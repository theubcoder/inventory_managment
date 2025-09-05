'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useNotification, useConfirm } from '../components/NotificationSystem';

export default function Ograi() {
  const t = useTranslations('Ograi');
  const tCommon = useTranslations('Common');
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const { confirm, ConfirmComponent } = useConfirm();
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierName: '',
    contactNumber: '',
    address: '',
    transactionDate: new Date().toISOString().split('T')[0],
    productName: '',
    quantity: '',
    pricePerUnit: '',
    totalAmount: 0,
    amountPaid: '',
    remainingAmount: 0,
    overpaidAmount: 0,
    transportFee: '',
    transportPaid: '',
    transportRemaining: 0,
    paymentMethod: 'cash',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    paymentAmount: '',
    transportPayment: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: ''
  });
  
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchTransactions();
  }, []);

  useEffect(() => {
    const total = parseFloat(formData.quantity || 0) * parseFloat(formData.pricePerUnit || 0);
    const paid = parseFloat(formData.amountPaid || 0);
    const remaining = Math.max(0, total - paid);
    const overpaid = Math.max(0, paid - total);
    
    const transportTotal = parseFloat(formData.transportFee || 0);
    const transportPaid = parseFloat(formData.transportPaid || 0);
    const transportRemaining = Math.max(0, transportTotal - transportPaid);

    setFormData(prev => ({
      ...prev,
      totalAmount: total,
      remainingAmount: remaining,
      overpaidAmount: overpaid,
      transportRemaining: transportRemaining
    }));
  }, [formData.quantity, formData.pricePerUnit, formData.amountPaid, formData.transportFee, formData.transportPaid]);

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
      const response = await fetch('/api/ograi/transactions?status=pending');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/ograi/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transaction saved:', data);
        fetchTransactions();
        setShowAddForm(false);
        resetForm();
        showSuccess('Transaction saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        showError(`Error saving transaction: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      showError('Error saving transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      contactNumber: '',
      address: '',
      transactionDate: new Date().toISOString().split('T')[0],
      productName: '',
      quantity: '',
      pricePerUnit: '',
      totalAmount: 0,
      amountPaid: '',
      remainingAmount: 0,
      overpaidAmount: 0,
      transportFee: '',
      transportPaid: '',
      transportRemaining: 0,
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    
    // Validate payment amounts
    const paymentAmount = parseFloat(paymentData.paymentAmount || 0);
    const transportPayment = parseFloat(paymentData.transportPayment || 0);
    const remainingAmount = parseFloat(selectedTransaction.remainingAmount || 0);
    const transportRemaining = parseFloat(selectedTransaction.transportRemaining || 0);
    
    // Check if payment exceeds remaining amount
    if (paymentAmount > remainingAmount) {
      showError(`Payment amount (PKR ${paymentAmount}) cannot exceed remaining amount of PKR ${remainingAmount.toLocaleString()}`);
      setPaymentData({...paymentData, paymentAmount: remainingAmount.toString()});
      return;
    }
    
    // Check if transport payment exceeds remaining transport
    if (transportPayment > transportRemaining) {
      showError(`Transport payment (PKR ${transportPayment}) cannot exceed remaining transport amount of PKR ${transportRemaining.toLocaleString()}`);
      setPaymentData({...paymentData, transportPayment: transportRemaining.toString()});
      return;
    }
    
    setLoading(true);
    
    try {
      // Send payment data properly formatted for the API
      const paymentRequestData = {
        id: selectedTransaction.id,
        paymentAmount: paymentAmount,
        transportPayment: transportPayment,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes
      };
      
      console.log('Sending payment data:', paymentRequestData);
      
      const response = await fetch('/api/ograi/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequestData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Payment recorded:', result);
        
        // Refresh data
        await fetchTransactions();
        setShowPaymentForm(false);
        setSelectedTransaction(null);
        setPaymentData({
          paymentAmount: '',
          transportPayment: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          notes: ''
        });
        showSuccess('Payment recorded successfully!');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        showError(`Error recording payment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showError('Error recording payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentForm(true);
  };
  
  const openPaymentHistoryModal = async (transaction) => {
    setSelectedTransaction(transaction);
    await fetchPaymentHistory(transaction.id);
    setShowPaymentHistory(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = await confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this fully paid transaction?',
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
    const totalRemaining = supplierTransactions.reduce((sum, t) => sum + t.remainingAmount, 0);
    const totalTransportDue = supplierTransactions.reduce((sum, t) => sum + t.transportRemaining, 0);
    
    return { totalPurchases, totalPaid, totalRemaining, totalTransportDue };
  };

  return (
    <div className="ograi-container">
      <style jsx>{`
        .ograi-container {
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .add-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
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

        .icon-purchases {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .icon-paid {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .icon-due {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }

        .icon-transport {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
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
          border-color: #667eea;
          background: #f9fafb;
        }

        .supplier-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
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

        .status-paid {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-overpaid {
          background: #dbeafe;
          color: #2563eb;
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

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: black;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .form-select {
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: black;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: black;
          resize: vertical;
          min-height: 80px;
          transition: all 0.3s ease;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .summary-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .summary-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-row-label {
          color: #6b7280;
          font-size: 14px;
        }

        .summary-row-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
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

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
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

          .form-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            padding: 20px;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">{t('ograiSupplierTracking')}</h1>
        <p className="page-subtitle">{t('manageSupplierPurchases')}</p>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t('searchBySupplier')}
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              // Filter logic here
            }}
          />
        </div>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>
          <span>➕</span> {t('addNewTransaction')}
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon icon-purchases">💰</div>
          <div className="summary-label">{t('totalPurchases')}</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon icon-paid">✅</div>
          <div className="summary-label">{t('totalPaid')}</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.amountPaid, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon icon-due">⏳</div>
          <div className="summary-label">{t('totalDue')}</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.remainingAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon icon-transport">🚚</div>
          <div className="summary-label">{t('transportDue')}</div>
          <div className="summary-value">
            PKR {transactions.reduce((sum, t) => sum + t.transportRemaining, 0).toLocaleString()}
          </div>
        </div>
      </div>


      <div className="transactions-table">
        <h2 className="section-title">{t('transactionHistory')}</h2>
        {transactions.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('supplier')}</th>
                  <th>{t('product')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('totalAmount')}</th>
                  <th>{t('paid')}</th>
                  <th>{t('remaining')}</th>
                  <th>{t('transport')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
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
                    <td>PKR {transaction.remainingAmount.toLocaleString()}</td>
                    <td>PKR {transaction.transportRemaining.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${
                        transaction.remainingAmount === 0 && transaction.transportRemaining === 0 ? 'status-paid' : 
                        transaction.overpaidAmount > 0 ? 'status-overpaid' : 
                        'status-pending'
                      }`}>
                        {transaction.remainingAmount === 0 && transaction.transportRemaining === 0 ? t('complete') : 
                         transaction.overpaidAmount > 0 ? t('overpaid') : 
                         t('pending')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(transaction.remainingAmount > 0 || transaction.transportRemaining > 0) ? (
                          <button
                            className="payment-btn"
                            onClick={() => openPaymentModal(transaction)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            💵 {t('pay')}
                          </button>
                        ) : (
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
                            🗑️ {t('delete')}
                          </button>
                        )}
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
                          📜 {t('history')}
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
            <div className="empty-icon">📋</div>
            <div className="empty-title">{t('noTransactionsYet')}</div>
            <div className="empty-description">{t('addFirstSupplierTransaction')}</div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowAddForm(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{t('addNewTransaction')}</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('supplierName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('contactNumber')}</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('transactionDate')} *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.transactionDate || ''}
                    onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('productName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.productName || ''}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('quantity')} *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('pricePerUnit')} *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.pricePerUnit || ''}
                    onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('totalAmount')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.totalAmount || 0}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('amountPaid')} *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.amountPaid || ''}
                    onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('remainingAmount')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.remainingAmount || 0}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('transportFee')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.transportFee || ''}
                    onChange={(e) => setFormData({...formData, transportFee: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('transportPaid')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.transportPaid || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const value = parseFloat(inputValue || 0);
                      const maxAmount = parseFloat(formData.transportFee || 0);
                      
                      if (value > maxAmount) {
                        setFormData({...formData, transportPaid: maxAmount.toString()});
                        e.target.value = maxAmount.toString();
                      } else {
                        setFormData({...formData, transportPaid: inputValue});
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value || 0);
                      const maxAmount = parseFloat(formData.transportFee || 0);
                      if (value > maxAmount) {
                        setFormData({...formData, transportPaid: maxAmount.toString()});
                        e.target.value = maxAmount.toString();
                      }
                    }}
                    max={formData.transportFee}
                    placeholder={`Max: PKR ${parseFloat(formData.transportFee || 0).toLocaleString()}`}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('transportRemaining')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.transportRemaining || 0}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('paymentMethod')}</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod || 'cash'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="cash">{t('cash')}</option>
                    <option value="bank">{t('bankTransfer')}</option>
                    <option value="cheque">{t('cheque')}</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t('notes')}</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder={t('anyAdditionalNotes')}
                  />
                </div>
              </div>

              <div className="summary-section">
                <h3 className="summary-title">{t('transactionSummary')}</h3>
                <div className="summary-row">
                  <span className="summary-row-label">{t('totalPurchaseAmount')}</span>
                  <span className="summary-row-value">PKR {formData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">{t('amountPaid')}</span>
                  <span className="summary-row-value">PKR {parseFloat(formData.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">{t('remainingAmount')}</span>
                  <span className="summary-row-value">PKR {formData.remainingAmount.toLocaleString()}</span>
                </div>
                {formData.overpaidAmount > 0 && (
                  <div className="summary-row">
                    <span className="summary-row-label">{t('overpaidAmount')}</span>
                    <span className="summary-row-value">PKR {formData.overpaidAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-row-label">{t('transportFee')}</span>
                  <span className="summary-row-value">PKR {parseFloat(formData.transportFee || 0).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">{t('transportRemaining')}</span>
                  <span className="summary-row-value">PKR {formData.transportRemaining.toLocaleString()}</span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('saving') : t('saveTransaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentHistory && selectedTransaction && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPaymentHistory(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{t('paymentHistory')}</h2>
              <button className="close-btn" onClick={() => setShowPaymentHistory(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#374151' }}>{t('transactionDetails')}</h3>
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
                  <strong>PKR {parseFloat(selectedTransaction.amountPaid).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Remaining: </span>
                  <strong style={{ color: '#dc2626' }}>PKR {parseFloat(selectedTransaction.remainingAmount).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Transport Remaining: </span>
                  <strong style={{ color: '#dc2626' }}>PKR {parseFloat(selectedTransaction.transportRemaining).toLocaleString()}</strong>
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
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>{t('productPayment')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>{t('transportPayment')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>{t('totalPayment')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>{t('method')}</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>{t('notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr key={payment.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                          {t('installment')} {paymentHistory.length - index}
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
                <div className="empty-title">{t('noPaymentHistory')}</div>
                <div className="empty-description">{t('noPaymentsMade')}</div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentHistory(false)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && selectedTransaction && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPaymentForm(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Make Payment</h2>
              <button className="close-btn" onClick={() => setShowPaymentForm(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#374151' }}>{t('transactionDetails')}</h3>
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
                  <span style={{ color: '#6b7280' }}>Already Paid: </span>
                  <strong>PKR {parseFloat(selectedTransaction.amountPaid).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Remaining: </span>
                  <strong style={{ color: '#dc2626' }}>PKR {parseFloat(selectedTransaction.remainingAmount).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Transport Remaining: </span>
                  <strong style={{ color: '#dc2626' }}>PKR {parseFloat(selectedTransaction.transportRemaining).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleMakePayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Payment Amount *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={paymentData.paymentAmount || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const value = parseFloat(inputValue || 0);
                      const maxAmount = parseFloat(selectedTransaction?.remainingAmount || 0);
                      
                      if (value > maxAmount) {
                        showWarning(`Payment amount cannot exceed PKR ${maxAmount.toLocaleString()}`);
                        const cappedValue = maxAmount.toString();
                        setPaymentData({...paymentData, paymentAmount: cappedValue});
                        e.target.value = cappedValue;
                      } else {
                        setPaymentData({...paymentData, paymentAmount: inputValue});
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value || 0);
                      const maxAmount = parseFloat(selectedTransaction?.remainingAmount || 0);
                      if (value > maxAmount) {
                        setPaymentData({...paymentData, paymentAmount: maxAmount.toString()});
                        e.target.value = maxAmount.toString();
                      }
                    }}
                    max={selectedTransaction.remainingAmount}
                    placeholder={`Max: PKR ${parseFloat(selectedTransaction.remainingAmount).toLocaleString()}`}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transport Payment</label>
                  <input
                    type="number"
                    className="form-input"
                    value={paymentData.transportPayment || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const value = parseFloat(inputValue || 0);
                      const maxAmount = parseFloat(selectedTransaction?.transportRemaining || 0);
                      
                      if (value > maxAmount) {
                        showWarning(`Transport payment cannot exceed PKR ${maxAmount.toLocaleString()}`);
                        const cappedValue = maxAmount.toString();
                        setPaymentData({...paymentData, transportPayment: cappedValue});
                        e.target.value = cappedValue;
                      } else {
                        setPaymentData({...paymentData, transportPayment: inputValue});
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value || 0);
                      const maxAmount = parseFloat(selectedTransaction?.transportRemaining || 0);
                      if (value > maxAmount) {
                        setPaymentData({...paymentData, transportPayment: maxAmount.toString()});
                        e.target.value = maxAmount.toString();
                      }
                    }}
                    max={selectedTransaction.transportRemaining}
                    placeholder={`Max: PKR ${parseFloat(selectedTransaction.transportRemaining).toLocaleString()}`}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentData.paymentDate || ''}
                    onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('paymentMethod')}</label>
                  <select
                    className="form-select"
                    value={paymentData.paymentMethod || 'cash'}
                    onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  >
                    <option value="cash">{t('cash')}</option>
                    <option value="bank">{t('bankTransfer')}</option>
                    <option value="cheque">{t('cheque')}</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t('notes')}</label>
                  <textarea
                    className="form-textarea"
                    value={paymentData.notes || ''}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder="Payment notes..."
                  />
                </div>
              </div>

              <div className="summary-section">
                <h3 className="summary-title">Payment Summary</h3>
                <div className="summary-row">
                  <span className="summary-row-label">Product Payment</span>
                  <span className="summary-row-value">PKR {parseFloat(paymentData.paymentAmount || 0).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">Transport Payment</span>
                  <span className="summary-row-value">PKR {parseFloat(paymentData.transportPayment || 0).toLocaleString()}</span>
                </div>
                <div className="summary-row" style={{ fontWeight: 'bold', borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
                  <span className="summary-row-label">Total Payment</span>
                  <span className="summary-row-value">
                    PKR {(parseFloat(paymentData.paymentAmount || 0) + parseFloat(paymentData.transportPayment || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">New Remaining Amount</span>
                  <span className="summary-row-value" style={{ color: '#dc2626' }}>
                    PKR {Math.max(0, parseFloat(selectedTransaction.remainingAmount) - parseFloat(paymentData.paymentAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">New Transport Remaining</span>
                  <span className="summary-row-value" style={{ color: '#dc2626' }}>
                    PKR {Math.max(0, parseFloat(selectedTransaction.transportRemaining) - parseFloat(paymentData.transportPayment || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentForm(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmComponent />
    </div>
  );
}