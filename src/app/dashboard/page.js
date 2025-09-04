'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    revenue: 0
  })

  useEffect(() => {
    // Fetch dashboard data
    setStats({
      totalProducts: 156,
      totalOrders: 48,
      totalCustomers: 234,
      revenue: 45678
    })
  }, [])

  const statsCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      change: '+12%',
      changeType: 'increase',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCartIcon,
      change: '+8%',
      changeType: 'increase',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      change: '+5%',
      changeType: 'increase',
      bgColor: 'bg-purple-500',
    },
    {
      title: 'Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: ChartBarIcon,
      change: '+18%',
      changeType: 'increase',
      bgColor: 'bg-orange-500',
    },
  ]

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', date: '2024-01-10', amount: 1250, status: 'Delivered' },
    { id: 'ORD002', customer: 'Jane Smith', date: '2024-01-11', amount: 890, status: 'Processing' },
    { id: 'ORD003', customer: 'Bob Johnson', date: '2024-01-11', amount: 2100, status: 'Pending' },
    { id: 'ORD004', customer: 'Alice Brown', date: '2024-01-12', amount: 560, status: 'Delivered' },
  ]

  const lowStockProducts = [
    { id: 1, name: 'Product A', stock: 5, minStock: 10 },
    { id: 2, name: 'Product B', stock: 3, minStock: 15 },
    { id: 3, name: 'Product C', stock: 8, minStock: 20 },
    { id: 4, name: 'Product D', stock: 2, minStock: 10 },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your inventory management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <th className="pb-3 font-medium text-gray-600">Order ID</th>
                  <th className="pb-3 font-medium text-gray-600">Customer</th>
                  <th className="pb-3 font-medium text-gray-600">Amount</th>
                  <th className="pb-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3">₹{order.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-600' : 
                          'bg-yellow-100 text-yellow-600'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Low Stock Alert</h2>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">Min Stock: {product.minStock}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{product.stock}</p>
                  <p className="text-xs text-gray-500">Current Stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}