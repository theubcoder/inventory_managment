import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET dashboard statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Create date filter
    let dateFilter = {};
    let dateRangeLabel = 'Today';
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      };
      dateRangeLabel = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateFilter = {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      };
    }

    // Fetch dashboard statistics
    const [
      totalSales,
      filteredSalesData,
      totalProducts,
      lowStockProducts,
      pendingReturns,
      recentSales,
      totalCustomers
    ] = await Promise.all([
      // Total sales count (all time)
      prisma.sale.count(),
      
      // Sales in date range
      prisma.sale.findMany({
        where: dateFilter,
        select: {
          totalAmount: true,
          totalProfit: true
        }
      }),
      
      // Total products
      prisma.product.count(),
      
      // Low stock products - using raw query for self-reference comparison
      prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE quantity <= min_stock
      `.then(result => parseInt(result[0]?.count || 0)),
      
      // Pending returns
      prisma.return.count({
        where: {
          status: 'processing'
        }
      }),
      
      // Recent sales for activities
      prisma.sale.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      }),
      
      // Total customers
      prisma.customer.count()
    ]);

    // Calculate filtered period totals
    const periodSalesTotal = filteredSalesData.reduce((sum, sale) => 
      sum + parseFloat(sale.totalAmount || 0), 0
    );
    
    const periodProfitTotal = filteredSalesData.reduce((sum, sale) => 
      sum + parseFloat(sale.totalProfit || 0), 0
    );

    // Calculate total revenue (all time)
    const revenueData = await prisma.sale.aggregate({
      _sum: {
        totalAmount: true,
        totalProfit: true
      }
    });
    
    // Format recent activities
    const recentActivities = recentSales.map(sale => ({
      id: sale.id,
      type: 'sale',
      description: `Sale #${sale.id} to ${sale.customer?.name || 'Walk-in Customer'}`,
      amount: parseFloat(sale.totalAmount),
      profit: parseFloat(sale.totalProfit || 0),
      date: sale.createdAt,
      items: sale.saleItems.length,
      status: sale.paymentStatus
    }));

    // Get low stock products details
    const lowStockProductsList = await prisma.product.findMany({
      where: {
        quantity: {
          lte: 10
        }
      },
      orderBy: {
        quantity: 'asc'
      },
      take: 5
    });

    const dashboardData = {
      totalSales,
      totalCustomers,
      totalProducts,
      lowStock: lowStockProducts,
      pendingReturns,
      totalRevenue: parseFloat(revenueData._sum.totalAmount || 0),
      totalProfit: parseFloat(revenueData._sum.totalProfit || 0),
      periodSales: filteredSalesData.length,
      periodRevenue: periodSalesTotal,
      periodProfit: periodProfitTotal,
      dateRange: dateRangeLabel,
      recentActivities,
      lowStockProducts: lowStockProductsList
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // If database connection fails, return empty structure
    const fallbackData = {
      totalSales: 0,
      todaySales: 0,
      totalProducts: 0,
      lowStock: 0,
      pendingReturns: 0,
      totalRevenue: 0,
      recentActivities: []
    };
    
    return NextResponse.json(fallbackData);
  }
}