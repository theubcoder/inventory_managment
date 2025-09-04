import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET dashboard statistics
export async function GET() {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch dashboard statistics
    const [
      totalSales,
      todaySalesData,
      totalProducts,
      lowStockProducts,
      pendingReturns,
      recentSales
    ] = await Promise.all([
      // Total sales count
      prisma.sale.count(),
      
      // Today's sales
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        select: {
          totalAmount: true
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
      })
    ]);

    // Calculate today's sales total
    const todaySalesTotal = todaySalesData.reduce((sum, sale) => 
      sum + parseFloat(sale.totalAmount || 0), 0
    );

    // Calculate total revenue
    const revenueData = await prisma.sale.aggregate({
      _sum: {
        totalAmount: true
      }
    });
    
    // Format recent activities
    const recentActivities = recentSales.map(sale => ({
      id: sale.id,
      type: 'sale',
      description: `Sale #${sale.id} to ${sale.customer?.name || 'Walk-in Customer'}`,
      amount: parseFloat(sale.totalAmount),
      date: sale.createdAt,
      items: sale.saleItems.length
    }));

    const dashboardData = {
      totalSales,
      todaySales: todaySalesTotal,
      totalProducts,
      lowStock: lowStockProducts,
      pendingReturns,
      totalRevenue: parseFloat(revenueData._sum.totalAmount || 0),
      recentActivities
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