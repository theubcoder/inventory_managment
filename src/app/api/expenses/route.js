import { NextResponse } from 'next/server';

// GET all expenses with optional date filtering
export async function GET(request) {
  try {
    // Return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST create a new expense
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.category || !data.amount || !data.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newExpense = {
      id: Date.now(),
      category: data.category,
      amount: parseFloat(data.amount),
      date: data.date,
      description: data.description || '',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

// PUT update an expense
export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const updatedExpense = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

// DELETE an expense
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully', id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}