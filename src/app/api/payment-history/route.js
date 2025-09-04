import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET payment history for a sale
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const paymentHistory = await prisma.paymentHistory.findMany({
      where: { saleId: parseInt(saleId) },
      orderBy: { paymentDate: 'desc' },
      include: {
        sale: {
          include: {
            customer: true
          }
        }
      }
    });

    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}

// GET all pending/partial payments
export async function POST(request) {
  try {
    const body = await request.json();
    const { type } = body;

    let where = {};
    if (type === 'pending') {
      where.paymentStatus = { in: ['pending', 'partial'] };
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
          orderBy: { paymentDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 });
  }
}

// PUT - Record a new payment or update existing payment
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, saleId, amountPaid, paymentMethod, paymentDate, notes } = body;

    // If id is provided, update existing payment
    if (id) {
      const result = await prisma.$transaction(async (tx) => {
        // Get the existing payment record
        const existingPayment = await tx.paymentHistory.findUnique({
          where: { id: parseInt(id) },
          include: {
            sale: true
          }
        });

        if (!existingPayment) {
          throw new Error('Payment record not found');
        }

        // Calculate the difference in payment amount
        const amountDifference = parseFloat(amountPaid) - parseFloat(existingPayment.amountPaid);
        
        // Update sale amounts
        const newAmountPaid = parseFloat(existingPayment.sale.amountPaid) + amountDifference;
        const newRemainingAmount = Math.max(0, parseFloat(existingPayment.sale.totalAmount) - newAmountPaid);
        const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : newRemainingAmount < parseFloat(existingPayment.sale.totalAmount) ? 'partial' : 'pending';

        // Update the payment record
        const updatedPayment = await tx.paymentHistory.update({
          where: { id: parseInt(id) },
          data: {
            amountPaid: parseFloat(amountPaid),
            paymentMethod: paymentMethod || existingPayment.paymentMethod,
            paymentDate: paymentDate ? new Date(paymentDate) : existingPayment.paymentDate,
            notes: notes !== undefined ? notes : existingPayment.notes
          }
        });

        // Update the sale
        await tx.sale.update({
          where: { id: existingPayment.saleId },
          data: {
            amountPaid: newAmountPaid,
            remainingAmount: newRemainingAmount,
            paymentStatus: newPaymentStatus
          }
        });

        return updatedPayment;
      });

      return NextResponse.json(result);
    }

    // Otherwise, create new payment (original logic)
    if (!saleId || !amountPaid) {
      return NextResponse.json({ error: 'Sale ID and payment amount are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current sale
      const sale = await tx.sale.findUnique({
        where: { id: parseInt(saleId) }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Validate payment amount doesn't exceed remaining
      if (parseFloat(amountPaid) > parseFloat(sale.remainingAmount)) {
        throw new Error(`Payment amount cannot exceed remaining amount of PKR ${sale.remainingAmount}`);
      }

      // Calculate new payment details
      const newTotalPaid = parseFloat(sale.amountPaid || 0) + parseFloat(amountPaid);
      const newRemaining = Math.max(0, parseFloat(sale.totalAmount) - newTotalPaid);
      const newPaymentStatus = newRemaining <= 0 ? 'paid' : newRemaining < parseFloat(sale.totalAmount) ? 'partial' : 'pending';

      // Update sale and create payment history record
      const [updatedSale, paymentRecord] = await Promise.all([
        tx.sale.update({
          where: { id: parseInt(saleId) },
          data: {
            amountPaid: newTotalPaid,
            remainingAmount: Math.max(0, newRemaining),
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
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payment' }, { status: 500 });
  }
}

// DELETE - Delete a payment record
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the payment record to know the amounts
      const payment = await tx.paymentHistory.findUnique({
        where: { id: parseInt(paymentId) },
        include: {
          sale: true
        }
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Check if this is the only payment
      const paymentCount = await tx.paymentHistory.count({
        where: { saleId: payment.saleId }
      });
      
      // Allow deletion of any payment, but warn if it's the last one
      if (paymentCount === 1) {
        console.log('Deleting the last payment record for sale:', payment.saleId);
      }

      // Update the sale amounts
      const newAmountPaid = Math.max(0, parseFloat(payment.sale.amountPaid) - parseFloat(payment.amountPaid));
      const newRemainingAmount = Math.max(0, parseFloat(payment.sale.totalAmount) - newAmountPaid);
      const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : newRemainingAmount < parseFloat(payment.sale.totalAmount) ? 'partial' : 'pending';

      // Update sale
      await tx.sale.update({
        where: { id: payment.saleId },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus
        }
      });

      // Delete the payment record
      await tx.paymentHistory.delete({
        where: { id: parseInt(paymentId) }
      });

      return { message: 'Payment deleted successfully' };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete payment' 
    }, { status: 500 });
  }
}