'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useNotification, useConfirm } from '../components/NotificationSystem';

export default function ProductManagement() {
  const { showSuccess, showError, showWarning } = useNotification();
  const { confirm, ConfirmComponent } = useConfirm();
  const t = useTranslations('Products');
  const tCommon = useTranslations('Common');
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for counts
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    quantity: '',
    minStock: '',
    unitsPerBox: '10',
    profitPerUnit: '',
    profitPerBox: '',
    description: '',
    barcode: ''
  });
  const [inputMethod, setInputMethod] = useState('quantity'); // 'quantity' or 'box'
  const [boxInput, setBoxInput] = useState({ boxes: '', units: '' });
  const [profitMethod, setProfitMethod] = useState('unit'); // 'unit' or 'box'
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [productNameError, setProductNameError] = useState('');
  const [categoryNameError, setCategoryNameError] = useState('');

  // Fetch categories and all products on mount
  useEffect(() => {
    fetchCategories();
    fetchAllProducts();
  }, []);

  // Fetch products when search or category changes
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategoryTab]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Invalid categories data received:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllProducts(data);
      } else {
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
      setAllProducts([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products?';
      if (searchTerm) url += `search=${searchTerm}&`;
      // Use selectedCategoryTab for filtering
      if (selectedCategoryTab !== 'all') url += `category=${selectedCategoryTab}`;

      const response = await fetch(url);
      const data = await response.json();
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Invalid products data received:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation for product name
    if (name === 'name') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        const existingProduct = products.find(p => 
          p.name.toLowerCase() === trimmedValue.toLowerCase() && 
          p.id !== editingProduct?.id
        );
        
        if (existingProduct) {
          setProductNameError(t('productAlreadyExists') || 'Product already exists!');
        } else {
          setProductNameError('');
        }
      } else {
        setProductNameError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check for duplicate product name (case-insensitive)
      const productName = formData.name.trim().toLowerCase();
      const existingProduct = products.find(p => 
        p.name.toLowerCase() === productName && 
        p.id !== editingProduct?.id
      );
      
      if (existingProduct) {
        showError(t('productAlreadyExists') || `Product "${formData.name}" already exists! You cannot add the same product in different sizes.`);
        setLoading(false);
        return;
      }
      
      // Calculate total quantity based on input method
      let totalQuantity = parseInt(formData.quantity);
      if (inputMethod === 'box') {
        const boxes = parseInt(boxInput.boxes) || 0;
        const extraUnits = parseInt(boxInput.units) || 0;
        const unitsPerBox = parseInt(formData.unitsPerBox) || 10;
        totalQuantity = (boxes * unitsPerBox) + extraUnits;
      }
      
      // Calculate profit values based on selected method
      let profitPerUnit = 0;
      let profitPerBox = 0;
      const unitsPerBox = parseInt(formData.unitsPerBox) || 10;

      if (profitMethod === 'unit') {
        profitPerUnit = parseFloat(formData.profitPerUnit) || 0;
        profitPerBox = profitPerUnit * unitsPerBox;
      } else {
        profitPerBox = parseFloat(formData.profitPerBox) || 0;
        profitPerUnit = profitPerBox / unitsPerBox;
      }

      const data = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        price: parseFloat(formData.price),
        quantity: totalQuantity,
        minStock: parseInt(formData.minStock),
        unitsPerBox: unitsPerBox,
        profitPerUnit: profitPerUnit,
        profitPerBox: profitPerBox
      };

      if (editingProduct) {
        // Update existing product
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, id: editingProduct.id })
        });
        
        if (response.ok) {
          await fetchProducts();
          await fetchAllProducts();
          setEditingProduct(null);
          showSuccess(t('productUpdated'));
        } else {
          showError(t('failedToUpdateProduct'));
        }
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          await fetchProducts();
          await fetchAllProducts();
          showSuccess(t('productAdded'));
        } else {
          showError(t('failedToCreateProduct'));
        }
      }
      
      setShowAddModal(false);
      setFormData({ name: '', categoryId: '', price: '', quantity: '', minStock: '', unitsPerBox: '10', profitPerUnit: '', profitPerBox: '', description: '', barcode: '' });
      setBoxInput({ boxes: '', units: '' });
      setInputMethod('quantity');
      setProfitMethod('unit');
      setProductNameError('');
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Error saving product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId?.toString() || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      minStock: product.minStock.toString(),
      unitsPerBox: product.unitsPerBox?.toString() || '10',
      profitPerUnit: product.profitPerUnit?.toString() || '0',
      profitPerBox: product.profitPerBox?.toString() || '0',
      description: product.description || '',
      barcode: product.barcode || ''
    });
    // Calculate box values for editing
    const unitsPerBox = product.unitsPerBox || 10;
    setBoxInput({
      boxes: Math.floor(product.quantity / unitsPerBox).toString(),
      units: (product.quantity % unitsPerBox).toString()
    });
    // Set profit method based on existing data
    // If profitPerBox exists and is different from calculated value, use box method
    if (product.profitPerBox && product.profitPerUnit) {
      const calculatedBoxProfit = product.profitPerUnit * unitsPerBox;
      // If the box profit doesn't match the calculated value, it was set independently
      setProfitMethod(Math.abs(product.profitPerBox - calculatedBoxProfit) > 0.01 ? 'box' : 'unit');
    } else {
      setProfitMethod('unit'); // Default to unit
    }
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: t('deleteProduct'),
      message: t('deleteProductConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      type: 'delete'
    });
    
    if (confirmed) {
      try {
        const response = await fetch(`/api/products?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchProducts();
          await fetchAllProducts();
          showSuccess(t('productDeletedSuccessfully'));
        } else {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('sales or return history')) {
            showError(t('cannotDeleteProductWithHistory'));
          } else {
            showError(errorData.error || t('failedToDeleteProduct'));
          }
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showError('Error deleting product: ' + error.message);
      }
    }
  };

  // Category management functions
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: value
    });
    
    // Real-time validation for category name
    if (name === 'name') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        const existingCategory = categories.find(c => 
          c.name.toLowerCase() === trimmedValue.toLowerCase() && 
          c.id !== editingCategory?.id
        );
        
        if (existingCategory) {
          setCategoryNameError(t('categoryAlreadyExists') || 'Category already exists!');
        } else {
          setCategoryNameError('');
        }
      } else {
        setCategoryNameError('');
      }
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check for duplicate category name (case-insensitive)
      const categoryName = categoryFormData.name.trim().toLowerCase();
      const existingCategory = categories.find(c => 
        c.name.toLowerCase() === categoryName && 
        c.id !== editingCategory?.id
      );
      
      if (existingCategory) {
        showError(t('categoryAlreadyExists') || `Category "${categoryFormData.name}" already exists!`);
        setLoading(false);
        return;
      }
      
      if (editingCategory) {
        // Update existing category
        const response = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...categoryFormData, id: editingCategory.id })
        });
        
        if (response.ok) {
          await fetchCategories();
          setEditingCategory(null);
        } else {
          showError(t('failedToUpdateCategory'));
        }
      } else {
        // Create new category
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData)
        });
        
        if (response.ok) {
          await fetchCategories();
        } else {
          showError(t('failedToCreateCategory'));
        }
      }
      
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', description: '' });
      setCategoryNameError('');
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Error saving category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await confirm({
      title: t('deleteCategory'),
      message: t('deleteCategoryConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      type: 'delete'
    });
    
    if (confirmed) {
      try {
        const response = await fetch(`/api/categories?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchCategories();
          await fetchProducts();
        } else {
          showError(t('failedToDeleteCategory'));
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        showError('Error deleting category: ' + error.message);
      }
    }
  };

  // Products are already filtered by API, no need for client-side filtering
  const filteredProducts = products;

  return (
    <div className="product-management">
      <style jsx>{`
        .product-management {
          padding: 30px;
          background: #f0f2f5;
          min-height: 100vh;
          margin: 0;
        }

        .header {
          background: white;
          border-radius: 20px;
          padding: 25px;
          margin: 0 0 30px 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }

        .add-product-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-product-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .filters {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 12px 15px 12px 45px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          color: black;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .category-filter {
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-filter:focus {
          outline: none;
          border-color: #667eea;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
        }

        .product-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        }

        .product-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.in-stock {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.low-stock {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.out-of-stock {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .box-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 13px;
        }
        
        .box-icon {
          width: 16px;
          height: 16px;
          background: #667eea;
          border-radius: 3px;
          display: inline-block;
        }

        .product-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .detail-label {
          color: #6b7280;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }

        .product-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .edit-btn {
          background: #eff6ff;
          color: #2563eb;
        }

        .edit-btn:hover {
          background: #dbeafe;
        }

        .delete-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fee2e2;
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
          transition: color 0.3s ease;
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

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          color: black;
          transition: all 0.3s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 25px;
        }

        .submit-btn {
          flex: 1;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
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

        .tabs-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: #e5e7eb;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }

        .category-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .category-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .category-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .category-count {
          background: #f3f4f6;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 13px;
          color: #6b7280;
          display: inline-block;
          margin-bottom: 15px;
        }

        .category-actions {
          display: flex;
          gap: 10px;
        }

        .radio-toggle-container {
          display: flex;
          gap: 15px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .radio-option {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          min-width: 150px;
        }

        .radio-label {
          font-size: 14px;
        }

        .radio-warning {
          margin-left: 8px;
          font-size: 12px;
          color: #ef4444;
          white-space: nowrap;
        }

        .category-tabs {
          display: flex;
          gap: 10px;
          padding: 0 30px;
          margin-bottom: 25px;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f1f5f9;
        }

        .category-tabs::-webkit-scrollbar {
          height: 6px;
        }

        .category-tabs::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .category-tabs::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }

        .category-tab {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-tab:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .category-tab.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .category-tab:not(.active) .tab-count {
          background: #f3f4f6;
          color: #374151;
        }

        @media (max-width: 768px) {
          .product-management {
            padding: 20px;
          }

          .header-top {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .filters {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .radio-toggle-container {
            flex-direction: column;
            gap: 12px;
          }

          .radio-option {
            width: 100%;
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }

          .radio-option:has(input:checked) {
            background: #eff6ff;
            border-color: #667eea;
          }

          .radio-warning {
            display: block;
            margin-left: 24px;
            margin-top: 4px;
            font-size: 11px;
          }

          .modal {
            padding: 20px;
            max-width: 95%;
          }

          .category-tabs {
            padding: 0 20px;
            margin-bottom: 20px;
          }

          .category-tab {
            padding: 8px 16px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .product-management {
            padding: 15px;
          }

          .page-title {
            font-size: 24px;
          }

          .add-product-btn {
            width: 100%;
            justify-content: center;
          }

          .radio-option {
            padding: 12px;
          }

          .radio-label {
            font-size: 13px;
          }

          .form-label {
            font-size: 13px;
          }

          .form-input, .form-select, .form-textarea {
            font-size: 14px;
            padding: 10px 12px;
          }

          .category-tabs {
            padding: 0 15px;
          }

          .category-tab {
            padding: 7px 12px;
            font-size: 13px;
          }

          .tab-count {
            padding: 1px 6px;
            font-size: 11px;
          }
        }
      `}</style>

      <div className="header">
        <div className="header-top">
          <h1 className="page-title">{t('inventoryManagement')}</h1>
          {activeTab === 'products' ? (
            <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
              <span>+</span> {t('addProduct')}
            </button>
          ) : (
            <button className="add-product-btn" onClick={() => setShowCategoryModal(true)}>
              <span>+</span> {t('addCategory')}
            </button>
          )}
        </div>
        
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            {t('products')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            {t('categories')}
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t('searchProducts')}
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategoryTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryTab('all')}
            >
              {t('allCategories')}
              <span className="tab-count">
                {allProducts.length}
              </span>
            </button>
            {categories.map(cat => {
              const categoryProductCount = allProducts.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategoryTab === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryTab(cat.name)}
                >
                  {cat.name}
                  <span className="tab-count">
                    {categoryProductCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="products-grid">
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#6b7280' }}>{t('loadingProducts')}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#6b7280' }}>{t('noProductsFound')}</div>
          </div>
        ) : filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-header">
              <h3 className="product-name">{product.name}</h3>
              <span className={`status-badge ${product.status.toLowerCase().replace(' ', '-')}`}>
                {product.status}
              </span>
            </div>
            <div className="product-details">
              <div className="detail-row">
                <span className="detail-label">{t('category')}:</span>
                <span className="detail-value">{product.category?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('price')}:</span>
                <span className="detail-value">PKR {product.price.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('stock')}:</span>
                <span className="detail-value">
                  {Math.floor(product.quantity / 10)} {t('boxes')} ({product.quantity} {t('units')})
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('minStock')}:</span>
                <span className="detail-value">
                  {Math.floor(product.minStock / 10)} {t('boxes')} ({product.minStock} {t('units')})
                </span>
              </div>
            </div>
            <div className="product-actions">
              <button className="action-btn edit-btn" onClick={() => handleEdit(product)}>
                {t('edit')}
              </button>
              <button className="action-btn delete-btn" onClick={() => handleDelete(product.id)}>
                {t('delete')}
              </button>
            </div>
          </div>
        ))}
          </div>
        </>
      ) : (
        <div className="category-grid">
          {categories.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', color: '#6b7280' }}>{t('noCategoriesFound')}</div>
            </div>
          ) : categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-name">{category.name}</div>
              {category.description && (
                <div className="category-description">{category.description}</div>
              )}
              <div className="category-count">
                {category.products ? `${category.products.length} ${t('products')}` : `0 ${t('products')}`}
              </div>
              <div className="category-actions">
                <button className="action-btn edit-btn" onClick={() => handleEditCategory(category)}>
                  {t('edit')}
                </button>
                <button className="action-btn delete-btn" onClick={() => handleDeleteCategory(category.id)}>
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduct ? t('editProduct') : t('addNewProduct')}
              </h2>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                setEditingProduct(null);
                setFormData({ name: '', categoryId: '', price: '', quantity: '', minStock: '', unitsPerBox: '10', description: '', barcode: '' });
                setBoxInput({ boxes: '', units: '' });
                setInputMethod('quantity');
                setProductNameError('');
              }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('productName')}</label>
                <input
                  type="text"
                  name="name"
                  className={`form-input ${productNameError ? 'border-red-500' : ''}`}
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder={t('enterUniqueProductName') || 'Enter unique product name'}
                  required
                />
                {productNameError && (
                  <p className="text-red-500 text-sm mt-1">{productNameError}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('category')}</label>
                <select
                  name="categoryId"
                  className="form-select"
                  value={formData.categoryId || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('price')} (PKR)</label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('unitsPerBox')}</label>
                  <input
                    type="number"
                    name="unitsPerBox"
                    className="form-input"
                    value={formData.unitsPerBox || '10'}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder={t('howManyUnitsInBox')}
                  />
                </div>
              </div>
              
              {/* Profit Method Toggle */}
              <div className="form-group">
                <label className="form-label">{t('profitCalculation')}</label>
                <div className="radio-toggle-container">
                  <label className="radio-option"
                    style={{
                      cursor: profitMethod === 'box' && formData.profitPerBox ? 'not-allowed' : 'pointer',
                      opacity: profitMethod === 'box' && formData.profitPerBox ? 0.5 : 1
                    }}
                    title={profitMethod === 'box' && formData.profitPerBox ? 'Clear profit per box to switch to profit per unit' : ''}>
                    <input
                      type="radio"
                      value="unit"
                      checked={profitMethod === 'unit'}
                      onChange={(e) => {
                        // Only allow switching if profit per box is empty
                        if (profitMethod === 'box' && formData.profitPerBox) {
                          return;
                        }
                        setProfitMethod(e.target.value);
                        setFormData({...formData, profitPerBox: ''});
                      }}
                      disabled={profitMethod === 'box' && formData.profitPerBox}
                      style={{ marginRight: '8px' }}
                    />
                    <span className="radio-label">{t('profitPerUnit')}</span>
                    {profitMethod === 'box' && formData.profitPerBox && (
                      <span className="radio-warning">
                        (Clear box profit first)
                      </span>
                    )}
                  </label>
                  <label className="radio-option"
                    style={{
                      cursor: profitMethod === 'unit' && formData.profitPerUnit ? 'not-allowed' : 'pointer',
                      opacity: profitMethod === 'unit' && formData.profitPerUnit ? 0.5 : 1
                    }}
                    title={profitMethod === 'unit' && formData.profitPerUnit ? 'Clear profit per unit to switch to profit per box' : ''}>
                    <input
                      type="radio"
                      value="box"
                      checked={profitMethod === 'box'}
                      onChange={(e) => {
                        // Only allow switching if profit per unit is empty
                        if (profitMethod === 'unit' && formData.profitPerUnit) {
                          return;
                        }
                        setProfitMethod(e.target.value);
                        setFormData({...formData, profitPerUnit: ''});
                      }}
                      disabled={profitMethod === 'unit' && formData.profitPerUnit}
                      style={{ marginRight: '8px' }}
                    />
                    <span className="radio-label">{t('profitPerBox')}</span>
                    {profitMethod === 'unit' && formData.profitPerUnit && (
                      <span className="radio-warning">
                        (Clear unit profit first)
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Profit Input Based on Method */}
              {profitMethod === 'unit' ? (
                <div className="form-group">
                  <label className="form-label">{t('profitPerUnit')} (PKR)</label>
                  <input
                    type="number"
                    name="profitPerUnit"
                    className="form-input"
                    value={formData.profitPerUnit || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder={t('profitEarnedPerUnit')}
                  />
                  {formData.profitPerUnit && formData.unitsPerBox && (
                    <div style={{
                      padding: '10px',
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      marginTop: '8px'
                    }}>
                      📦 {t('thisEquals')} <strong>PKR {(parseFloat(formData.profitPerUnit || 0) * parseInt(formData.unitsPerBox || 10)).toFixed(2)}</strong> {t('profitPerBox')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('profitPerBox')} (PKR)</label>
                  <input
                    type="number"
                    name="profitPerBox"
                    className="form-input"
                    value={formData.profitPerBox || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder={t('profitEarnedPerBox')}
                  />
                  {formData.profitPerBox && formData.unitsPerBox && (
                    <div style={{
                      padding: '10px',
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      marginTop: '8px'
                    }}>
                      📦 {t('thisEquals')} <strong>PKR {(parseFloat(formData.profitPerBox || 0) / parseInt(formData.unitsPerBox || 10)).toFixed(2)}</strong> {t('profitPerUnit')}
                    </div>
                  )}
                </div>
              )}

              {/* Input Method Toggle */}
              <div className="form-group">
                <label className="form-label">{t('addStockBy')}</label>
                <div className="radio-toggle-container">
                  <label className="radio-option"
                    style={{
                      cursor: inputMethod === 'box' && (boxInput.boxes || boxInput.units) ? 'not-allowed' : 'pointer',
                      opacity: inputMethod === 'box' && (boxInput.boxes || boxInput.units) ? 0.5 : 1
                    }}
                    title={inputMethod === 'box' && (boxInput.boxes || boxInput.units) ? 'Clear box inputs to switch to individual quantity' : ''}>
                    <input
                      type="radio"
                      value="quantity"
                      checked={inputMethod === 'quantity'}
                      onChange={(e) => {
                        // Only allow switching if box inputs are empty
                        if (inputMethod === 'box' && (boxInput.boxes || boxInput.units)) {
                          return;
                        }
                        setInputMethod(e.target.value);
                      }}
                      disabled={inputMethod === 'box' && (boxInput.boxes || boxInput.units)}
                      style={{ marginRight: '8px' }}
                    />
                    <span className="radio-label">{t('individualQuantity')}</span>
                    {inputMethod === 'box' && (boxInput.boxes || boxInput.units) && (
                      <span className="radio-warning">
                        (Clear box data first)
                      </span>
                    )}
                  </label>
                  <label className="radio-option"
                    style={{
                      cursor: inputMethod === 'quantity' && formData.quantity ? 'not-allowed' : 'pointer',
                      opacity: inputMethod === 'quantity' && formData.quantity ? 0.5 : 1
                    }}
                    title={inputMethod === 'quantity' && formData.quantity ? 'Clear quantity input to switch to boxes & units' : ''}>
                    <input
                      type="radio"
                      value="box"
                      checked={inputMethod === 'box'}
                      onChange={(e) => {
                        // Only allow switching if quantity input is empty
                        if (inputMethod === 'quantity' && formData.quantity) {
                          return;
                        }
                        setInputMethod(e.target.value);
                      }}
                      disabled={inputMethod === 'quantity' && formData.quantity}
                      style={{ marginRight: '8px' }}
                    />
                    <span className="radio-label">{t('boxesUnits')}</span>
                    {inputMethod === 'quantity' && formData.quantity && (
                      <span className="radio-warning">
                        (Clear quantity data first)
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Quantity Input Based on Method */}
              {inputMethod === 'quantity' ? (
                <div className="form-group">
                  <label className="form-label">{t('totalQuantityUnits')}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="number"
                      name="quantity"
                      className="form-input"
                      value={formData.quantity || ''}
                      onChange={handleInputChange}
                      min="0"
                      required
                      placeholder={t('enterTotalUnits')}
                    />
                    <div style={{ 
                      padding: '10px', 
                      background: '#f3f4f6', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      📦 {t('thisEquals')} <strong>{Math.floor((formData.quantity || 0) / (formData.unitsPerBox || 10))} {t('boxes')}</strong> {t('and')} <strong>{(formData.quantity || 0) % (formData.unitsPerBox || 10)} {t('looseUnits')}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('numberOfBoxes')}</label>
                    <input
                      type="number"
                      value={boxInput.boxes || ''}
                      onChange={(e) => {
                        setBoxInput({...boxInput, boxes: e.target.value});
                        const boxes = parseInt(e.target.value) || 0;
                        const units = parseInt(boxInput.units) || 0;
                        const unitsPerBox = parseInt(formData.unitsPerBox) || 10;
                        setFormData({...formData, quantity: ((boxes * unitsPerBox) + units).toString()});
                      }}
                      min="0"
                      className="form-input"
                      placeholder={t('howManyBoxes')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('looseUnits')}</label>
                    <input
                      type="number"
                      value={boxInput.units || ''}
                      onChange={(e) => {
                        setBoxInput({...boxInput, units: e.target.value});
                        const boxes = parseInt(boxInput.boxes) || 0;
                        const units = parseInt(e.target.value) || 0;
                        const unitsPerBox = parseInt(formData.unitsPerBox) || 10;
                        setFormData({...formData, quantity: ((boxes * unitsPerBox) + units).toString()});
                      }}
                      min="0"
                      max={parseInt(formData.unitsPerBox) - 1 || 9}
                      className="form-input"
                      placeholder={t('extraUnits')}
                    />
                  </div>
                </div>
              )}

              {/* Show Total Calculation */}
              {inputMethod === 'box' && (boxInput.boxes || boxInput.units) && (
                <div style={{ 
                  padding: '12px', 
                  background: '#dcfce7', 
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: '#166534',
                  textAlign: 'center'
                }}>
                  ✅ {t('total')}: <strong>{formData.quantity || 0} {t('units')}</strong> 
                  ({boxInput.boxes || 0} {t('boxes')} × {formData.unitsPerBox || 10} {t('units')}/{t('boxes').toLowerCase()} + {boxInput.units || 0} {t('looseUnits')})
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('minimumStockAlert')}</label>
                <input
                  type="number"
                  name="minStock"
                  className="form-input"
                  value={formData.minStock || ''}
                  onChange={handleInputChange}
                  min="0"
                  required
                  placeholder={t('alertWhenStockFallsBelow')}
                />
                <span style={{ color: '#6b7280', fontSize: '13px', marginTop: '5px', display: 'block' }}>
                  {t('alertWhenStockFalls')} {Math.floor((formData.minStock || 0) / (formData.unitsPerBox || 10))} {t('boxes')} {t('and')} {(formData.minStock || 0) % (formData.unitsPerBox || 10)} {t('units')}
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">{t('descriptionOptional')}</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`submit-btn ${productNameError ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!!productNameError || loading}
                >
                  {editingProduct ? t('updateProduct') : t('addProduct')}
                </button>
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  setFormData({ name: '', categoryId: '', price: '', quantity: '', minStock: '', unitsPerBox: '10', description: '', barcode: '' });
                  setBoxInput({ boxes: '', units: '' });
                  setInputMethod('quantity');
                  setProductNameError('');
                }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCategory ? t('editCategory') : t('addNewCategory')}
              </h2>
              <button className="close-btn" onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryFormData({ name: '', description: '' });
              }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label className="form-label">{t('categoryName')} *</label>
                <input
                  type="text"
                  name="name"
                  className={`form-input ${categoryNameError ? 'border-red-500' : ''}`}
                  value={categoryFormData.name || ''}
                  onChange={handleCategoryInputChange}
                  placeholder={t('enterCategoryName')}
                  required
                />
                {categoryNameError && (
                  <p className="text-red-500 text-sm mt-1">{categoryNameError}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('description')}</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={categoryFormData.description || ''}
                  onChange={handleCategoryInputChange}
                  placeholder={t('enterCategoryDescription')}
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className={`submit-btn ${categoryNameError ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!!categoryNameError || loading}
                >
                  {loading ? t('saving') : (editingCategory ? t('updateCategory') : t('addCategory'))}
                </button>
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', description: '' });
                }}>
                  {t('cancel')}
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