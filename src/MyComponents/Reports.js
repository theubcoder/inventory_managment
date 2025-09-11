'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarIcon, ChartBarIcon, BanknotesIcon, ShoppingCartIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Reports() {
  const t = useTranslations('Reports');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const isRTL = locale === 'ur';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch('/api/reports?availableDates=true');
      const datesData = await response.json();
      if (datesData.availableDates) {
        setAvailableDates(datesData.availableDates);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

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
    fetchAvailableDates();
    fetchReportData();
  }, []);

  const isDateDisabled = (date) => {
    return availableDates.length > 0 && !availableDates.includes(date);
  };

  const getMinDate = () => {
    if (availableDates.length === 0) return '';
    return availableDates.sort()[0];
  };

  const getMaxDate = () => {
    if (availableDates.length === 0) return '';
    return availableDates.sort()[availableDates.length - 1];
  };

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
      <div className={`p-6 bg-gray-50 min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loadingReports')}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 bg-gray-50 min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{t('failedToLoad')}</div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: t('totalSales'),
      value: data.summary.totalSales,
      icon: ShoppingCartIcon,
      bgColor: 'bg-blue-500',
    },
    {
      title: `${t('revenue')} (${data.dateRange})`,
      value: `PKR ${data.summary.totalRevenue.toLocaleString()}`,
      icon: ChartBarIcon,
      bgColor: 'bg-green-500',
    },
    {
      title: `${t('profit')} (${data.dateRange})`,
      value: `PKR ${data.summary.totalProfit.toLocaleString()}`,
      icon: BanknotesIcon,
      bgColor: 'bg-emerald-500',
    },
    {
      title: t('profitMargin'),
      value: `${data.summary.profitMargin}%`,
      icon: ArrowTrendingUpIcon,
      bgColor: 'bg-orange-500',
    },
    {
      title: t('netProfit'),
      value: `PKR ${data.summary.netProfit.toLocaleString()}`,
      icon: BanknotesIcon,
      bgColor: 'bg-purple-500',
    },
  ];

  return (
    <div className={`p-6 bg-gray-50 min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
          
          <div className={`mt-4 lg:mt-0 flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4 bg-white p-4 rounded-lg shadow`}>
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('from')}:</label>
              <input
                type="date"
                value={dateRange.startDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (!isDateDisabled(selectedDate)) {
                    handleDateRangeChange('startDate', selectedDate);
                  }
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm cursor-pointer transition-all hover:border-blue-400"
                title={availableDates.length > 0 ? `Available dates: ${getMinDate()} to ${getMaxDate()}` : 'Loading available dates...'}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">{t('to')}:</label>
              <input
                type="date"
                value={dateRange.endDate}
                min={getMinDate()}
                max={getMaxDate()}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (!isDateDisabled(selectedDate)) {
                    handleDateRangeChange('endDate', selectedDate);
                  }
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm cursor-pointer transition-all hover:border-blue-400"
                title={availableDates.length > 0 ? `Available dates: ${getMinDate()} to ${getMaxDate()}` : 'Loading available dates...'}
              />
            </div>
            <button
              onClick={applyDateFilter}
              disabled={!dateRange.startDate || !dateRange.endDate || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-1 rounded text-sm font-medium cursor-pointer transition-all hover:scale-105"
            >
              {loading ? t('loading') : t('applyFilter')}
            </button>
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' })
                setTimeout(() => fetchReportData(), 100)
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm font-medium"
            >
              {t('clear')}
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('topSellingProducts')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isRTL ? 'text-right' : 'text-left'} border-b`}>
                  <th className="pb-3 font-medium text-gray-600">{t('product')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('quantitySold')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('revenue')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('profit')}</th>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('topCustomers')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isRTL ? 'text-right' : 'text-left'} border-b`}>
                  <th className="pb-3 font-medium text-gray-600">{t('customer')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('sales')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('revenue')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('profit')}</th>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('expensesByCategory')}</h2>
          <div className="space-y-4">
            {data.expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{category.category}</p>
                  <p className="text-sm text-gray-600">{category.count} {t('expenses')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">PKR {category.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('recentSales')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isRTL ? 'text-right' : 'text-left'} border-b`}>
                  <th className="pb-3 font-medium text-gray-600">{t('date')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('customer')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('amount')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('profit')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('status')}</th>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('salesTrend')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isRTL ? 'text-right' : 'text-left'} border-b`}>
                  <th className="pb-3 font-medium text-gray-600">{t('date')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('salesCount')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('revenue')}</th>
                  <th className="pb-3 font-medium text-gray-600">{t('profit')}</th>
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
