'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useNotification } from '../components/NotificationSystem';

export default function SalesPOS() {
  const t = useTranslations('Sales');
  const tCommon = useTranslations('Common');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentType, setPaymentType] = useState('full'); // full or partial
  const [profitDiscount, setProfitDiscount] = useState(0); // Discount from profit
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Helper function to translate category names
  const translateCategory = (categoryName) => {
    if (!categoryName) return '';
    const categoryKey = categoryName.toLowerCase();
    // Check if we have a translation for this category
    const categories = ['electronics', 'clothing', 'food', 'books', 'sports'];
    if (categories.includes(categoryKey)) {
      return t(categoryKey);
    }
    return categoryName; // Return original if no translation available
  };

  // Helper function to translate payment method
  const translatePaymentMethod = (method) => {
    if (!method) return '';
    const methodKey = method.toLowerCase();
    return t(methodKey) || method.toUpperCase();
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      let url = '/api/products';
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data.map(product => ({
          ...product,
          stock: product.quantity,
          price: parseFloat(product.price),
          profitPerUnit: parseFloat(product.profitPerUnit || 0)
        })));
      } else {
        console.error('Invalid product data received:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const addToCart = (product) => {
    // Check if product is out of stock
    if (product.stock === 0) {
      showError(t('outOfStockProduct'));
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        showWarning(t('notEnoughStock'));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, quantity) => {
    const product = products.find(p => p.id === id);
    if (quantity <= 0) {
      removeFromCart(id);
    } else if (quantity <= product.stock) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    } else {
      showWarning('Not enough stock available!');
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    // Subtotal is just the selling price of items
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateProfit = () => {
    return cart.reduce((totalProfit, item) => {
      // Use profitPerUnit if available, otherwise default to 0
      const profitPerUnit = parseFloat(item.profitPerUnit || 0);
      return totalProfit + (profitPerUnit * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    // Total = Subtotal + Profit
    return calculateSubtotal() + calculateProfit();
  };

  const calculateGrandTotal = () => {
    // Grand total = Subtotal + Profit - Discount
    const subtotal = calculateSubtotal();
    const profit = calculateProfit();
    const discount = parseFloat(profitDiscount) || 0;
    return subtotal + profit - discount;
  };
  
  const calculateFinalProfit = () => {
    const baseProfit = calculateProfit();
    const discount = parseFloat(profitDiscount) || 0;
    return Math.max(0, baseProfit - discount); // Profit after discount
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showWarning(t('cartEmpty'));
      return;
    }
    setShowCheckout(true);
  };

  const processSale = async () => {
    // Validate required fields
    if (!customerInfo.name || customerInfo.name.trim() === '') {
      showError('Customer name is required');
      return;
    }
    
    setLoading(true);
    try {
      const grandTotal = calculateGrandTotal();
      const paidAmount = paymentType === 'full' ? grandTotal : parseFloat(amountPaid) || 0;
      
      const saleData = {
        customer: customerInfo.name ? customerInfo : null,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          profitPerUnit: item.profitPerUnit || 0,
          profitPerBox: item.profitPerBox || 0
        })),
        paymentMethod: paymentMethod,
        amountPaid: paidAmount,
        profitDiscount: parseFloat(profitDiscount) || 0,
        dueDate: paymentType === 'partial' && dueDate ? dueDate : null
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const sale = await response.json();
        setLastSale({
          ...sale,
          items: sale.saleItems || cart, // Use saleItems from response or fallback to cart
          customer: sale.customer || customerInfo,
          date: new Date(sale.createdAt).toLocaleString(),
          subtotal: calculateSubtotal(),
          profit: calculateProfit(),
          profitDiscount: parseFloat(profitDiscount) || 0,
          finalProfit: calculateFinalProfit(),
          total: calculateGrandTotal(),
          paymentMethod: sale.paymentMethod || paymentMethod
        });
        
        setCart([]);
        setCustomerInfo({ name: '', phone: '' });
        setPaymentMethod('cash');
        setAmountPaid('');
        setDueDate('');
        setPaymentType('full');
        setProfitDiscount(0);
        setShowCheckout(false);
        setShowReceipt(true);
        
        // Refresh products to update stock
        fetchProducts();
        showSuccess(t('saleProcessedSuccess'));
      } else {
        showError(t('failedToProcessSale'));
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      showError(t('errorProcessingSale'));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  return (
    <div className="sales-pos">
      <style jsx>{`
        .sales-pos {
          display: flex;
          height: 100vh;
          background: #f8f9fa;
          margin: 0;
          overflow: hidden;
        }

        .left-panel {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8f9fa;
          overflow: hidden;
        }

        .right-panel {
          width: 400px;
          background: white;
          box-shadow: -5px 0 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
        }

        .search-section {
          background: white;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        .search-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }

        .search-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 10px;
          align-content: start;
          min-height: 0;
        }

        .product-card {
          background: white;
          border-radius: 15px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .product-card.out-of-stock {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f3f4f6;
        }

        .product-card.out-of-stock:hover {
          transform: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .out-of-stock-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ef4444;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          z-index: 1;
        }

        .product-image {
          width: 100%;
          height: 120px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
          margin-bottom: 10px;
        }

        .product-info {
          text-align: center;
        }

        .product-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-price {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 5px;
        }

        .product-stock {
          font-size: 12px;
          color: #6b7280;
        }
        
        .product-stock.low-stock {
          color: #d97706;
          font-weight: 500;
        }
        
        .product-stock.out-of-stock {
          color: #dc2626;
          font-weight: 500;
        }

        .cart-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          flex-shrink: 0;
        }

        .cart-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .cart-count {
          font-size: 14px;
          opacity: 0.9;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          padding-bottom: 10px;
          min-height: 0;
          max-height: calc(100vh - 280px);
        }

        .cart-item {
          background: #f9fafb;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }

        .cart-item-price {
          font-size: 16px;
          color: #667eea;
          font-weight: bold;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .quantity-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: none;
          background: white;
          color: #667eea;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .quantity-btn:hover {
          background: #667eea;
          color: white;
        }

        .quantity-display {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          min-width: 30px;
          text-align: center;
        }

        .remove-btn {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: #fca5a5;
        }

        .cart-footer {
          padding: 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
          margin-top: auto;
          flex-shrink: 0;
        }

        .total-section {
          margin-bottom: 20px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .total-label {
          color: #6b7280;
        }

        .total-value {
          color: #1f2937;
          font-weight: 600;
        }

        .grand-total {
          font-size: 18px;
          padding-top: 10px;
          border-top: 2px solid #e5e7eb;
        }

        .grand-total .total-label {
          color: #1f2937;
          font-weight: 600;
        }

        .grand-total .total-value {
          color: #667eea;
          font-weight: bold;
        }

        .checkout-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .checkout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .modal {
          background: white;
          border-radius: 20px;
          padding: 30px;
          width: 90%;
          max-width: 500px;
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
          color: #6b7280;
          cursor: pointer;
        }

        .close-btn:hover {
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .payment-option {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .payment-option.selected {
          border-color: #667eea;
          background: #eff6ff;
          color: #667eea;
          font-weight: 600;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 25px;
        }

        .process-btn {
          flex: 1;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .process-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
        }

        .cancel-btn {
          flex: 1;
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .receipt {
          text-align: center;
          padding: 20px;
        }

        .receipt-header {
          margin-bottom: 30px;
        }

        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 10px;
        }

        .receipt-info {
          color: #6b7280;
          font-size: 14px;
        }

        .receipt-items {
          text-align: left;
          margin: 20px 0;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .receipt-total {
          text-align: right;
          margin-top: 20px;
        }

        .print-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        }

        .print-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .empty-cart {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-cart-icon {
          font-size: 60px;
          margin-bottom: 15px;
        }

        .empty-cart-text {
          font-size: 16px;
        }

        /* Tablet View */
        @media (max-width: 1024px) {
          .right-panel {
            width: 350px;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }

          .modal {
            width: 90%;
            max-width: 500px;
          }
        }

        /* Mobile View */
        @media (max-width: 768px) {
          .sales-pos {
            flex-direction: column;
            height: 100vh;
            position: relative;
            background: #f8f9fa;
            overflow: hidden;
          }

          .left-panel {
            padding: 15px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding-bottom: 80px; /* Space for mobile cart button */
            background: #f8f9fa;
          }

          /* Removed old right-panel mobile styles as they're now in cart drawer section */

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            padding-bottom: 10px;
          }

          .product-card {
            padding: 12px;
          }

          .product-name {
            font-size: 13px;
          }

          .product-price {
            font-size: 14px;
          }

          .product-stock {
            font-size: 11px;
          }

          .search-section {
            padding: 15px;
            margin-bottom: 15px;
          }

          .search-title {
            font-size: 18px;
          }

          .cart-header {
            padding: 15px 20px;
            flex-shrink: 0;
          }

          .cart-items {
            max-height: calc(100vh - 320px);
            min-height: 200px;
          }

          .cart-footer {
            padding: 15px 20px;
            position: sticky;
            bottom: 0;
            background: white;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          }

          .payment-methods {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .checkout-form {
            padding: 15px;
          }

          .modal {
            width: 95%;
            max-width: none;
            margin: 10px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            padding: 15px;
          }

          .form-group {
            margin-bottom: 15px;
          }

          .customer-inputs {
            flex-direction: column;
          }

          .customer-inputs input {
            width: 100%;
          }
        }

        /* Small Mobile View */
        @media (max-width: 480px) {
          .sales-pos {
            font-size: 14px;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 8px;
          }

          .product-card {
            padding: 10px;
          }

          .product-image {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .product-name {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .product-price {
            font-size: 13px;
          }

          .product-stock {
            font-size: 10px;
          }

          .cart-item {
            padding: 10px;
          }

          .cart-item-name {
            font-size: 13px;
          }

          .cart-item-price {
            font-size: 12px;
          }

          .quantity-controls {
            gap: 8px;
          }

          .quantity-btn {
            width: 25px;
            height: 25px;
            font-size: 14px;
          }

          .remove-btn {
            padding: 4px 8px;
            font-size: 11px;
          }

          .total-section {
            font-size: 13px;
          }

          .checkout-btn {
            padding: 12px;
            font-size: 14px;
          }

          .receipt-modal {
            width: 95%;
          }

          .receipt-content {
            padding: 20px;
          }

          .receipt-title {
            font-size: 20px;
          }

          .receipt-item {
            font-size: 12px;
          }

          .print-btn {
            padding: 10px 20px;
            font-size: 14px;
          }
        }

        /* Mobile Cart Button and Drawer */
        .mobile-cart-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-cart-btn {
            display: flex;
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            font-size: 24px;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            z-index: 999;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .mobile-cart-btn:hover {
            transform: scale(1.1);
          }

          .cart-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }

          /* Cart Drawer Overlay */
          .cart-drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
          }

          .cart-drawer-overlay.active {
            opacity: 1;
            visibility: visible;
          }

          /* Cart Drawer */
          .right-panel {
            position: fixed;
            right: -100%;
            top: 0;
            bottom: 0;
            width: 85%;
            max-width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .right-panel.active {
            right: 0;
            display: flex;
            flex-direction: column;
          }

        }
        
        /* Close button for drawer - Desktop hidden */
        .drawer-close-btn {
          display: none;
        }
        
        @media (max-width: 768px) {
          .drawer-close-btn {
            display: flex;
            position: absolute;
            top: 10px;
            left: 10px;
            background: #f3f4f6;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1;
          }

          .drawer-close-btn:hover {
            background: #e5e7eb;
          }
        }
      `}</style>

      <div className="left-panel">
        <div className="search-section">
          <h2 className="search-title">{t('searchProducts')}</h2>
          <input
            type="text"
            className="search-input"
            placeholder={t('searchProductsBarcode')}
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={`product-card ${product.stock === 0 ? 'out-of-stock' : ''}`} 
              onClick={() => addToCart(product)}>
              {product.stock === 0 && (
                <div className="out-of-stock-badge">{t('outOfStock')}</div>
              )}
              <div className="product-image">
                {product.category?.name?.toLowerCase() === 'electronics' && '💻'}
                {product.category?.name?.toLowerCase() === 'clothing' && '👕'}
                {product.category?.name?.toLowerCase() === 'food' && '🍚'}
                {product.category?.name?.toLowerCase() === 'books' && '📚'}
                {product.category?.name?.toLowerCase() === 'sports' && '⚽'}
                {!product.category && '📦'}
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-price">PKR {product.price.toLocaleString()}</div>
                <div className={`product-stock ${
                  product.stock === 0 ? 'out-of-stock' : 
                  product.stock < (product.minStock || 10) ? 'low-stock' : ''
                }`}>
                  {t('stock')}: {Math.floor((product.stock || 0) / (product.unitsPerBox || 10))} {t('boxes')} ({product.stock || 0} {t('units')})
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '5px' }}>
                    ({product.unitsPerBox || 10} {t('units')}/{t('boxes').toLowerCase()})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cart Button */}
      <button 
        className="mobile-cart-btn"
        onClick={() => setShowMobileCart(true)}
      >
        🛒
        {cart.length > 0 && (
          <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        )}
      </button>

      {/* Cart Drawer Overlay for Mobile */}
      <div 
        className={`cart-drawer-overlay ${showMobileCart ? 'active' : ''}`}
        onClick={() => setShowMobileCart(false)}
      />

      <div className={`right-panel ${showMobileCart ? 'active' : ''}`}>
        {/* Close button for mobile drawer */}
        <button 
          className="drawer-close-btn"
          onClick={() => setShowMobileCart(false)}
        >
          ✕
        </button>
        <div className="cart-header">
          <h2 className="cart-title">{t('shoppingCart')}</h2>
          <div className="cart-count">{cart.length} {t('items')}</div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <div className="empty-cart-text">{t('emptyCart')}</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">PKR {item.price.toLocaleString()}</div>
                </div>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-section">
            <div className="total-row">
              <span className="total-label">{t('subtotal')}:</span>
              <span className="total-value">PKR {calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="total-row" style={{color: '#10b981'}}>
              <span className="total-label">+ {t('profit')}:</span>
              <span className="total-value">PKR {calculateProfit().toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span className="total-label">{t('grandTotal')}:</span>
              <span className="total-value">PKR {calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            {t('proceedToCheckout')}
          </button>
        </div>
      </div>

      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('checkout')}</h2>
              <button className="close-btn" onClick={() => setShowCheckout(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('customerName')} <span style={{color: '#ef4444'}}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={customerInfo.name || ''}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                placeholder={t('enterCustomerName') + ' (Required)'}
                required
                style={{
                  borderColor: customerInfo.name ? '#e5e7eb' : '#fca5a5',
                  borderWidth: '2px'
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('phoneNumber')} (Optional)</label>
              <input
                type="tel"
                className="form-input"
                value={customerInfo.phone || ''}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                placeholder={t('enterPhoneNumber')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('paymentType')}</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={(e) => setPaymentType(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  {t('fullPayment')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="partial"
                    checked={paymentType === 'partial'}
                    onChange={(e) => setPaymentType(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  {t('partialPayment')}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{color: '#ef4444'}}>
                Discount Amount (PKR)
              </label>
              <input
                type="number"
                className="form-input"
                value={profitDiscount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const maxDiscount = calculateProfit();
                  if (value > maxDiscount) {
                    showWarning(`Maximum profit reduction is PKR ${maxDiscount.toFixed(2)}`);
                    setProfitDiscount(maxDiscount);
                  } else if (value < 0) {
                    setProfitDiscount(0);
                  } else {
                    setProfitDiscount(value);
                  }
                }}
                placeholder="Enter discount amount"
                min="0"
                max={calculateProfit()}
                step="0.01"
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                <div>Total Profit: PKR {calculateProfit().toFixed(2)}</div>
                <div>Max Discount: PKR {calculateProfit().toFixed(2)}</div>
                {profitDiscount > 0 && (
                  <div style={{color: '#10b981', marginTop: '4px', fontWeight: '500'}}>
                    Net Profit After Discount: PKR {calculateFinalProfit().toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {paymentType === 'partial' && (
              <>
                <div className="form-group">
                  <label className="form-label">{t('amountPaidNow')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountPaid || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const grandTotal = calculateGrandTotal();
                      // Limit to grand total amount
                      if (value <= grandTotal) {
                        setAmountPaid(e.target.value);
                      } else {
                        setAmountPaid(grandTotal.toString());
                      }
                    }}
                    placeholder={t('enterAmountPayingNow')}
                    min="0"
                    max={calculateGrandTotal().toFixed(2)}
                    step="0.01"
                  />
                  {amountPaid && (
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      {parseFloat(amountPaid) > calculateGrandTotal() ? (
                        <div style={{ color: '#ef4444' }}>
                          {t('amountExceedsTotal') || 'Amount cannot exceed total'}
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280' }}>
                          {t('remaining')}: PKR {Math.max(0, calculateGrandTotal() - parseFloat(amountPaid || 0)).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('dueDate')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate || ''}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">{t('paymentMethod')}</label>
              <div className="payment-methods">
                <div 
                  className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  💵 {t('cash')}
                </div>
                <div 
                  className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  💳 {t('card')}
                </div>
                <div 
                  className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  📱 {t('upi')}
                </div>
              </div>
            </div>

            <div className="total-section">
              <div className="total-row">
                <span className="total-label">{t('subtotal')}:</span>
                <span className="total-value">PKR {calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="total-row" style={{color: '#10b981'}}>
                <span className="total-label">+ {t('profit')}:</span>
                <span className="total-value">PKR {calculateProfit().toFixed(2)}</span>
              </div>
              <div className="total-row" style={{fontWeight: '500'}}>
                <span className="total-label">Total:</span>
                <span className="total-value">PKR {calculateTotal().toFixed(2)}</span>
              </div>
              {profitDiscount > 0 && (
                <>
                  <div className="total-row" style={{color: '#ef4444'}}>
                    <span className="total-label">- Discount:</span>
                    <span className="total-value">-PKR {parseFloat(profitDiscount).toFixed(2)}</span>
                  </div>
                  <div className="total-row" style={{color: '#059669', fontSize: '12px'}}>
                    <span className="total-label">(Net Profit: PKR {calculateFinalProfit().toFixed(2)})</span>
                  </div>
                </>
              )}
              <div className="total-row grand-total">
                <span className="total-label">{t('grandTotal')} (Customer Pays):</span>
                <span className="total-value">PKR {calculateGrandTotal().toFixed(2)}</span>
              </div>
              {paymentType === 'partial' && amountPaid && (
                <>
                  <div className="total-row">
                    <span className="total-label">{t('amountPayingNow')}:</span>
                    <span className="total-value">PKR {parseFloat(amountPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row" style={{ color: '#dc2626' }}>
                    <span className="total-label">{t('remainingAmount')}:</span>
                    <span className="total-value">PKR {Math.max(0, calculateGrandTotal() - parseFloat(amountPaid || 0)).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button 
                className="process-btn" 
                onClick={processSale}
                disabled={
                  !customerInfo.name || 
                  customerInfo.name.trim() === '' || 
                  loading || 
                  (paymentType === 'partial' && parseFloat(amountPaid || 0) > calculateGrandTotal())
                }
                style={{
                  opacity: (
                    !customerInfo.name || 
                    customerInfo.name.trim() === '' || 
                    (paymentType === 'partial' && parseFloat(amountPaid || 0) > calculateGrandTotal())
                  ) ? 0.6 : 1,
                  cursor: (
                    !customerInfo.name || 
                    customerInfo.name.trim() === '' || 
                    (paymentType === 'partial' && parseFloat(amountPaid || 0) > calculateGrandTotal())
                  ) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? t('processing') + '...' : t('processSale')}
              </button>
              <button className="cancel-btn" onClick={() => setShowCheckout(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('receipt')}</h2>
              <button className="close-btn" onClick={() => setShowReceipt(false)}>✕</button>
            </div>

            <div className="receipt">
              <div className="receipt-header">
                <div className="receipt-title">✅ {t('paymentSuccessful')}</div>
                <div className="receipt-info">
                  {t('saleId')}: #{lastSale.id}<br />
                  {t('date')}: {lastSale.date}
                </div>
              </div>

              {lastSale.customer && (lastSale.customer.name || lastSale.customer.phone) && (
                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                  {lastSale.customer.name && <><strong>{t('customer')}:</strong> {lastSale.customer.name}<br /></>}
                  {lastSale.customer.phone && <><strong>{t('phone')}:</strong> {lastSale.customer.phone}</>}
                </div>
              )}

              <div className="receipt-items">
                {lastSale.items && lastSale.items.map((item, index) => (
                  <div key={index} className="receipt-item">
                    <span>{item.product?.name || item.name} x {item.quantity}</span>
                    <span>PKR {((item.unitPrice || item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="receipt-total">
                <div className="total-row">
                  <span className="total-label">{t('subtotal')}:</span>
                  <span className="total-value">PKR {lastSale.subtotal.toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span className="total-label">{t('profit')}:</span>
                  <span className="total-value">PKR {lastSale.profit.toFixed(2)}</span>
                </div>
                {lastSale.profitDiscount > 0 && (
                  <>
                    <div className="total-row" style={{color: '#ef4444'}}>
                      <span className="total-label">Profit Reduced By:</span>
                      <span className="total-value">-PKR {lastSale.profitDiscount.toFixed(2)}</span>
                    </div>
                    <div className="total-row" style={{color: '#10b981'}}>
                      <span className="total-label">Net Profit:</span>
                      <span className="total-value">PKR {lastSale.finalProfit.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="total-row grand-total">
                  <span className="total-label">{t('total')}:</span>
                  <span className="total-value">PKR {lastSale.total.toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
                  {t('paymentMethod')}: {translatePaymentMethod(lastSale.paymentMethod)}
                </div>
              </div>

              <button className="print-btn" onClick={() => window.print()}>
                🖨️ {t('printReceipt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}