"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Expense,
  ApiError 
} from '@/lib/api/index';
import { Button, FormField, SingleImageUploadEdit, SuccessToast, TableSkeleton } from '@/components/ui';

export default function EditExpense() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [purchases, setPurchases] = useState<PurchaseFormData[]>([]);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_category_id: '',
    expense_type: '', // Keep for API compatibility
    amount: 0,
    expense_date: '',
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

  // Add payment status and total amount states
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [showPaymentAmount, setShowPaymentAmount] = useState<boolean>(false);

  // Calculate total amount from purchases
  useEffect(() => {
    // Ensure each purchase total_amount is a number
    const total = purchases.reduce((sum, purchase) => {
      const purchaseAmount = typeof purchase.total_amount === 'number' ? purchase.total_amount : 0;
      return sum + purchaseAmount;
    }, 0);
    
    // Make sure total is a valid number
    const safeTotal = isNaN(total) ? 0 : total;
    
    // Update total amount state and form data
    setTotalAmount(safeTotal);
    setFormData(prev => ({ ...prev, amount: safeTotal }));
    
    // Also update payment amount and due amount based on payment status
    if (paymentStatus === 'paid') {
      setPaymentAmount(safeTotal);
      setDueAmount(0);
    } else if (paymentStatus === 'partially_paid') {
      // Keep existing payment amount, but ensure it doesn't exceed new total
      setPaymentAmount(prev => Math.min(prev || 0, safeTotal));
      // Recalculate due amount
      setDueAmount(Math.max(0, safeTotal - (paymentAmount || 0)));
    } else if (paymentStatus === 'credit') {
      setPaymentAmount(0);
      setDueAmount(safeTotal);
    }
  }, [purchases, paymentStatus]);

  // Load initial data and expense details
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        setError(null);
        
        // Get expense data directly for debugging
        const expenseResponse = await expenseApi.getExpense(params.id as string);
        console.log('API Response - Raw Expense Data:', JSON.stringify(expenseResponse));
        
        // Continue with other API calls
        const [categoriesResponse, suppliersResponse, studentsResponse] = await Promise.all([
          expenseCategoryApi.getExpenseCategories(),
          supplierApi.getSuppliers(),
          studentApi.getStudents()
        ]);
        
        setExpense(expenseResponse);
        setExpenseCategories(categoriesResponse);
        setSuppliers(suppliersResponse.data);
        setStudents(studentsResponse.data);
        
        // Set existing image
        if (expenseResponse.expense_attachment) {
          // Ensure the URL is properly formatted for display
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const attachmentPath = expenseResponse.expense_attachment || '';
          
          // Check if attachment path already includes /storage/ to avoid duplication
          const attachmentUrl = attachmentPath.startsWith('http')
            ? attachmentPath // Already a full URL
            : attachmentPath.startsWith('/storage/')
              ? `${baseUrl}${attachmentPath}` // Path already includes /storage/
              : `${baseUrl}/storage/${attachmentPath}`; // Need to add /storage/
          
          console.log('Setting existing image URL:', attachmentUrl);
          setExistingImage(attachmentUrl);
        }
        
        // Set form data with existing values
        setFormData({
          expense_category_id: expenseResponse.expense_category_id,
          expense_type: expenseResponse.expense_type,
          amount: expenseResponse.amount,
          expense_date: expenseResponse.expense_date,
          title: expenseResponse.title,
          description: expenseResponse.description || '',
          student_id: expenseResponse.student_id || '',
          staff_id: expenseResponse.staff_id || '',
          supplier_id: expenseResponse.supplier_id || '',
          expense_attachment: null,
          paid_amount: expenseResponse.paid_amount || 0,
          due_amount: expenseResponse.due_amount || 0,
          purchases: []
        });
        
        // Set initial total amount from the response
        setTotalAmount(expenseResponse.amount || 0);
        
        // Set payment status from the response
        if (expenseResponse.payment_status) {
          setPaymentStatus(expenseResponse.payment_status);
          
          // Set showPaymentAmount and paymentAmount based on status
          if (expenseResponse.payment_status === 'partially_paid') {
            setShowPaymentAmount(true);
            setPaymentAmount(expenseResponse.paid_amount || 0);
            setDueAmount(Math.max(0, (expenseResponse.amount || 0) - (expenseResponse.paid_amount || 0)));
          } else if (expenseResponse.payment_status === 'paid') {
            setShowPaymentAmount(false);
            setPaymentAmount(expenseResponse.amount || 0);
            setDueAmount(0);
          } else {
            // Credit status
            setShowPaymentAmount(false);
            setPaymentAmount(0);
            setDueAmount(expenseResponse.amount || 0);
          }
        } else {
          // Default to credit if no status is set
          setPaymentStatus('credit');
          setShowPaymentAmount(false);
          setPaymentAmount(0);
          setDueAmount(expenseResponse.amount || 0);
        }
        
        // Detailed debug logging
        console.log('Expense Response Data Structure:', {
          id: expenseResponse.id,
          amount: expenseResponse.amount,
          payment_status: expenseResponse.payment_status,
          purchases_count: expenseResponse.purchases?.length || 0
        });
        
        if (expenseResponse.purchases) {
          console.log('Purchase Details:', expenseResponse.purchases.map(p => ({
            name: p.item_name,
            quantity: p.item_quantity,
            unit_price: p.item_unit_price,
            total: p.total_amount
          })));
        }
        
        // Set purchases if they exist
        if (expenseResponse.purchases && expenseResponse.purchases.length > 0) {
          const purchasesData = expenseResponse.purchases.map(purchase => ({
            item_name: purchase.item_name,
            item_quantity: Number(purchase.item_quantity) || 0,  // Ensure numeric type
            item_price: Number(purchase.item_price) || 0,        // Ensure numeric type
            item_unit_price: Number(purchase.item_unit_price) || 0, // Ensure numeric type
            purchase_date: purchase.purchase_date,
            total_amount: Number(purchase.total_amount) || 0     // Ensure numeric type
          }));
          
          // Calculate total from purchases immediately and log it
          const calculatedTotal = purchasesData.reduce((sum, p) => sum + p.total_amount, 0);
          console.log('Calculated Total from Purchases:', calculatedTotal);
          
          // Update the state with the purchase data and calculated total
          setPurchases(purchasesData);
          setTotalAmount(calculatedTotal);
          
          // Also update form data with the calculated total
          setFormData(prev => ({
            ...prev,
            amount: calculatedTotal
          }));
        } else {
          // Always add one product field by default if no purchases exist
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
        if (error instanceof ApiError) {
          setError(`Failed to load expense: ${error.message}`);
        } else {
          setError('Failed to load expense. Please check your connection.');
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (params.id) {
      loadData();
    }
  }, [params.id]);

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
      setPaymentAmount(totalAmount); // Full payment amount
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
    
    // Update due amount when payment amount changes
    if (paymentStatus === 'partially_paid') {
      setDueAmount(Math.max(0, totalAmount - amount));
    }
  };
  
  // Effect to update due amount whenever payment amount or total changes
  useEffect(() => {
    if (paymentStatus === 'paid') {
      setDueAmount(0);
    } else if (paymentStatus === 'partially_paid') {
      setDueAmount(Math.max(0, totalAmount - paymentAmount));
    } else {
      setDueAmount(totalAmount);
    }
  }, [paymentAmount, totalAmount, paymentStatus]);

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
    setExistingImage(null);
    setFormData(prev => ({
      ...prev,
      expense_attachment: null
    }));
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    console.log('Image clicked:', imageUrl, alt);
  };

  const addPurchase = () => {
    const newPurchase: PurchaseFormData = {
      item_name: '',
      item_quantity: 1,
      item_price: 0,
      item_unit_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      total_amount: 0
    };
    setPurchases([...purchases, newPurchase]);
  };

  const removePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const updatePurchase = (index: number, field: keyof PurchaseFormData, value: any) => {
    console.log(`Updating purchase at index ${index}, field: ${field}, value: ${value}`);
    
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
    
    // When quantity is updated, recalculate subtotal based on unit price
    if (field === 'item_quantity') {
      const unitPrice = updatedPurchases[index].item_unit_price;
      const newTotalAmount = value * unitPrice;
      updatedPurchases[index].total_amount = newTotalAmount;
      updatedPurchases[index].item_price = newTotalAmount;
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
      const amount = typeof purchase.total_amount === 'number' ? purchase.total_amount : 0;
      console.log(`Purchase in calculation: ${purchase.item_name}, Amount: ${amount}`);
      return sum + amount;
    }, 0);
    
    console.log('New calculated total:', newTotal);
    
    // Update total amount state and form data
    setTotalAmount(newTotal);
    setFormData(prev => ({ ...prev, amount: newTotal }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // For partially paid, validate payment amount doesn't exceed total
      if (paymentStatus === 'partially_paid' && paymentAmount > totalAmount) {
        setError("Payment amount cannot exceed the total amount for a partial payment.");
        setIsLoading(false);
        return;
      }
      
      // Validate attachment file if a new one is selected
      if (selectedFile) {
        // Check file type
        const validFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!validFileTypes.includes(selectedFile.type)) {
          setError(`Invalid file type. Allowed types: JPG, PNG, GIF, PDF. Selected file is ${selectedFile.type}`);
          setIsLoading(false);
          return;
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (selectedFile.size > maxSize) {
          setError(`File size exceeds 5MB limit. Selected file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
          setIsLoading(false);
          return;
        }

        console.log('Uploading file:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: `${(selectedFile.size / 1024).toFixed(2)}KB`
        });
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
      
      // Create a copy of the form data to avoid manipulating the state directly
      const dataToSubmit: ExpenseFormData = {
        ...formData,
        expense_type: selectedCategory?.name || 'General',
        title: selectedCategory?.name || 'Expense',
        amount: totalAmount,
        paid_amount: finalPaidAmount,
        due_amount: finalDueAmount,
        payment_status: paymentStatus,
        purchases: purchases.length > 0 ? purchases : undefined,
        // Only include expense_attachment if there's a new file selected
        expense_attachment: selectedFile
      };

      try {
        console.log('Submitting expense update with data:', {
          ...dataToSubmit,
          expense_attachment: dataToSubmit.expense_attachment ? 'File included' : 'No file',
          purchases: dataToSubmit.purchases?.length
        });
        
        await expenseApi.updateExpense(params.id as string, dataToSubmit);
        
        setAlert({
          show: true,
          message: 'Expense updated successfully!',
          type: 'success'
        });

        // Redirect after success
        setTimeout(() => {
          router.push('/admin/expense');
        }, 2000);
        
      } catch (error) {
        console.error('Error updating expense:', error);
        
        if (error instanceof ApiError) {
          // Handle file upload error specifically
          if (error.message.includes('attachment') || error.message.includes('upload')) {
            setError(`Failed to upload attachment: ${error.message}. Please check the file type and size.`);
          } else {
            setError(`Failed to update expense: ${error.message}`);
          }
          
          // Log validation errors if available
          if (error.validation) {
            console.error('Validation errors:', error.validation);
          }
        } else {
          setError('Failed to update expense. Please try again.');
        }
        
        setAlert({
          show: true,
          message: 'Failed to update expense. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Loading Expense...</h1>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Expense</h1>
          <p className="text-sm text-gray-500 mt-1">Update expense information</p>
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
                        // Always force to number type for reliable calculation
                        const amount = Number(p.total_amount) || 0;
                        console.log(`Total line - Purchase: ${p.item_name}, Amount: ${amount}, Type: ${typeof amount}`);
                        return sum + amount;
                      }, 0);
                      console.log('Final Total amount line:', calculatedTotal);
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
                  <SingleImageUploadEdit
                    imagePreview={imagePreview}
                    existingImageUrl={existingImage}
                    onFileSelect={handleFileSelect}
                    onRemove={handleFileRemove}
                    onImageClick={handleImageClick}
                    label=""
                    error={error && error.includes('attachment') ? error : undefined}
                  />
                  {!existingImage && !imagePreview && (
                    <p className="text-xs text-neutral-500 mt-1">No attachment currently available</p>
                  )}
                  {existingImage && (
                    <p className="text-xs text-green-600 mt-1">Current attachment will be displayed in the preview above</p>
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
                        <span className="font-bold text-blue-900">Rs.{(() => {
                            // Calculate directly from purchases for accuracy
                            const calculatedTotal = purchases.reduce((sum, p) => {
                              // Always force to number type to avoid string concatenation issues
                              const amount = Number(p.total_amount) || 0;
                              console.log(`Purchase in summary: ${p.item_name}, Amount: ${amount}`);
                              return sum + amount;
                            }, 0);
                            console.log('Final Summary Total:', calculatedTotal);
                            return calculatedTotal.toFixed(2);
                          })()}</span>
                      </div>
                    </div>
                    
                    {/* Payment Status */}
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
                        {!paymentStatus && 
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Not Set</span>
                        }
                      </span>
                    </div>
                    
                    {/* Payment details based on status */}
                    <div className="flex justify-between">
                      <span className="text-blue-700">Paid Amount:</span>
                      <span className="font-medium text-blue-900">
                        Rs.{(typeof paymentAmount === 'number' ? paymentAmount : 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Due Amount:</span>
                      <span className="font-medium text-blue-900">
                        Rs.{(typeof dueAmount === 'number' ? dueAmount : 0).toFixed(2)}
                      </span>
                    </div>
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
                {isLoading ? 'Updating...' : 'Update Expense'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
