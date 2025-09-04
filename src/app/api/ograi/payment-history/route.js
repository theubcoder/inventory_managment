import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET payment history for a transaction
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      // Get all payment history
      const allPayments = await prisma.ograiPaymentHistory.findMany({
        include: {
          transaction: {
            include: {
              supplier: true
            }
          }
        },
        orderBy: {
          paymentDate: 'desc'
        }
      });
      return NextResponse.json(allPayments);
    }
    
    // Get payment history for specific transaction
    const paymentHistory = await prisma.ograiPaymentHistory.findMany({
      where: {
        transactionId: parseInt(transactionId)
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });
    
    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}

// POST add a payment to history
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.transactionId || (!data.paymentAmount && !data.transportPayment)) {
      return NextResponse.json({ error: 'Transaction ID and at least one payment amount required' }, { status: 400 });
    }

    const paymentAmount = parseFloat(data.paymentAmount || 0);
    const transportPayment = parseFloat(data.transportPayment || 0);

    const result = await prisma.$transaction(async (tx) => {
      // Get current transaction
      const transaction = await tx.ograiTransaction.findUnique({
        where: { id: parseInt(data.transactionId) }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Calculate new amounts
      const newAmountPaid = parseFloat(transaction.amountPaid) + paymentAmount;
      const newTransportPaid = parseFloat(transaction.transportPaid) + transportPayment;
      
      const newRemaining = Math.max(0, parseFloat(transaction.totalAmount) - newAmountPaid);
      const newOverpaid = Math.max(0, newAmountPaid - parseFloat(transaction.totalAmount));
      const newTransportRemaining = Math.max(0, parseFloat(transaction.transportFee) - newTransportPaid);

      // Update transaction
      await tx.ograiTransaction.update({
        where: { id: parseInt(data.transactionId) },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemaining,
          overpaidAmount: newOverpaid,
          transportPaid: newTransportPaid,
          transportRemaining: newTransportRemaining
        }
      });

      // Create payment history record
      const paymentRecord = await tx.ograiPaymentHistory.create({
        data: {
          transactionId: parseInt(data.transactionId),
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentAmount: paymentAmount,
          transportPayment: transportPayment,
          totalPayment: paymentAmount + transportPayment,
          paymentMethod: data.paymentMethod || 'cash',
          notes: data.notes || null
        }
      });

      return paymentRecord;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json({ 
      error: 'Failed to add payment',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT update a payment (not typically used for payment history)
export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const updatedPayment = await prisma.ograiPaymentHistory.update({
      where: { id: parseInt(data.id) },
      data: {
        paymentAmount: parseFloat(data.paymentAmount || 0),
        transportPayment: parseFloat(data.transportPayment || 0),
        totalPayment: parseFloat(data.paymentAmount || 0) + parseFloat(data.transportPayment || 0),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined
      }
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// DELETE a payment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get payment record to know how much to subtract
      const payment = await tx.ograiPaymentHistory.findUnique({
        where: { id: parseInt(id) },
        include: {
          transaction: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update transaction amounts
      const transaction = payment.transaction;
      const newAmountPaid = Math.max(0, parseFloat(transaction.amountPaid) - parseFloat(payment.paymentAmount));
      const newTransportPaid = Math.max(0, parseFloat(transaction.transportPaid) - parseFloat(payment.transportPayment));
      
      await tx.ograiTransaction.update({
        where: { id: transaction.id },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: Math.max(0, parseFloat(transaction.totalAmount) - newAmountPaid),
          overpaidAmount: Math.max(0, newAmountPaid - parseFloat(transaction.totalAmount)),
          transportPaid: newTransportPaid,
          transportRemaining: Math.max(0, parseFloat(transaction.transportFee) - newTransportPaid)
        }
      });

      // Delete payment record
      await tx.ograiPaymentHistory.delete({
        where: { id: parseInt(id) }
      });

      return { message: 'Payment deleted successfully', id };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}