'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, ChartBarIcon, BanknotesIcon, ShoppingCartIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = '/api/reports';
      const params = new URLSearchParams();
      
      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const reportData = await response.json();
      setData(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyDateFilter = () => {
    fetchReportData();
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load report data</div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Sales',
      value: data.summary.totalSales,
      icon: ShoppingCartIcon,
      bgColor: 'bg-blue-500',
    },
    {
      title: `Revenue (${data.dateRange})`,
      value: `PKR ${data.summary.totalRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      bgColor: 'bg-green-500',
    },
    {
      title: `Profit (${data.dateRange})`,
      value: `PKR ${data.summary.totalProfit.toLocaleString()}`,
      icon: BanknotesIcon,
      bgColor: 'bg-emerald-500',
    },
    {
      title: 'Profit Margin',
      value: `${data.summary.profitMargin}%`,
      icon: ArrowTrendingUpIcon,
      bgColor: 'bg-orange-500',
    },
    {
      title: 'Net Profit',
      value: `PKR ${data.summary.netProfit.toLocaleString()}`,
      icon: BanknotesIcon,
      bgColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive business analytics and profit reports</p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <button
              onClick={applyDateFilter}
              disabled={!dateRange.startDate || !dateRange.endDate}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-1 rounded text-sm font-medium"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' })
                setTimeout(() => fetchReportData(), 100)
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Product</th>
                  <th className="pb-3 font-medium text-gray-600">Quantity Sold</th>
                  <th className="pb-3 font-medium text-gray-600">Revenue</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">{product.name}</td>
                    <td className="py-3">{product.quantity}</td>
                    <td className="py-3">PKR {product.revenue.toLocaleString()}</td>
                    <td className="py-3 text-green-600">PKR {product.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Customer</th>
                  <th className="pb-3 font-medium text-gray-600">Sales</th>
                  <th className="pb-3 font-medium text-gray-600">Revenue</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">{customer.name}</td>
                    <td className="py-3">{customer.sales}</td>
                    <td className="py-3">PKR {customer.revenue.toLocaleString()}</td>
                    <td className="py-3 text-green-600">PKR {customer.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Expenses by Category</h2>
          <div className="space-y-4">
            {data.expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{category.category}</p>
                  <p className="text-sm text-gray-600">{category.count} expenses</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">PKR {category.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Date</th>
                  <th className="pb-3 font-medium text-gray-600">Customer</th>
                  <th className="pb-3 font-medium text-gray-600">Amount</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                  <th className="pb-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">{sale.date}</td>
                    <td className="py-3">{sale.customer}</td>
                    <td className="py-3">PKR {sale.amount.toLocaleString()}</td>
                    <td className="py-3 text-green-600">PKR {sale.profit.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${sale.status === 'paid' ? 'bg-green-100 text-green-600' : 
                          sale.status === 'partial' ? 'bg-blue-100 text-blue-600' : 
                          'bg-yellow-100 text-yellow-600'}`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {data.salesTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Date</th>
                  <th className="pb-3 font-medium text-gray-600">Sales Count</th>
                  <th className="pb-3 font-medium text-gray-600">Revenue</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.salesTrend.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-3">{day.sales}</td>
                    <td className="py-3">PKR {day.revenue.toLocaleString()}</td>
                    <td className="py-3 text-green-600">PKR {day.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
