import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET all transactions
export async function GET() {
  try {
    const transactions = await prisma.ograiTransaction.findMany({
      include: {
        supplier: true,
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
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST create a new transaction
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.supplierName || !data.productName || !data.quantity || !data.pricePerUnit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalAmount = parseFloat(data.quantity) * parseFloat(data.pricePerUnit);
    const amountPaid = parseFloat(data.amountPaid || 0);
    const transportFee = parseFloat(data.transportFee || 0);
    const transportPaid = parseFloat(data.transportPaid || 0);

    const result = await prisma.$transaction(async (tx) => {
      // Find or create supplier
      let supplier = await tx.supplier.findFirst({
        where: {
          name: data.supplierName
        }
      });

      if (!supplier) {
        supplier = await tx.supplier.create({
          data: {
            name: data.supplierName,
            contactNumber: data.contactNumber || null,
            address: data.address || null
          }
        });
      }

      // Create transaction
      const transaction = await tx.ograiTransaction.create({
        data: {
          supplierId: supplier.id,
          supplierName: data.supplierName,
          contactNumber: data.contactNumber || null,
          address: data.address || null,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          productName: data.productName,
          quantity: parseFloat(data.quantity),
          pricePerUnit: parseFloat(data.pricePerUnit),
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          remainingAmount: Math.max(0, totalAmount - amountPaid),
          overpaidAmount: Math.max(0, amountPaid - totalAmount),
          transportFee: transportFee,
          transportPaid: transportPaid,
          transportRemaining: Math.max(0, transportFee - transportPaid),
          paymentMethod: data.paymentMethod || 'cash',
          notes: data.notes || null
        },
        include: {
          supplier: true,
          paymentHistory: true
        }
      });

      // If initial payment was made, create payment history record
      if (amountPaid > 0 || transportPaid > 0) {
        await tx.ograiPaymentHistory.create({
          data: {
            transactionId: transaction.id,
            paymentDate: new Date(),
            paymentAmount: amountPaid,
            transportPayment: transportPaid,
            totalPayment: amountPaid + transportPaid,
            paymentMethod: data.paymentMethod || 'cash',
            notes: 'Initial payment'
          }
        });
      }

      return transaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ 
      error: 'Failed to create transaction',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT update a transaction (for payments)
export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current transaction
      const currentTransaction = await tx.ograiTransaction.findUnique({
        where: { id: parseInt(data.id) }
      });

      if (!currentTransaction) {
        throw new Error('Transaction not found');
      }

      // Calculate new amounts
      const paymentAmount = parseFloat(data.paymentAmount || 0);
      const transportPayment = parseFloat(data.transportPayment || 0);
      
      const newAmountPaid = parseFloat(currentTransaction.amountPaid) + paymentAmount;
      const newTransportPaid = parseFloat(currentTransaction.transportPaid) + transportPayment;
      
      const newRemaining = Math.max(0, parseFloat(currentTransaction.totalAmount) - newAmountPaid);
      const newOverpaid = Math.max(0, newAmountPaid - parseFloat(currentTransaction.totalAmount));
      const newTransportRemaining = Math.max(0, parseFloat(currentTransaction.transportFee) - newTransportPaid);

      // Update transaction
      const updatedTransaction = await tx.ograiTransaction.update({
        where: { id: parseInt(data.id) },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemaining,
          overpaidAmount: newOverpaid,
          transportPaid: newTransportPaid,
          transportRemaining: newTransportRemaining
        },
        include: {
          supplier: true,
          paymentHistory: true
        }
      });

      // Create payment history record
      if (paymentAmount > 0 || transportPayment > 0) {
        await tx.ograiPaymentHistory.create({
          data: {
            transactionId: parseInt(data.id),
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
            paymentAmount: paymentAmount,
            transportPayment: transportPayment,
            totalPayment: paymentAmount + transportPayment,
            paymentMethod: data.paymentMethod || 'cash',
            notes: data.notes || null
          }
        });
      }

      return updatedTransaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE a transaction
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await prisma.ograiTransaction.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Transaction deleted successfully', id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}