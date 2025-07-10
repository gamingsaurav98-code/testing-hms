"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  expenseApi, 
  expenseCategoryApi, 
  supplierApi, 
  studentApi,
  ExpenseFormData, 
  ExpenseCategory, 
  Supplier, 
  Student,
  PaymentType,
  PurchaseFormData,
  ApiError 
} from '@/lib/api/index';
import { Button, FormField, SingleImageUploadCreate, SuccessToast } from '@/components/ui';

export default function CreateExpense() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [purchases, setPurchases] = useState<PurchaseFormData[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_category_id: '',
    expense_type: '', // Keep for API compatibility but will be auto-generated
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    student_id: '',
    staff_id: '',
    supplier_id: '',
    expense_attachment: null,
    paid_amount: 0,
    due_amount: 0,
    purchases: []
  });

  // Add payment status state
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showPaymentAmount, setShowPaymentAmount] = useState<boolean>(false);

  // Calculate total amount from purchases
  useEffect(() => {
    const total = purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
    setTotalAmount(total);
    setFormData(prev => ({ ...prev, amount: total }));
  }, [purchases]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Fetching categories, suppliers, and students...');
        
        const [categoriesResponse, suppliersResponse, studentsResponse] = await Promise.all([
          expenseCategoryApi.getExpenseCategories(),
          supplierApi.getSuppliers(),
          studentApi.getStudents()
        ]);
        
        console.log('Categories response:', categoriesResponse);
        console.log('Suppliers response:', suppliersResponse);
        console.log('Students response:', studentsResponse);
        
        setExpenseCategories(categoriesResponse);
        setSuppliers(suppliersResponse.data);
        setStudents(studentsResponse.data);
        
        // Always add one product field by default
        if (purchases.length === 0) {
          const defaultPurchase: PurchaseFormData = {
            item_name: '',
            item_quantity: 1,
            item_price: 0,
            item_unit_price: 0,
            purchase_date: new Date().toISOString().split('T')[0],
            total_amount: 0
          };
          setPurchases([defaultPurchase]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load required data. Please refresh the page.');
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'paid_amount' || name === 'due_amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePaymentStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPaymentStatus(value);
    
    // Show payment amount field only for 'partially_paid' status
    if (value === 'partially_paid') {
      setShowPaymentAmount(true);
      setPaymentAmount(0); // Default to 0 for partial payment
    } else if (value === 'paid') {
      // Don't show payment amount input, but set full payment
      setShowPaymentAmount(false);
      // Set payment amount to total amount or 0 if total is 0
      const paymentValue = totalAmount > 0 ? totalAmount : 0;
      setPaymentAmount(paymentValue);
    } else {
      // For 'credit' status
      setShowPaymentAmount(false);
      setPaymentAmount(0); // No payment for credit
    }
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Allow empty string in the input but store as 0 for calculations
    const amount = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
    setPaymentAmount(amount);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      expense_attachment: file
    }));
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      expense_attachment: null
    }));
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    // Handle image preview modal if needed
    console.log('Image clicked:', imageUrl, alt);
  };

  const addPurchase = () => {
    const today = new Date().toISOString().split('T')[0];
    const newPurchase: PurchaseFormData = {
      item_name: '',
      item_quantity: 1,
      item_price: 0,
      item_unit_price: 0,
      purchase_date: today,
      total_amount: 0
    };
    setPurchases([...purchases, newPurchase]);
  };

  const removePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const updatePurchase = (index: number, field: keyof PurchaseFormData, value: any) => {
    const updatedPurchases = [...purchases];
    updatedPurchases[index] = {
      ...updatedPurchases[index],
      [field]: value
    };
    
    // When subtotal (total_amount) is manually updated, automatically calculate unit price
    if (field === 'total_amount') {
      const quantity = updatedPurchases[index].item_quantity;
      
      if (quantity > 0) {
        // Calculate unit price based on the new subtotal
        updatedPurchases[index].item_unit_price = value / quantity;
      } else {
        updatedPurchases[index].item_unit_price = 0;
      }
      updatedPurchases[index].item_price = value; // Set item_price to match total_amount
    }
    
    // When quantity is updated, recalculate unit price from current subtotal
    if (field === 'item_quantity') {
      const totalAmount = updatedPurchases[index].total_amount;
      
      if (value > 0) {
        updatedPurchases[index].item_unit_price = totalAmount / value;
      } else {
        updatedPurchases[index].item_unit_price = 0;
      }
    }
    
    // When unit price is updated, calculate subtotal based on quantity
    if (field === 'item_unit_price') {
      const quantity = updatedPurchases[index].item_quantity;
      const newTotalAmount = quantity * value;
      updatedPurchases[index].total_amount = newTotalAmount;
      updatedPurchases[index].item_price = newTotalAmount;
    }
    
    setPurchases(updatedPurchases);
    
    // Calculate and update the total amount immediately
    const newTotal = updatedPurchases.reduce((sum, purchase) => {
      return sum + (typeof purchase.total_amount === 'number' ? purchase.total_amount : 0);
    }, 0);
    
    // Update total amount state
    setTotalAmount(newTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.expense_category_id) {
        setError("Please select an expense category.");
        setIsLoading(false);
        return;
      }
      
      if (!formData.supplier_id) {
        setError("Please select a supplier.");
        setIsLoading(false);
        return;
      }
      
      // Description is optional, removed validation

      if (!paymentStatus) {
        setError("Please select a payment status.");
        setIsLoading(false);
        return;
      }
      
      // For partially paid, validate payment amount doesn't exceed total
      if (paymentStatus === 'partially_paid' && paymentAmount > totalAmount) {
        setError("Payment amount cannot exceed the total amount for a partial payment.");
        setIsLoading(false);
        return;
      }
      
      // Auto-generate expense_type from category
      const selectedCategory = expenseCategories.find(cat => cat.id === formData.expense_category_id);
      
      // Handle payment amount based on status
      let finalPaidAmount = 0;
      let finalDueAmount = 0;
      
      if (paymentStatus === 'paid') {
        finalPaidAmount = totalAmount;
        finalDueAmount = 0;
      } else if (paymentStatus === 'partially_paid') {
        finalPaidAmount = paymentAmount;
        finalDueAmount = Math.max(0, totalAmount - paymentAmount);
      } else {
        // Credit - everything is due
        finalPaidAmount = 0;
        finalDueAmount = totalAmount;
      }
      
      // Make sure purchases have all required fields, especially purchase_date
      const processedPurchases = purchases.map(purchase => ({
        ...purchase,
        purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0]
      }));
      
      const dataToSubmit = {
        ...formData,
        expense_type: selectedCategory?.name || 'General',
        title: selectedCategory?.name || 'Expense',
        amount: totalAmount,
        paid_amount: finalPaidAmount,
        due_amount: finalDueAmount,
        payment_type_id: '1', // Default payment type
        payment_status: paymentStatus, // Add payment status to the submission
        purchases: processedPurchases.length > 0 ? processedPurchases : undefined
      };

      await expenseApi.createExpense(dataToSubmit);
      
      setAlert({
        show: true,
        message: 'Expense created successfully!',
        type: 'success'
      });

      // Redirect after success
      setTimeout(() => {
        router.push('/admin/expense');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating expense:', error);
      if (error instanceof ApiError) {
        setError(`Failed to create expense: ${error.message}`);
      } else {
        setError('Failed to create expense. Please try again.');
      }
      setAlert({
        show: true,
        message: 'Failed to create expense. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Expense</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new expense record</p>
        </div>

        {/* Alert Notifications */}
        {alert.show && alert.type === 'success' && (
          <SuccessToast
            show={alert.show}
            message={alert.message}
            progress={100}
            onClose={() => setAlert({show: false, message: '', type: 'success'})}
          />
        )}
        {alert.show && alert.type === 'error' && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-100 border-red-500 text-red-700 border-l-4 p-4 rounded-lg shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Basic Information */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Expense Category */}
                  <div>
                    <label htmlFor="expense_category_id" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Expense Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="expense_category_id"
                      name="expense_category_id"
                      value={formData.expense_category_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label htmlFor="supplier_id" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="supplier_id"
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.opening_balance && supplier.opening_balance > 0 && (
                            ` - ${supplier.balance_type === 'due' ? 'Due' : 'Advance'}: Rs.${supplier.opening_balance}`
                          )}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                    placeholder="Enter expense description..."
                  />
                </div>

                {/* Product Details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                    <button
                      type="button"
                      onClick={addPurchase}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Add Product
                    </button>
                  </div>

                  {/* Always show at least one product field */}
                  {purchases.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 text-sm">No products added yet</p>
                      <button
                        type="button"
                        onClick={addPurchase}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add your first product
                      </button>
                    </div>
                  )}

                  {/* Product List */}
                  <div className="space-y-4">
                    {purchases.map((purchase, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          
                          {/* Product Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product Name
                            </label>
                            <input
                              type="text"
                              value={purchase.item_name}
                              onChange={(e) => updatePurchase(index, 'item_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Enter product name"
                            />
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={purchase.item_quantity}
                              onChange={(e) => updatePurchase(index, 'item_quantity', parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Qty"
                            />
                          </div>

                          {/* Unit Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              value={purchase.item_unit_price}
                              onChange={(e) => updatePurchase(index, 'item_unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Unit price"
                            />
                          </div>

                          {/* Subtotal */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subtotal
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={purchase.total_amount}
                                onChange={(e) => updatePurchase(index, 'total_amount', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                              />
                              <button
                                type="button"
                                onClick={() => removePurchase(index)}
                                className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Amount Line */}
                <div className="flex justify-end items-center mt-4 mb-4">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium mr-4">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">Rs.{(() => {
                      // Calculate total directly from purchases for accuracy
                      const calculatedTotal = purchases.reduce((sum, p) => {
                        return sum + (typeof p.total_amount === 'number' ? p.total_amount : 0);
                      }, 0);
                      return calculatedTotal.toFixed(2);
                    })()}</span>
                  </div>
                </div>

                {/* Date and Payment Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Payment Date */}
                  <div>
                    <label htmlFor="expense_date" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="expense_date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label htmlFor="payment_status" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Payment Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="payment_status"
                      name="payment_status"
                      value={paymentStatus}
                      onChange={handlePaymentStatusChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                </div>

                {/* Payment Amount (Conditional) */}
                {showPaymentAmount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="payment_amount" className="block text-sm font-semibold text-neutral-900 mb-2">
                        Payment Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="payment_amount"
                        name="payment_amount"
                        value={paymentAmount || ''}
                        onChange={handlePaymentAmountChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter payment amount..."
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Partial payment</div>
                        {paymentAmount > 0 && (
                          <div className="text-sm font-medium">
                            <span className="text-amber-600">Due to add to supplier: </span>
                            <span className="text-amber-700 font-semibold">Rs.{Math.max(0, totalAmount - paymentAmount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column - Image Upload & Summary */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Image Upload */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Expense Attachment
                  </label>
                  <SingleImageUploadCreate
                    imagePreview={imagePreview}
                    onFileSelect={handleFileSelect}
                    onRemove={handleFileRemove}
                    onImageClick={handleImageClick}
                    label=""
                  />
                  {!imagePreview && (
                    <p className="text-xs text-neutral-500 mt-1">Add an image of the receipt or invoice (optional)</p>
                  )}
                </div>

                {/* Summary Card */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Items:</span>
                      <span className="font-medium text-blue-900">{purchases.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Quantity:</span>
                      <span className="font-medium text-blue-900">{purchases.reduce((sum, p) => sum + p.item_quantity, 0)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700 font-medium">Total Amount:</span>
                        <span className="font-bold text-blue-900">Rs.{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Payment details based on status */}
                    {paymentStatus && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Payment Status:</span>
                          <span className="font-medium">
                            {paymentStatus === 'paid' && 
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Paid</span>
                            }
                            {paymentStatus === 'partially_paid' && 
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Partially Paid</span>
                            }
                            {paymentStatus === 'credit' && 
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Credit</span>
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Paid Amount:</span>
                          <span className="font-medium text-blue-900">
                            Rs.{paymentStatus === 'paid' 
                              ? totalAmount.toFixed(2) 
                              : paymentStatus === 'partially_paid' 
                                ? paymentAmount.toFixed(2) 
                                : '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Due Amount:</span>
                          <span className="font-medium text-blue-900">
                            Rs.{paymentStatus === 'paid' 
                              ? '0.00' 
                              : paymentStatus === 'partially_paid' 
                                ? (totalAmount - paymentAmount).toFixed(2) 
                                : totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/expense')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#235999] hover:bg-[#1e4d87]"
              >
                {isLoading ? 'Creating...' : 'Create Expense'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
