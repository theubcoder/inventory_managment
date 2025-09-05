'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification, useConfirm } from '../components/NotificationSystem';

export default function OgraiCleared() {
  const { t, language } = useLanguage();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const { confirm, ConfirmComponent } = useConfirm();
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchTransactions();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/ograi/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/ograi/transactions?status=cleared');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
  const fetchPaymentHistory = async (transactionId) => {
    try {
      const response = await fetch(`/api/ograi/payment-history?transactionId=${transactionId}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const openPaymentHistoryModal = async (transaction) => {
    setSelectedTransaction(transaction);
    await fetchPaymentHistory(transaction.id);
    setShowPaymentHistory(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = await confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this completed transaction?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ograi/transactions?id=${transactionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showSuccess('Transaction deleted successfully!');
        fetchTransactions();
      } else {
        const errorData = await response.json();
        showError(`Failed to delete transaction: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showError('Failed to delete transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSupplierSummary = (supplierName) => {
    const supplierTransactions = transactions.filter(t => t.supplierName === supplierName);
    const totalPurchases = supplierTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPaid = supplierTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
    
    return { totalPurchases, totalPaid, totalRemaining: 0, totalTransportDue: 0 };
  };

  return (
    <div className="ograi-container">
      <style jsx>{`
        .ograi-container {
          padding: 30px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          min-height: 100vh;
          margin: 0;
        }

        .page-header {
          margin: 0 0 30px 0;
        }

        .page-title {
          font-size: 36px;
          font-weight: bold;
          color: white;
          margin-bottom: 10px;
        }

        .page-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
        }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          background: white;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          flex: 1;
          padding: 10px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          color: black;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .summary-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 12px;
        }

        .icon-completed {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .icon-paid {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .summary-label {
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        .suppliers-section {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .suppliers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .supplier-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .supplier-card:hover {
          border-color: #10b981;
          background: #f9fafb;
        }

        .supplier-card.selected {
          border-color: #10b981;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
        }

        .supplier-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .supplier-info {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
        }

        .info-item {
          flex: 1;
        }

        .info-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .transactions-table {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
        }

        td {
          padding: 12px;
          font-size: 14px;
          color: #1f2937;
          border-bottom: 1px solid #f3f4f6;
        }

        tr:hover {
          background: #f9fafb;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-completed {
          background: #dcfce7;
          color: #16a34a;
        }

        .modal-overlay {
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
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .close-btn:hover {
          color: #1f2937;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .ograi-container {
            padding: 20px;
          }

          .page-title {
            font-size: 28px;
          }

          .action-bar {
            flex-direction: column;
            gap: 15px;
          }

          .search-box {
            width: 100%;
            max-width: none;
          }

          .modal-content {
            padding: 20px;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Cleared Ograi Transactions</h1>
        <p className="page-subtitle">Completed supplier payments and transactions</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by supplier"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              // Filter logic here
            }}
          />
        </div>
        <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
          ✅ All transactions completed
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon icon-completed">✅</div>
          <div className="summary-label">Completed Transactions</div>
          <div className="summary-value">{transactions.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-icon icon-paid">💰</div>
          <div className="summary-label">Total Completed Amount</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon icon-paid">✅</div>
          <div className="summary-label">Total Paid</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.amountPaid, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {suppliers.length > 0 && (
        <div className="suppliers-section">
          <h2 className="section-title">Completed Supplier Transactions</h2>
          <div className="suppliers-grid">
            {suppliers.map(supplier => {
              const summary = getSupplierSummary(supplier.name);
              const hasCompletedTransactions = transactions.some(t => t.supplierName === supplier.name);
              
              if (!hasCompletedTransactions) return null;
              
              return (
                <div
                  key={supplier.id}
                  className={`supplier-card ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <div className="supplier-name">{supplier.name}</div>
                  <div className="supplier-info">
                    <div className="info-item">
                      <div className="info-label">Total Business</div>
                      <div className="info-value">PKR {summary.totalPurchases.toLocaleString()}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Transactions</div>
                      <div className="info-value">
                        {transactions.filter(t => t.supplierName === supplier.name).length}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="transactions-table">
        <h2 className="section-title">Cleared Transaction History</h2>
        {transactions.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Transport Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .filter(t => !selectedSupplier || t.supplierName === selectedSupplier.name)
                  .map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                    <td>{transaction.supplierName}</td>
                    <td>{transaction.productName}</td>
                    <td>{transaction.quantity}</td>
                    <td>PKR {transaction.totalAmount.toLocaleString()}</td>
                    <td>PKR {transaction.amountPaid.toLocaleString()}</td>
                    <td>PKR {(transaction.transportFee || 0).toLocaleString()}</td>
                    <td>
                      <span className="status-badge status-completed">
                        ✅ Completed
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="history-btn"
                          onClick={() => openPaymentHistoryModal(transaction)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          📜 History
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">No Cleared Transactions Yet</div>
            <div className="empty-description">Completed transactions will appear here</div>
          </div>
        )}
      </div>

      {showPaymentHistory && selectedTransaction && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPaymentHistory(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Payment History</h2>
              <button className="close-btn" onClick={() => setShowPaymentHistory(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#374151' }}>Transaction Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Supplier: </span>
                  <strong>{selectedTransaction.supplierName}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Product: </span>
                  <strong>{selectedTransaction.productName}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Total Amount: </span>
                  <strong>PKR {parseFloat(selectedTransaction.totalAmount).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Total Paid: </span>
                  <strong style={{ color: '#10b981' }}>PKR {parseFloat(selectedTransaction.amountPaid).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Status: </span>
                  <strong style={{ color: '#10b981' }}>✅ Fully Paid</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Transport: </span>
                  <strong style={{ color: '#10b981' }}>✅ Completed</strong>
                </div>
              </div>
            </div>

            {paymentHistory.length > 0 ? (
              <div className="table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Payment #</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Product Payment</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Transport Payment</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Total Payment</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Method</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr key={payment.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          Installment {paymentHistory.length - index}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          PKR {parseFloat(payment.paymentAmount).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          PKR {parseFloat(payment.transportPayment).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', fontWeight: 'bold' }}>
                          PKR {parseFloat(payment.totalPayment).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          {payment.paymentMethod}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💳</div>
                <div className="empty-title">No Payment History</div>
                <div className="empty-description">Payment history not available</div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentHistory(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmComponent />
    </div>
  );
}