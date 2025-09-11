'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availableDates, setAvailableDates] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/dashboard?availableDates=true')
      const datesData = await response.json()
      if (datesData.availableDates) {
        setAvailableDates(datesData.availableDates)
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    }
  }

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
    fetchAvailableDates()
    fetchDashboardData()
  }, [])

  const isDateDisabled = (date) => {
    return availableDates.length > 0 && !availableDates.includes(date)
  }

  const getMinDate = () => {
    if (availableDates.length === 0) return ''
    return availableDates.sort()[0]
  }

  const getMaxDate = () => {
    if (availableDates.length === 0) return ''
    return availableDates.sort()[availableDates.length - 1]
  }

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
          <div className="text-lg">{t('loading')}</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{t('error')}</div>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: t('stats.totalProducts'),
      value: data.totalProducts,
      icon: CubeIcon,
      change: null,
      changeType: 'neutral',
      bgColor: 'bg-blue-500',
    },
    {
      title: `${t('stats.sales')} (${data.dateRange || 'Today'})`,
      value: data.periodSales || 0,
      icon: ShoppingCartIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-green-500',
    },
    {
      title: t('stats.totalCustomers'),
      value: data.totalCustomers,
      icon: UsersIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-purple-500',
    },
    {
      title: `${t('stats.revenue')} (${data.dateRange || 'Today'})`,
      value: `${tCommon('currency')} ${(data.periodRevenue || 0).toLocaleString()}`,
      icon: ChartBarIcon,
      change: null,
      changeType: 'increase',
      bgColor: 'bg-orange-500',
    },
    {
      title: `${t('stats.profit')} (${data.dateRange || 'Today'})`,
      value: `${tCommon('currency')} ${(data.periodProfit || 0).toLocaleString()}`,
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
            <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
            {availableDates.length > 0 && (
              <div className="mt-2 flex items-center space-x-2 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📅 {t('daysWithData', {count: availableDates.length})}
                </span>
                <span className="text-gray-500">
                  ({getMinDate()} to {getMaxDate()})
                </span>
              </div>
            )}
          </div>
          
          {/* Date Range Filter - Responsive */}
          <div className="mt-4 lg:mt-0 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-500 hidden sm:block" />
              
              {/* Date Inputs Container */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* From Date */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('dateFilter.from')}</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    min={getMinDate()}
                    max={getMaxDate()}
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      if (!isDateDisabled(selectedDate)) {
                        handleDateRangeChange('startDate', selectedDate)
                      }
                    }}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm cursor-pointer transition-all hover:border-blue-400 w-full sm:w-auto"
                    title={availableDates.length > 0 ? `Available dates: ${getMinDate()} to ${getMaxDate()}` : 'Loading available dates...'}
                  />
                </div>
                
                {/* To Date */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('dateFilter.to')}</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    min={getMinDate()}
                    max={getMaxDate()}
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      if (!isDateDisabled(selectedDate)) {
                        handleDateRangeChange('endDate', selectedDate)
                      }
                    }}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm cursor-pointer transition-all hover:border-blue-400 w-full sm:w-auto"
                    title={availableDates.length > 0 ? `Available dates: ${getMinDate()} to ${getMaxDate()}` : 'Loading available dates...'}
                  />
                </div>
              </div>
              
              {/* Buttons Container */}
              <div className="flex gap-2 mt-3 sm:mt-0">
                <button
                  onClick={applyDateFilter}
                  disabled={!dateRange.startDate || !dateRange.endDate || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-1.5 rounded text-sm font-medium cursor-pointer transition-all hover:scale-105 flex-1 sm:flex-initial"
                >
                  {loading ? t('dateFilter.loading') : t('dateFilter.apply')}
                </button>
                <button
                  onClick={() => {
                    setDateRange({ startDate: '', endDate: '' })
                    setTimeout(() => fetchDashboardData(), 100)
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium cursor-pointer transition-all hover:scale-105 flex-1 sm:flex-initial"
                >
                  {t('dateFilter.clear')}
                </button>
              </div>
            </div>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('recentOrders.title')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">{t('recentOrders.saleId')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('recentOrders.customer')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('recentOrders.amount')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('recentOrders.profit')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('recentOrders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">#{order.id}</td>
                    <td className="py-3">{order.description.split(' to ')[1]}</td>
                    <td className="py-3">{tCommon('currency')} {order.amount.toLocaleString()}</td>
                    <td className="py-3 text-green-600">{tCommon('currency')} {order.profit.toLocaleString()}</td>
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
                      {t('recentOrders.noSales')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('lowStock.title')}</h2>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">{t('lowStock.category')} {product.category || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{product.quantity}</p>
                  <p className="text-xs text-gray-500">{t('lowStock.currentStock')}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>{t('lowStock.allStocked')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}