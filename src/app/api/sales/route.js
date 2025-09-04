import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET all sales or search by ID/phone
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let where = {};
    
    if (search) {
      // Try to parse as number for ID search
      const searchId = parseInt(search);
      if (!isNaN(searchId)) {
        where.OR = [
          { id: searchId },
          { customer: { phone: search } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }
        ];
      } else {
        // Search by phone or name
        where.OR = [
          { customer: { phone: search } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true
          }
        },
        paymentHistory: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter out sales that have no items left (all items returned)
    const salesWithItems = sales.filter(sale => sale.saleItems && sale.saleItems.length > 0);

    return NextResponse.json(salesWithItems);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

// POST - Create new sale
export async function POST(request) {
  try {
    const body = await request.json();
    const { customer, items, paymentMethod, amountPaid, profitDiscount, dueDate } = body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = 0; // No tax
    const discountAmount = parseFloat(profitDiscount) || 0;
    
    // Calculate profit
    let totalProfit = 0;
    for (const item of items) {
      const profitPerUnit = parseFloat(item.profitPerUnit || 0);
      const profitPerBox = parseFloat(item.profitPerBox || 0);
      const unitsPerBox = 10; // Default units per box, you might want to fetch this from product
      const quantity = item.quantity;
      
      let itemProfit = 0;
      if (profitPerBox > 0) {
        // If profit per box is set, use box calculation
        const boxes = Math.floor(quantity / unitsPerBox);
        const remainingUnits = quantity % unitsPerBox;
        itemProfit = (boxes * profitPerBox) + (remainingUnits * profitPerUnit);
      } else {
        // If no box profit is set, calculate all as individual units
        itemProfit = quantity * profitPerUnit;
      }
      
      totalProfit += itemProfit;
    }
    
    // Total amount = subtotal + profit - discount
    const totalAmount = subtotal + totalProfit - discountAmount;
    
    // Final profit after discount
    const finalProfit = Math.max(0, totalProfit - discountAmount);
    
    // Calculate payment details
    const paidAmount = amountPaid !== undefined ? parseFloat(amountPaid) : totalAmount;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = remainingAmount <= 0 ? 'paid' : remainingAmount < totalAmount ? 'partial' : 'pending';

    // Start a transaction with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // Create or find customer - Always use exact match or create new
      let customerId = null;
      if (customer && customer.name) {
        // Try to find exact match by name AND phone
        const whereConditions = {
          name: customer.name
        };
        
        // Add phone to search if provided
        if (customer.phone) {
          whereConditions.phone = customer.phone;
        }
        
        const existingCustomer = await tx.customer.findFirst({
          where: whereConditions
        });

        if (existingCustomer) {
          // Use existing customer with exact match
          customerId = existingCustomer.id;
        } else {
          // Create new customer with provided details
          const newCustomer = await tx.customer.create({
            data: {
              name: customer.name,
              phone: customer.phone || null,
              email: customer.email || null
            }
          });
          customerId = newCustomer.id;
        }
      }

      // Create sale
      const sale = await tx.sale.create({
        data: {
          customerId,
          totalAmount,
          taxAmount,
          discountAmount: discountAmount,
          profitDiscount: discountAmount,
          totalProfit: finalProfit,
          amountPaid: paidAmount,
          remainingAmount,
          paymentStatus,
          paymentMethod: paymentMethod || 'cash',
          dueDate: dueDate ? new Date(dueDate) : null,
          saleItems: {
            create: items.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity
            }))
          }
        },
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true
            }
          },
          paymentHistory: true
        }
      });

      // Update product quantities FIRST (this should always happen for any sale)
      for (const item of items) {
        // First check current quantity
        const product = await tx.product.findUnique({
          where: { id: item.id }
        });
        
        if (!product) {
          throw new Error(`Product with id ${item.id} not found`);
        }
        
        // Calculate new quantity, ensuring it doesn't go below 0
        const newQuantity = Math.max(0, product.quantity - item.quantity);
        
        await tx.product.update({
          where: { id: item.id },
          data: {
            quantity: newQuantity
          }
        });
      }

      // Create initial payment record if amount was paid
      if (paidAmount > 0) {
        await tx.paymentHistory.create({
          data: {
            saleId: sale.id,
            amountPaid: paidAmount,
            paymentMethod: paymentMethod || 'cash',
            notes: 'Initial payment'
          }
        });
        
        // Re-fetch the sale to include the payment history
        return await tx.sale.findUnique({
          where: { id: sale.id },
          include: {
            customer: true,
            saleItems: {
              include: {
                product: true
              }
            },
            paymentHistory: true
          }
        });
      }

      return sale;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 20000 // 20 seconds
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}

// PUT - Update sale payment
export async function PUT(request) {
  try {
    const body = await request.json();
    const { saleId, amountPaid, paymentMethod, notes } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Get current sale
      const sale = await tx.sale.findUnique({
        where: { id: parseInt(saleId) }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Calculate new payment details
      const newTotalPaid = parseFloat(sale.amountPaid || 0) + parseFloat(amountPaid);
      const newRemaining = Math.max(0, parseFloat(sale.totalAmount) - newTotalPaid);
      const newPaymentStatus = newRemaining <= 0 ? 'paid' : newRemaining < parseFloat(sale.totalAmount) ? 'partial' : 'pending';

      // Update sale and create payment history in parallel
      const [updatedSale, paymentRecord] = await Promise.all([
        tx.sale.update({
          where: { id: parseInt(saleId) },
          data: {
            amountPaid: newTotalPaid,
            remainingAmount: newRemaining,
            paymentStatus: newPaymentStatus
          },
          include: {
            customer: true,
            saleItems: {
              include: {
                product: true
              }
            },
            paymentHistory: true
          }
        }),
        tx.paymentHistory.create({
          data: {
            saleId: parseInt(saleId),
            amountPaid: parseFloat(amountPaid),
            paymentMethod: paymentMethod || 'cash',
            notes: notes || 'Payment received'
          }
        })
      ]);

      return updatedSale;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 20000  // 20 seconds
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating sale payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE - Delete a sale (only if fully paid)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('id');

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the sale with all related data
      const sale = await tx.sale.findUnique({
        where: { id: parseInt(saleId) },
        include: {
          saleItems: true,
          paymentHistory: true,
          returns: true
        }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Check if sale has any returns
      if (sale.returns && sale.returns.length > 0) {
        throw new Error('Cannot delete sale with returns. Please delete the returns first.');
      }

      // Only allow deletion of fully paid sales
      if (sale.paymentStatus !== 'paid') {
        throw new Error('Only fully paid sales can be deleted');
      }

      // Restore product quantities before deleting
      // Note: If there were returns, the quantities have already been restored
      // So we only restore quantities that weren't returned
      for (const item of sale.saleItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (product) {
          // Since we don't allow deletion with returns, we can safely restore full quantity
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: product.quantity + item.quantity
            }
          });
        }
      }

      // Delete the sale (this will cascade delete saleItems and paymentHistory)
      await tx.sale.delete({
        where: { id: parseInt(saleId) }
      });

      return { message: 'Sale deleted successfully' };
    }, {
      maxWait: 10000,
      timeout: 20000
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete sale' 
    }, { status: 500 });
  }
}