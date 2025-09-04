'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationSystem';
import { useLanguage } from '../contexts/LanguageContext';

export default function Reports() {
  const { showInfo } = useNotification();
  const { t } = useLanguage();
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({
    daily: [],
    topProducts: [],
    categories: [],
    totalRevenue: 0,
    totalSales: 0
  });
  const [inventoryData, setInventoryData] = useState({
    lowStock: [],
    stockValue: [],
    totalProducts: 0,
    totalValue: 0
  });
  const [financialData, setFinancialData] = useState({
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0
    },
    monthlyTrend: [],
    expenses: []
  });

  useEffect(() => {
    // Reset date range to today when component mounts
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ start: today, end: today });
    
    // Reset report selection to sales
    setSelectedReport('sales');
    
    // Clear all previous data
    setSalesData({
      daily: [],
      topProducts: [],
      categories: [],
      totalRevenue: 0,
      totalSales: 0
    });
    setInventoryData({
      lowStock: [],
      stockValue: [],
      totalProducts: 0,
      totalValue: 0
    });
    setFinancialData({
      summary: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
      },
      monthlyTrend: [],
      expenses: []
    });
    
    // Fetch fresh data
    fetchReportData();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (selectedReport === 'sales') {
        await fetchSalesReport();
      } else if (selectedReport === 'inventory') {
        await fetchInventoryReport();
      } else if (selectedReport === 'financial') {
        await fetchFinancialReport();
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    // Fetch sales data
    const salesResponse = await fetch(`/api/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`);
    const sales = await salesResponse.json();

    // Fetch dashboard data for additional stats
    const dashboardResponse = await fetch('/api/dashboard');
    const dashboardData = await dashboardResponse.json();

    // Process sales data
    const dailySales = {};
    const productSales = {};
    const categorySales = {};
    let totalRevenue = 0;

    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      const amount = parseFloat(sale.totalAmount);
      
      // Daily sales
      dailySales[date] = (dailySales[date] || 0) + amount;
      totalRevenue += amount;

      // Product sales
      sale.saleItems?.forEach(item => {
        const productName = item.product?.name || 'Unknown';
        if (!productSales[productName]) {
          productSales[productName] = { units: 0, revenue: 0 };
        }
        productSales[productName].units += item.quantity;
        productSales[productName].revenue += parseFloat(item.totalPrice);

        // Category sales
        const categoryName = item.product?.category?.name || 'Uncategorized';
        categorySales[categoryName] = (categorySales[categoryName] || 0) + parseFloat(item.totalPrice);
      });
    });

    // Convert to arrays for display
    const dailyArray = Object.entries(dailySales).map(([date, sales]) => ({
      date: date.split('/')[0], // Get day only
      sales
    })).slice(-7); // Last 7 days

    const topProductsArray = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalCategoryRevenue = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const categoriesArray = Object.entries(categorySales)
      .map(([name, value]) => ({
        name,
        value: totalCategoryRevenue > 0 ? Math.round((value / totalCategoryRevenue) * 100) : 0,
        color: getColorForCategory(name)
      }));

    setSalesData({
      daily: dailyArray,
      topProducts: topProductsArray,
      categories: categoriesArray,
      totalRevenue,
      totalSales: sales.length
    });
  };

  const fetchInventoryReport = async () => {
    // Fetch products
    const productsResponse = await fetch('/api/products');
    const products = await productsResponse.json();

    // Find low stock items
    const lowStockItems = products
      .filter(p => p.quantity <= p.minStock)
      .map(p => ({
        product: p.name,
        current: p.quantity,
        minimum: p.minStock,
        status: p.quantity === 0 ? t('outOfStock') : p.quantity < p.minStock / 2 ? t('critical') : t('low')
      }));

    // Calculate stock value by category
    const categoryStock = {};
    let totalValue = 0;

    products.forEach(product => {
      const categoryName = product.category?.name || t('uncategorized');
      if (!categoryStock[categoryName]) {
        categoryStock[categoryName] = { value: 0, items: 0 };
      }
      const productValue = parseFloat(product.price) * product.quantity;
      categoryStock[categoryName].value += productValue;
      categoryStock[categoryName].items += product.quantity;
      totalValue += productValue;
    });

    const stockValueArray = Object.entries(categoryStock)
      .map(([category, data]) => ({
        category,
        value: data.value,
        items: data.items
      }))
      .sort((a, b) => b.value - a.value);

    setInventoryData({
      lowStock: lowStockItems,
      stockValue: stockValueArray,
      totalProducts: products.length,
      totalValue
    });
  };

  const fetchFinancialReport = async () => {
    // Fetch sales
    const salesResponse = await fetch(`/api/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`);
    const sales = await salesResponse.json();

    // Fetch expenses
    const expensesResponse = await fetch(`/api/expenses?startDate=${dateRange.start}&endDate=${dateRange.end}`);
    const expensesData = await expensesResponse.json();

    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalExpenses = expensesData.totalAmount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Group expenses by category
    const expensesByCategory = {};
    expensesData.expenses?.forEach(expense => {
      const category = expense.category;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(expense.amount);
    });

    const expensesArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    setFinancialData({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(1)
      },
      monthlyTrend: [], // Would need more complex date grouping
      expenses: expensesArray
    });
  };

  const getColorForCategory = (name) => {
    const colors = {
      'Electronics': '#667eea',
      'Clothing': '#f59e0b',
      'Food': '#10b981',
      'Books': '#ef4444',
      'Sports': '#8b5cf6'
    };
    return colors[name] || '#6b7280';
  };

  const handleExport = (format) => {
    showInfo(`${t('exportingReportAs')} ${format}...`);
    // Here you would implement actual export functionality
  };

  return (
    <div className="reports">
      <style jsx>{`
        .reports {
          padding: 30px;
          background: #f8f9fa;
          min-height: 100vh;
          margin: 0;
        }

        .header {
          background: white;
          border-radius: 20px;
          padding: 25px;
          margin: 0 0 30px 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }

        .export-buttons {
          display: flex;
          gap: 10px;
        }

        .export-btn {
          background: white;
          border: 2px solid #e5e7eb;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .export-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filters {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .report-tabs {
          display: flex;
          gap: 10px;
          flex: 1;
        }

        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          color: #000000;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .date-range {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .date-input {
          padding: 10px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
        }

        .date-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 25px;
        }

        .report-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-container {
          height: 300px;
          position: relative;
          margin-bottom: 20px;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 100%;
          padding: 20px 0;
        }

        .bar {
          width: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px 10px 0 0;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bar:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .bar-label {
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: #000000;
        }

        .bar-value {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
        }

        .pie-chart {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          position: relative;
        }

        .pie-svg {
          width: 250px;
          height: 250px;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-left: 30px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .legend-label {
          font-size: 14px;
          color: #374151;
        }

        .legend-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-left: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-box {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-label {
          font-size: 14px;
          color: #000000;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .stat-change {
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .change-positive {
          color: #10b981;
        }

        .change-negative {
          color: #ef4444;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .data-table td {
          padding: 12px;
          font-size: 14px;
          color: #1f2937;
          border-bottom: 1px solid #f3f4f6;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .status-critical {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-low {
          background: #fef3c7;
          color: #d97706;
        }

        .status-good {
          background: #dcfce7;
          color: #16a34a;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        @media (max-width: 1024px) {
          .two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .reports {
            padding: 20px;
          }

          .header-top {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .filters {
            flex-direction: column;
          }

          .report-tabs {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .pie-chart {
            flex-direction: column;
          }

          .pie-legend {
            margin-left: 0;
            margin-top: 20px;
            width: 100%;
          }
        }
      `}</style>

      <div className="header">
        <div className="header-top">
          <h1 className="page-title">{t('reportsAnalytics')}</h1>
        </div>
        
        <div className="filters">
          <div className="report-tabs">
            <button 
              className={`tab-btn ${selectedReport === 'sales' ? 'active' : ''}`}
              onClick={() => setSelectedReport('sales')}
            >
              {t('salesReport')}
            </button>
            <button 
              className={`tab-btn ${selectedReport === 'inventory' ? 'active' : ''}`}
              onClick={() => setSelectedReport('inventory')}
            >
              {t('inventoryReport')}
            </button>
            <button 
              className={`tab-btn ${selectedReport === 'financial' ? 'active' : ''}`}
              onClick={() => setSelectedReport('financial')}
            >
              {t('financialReport')}
            </button>
          </div>
          
          <div className="date-range">
            <input 
              type="date" 
              className="date-input"
              value={dateRange.start || ''}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span>{t('to')}</span>
            <input 
              type="date" 
              className="date-input"
              value={dateRange.end || ''}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="report-card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '18px', color: '#000000' }}>{t('loadingReportData')}</div>
          </div>
        ) : selectedReport === 'sales' && (
          <>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">{t('totalRevenue')}</div>
                <div className="stat-value">PKR {salesData.totalRevenue.toLocaleString()}</div>
                <div className="stat-change change-positive">
                  {salesData.totalSales} {t('sales')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('topProduct')}</div>
                <div className="stat-value" style={{ fontSize: '16px' }}>
                  {salesData.topProducts[0]?.name || 'N/A'}
                </div>
                <div className="stat-change change-positive">
                  {salesData.topProducts[0]?.units || 0} {t('unitsSold')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('averageOrderValue')}</div>
                <div className="stat-value">
                  PKR {salesData.totalSales > 0 ? Math.round(salesData.totalRevenue / salesData.totalSales).toLocaleString() : 0}
                </div>
                <div className="stat-change change-positive">
                  {t('perTransaction')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('categories')}</div>
                <div className="stat-value">{salesData.categories.length}</div>
                <div className="stat-change change-positive">
                  {t('activeCategories')}
                </div>
              </div>
            </div>

            <div className="report-card">
              <div className="card-title">{t('dailySalesTrend')}</div>
              <div className="chart-container">
                <div className="bar-chart">
                  {salesData.daily.map((day, index) => (
                    <div 
                      key={index} 
                      className="bar" 
                      style={{ height: `${(day.sales / 70000) * 100}%` }}
                    >
                      <span className="bar-value">PKR {(day.sales / 1000).toFixed(0)}k</span>
                      <span className="bar-label">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="two-column">
              <div className="report-card">
                <div className="card-title">{t('topSellingProducts')}</div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('product')}</th>
                        <th>{t('units')}</th>
                        <th>{t('revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.topProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.name}</td>
                          <td>{product.units}</td>
                          <td>PKR {product.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="report-card">
                <div className="card-title">{t('salesByCategory')}</div>
                <div className="pie-chart">
                  <svg className="pie-svg" viewBox="0 0 100 100">
                    {(() => {
                      let cumulativePercent = 0;
                      return salesData.categories.map((cat, index) => {
                        const startAngle = cumulativePercent * 3.6;
                        cumulativePercent += cat.value;
                        const endAngle = cumulativePercent * 3.6;
                        const largeArc = cat.value > 50 ? 1 : 0;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        return (
                          <path
                            key={index}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={cat.color}
                            opacity="0.9"
                          />
                        );
                      });
                    })()}
                    <circle cx="50" cy="50" r="20" fill="white" />
                  </svg>
                  <div className="pie-legend">
                    {salesData.categories.map((cat, index) => (
                      <div key={index} className="legend-item">
                        <div className="legend-color" style={{ background: cat.color }}></div>
                        <span className="legend-label">{cat.name}</span>
                        <span className="legend-value">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'inventory' && (
          <>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">{t('totalProducts')}</div>
                <div className="stat-value">{inventoryData.totalProducts}</div>
                <div className="stat-change change-positive">
                  {t('inInventory')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('lowStockItems')}</div>
                <div className="stat-value">{inventoryData.lowStock.length}</div>
                <div className="stat-change change-negative">
                  {t('requiresAttention')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('outOfStock')}</div>
                <div className="stat-value">
                  {inventoryData.lowStock.filter(item => item.status === t('outOfStock')).length}
                </div>
                <div className="stat-change change-negative">
                  {t('critical')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('stockValue')}</div>
                <div className="stat-value">PKR {(inventoryData.totalValue / 100000).toFixed(1)}L</div>
                <div className="stat-change change-positive">
                  {t('totalInventoryValue')}
                </div>
              </div>
            </div>

            <div className="report-card">
              <div className="card-title">{t('lowStockAlert')}</div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>{t('currentStock')}</th>
                      <th>{t('minimumStock')}</th>
                      <th>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.lowStock.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product}</td>
                        <td>{item.current}</td>
                        <td>{item.minimum}</td>
                        <td>
                          <span className={`status-badge status-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-card">
              <div className="card-title">{t('stockValueByCategory')}</div>
              <div style={{ padding: '20px 0' }}>
                {inventoryData.stockValue.map((cat, index) => (
                  <div key={index} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{cat.category}</span>
                      <span style={{ fontSize: '14px', color: '#000000' }}>
                        PKR {(cat.value / 1000).toFixed(0)}k ({cat.items} {t('items')})
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(cat.value / 1300000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedReport === 'financial' && (
          <>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">{t('totalRevenue')}</div>
                <div className="stat-value">PKR {financialData.summary.totalRevenue.toLocaleString()}</div>
                <div className="stat-change change-positive">
                  ↑ 15% {t('fromLastMonth')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('totalExpenses')}</div>
                <div className="stat-value">PKR {financialData.summary.totalExpenses.toLocaleString()}</div>
                <div className="stat-change change-negative">
                  ↑ 8% {t('fromLastMonth')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('netProfit')}</div>
                <div className="stat-value">PKR {financialData.summary.netProfit.toLocaleString()}</div>
                <div className="stat-change change-positive">
                  ↑ 22% {t('fromLastMonth')}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">{t('profitMargin')}</div>
                <div className="stat-value">{financialData.summary.profitMargin}%</div>
                <div className="stat-change change-positive">
                  ↑ 3.2% {t('fromLastMonth')}
                </div>
              </div>
            </div>

            <div className="report-card">
              <div className="card-title">{t('monthlyFinancialTrend')}</div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('month')}</th>
                      <th>{t('revenue')}</th>
                      <th>{t('expenses')}</th>
                      <th>{t('profit')}</th>
                      <th>{t('margin')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.monthlyTrend.map((month, index) => (
                      <tr key={index}>
                        <td>{month.month}</td>
                        <td>PKR {month.revenue.toLocaleString()}</td>
                        <td>PKR {month.expenses.toLocaleString()}</td>
                        <td>PKR {month.profit.toLocaleString()}</td>
                        <td>{((month.profit / month.revenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-card">
              <div className="card-title">{t('expenseBreakdown')}</div>
              <div style={{ padding: '20px 0' }}>
                {financialData.expenses.map((expense, index) => (
                  <div key={index} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{expense.category}</span>
                      <span style={{ fontSize: '14px', color: '#000000' }}>
                        PKR {expense.amount.toLocaleString()} ({expense.percentage}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}