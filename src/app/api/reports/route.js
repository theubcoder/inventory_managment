import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET reports data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Create date filter
    let dateFilter = {};
    let dateRangeLabel = 'All Time';
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
      dateRangeLabel = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }

    // Fetch sales data with profit information
    const sales = await prisma.sale.findMany({
      where: dateFilter,
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch expenses data
    const expenses = await prisma.expense.findMany({
      where: dateFilter,
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(sale.totalProfit || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const netProfit = totalProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top selling products
    const productSales = {};
    sales.forEach(sale => {
      sale.saleItems.forEach(item => {
        const productName = item.product.name;
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += parseFloat(item.totalPrice);
        // Calculate proportional profit for this item
        const saleProfit = parseFloat(sale.totalProfit || 0);
        const saleRevenue = parseFloat(sale.totalAmount);
        const itemProfit = saleRevenue > 0 ? (parseFloat(item.totalPrice) / saleRevenue) * saleProfit : 0;
        productSales[productName].profit += itemProfit;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by customer
    const customerSales = {};
    sales.forEach(sale => {
      const customerName = sale.customer?.name || 'Walk-in Customer';
      if (!customerSales[customerName]) {
        customerSales[customerName] = {
          name: customerName,
          sales: 0,
          revenue: 0,
          profit: 0
        };
      }
      customerSales[customerName].sales += 1;
      customerSales[customerName].revenue += parseFloat(sale.totalAmount);
      customerSales[customerName].profit += parseFloat(sale.totalProfit || 0);
    });

    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Expenses by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
      const category = expense.category;
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = {
          category: category,
          amount: 0,
          count: 0
        };
      }
      expensesByCategory[category].amount += parseFloat(expense.amount);
      expensesByCategory[category].count += 1;
    });

    const expenseCategories = Object.values(expensesByCategory)
      .sort((a, b) => b.amount - a.amount);

    // Daily sales trend (last 30 days or filtered period)
    const dailySales = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = {
          date: date,
          sales: 0,
          revenue: 0,
          profit: 0
        };
      }
      dailySales[date].sales += 1;
      dailySales[date].revenue += parseFloat(sale.totalAmount);
      dailySales[date].profit += parseFloat(sale.totalProfit || 0);
    });

    const salesTrend = Object.values(dailySales)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const reportData = {
      dateRange: dateRangeLabel,
      summary: {
        totalSales: sales.length,
        totalRevenue,
        totalProfit,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        averageOrderValue: sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : 0
      },
      topProducts,
      topCustomers,
      expenseCategories,
      salesTrend,
      recentSales: sales.slice(0, 10).map(sale => ({
        id: sale.id,
        date: sale.createdAt.toLocaleDateString(),
        customer: sale.customer?.name || 'Walk-in Customer',
        amount: parseFloat(sale.totalAmount),
        profit: parseFloat(sale.totalProfit || 0),
        items: sale.saleItems.length,
        status: sale.paymentStatus
      }))
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
  }
}