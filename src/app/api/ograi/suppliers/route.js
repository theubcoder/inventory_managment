import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET all suppliers
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        transactions: {
          select: {
            id: true,
            totalAmount: true,
            amountPaid: true,
            remainingAmount: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Add calculated fields
    const suppliersWithStats = suppliers.map(supplier => {
      const totalTransactions = supplier.transactions.length;
      const totalAmount = supplier.transactions.reduce((sum, t) => sum + parseFloat(t.totalAmount || 0), 0);
      const totalPaid = supplier.transactions.reduce((sum, t) => sum + parseFloat(t.amountPaid || 0), 0);
      const totalRemaining = supplier.transactions.reduce((sum, t) => sum + parseFloat(t.remainingAmount || 0), 0);
      
      return {
        ...supplier,
        totalTransactions,
        totalAmount,
        totalPaid,
        totalRemaining
      };
    });
    
    return NextResponse.json(suppliersWithStats);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST create a new supplier
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    // Check if supplier already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: data.name
      }
    });

    if (existingSupplier) {
      return NextResponse.json({ 
        error: 'Supplier with this name already exists' 
      }, { status: 409 });
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactNumber: data.contactNumber || null,
        address: data.address || null
      }
    });

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ 
      error: 'Failed to create supplier',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT update a supplier
export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: parseInt(data.id) },
      data: {
        name: data.name,
        contactNumber: data.contactNumber,
        address: data.address
      }
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

// DELETE a supplier
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    // Check if supplier has transactions
    const transactionCount = await prisma.ograiTransaction.count({
      where: { supplierId: parseInt(id) }
    });

    if (transactionCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier with existing transactions' 
      }, { status: 400 });
    }

    await prisma.supplier.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Supplier deleted successfully', id });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}