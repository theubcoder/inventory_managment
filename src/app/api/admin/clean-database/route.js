import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get counts of all data that will be cleared
    const [
      salesCount,
      saleItemsCount,
      returnsCount,
      returnItemsCount,
      customersCount,
      expensesCount,
      suppliersCount,
      ograiTransactionsCount,
      ograiPaymentHistoryCount,
      paymentHistoryCount,
      categoriesCount,
      productsCount
    ] = await Promise.all([
      prisma.sale.count(),
      prisma.saleItem.count(),
      prisma.return.count(),
      prisma.returnItem.count(),
      prisma.customer.count(),
      prisma.expense.count(),
      prisma.supplier.count(),
      prisma.ograiTransaction.count(),
      prisma.ograiPaymentHistory.count(),
      prisma.paymentHistory.count(),
      prisma.category.count(),
      prisma.product.count()
    ]);

    const dataToClean = {
      willDelete: {
        sales: salesCount,
        saleItems: saleItemsCount,
        returns: returnsCount,
        returnItems: returnItemsCount,
        customers: customersCount,
        expenses: expensesCount,
        suppliers: suppliersCount,
        ograiTransactions: ograiTransactionsCount,
        ograiPaymentHistory: ograiPaymentHistoryCount,
        paymentHistory: paymentHistoryCount
      },
      willKeep: {
        categories: categoriesCount,
        products: productsCount
      }
    };

    return NextResponse.json({
      success: true,
      data: dataToClean
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const itemsToDelete = body.itemsToDelete || {};

    let deletedCounts = {};

    // Delete in correct order due to foreign key constraints
    // IMPORTANT: Delete child records before parent records
    
    // Step 1: Delete payment histories (most dependent)
    if (itemsToDelete.paymentHistory || itemsToDelete.sales) {
      const result = await prisma.paymentHistory.deleteMany({});
      deletedCounts.paymentHistory = result.count;
    }

    if (itemsToDelete.ograiPaymentHistory || itemsToDelete.ograiTransactions || itemsToDelete.suppliers) {
      const result = await prisma.ograiPaymentHistory.deleteMany({});
      deletedCounts.ograiPaymentHistory = result.count;
    }

    // Step 2: Delete sale and return items
    if (itemsToDelete.returns) {
      const resultItems = await prisma.returnItem.deleteMany({});
      deletedCounts.returnItems = resultItems.count;
    }

    if (itemsToDelete.sales) {
      const resultItems = await prisma.saleItem.deleteMany({});
      deletedCounts.saleItems = resultItems.count;
    }
    
    // Step 3: Delete returns and sales
    if (itemsToDelete.returns) {
      const result = await prisma.return.deleteMany({});
      deletedCounts.returns = result.count;
    }

    if (itemsToDelete.sales) {
      const result = await prisma.sale.deleteMany({});
      deletedCounts.sales = result.count;
    }

    // Step 4: Delete ograi transactions (must be before suppliers)
    if (itemsToDelete.ograiTransactions || itemsToDelete.suppliers) {
      const result = await prisma.ograiTransaction.deleteMany({});
      deletedCounts.ograiTransactions = result.count;
    }

    // Step 5: Delete suppliers (after ograi transactions)
    if (itemsToDelete.suppliers) {
      const result = await prisma.supplier.deleteMany({});
      deletedCounts.suppliers = result.count;
    }

    // Step 6: Delete customers
    if (itemsToDelete.customers) {
      const result = await prisma.customer.deleteMany({});
      deletedCounts.customers = result.count;
    }

    // Step 7: Delete expenses (independent)
    if (itemsToDelete.expenses) {
      const result = await prisma.expense.deleteMany({});
      deletedCounts.expenses = result.count;
    }

    // Reset product quantities if requested
    if (itemsToDelete.resetProductQuantities) {
      await prisma.product.updateMany({
        data: {
          quantity: 0
        }
      });
      deletedCounts.resetProductQuantities = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Selected data cleaned successfully.',
      deletedCounts
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean database' },
      { status: 500 }
    );
  }
}