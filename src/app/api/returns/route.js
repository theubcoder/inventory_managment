import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET all returns
export async function GET() {
  try {
    const returns = await prisma.return.findMany({
      include: {
        customer: true,
        returnItems: {
          include: {
            product: true
          }
        },
        sale: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

// POST create a new return
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.saleId || !data.reason || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the sale details
      const sale = await tx.sale.findUnique({
        where: { id: parseInt(data.saleId) },
        include: {
          customer: true
        }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Calculate refund amount INCLUDING profit
      const refundAmount = data.items.reduce((total, item) => {
        // Use unitPriceWithProfit if provided, otherwise calculate it
        const priceWithProfit = item.unitPriceWithProfit || 
          (data.subtotal > 0 ? item.unitPrice * (1 + (data.totalProfit / data.subtotal)) : item.unitPrice);
        return total + (item.quantity * priceWithProfit);
      }, 0);

      // Create the return record
      const newReturn = await tx.return.create({
        data: {
          saleId: parseInt(data.saleId),
          customerId: sale.customerId,
          reason: data.reason,
          refundAmount: refundAmount,
          status: 'completed',
          returnItems: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          customer: true,
          returnItems: {
            include: {
              product: true
            }
          }
        }
      });

      // Restore product quantities (add returned items back to inventory)
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        });
      }

      // Update sale items - reduce quantities or remove if fully returned
      for (const returnItem of data.items) {
        // Find the corresponding sale item
        const saleItem = await tx.saleItem.findFirst({
          where: {
            saleId: parseInt(data.saleId),
            productId: returnItem.productId
          }
        });

        if (saleItem) {
          const remainingQty = saleItem.quantity - returnItem.quantity;
          
          if (remainingQty <= 0) {
            // Remove the sale item if fully returned
            await tx.saleItem.delete({
              where: { id: saleItem.id }
            });
          } else {
            // Update the quantity and total price
            await tx.saleItem.update({
              where: { id: saleItem.id },
              data: {
                quantity: remainingQty,
                totalPrice: remainingQty * saleItem.unitPrice
              }
            });
          }
        }
      }

      // Update the sale totals
      const updatedSale = await tx.sale.findUnique({
        where: { id: parseInt(data.saleId) },
        include: {
          saleItems: true
        }
      });

      // Recalculate sale subtotal based on remaining items (without profit)
      const newSubtotal = updatedSale.saleItems.reduce((sum, item) => 
        sum + parseFloat(item.totalPrice), 0
      );

      // Calculate the actual profit portion of the refund
      // refundAmount includes profit, so we need to extract just the profit part
      const returnedSubtotal = data.items.reduce((total, item) => 
        total + (item.quantity * item.unitPrice), 0
      );
      const profitReduction = refundAmount - returnedSubtotal;
      
      // Calculate new profit after reduction
      const newProfit = Math.max(0, parseFloat(sale.totalProfit || 0) - profitReduction);
      
      // New total amount includes remaining subtotal + remaining profit
      const newTotalAmount = newSubtotal + newProfit;

      // Update sale with new totals
      await tx.sale.update({
        where: { id: parseInt(data.saleId) },
        data: {
          totalAmount: newTotalAmount,
          totalProfit: newProfit,
          // Update payment status if needed
          remainingAmount: Math.max(0, newTotalAmount - (parseFloat(sale.amountPaid || 0) - refundAmount)),
          paymentStatus: newTotalAmount <= (parseFloat(sale.amountPaid || 0) - refundAmount) ? 'paid' : 'partial'
        }
      });

      // Add a payment history entry for the refund
      await tx.paymentHistory.create({
        data: {
          saleId: parseInt(data.saleId),
          amountPaid: -refundAmount, // Negative amount for refund
          paymentMethod: 'refund',
          notes: `Return processed: ${data.reason}`,
          paymentDate: new Date()
        }
      });

      // Update the sale's amountPaid to reflect the refund
      await tx.sale.update({
        where: { id: parseInt(data.saleId) },
        data: {
          amountPaid: Math.max(0, parseFloat(sale.amountPaid || 0) - refundAmount)
        }
      });

      return newReturn;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 20000  // 20 seconds
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: error.message || 'Failed to create return' }, { status: 500 });
  }
}

// DELETE a return
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnId = searchParams.get('id');

    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the return with all details
      const returnRecord = await tx.return.findUnique({
        where: { id: parseInt(returnId) },
        include: {
          returnItems: true,
          sale: true
        }
      });

      if (!returnRecord) {
        throw new Error('Return not found');
      }

      // When deleting a return, we DON'T touch the inventory
      // The products should stay in inventory even if the return record is deleted
      // This way, the returned products remain in stock

      // Remove the refund from payment history
      await tx.paymentHistory.deleteMany({
        where: {
          saleId: returnRecord.saleId,
          paymentMethod: 'refund',
          amountPaid: -parseFloat(returnRecord.refundAmount)
        }
      });

      // Only adjust the payment amounts - don't change total amount since items stay returned
      const sale = returnRecord.sale;
      const newAmountPaid = parseFloat(sale.amountPaid) + parseFloat(returnRecord.refundAmount);
      const newRemainingAmount = Math.max(0, parseFloat(sale.totalAmount) - newAmountPaid);
      
      await tx.sale.update({
        where: { id: returnRecord.saleId },
        data: {
          // totalAmount stays the same (items remain as returned)
          amountPaid: newAmountPaid,
          remainingAmount: newRemainingAmount,
          paymentStatus: newRemainingAmount <= 0 ? 'paid' : newRemainingAmount < parseFloat(sale.totalAmount) ? 'partial' : 'pending'
        }
      });

      // Delete the return record (will cascade delete return items)
      await tx.return.delete({
        where: { id: parseInt(returnId) }
      });

      return { message: 'Return deleted successfully' };
    }, {
      maxWait: 10000,
      timeout: 20000
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting return:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete return' }, { status: 500 });
  }
}