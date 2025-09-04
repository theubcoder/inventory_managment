'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Navigation({ activeTab, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '📊' },
    { id: 'products', label: t('products'), icon: '📦' },
    { id: 'sales', label: t('sales'), icon: '💰' },
    { id: 'loans', label: t('loanHistory'), icon: '📜' },
    { id: 'ograi', label: t('ograi'), icon: '🌾' },
    { id: 'returns', label: t('returns'), icon: '↩️' },
    { id: 'reports', label: t('reports'), icon: '📈' },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        ☰
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />}

      {/* Navigation Sidebar */}
      <div className={`navigation ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <style jsx>{`
          .navigation {
            width: 280px;
            height: 100vh;
            background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
            position: fixed;
            left: 0;
            top: 0;
            transition: all 0.3s ease;
            box-shadow: 5px 0 20px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
          }

          [dir="rtl"] .navigation {
            left: auto;
            right: 0;
            box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
          }

          .navigation.collapsed {
            width: 80px;
          }

          .nav-header {
            padding: 25px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
          }

          .nav-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
          }

          .logo-text {
            font-size: 18px;
            font-weight: bold;
            color: white;
            transition: all 0.3s ease;
            white-space: nowrap;
            overflow: hidden;
          }

          .navigation.collapsed .logo-text {
            opacity: 0;
            width: 0;
          }

          .toggle-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 16px;
            flex-shrink: 0;
          }

          .toggle-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .nav-menu {
            flex: 1;
            padding: 20px 15px;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .nav-menu::-webkit-scrollbar {
            display: none;
          }

          .menu-item {
            display: flex;
            align-items: center;
            padding: 14px 15px;
            margin-bottom: 6px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .menu-item:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(4px);
          }

          .menu-item.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            transform: translateX(4px);
          }

          .menu-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: white;
            border-radius: 0 2px 2px 0;
          }

          .menu-icon {
            font-size: 20px;
            min-width: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .menu-label {
            color: white;
            font-size: 14px;
            font-weight: 500;
            margin-left: 12px;
            transition: all 0.3s ease;
            white-space: nowrap;
            overflow: hidden;
          }

          .navigation.collapsed .menu-label {
            opacity: 0;
            width: 0;
            margin-left: 0;
          }

          .nav-footer {
            flex-shrink: 0;
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 0, 0, 0.1);
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            margin-bottom: 12px;
          }

          .user-avatar {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
            flex-shrink: 0;
          }

          .user-details {
            flex: 1;
            min-width: 0;
            transition: all 0.3s ease;
          }

          .user-name {
            color: white;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
          }

          .user-role {
            color: rgba(255, 255, 255, 0.6);
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
          }

          .navigation.collapsed .user-details {
            opacity: 0;
            width: 0;
            overflow: hidden;
          }

          .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .language-toggle {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            padding: 10px 12px;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
          }

          .language-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }

          .logout-btn {
            background: rgba(239, 68, 68, 0.2);
            border: none;
            padding: 10px 12px;
            border-radius: 8px;
            color: #fca5a5;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
          }

          .logout-btn:hover {
            background: rgba(239, 68, 68, 0.3);
            color: white;
            transform: translateY(-2px);
          }

          .navigation.collapsed .language-toggle span,
          .navigation.collapsed .logout-btn span {
            display: none;
          }

          .tooltip {
            position: absolute;
            left: 85px;
            top: 50%;
            transform: translateY(-50%);
            background: #1f2937;
            color: white;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1001;
          }

          .tooltip::before {
            content: '';
            position: absolute;
            left: -4px;
            top: 50%;
            transform: translateY(-50%);
            border-right: 4px solid #1f2937;
            border-top: 4px solid transparent;
            border-bottom: 4px solid transparent;
          }

          .navigation.collapsed .menu-item:hover .tooltip {
            opacity: 1;
          }

          .mobile-toggle {
            display: none;
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1100;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 12px;
            color: white;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .mobile-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }

          .mobile-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
          }

          /* Mobile Styles */
          @media (max-width: 768px) {
            .mobile-toggle {
              display: flex;
            }

            .mobile-overlay {
              display: block;
            }

            .navigation {
              transform: translateX(-100%);
              z-index: 1000;
            }

            .navigation.mobile-open {
              transform: translateX(0);
            }

            .navigation.collapsed {
              width: 280px;
            }

            .navigation.collapsed .logo-text,
            .navigation.collapsed .menu-label,
            .navigation.collapsed .user-details {
              opacity: 1;
              width: auto;
            }

            .navigation.collapsed .language-toggle span,
            .navigation.collapsed .logout-btn span {
              display: inline;
            }

            .toggle-btn {
              display: none;
            }
          }

          /* Tablet Styles */
          @media (min-width: 769px) and (max-width: 1024px) {
            .navigation {
              width: 260px;
            }

            .navigation.collapsed {
              width: 70px;
            }
          }

          /* Large Screen Styles */
          @media (min-width: 1400px) {
            .navigation {
              width: 300px;
            }
          }
        `}</style>

        <div className="nav-header">
          <div className="nav-logo">
            <div className="logo-icon">📦</div>
            <span className="logo-text">{t('inventoryPro')}</span>
          </div>
          <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="nav-menu">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              {isCollapsed && <span className="tooltip">{item.label}</span>}
            </div>
          ))}
        </div>

        <div className="nav-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">Admin User</div>
              <div className="user-role">Store Manager</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="language-toggle" onClick={toggleLanguage}>
              🌐 <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>
            <button className="logout-btn">
              🚪 <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}