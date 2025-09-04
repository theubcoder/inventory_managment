'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/NotificationSystem';

export default function LoanManagement() {
  const { t } = useLanguage();
  const { showSuccess, showError, showInfo } = useNotification();
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, paid, partial, pending
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [expandedSale, setExpandedSale] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');

  useEffect(() => {
    fetchSales();
  }, [dateFilter, filterStatus]);

  const fetchSales = async () => {
    setIsLoadingData(true);
    try {
      let url = `/api/sales?startDate=${dateFilter.start}&endDate=${dateFilter.end}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Filter by payment status if needed
      let filteredData = data;
      if (filterStatus !== 'all') {
        filteredData = data.filter(sale => sale.paymentStatus === filterStatus);
      }
      
      setSales(filteredData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showError(t('errorFetchingSales'));
      setSales([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedSale || !paymentAmount) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/payment-history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          amountPaid: parseFloat(paymentAmount),
          paymentMethod,
          notes: paymentNotes || null
        })
      });

      if (response.ok) {
        showSuccess(t('paymentRecordedSuccess'));
        setShowPaymentModal(false);
        setSelectedSale(null);
        setPaymentAmount('');
        setPaymentNotes('');
        await fetchSales();
      } else {
        showError(t('failedToRecordPayment'));
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showError(t('failedToRecordPayment'));
    } finally {
      setLoading(false);
    }
  };

  const showCustomConfirm = (title, message, onConfirm) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleDeletePayment = (saleId, paymentId) => {
    const deletePayment = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/payment-history?id=${paymentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          showSuccess(t('paymentDeletedSuccess') || 'Payment deleted successfully');
          await fetchSales(); // Refresh the sales data
        } else {
          const error = await response.json();
          showError(error.error || t('failedToDeletePayment') || 'Failed to delete payment');
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        showError(t('failedToDeletePayment') || 'Failed to delete payment');
      } finally {
        setLoading(false);
      }
    };
    
    showCustomConfirm(
      t('deletePayment') || 'Delete Payment',
      t('confirmDeletePayment') || 'Are you sure you want to delete this payment?',
      deletePayment
    );
  };

  const handleDeleteSale = (saleId) => {
    const deleteSale = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sales?id=${saleId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          showSuccess(t('saleDeletedSuccess') || 'Sale deleted successfully');
          await fetchSales(); // Refresh the sales data
          setExpandedSale(null); // Close expanded view if any
        } else {
          const error = await response.json();
          showError(error.error || t('failedToDeleteSale') || 'Failed to delete sale');
        }
      } catch (error) {
        console.error('Error deleting sale:', error);
        showError(t('failedToDeleteSale') || 'Failed to delete sale');
      } finally {
        setLoading(false);
      }
    };
    
    showCustomConfirm(
      t('deleteSale') || 'Delete Sale',
      t('confirmDeleteSale') || 'Are you sure you want to delete this fully paid sale? This action cannot be undone.',
      deleteSale
    );
  };

  const handleDeleteAllPaidSales = () => {
    const paidSales = filteredSales.filter(sale => sale.paymentStatus === 'paid');
    
    if (paidSales.length === 0) {
      showInfo(t('noPaidSales') || 'No paid sales to delete');
      return;
    }
    
    const deleteAllPaid = async () => {
      setLoading(true);
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const sale of paidSales) {
        try {
          const response = await fetch(`/api/sales?id=${sale.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            deletedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Error deleting sale ${sale.id}:`, error);
          failedCount++;
        }
      }
      
      if (deletedCount > 0) {
        showSuccess(`${deletedCount} ${t('salesDeleted') || 'sales deleted successfully'}`);
        await fetchSales();
      }
      
      if (failedCount > 0) {
        showError(`${failedCount} ${t('salesFailedToDelete') || 'sales failed to delete'}`);
      }
      
      setLoading(false);
    };
    
    showCustomConfirm(
      t('deleteAllPaidSales') || 'Delete All Paid Sales',
      `${t('confirmDeleteAllPaid') || 'Are you sure you want to delete'} ${paidSales.length} ${t('paidSales') || 'paid sales'}? ${t('actionCannotUndone') || 'This action cannot be undone.'}`,
      deleteAllPaid
    );
  };

  const toggleSaleDetails = (saleId) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchLower)) ||
      (sale.customer?.phone && sale.customer.phone.includes(searchLower))
    );
  });

  const calculateTotals = () => {
    const totals = filteredSales.reduce((acc, sale) => {
      acc.totalSales += 1;
      acc.totalAmount += parseFloat(sale.totalAmount || 0);
      acc.totalPaid += parseFloat(sale.amountPaid || 0);
      acc.totalPending += parseFloat(sale.remainingAmount || 0);
      acc.totalProfit += parseFloat(sale.totalProfit || 0);
      return acc;
    }, { totalSales: 0, totalAmount: 0, totalPaid: 0, totalPending: 0, totalProfit: 0 });
    
    return totals;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const totals = calculateTotals();

  return (
    <div className="loan-management">
      <style jsx>{`
        .loan-management {
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          margin: 0;
        }

        .page-header {
          background: white;
          border-radius: 20px;
          padding: 25px;
          margin: 0 0 30px 0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .page-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }

        .page-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .filters {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          min-width: 250px;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .date-filter {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .date-input {
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
        }

        .filter-tab {
          padding: 10px 20px;
          border: none;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-tab.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-change {
          font-size: 12px;
          color: #10b981;
          margin-top: 5px;
        }

        .sales-table {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .table-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .sales-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .sale-item {
          background: #f9fafb;
          border-radius: 12px;
          padding: 15px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .sale-item:hover {
          background: #f3f4f6;
          transform: translateX(5px);
        }

        .sale-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sale-info {
          flex: 1;
        }

        .sale-id {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .sale-customer {
          font-size: 14px;
          color: #6b7280;
        }

        .sale-meta {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .sale-amount {
          text-align: right;
        }

        .amount-total {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .amount-paid {
          font-size: 13px;
          color: #10b981;
        }

        .amount-remaining {
          font-size: 13px;
          color: #ef4444;
        }

        .payment-status {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sale-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .detail-section {
          margin-bottom: 15px;
        }

        .detail-title {
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 10px;
        }

        .items-list {
          font-size: 13px;
          color: #6b7280;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }

        .payment-history {
          margin-top: 10px;
        }

        .payment-item {
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .payment-date {
          color: #6b7280;
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 60px;
          margin-bottom: 15px;
        }

        .empty-text {
          font-size: 18px;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 30px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          margin-bottom: 25px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .modal-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          resize: vertical;
          min-height: 100px;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .payment-method-btn {
          padding: 10px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .payment-method-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #6b7280;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .loan-management {
            padding: 20px;
          }

          .filters {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .payment-methods {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">{t('loanHistory')}</h1>
        <p className="page-subtitle">{t('loanHistorySubtitle')}</p>
        
        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder={t('searchBySaleIdCustomer')}
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="date-filter">
            <input
              type="date"
              className="date-input"
              value={dateFilter.start || ''}
              onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
            />
            <span>{t('to')}</span>
            <input
              type="date"
              className="date-input"
              value={dateFilter.end || ''}
              onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
            />
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            {t('allSales')} ({sales.length})
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'paid' ? 'active' : ''}`}
            onClick={() => setFilterStatus('paid')}
          >
            {t('fullyPaid')}
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'partial' ? 'active' : ''}`}
            onClick={() => setFilterStatus('partial')}
          >
            {t('partiallyPaid')}
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            {t('pending')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('totalSales')}</div>
          <div className="stat-value">{totals.totalSales}</div>
          <div className="stat-change">{t('inSelectedPeriod')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('totalAmount')}</div>
          <div className="stat-value">PKR {totals.totalAmount.toLocaleString()}</div>
          <div className="stat-change">{t('totalSalesAmount')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('totalPaid')}</div>
          <div className="stat-value">PKR {totals.totalPaid.toLocaleString()}</div>
          <div className="stat-change">{t('amountCollected')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('totalPending')}</div>
          <div className="stat-value">PKR {totals.totalPending.toLocaleString()}</div>
          <div className="stat-change">{t('yetToCollect')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('totalProfit')}</div>
          <div className="stat-value">PKR {totals.totalProfit.toLocaleString()}</div>
          <div className="stat-change">{t('fromAllSales')}</div>
        </div>
      </div>

      <div className="sales-table">
        <div className="table-header">
          <h2 className="table-title">{t('salesAndPaymentHistory')}</h2>
          {filteredSales.filter(s => s.paymentStatus === 'paid').length > 0 && (
            <button 
              className="action-btn"
              style={{ 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                padding: '10px 20px',
                fontSize: '14px'
              }}
              onClick={handleDeleteAllPaidSales}
              disabled={loading}
            >
              {t('deleteAllPaid') || 'Delete All Paid'} ({filteredSales.filter(s => s.paymentStatus === 'paid').length})
            </button>
          )}
        </div>

        {isLoadingData ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">{t('loadingData')}</div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <div className="empty-text">{t('noSalesFound')}</div>
          </div>
        ) : (
          <div className="sales-list">
            {filteredSales.map(sale => (
              <div 
                key={sale.id} 
                className="sale-item"
                onClick={() => toggleSaleDetails(sale.id)}
              >
                <div className="sale-header">
                  <div className="sale-info">
                    <div className="sale-id">
                      {t('sale')} #{sale.id} - {formatDate(sale.createdAt)}
                    </div>
                    <div className="sale-customer">
                      {sale.customer?.name || t('walkInCustomer')} 
                      {sale.customer?.phone && ` (${sale.customer.phone})`}
                    </div>
                  </div>
                  <div className="sale-meta">
                    <div className="sale-amount">
                      <div className="amount-total">PKR {parseFloat(sale.totalAmount).toLocaleString()}</div>
                      <div className="amount-paid">{t('paid')}: {parseFloat(sale.amountPaid || 0).toLocaleString()}</div>
                      {sale.remainingAmount > 0 && (
                        <div className="amount-remaining">{t('remaining')}: {parseFloat(sale.remainingAmount).toLocaleString()}</div>
                      )}
                    </div>
                    <div 
                      className="payment-status"
                      style={{ backgroundColor: getPaymentStatusColor(sale.paymentStatus) }}
                    >
                      {t(sale.paymentStatus || 'paid')}
                    </div>
                    {sale.paymentStatus !== 'paid' ? (
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSale(sale);
                          setPaymentAmount(sale.remainingAmount.toString());
                          setShowPaymentModal(true);
                        }}
                      >
                        {t('addPayment')}
                      </button>
                    ) : (
                      <button 
                        className="action-btn"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id);
                        }}
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>

                {expandedSale === sale.id && (
                  <div className="sale-details">
                    <div className="details-grid">
                      <div className="detail-section">
                        <div className="detail-title">{t('itemsSold')}</div>
                        <div className="items-list">
                          {sale.saleItems?.map((item, index) => (
                            <div key={index} className="item-row">
                              <span>{item.product?.name || 'Unknown'}</span>
                              <span>{item.quantity} × PKR {parseFloat(item.unitPrice).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <div className="detail-title">{t('paymentHistory')}</div>
                        <div className="payment-history">
                          {sale.paymentHistory && sale.paymentHistory.length > 0 ? (
                            sale.paymentHistory.map((payment, index) => (
                              <div key={index} className="payment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ flex: 1 }}>
                                  <div>{t(payment.paymentMethod)} - PKR {parseFloat(payment.amountPaid).toLocaleString()}</div>
                                  <div className="payment-date" style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(payment.paymentDate || payment.createdAt)}</div>
                                  {payment.notes && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{payment.notes}</div>}
                                </div>
                                {index > 0 && ( // Don't show delete for initial payment
                                  <button
                                    onClick={() => handleDeletePayment(sale.id, payment.id)}
                                    className="btn-delete-payment"
                                    style={{
                                      padding: '4px 8px',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      marginLeft: '10px'
                                    }}
                                  >
                                    {t('delete')}
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div>{t('noPaymentHistory')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb' }}>
                      <div className="item-row">
                        <span>{t('profit')}:</span>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>PKR {parseFloat(sale.totalProfit || 0).toLocaleString()}</span>
                      </div>
                      {sale.dueDate && (
                        <div className="item-row">
                          <span>{t('dueDate')}:</span>
                          <span>{new Date(sale.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentModal && selectedSale && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{t('recordPayment')}</h2>
              <p className="modal-subtitle">
                {t('sale')} #{selectedSale.id} - {selectedSale.customer?.name || t('walkInCustomer')}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">{t('remainingAmount')}</label>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                PKR {parseFloat(selectedSale.remainingAmount).toLocaleString()}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('paymentAmount')}</label>
              <input
                type="number"
                className="form-input"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={t('enterAmountBeingPaid')}
                max={selectedSale.remainingAmount}
              />
              {paymentAmount && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                  {t('remainingAfterPayment')}: PKR {(selectedSale.remainingAmount - parseFloat(paymentAmount || 0)).toLocaleString()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('paymentMethod')}</label>
              <div className="payment-methods">
                {['cash', 'card', 'bank'].map(method => (
                  <button
                    key={method}
                    className={`payment-method-btn ${paymentMethod === method ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {t(method)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('notesOptional')}</label>
              <textarea
                className="form-textarea"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={t('addNotesAboutPayment')}
              />
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedSale(null);
                  setPaymentAmount('');
                  setPaymentNotes('');
                }}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePayment}
                disabled={!paymentAmount || loading || parseFloat(paymentAmount) <= 0}
              >
                {loading ? t('processing') : t('recordPayment')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.3s ease'
          }}>
            <h2 style={{
              margin: '0 0 15px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              borderBottom: '2px solid #f3f4f6',
              paddingBottom: '15px'
            }}>
              {confirmTitle}
            </h2>
            
            <p style={{
              margin: '20px 0 30px 0',
              fontSize: '16px',
              color: '#4b5563',
              lineHeight: '1.5'
            }}>
              {confirmMessage}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelConfirm}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                {t('cancel') || 'Cancel'}
              </button>
              
              <button
                onClick={handleConfirm}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                }}
              >
                {t('confirm') || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}