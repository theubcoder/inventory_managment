'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      let url = '/api/dashboard'
      const params = new URLSearchParams()
      
      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate)
        params.append('endDate', dateRange.endDate)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url)
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyDateFilter = () => {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load dashboard data</div>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Products',
      value: data.totalProducts,
      icon: CubeIcon,
      change: null,
      changeType: 'neutral',
      bgColor: 'bg-blue-500',
    },
    {
      title: `Sales (${data.dateRange})`,
      value: data.periodSales,
      icon: ShoppingCartIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Total Customers',
      value: data.totalCustomers,
      icon: UsersIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-purple-500',
    },
    {
      title: `Revenue (${data.dateRange})`,
      value: `PKR ${data.periodRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-orange-500',
    },
    {
      title: `Profit (${data.dateRange})`,
      value: `PKR ${data.periodProfit.toLocaleString()}`,
      icon: BanknotesIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-emerald-500',
    },
  ]

  const recentOrders = data.recentActivities || []
  const lowStockProducts = data.lowStockProducts || []

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to your inventory management system</p>
          </div>
          
          {/* Date Range Filter */}
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
                setTimeout(() => fetchDashboardData(), 100)
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Sale ID</th>
                  <th className="pb-3 font-medium text-gray-600">Customer</th>
                  <th className="pb-3 font-medium text-gray-600">Amount</th>
                  <th className="pb-3 font-medium text-gray-600">Profit</th>
                  <th className="pb-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">#{order.id}</td>
                    <td className="py-3">{order.description.split(' to ')[1]}</td>
                    <td className="py-3">PKR {order.amount.toLocaleString()}</td>
                    <td className="py-3 text-green-600">PKR {order.profit.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${order.status === 'paid' ? 'bg-green-100 text-green-600' : 
                          order.status === 'partial' ? 'bg-blue-100 text-blue-600' : 
                          'bg-yellow-100 text-yellow-600'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No recent sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Low Stock Alert</h2>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">Category: {product.category || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{product.quantity}</p>
                  <p className="text-xs text-gray-500">Current Stock</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}