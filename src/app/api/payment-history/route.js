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

// PUT - Record a payment for a sale
export async function PUT(request) {
  try {
    const body = await request.json();
    const { saleId, amountPaid, paymentMethod, notes } = body;

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

      // Calculate new payment details
      const newTotalPaid = parseFloat(sale.amountPaid || 0) + parseFloat(amountPaid);
      const newRemaining = parseFloat(sale.totalAmount) - newTotalPaid;
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
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
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

      // Don't allow deleting the initial payment (index 0)
      const paymentCount = await tx.paymentHistory.count({
        where: { saleId: payment.saleId }
      });
      
      const firstPayment = await tx.paymentHistory.findFirst({
        where: { saleId: payment.saleId },
        orderBy: { createdAt: 'asc' }
      });

      if (firstPayment && firstPayment.id === payment.id && paymentCount > 1) {
        throw new Error('Cannot delete the initial payment record');
      }

      // Update the sale amounts
      const newAmountPaid = Math.max(0, parseFloat(payment.sale.amountPaid) - parseFloat(payment.amountPaid));
      const newRemainingAmount = parseFloat(payment.sale.totalAmount) - newAmountPaid;
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