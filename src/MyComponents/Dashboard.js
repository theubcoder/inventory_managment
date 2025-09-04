'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    pendingReturns: 0,
    totalRevenue: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      setStats({
        totalSales: data.totalSales || 0,
        todaySales: data.todaySales || 0,
        totalProducts: data.totalProducts || 0,
        lowStock: data.lowStock || 0,
        pendingReturns: data.pendingReturns || 0,
        totalRevenue: parseFloat(data.totalRevenue) || 0
      });

      if (data.recentActivities) {
        setRecentActivities(data.recentActivities.map(activity => ({
          ...activity,
          time: new Date(activity.time).toLocaleString()
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <style jsx>{`
        .dashboard {
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          margin: 0;
        }

        .dashboard-header {
          margin: 0 0 40px 0;
        }

        .dashboard-title {
          font-size: 36px;
          font-weight: bold;
          color: white;
          margin-bottom: 10px;
        }

        .dashboard-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 15px;
        }

        .icon-sales {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .icon-products {
          background: linear-gradient(135deg, #f093fb, #f5576c);
          color: white;
        }

        .icon-stock {
          background: linear-gradient(135deg, #fa709a, #fee140);
          color: white;
        }

        .icon-returns {
          background: linear-gradient(135deg, #30cfd0, #330867);
          color: white;
        }

        .icon-revenue {
          background: linear-gradient(135deg, #a8edea, #fed6e3);
          color: white;
        }

        .stat-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #000000;
        }

        .stat-change {
          margin-top: 10px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .change-positive {
          color: #10b981;
        }

        .change-negative {
          color: #ef4444;
        }

        .activity-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .activity-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        .view-all-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          padding: 15px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          background: #f3f4f6;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 20px;
        }

        .activity-icon.sale {
          background: #dcfce7;
          color: #16a34a;
        }

        .activity-icon.return {
          background: #fee2e2;
          color: #dc2626;
        }

        .activity-icon.stock {
          background: #fef3c7;
          color: #d97706;
        }

        .activity-details {
          flex: 1;
        }

        .activity-description {
          font-size: 15px;
          color: #1f2937;
          font-weight: 500;
          margin-bottom: 3px;
        }

        .activity-time {
          font-size: 13px;
          color: #6b7280;
        }

        .quick-action-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .quick-action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .quick-action-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .quick-action-content {
          flex: 1;
        }

        .quick-action-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .quick-action-description {
          font-size: 14px;
          color: #6b7280;
        }

        .returns-info-section {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          color: white;
        }

        .returns-info-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .returns-info-description {
          font-size: 14px;
          opacity: 0.95;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 20px;
          }

          .dashboard-title {
            font-size: 28px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">{t('dashboard')}</h1>
        <p className="dashboard-subtitle">{t('welcomeBack')}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-sales">📈</div>
          <div className="stat-label">{t('todaysSales')}</div>
          <div className="stat-value">{stats.todaySales}</div>
          <div className="stat-change change-positive">
            ↑ 12% {t('fromYesterday')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-revenue">💰</div>
          <div className="stat-label">{t('totalRevenue')}</div>
          <div className="stat-value">PKR {stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-change change-positive">
            ↑ 8% {t('thisMonth')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-products">📦</div>
          <div className="stat-label">{t('totalProducts')}</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-change change-positive">
            ↑ 5 {t('newThisWeek')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-stock">⚠️</div>
          <div className="stat-label">{t('lowStockItems')}</div>
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-change change-negative">
            {t('requiresAttention')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-returns">↩️</div>
          <div className="stat-label">{t('pendingReturns')}</div>
          <div className="stat-value">{stats.pendingReturns}</div>
          <div className="stat-change change-negative">
            {t('processSoon')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
        <div className="activity-section" style={{ flex: 1 }}>
          <div className="activity-header">
            <h2 className="activity-title">{t('recentActivities')}</h2>
            <button className="view-all-btn">{t('viewAll')}</button>
          </div>
          <div className="activity-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'sale' && '💵'}
                  {activity.type === 'return' && '↩️'}
                  {activity.type === 'stock' && '📦'}
                </div>
                <div className="activity-details">
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
          <div className="quick-action-card">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-content">
              <h3 className="quick-action-title">{t('findSale')}</h3>
              <p className="quick-action-description">{t('searchViewTransactions')}</p>
            </div>
          </div>
          
          <div className="quick-action-card">
            <div className="quick-action-icon">↩️</div>
            <div className="quick-action-content">
              <h3 className="quick-action-title">{t('recentReturnsTitle')}</h3>
              <p className="quick-action-description">{t('viewLatestReturns')}</p>
            </div>
          </div>

          <div className="returns-info-section">
            <h3 className="returns-info-title">{t('returnsRefunds')}</h3>
            <p className="returns-info-description">{t('processReturnsRefunds')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}