"use client";

import { useState } from 'react';
import { Trash2, AlertTriangle, Database, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export function DatabaseCleaner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [selectedItems, setSelectedItems] = useState({
    sales: true,
    returns: true,
    customers: true,
    expenses: true,
    suppliers: true,
    ograiTransactions: true,
    ograiPaymentHistory: true,
    paymentHistory: true,
    resetProductQuantities: true
  });

  const dataLabels = {
    sales: 'Sales & Sale Items',
    returns: 'Returns & Return Items',
    customers: 'Customers',
    expenses: 'Expenses',
    suppliers: 'Suppliers',
    ograiTransactions: 'Ograi Transactions',
    ograiPaymentHistory: 'Ograi Payment History',
    paymentHistory: 'Payment History',
    resetProductQuantities: 'Reset Product Quantities to 0'
  };

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/clean-database');
      const data = await response.json();
      if (data.success) {
        setDatabaseInfo(data.data);
        setConfirmOpen(true);
      } else {
        toast.error('Failed to fetch database information');
      }
    } catch (error) {
      toast.error('Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanDatabase = async () => {
    // Check if at least one item is selected
    const hasSelection = Object.values(selectedItems).some(value => value);
    if (!hasSelection) {
      toast.error('Please select at least one item to clean');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/clean-database', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemsToDelete: selectedItems }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Selected data cleaned successfully!');
        setConfirmOpen(false);
        setOpen(false);
        // Reset selections
        setSelectedItems({
          sales: true,
          returns: true,
          customers: true,
          expenses: true,
          suppliers: true,
          ograiTransactions: true,
          ograiPaymentHistory: true,
          paymentHistory: true,
          resetProductQuantities: true
        });
        // Optionally refresh the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Failed to clean database');
      }
    } catch (error) {
      toast.error('Error cleaning database');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (key) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = async () => {
    setSelectAllLoading(true);
    // Add a small delay to show the processing state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allSelected = Object.values(selectedItems).every(value => value);
    const newValue = !allSelected;
    const newSelectedItems = {};
    Object.keys(selectedItems).forEach(key => {
      newSelectedItems[key] = newValue;
    });
    setSelectedItems(newSelectedItems);
    setSelectAllLoading(false);
  };

  const getSelectedCount = () => {
    if (!databaseInfo) return 0;
    let count = 0;
    
    if (selectedItems.sales) {
      count += databaseInfo.willDelete.sales + databaseInfo.willDelete.saleItems;
    }
    if (selectedItems.returns) {
      count += databaseInfo.willDelete.returns + databaseInfo.willDelete.returnItems;
    }
    if (selectedItems.customers) {
      count += databaseInfo.willDelete.customers;
    }
    if (selectedItems.expenses) {
      count += databaseInfo.willDelete.expenses;
    }
    if (selectedItems.suppliers) {
      count += databaseInfo.willDelete.suppliers;
    }
    if (selectedItems.ograiTransactions) {
      count += databaseInfo.willDelete.ograiTransactions;
    }
    if (selectedItems.ograiPaymentHistory) {
      count += databaseInfo.willDelete.ograiPaymentHistory;
    }
    if (selectedItems.paymentHistory) {
      count += databaseInfo.willDelete.paymentHistory;
    }
    
    return count;
  };

  const allSelected = Object.values(selectedItems).every(value => value);
  const someSelected = Object.values(selectedItems).some(value => value);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="w-full cursor-pointer transition-all hover:scale-105">
            <Database className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Clean Database</span>
            <span className="sm:hidden">Clean DB</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Clean Database</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select the data types you want to clean from your database. Categories and Products will always be preserved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs sm:text-sm text-yellow-800">
                <strong>Warning:</strong> This action cannot be undone. Please make sure you have a backup if needed.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">You can select which data to clear:</p>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 ml-2">
                <li>Sales and Sale Items</li>
                <li>Returns and Return Items</li>
                <li>Customers</li>
                <li>Expenses</li>
                <li>Suppliers and Transactions</li>
                <li>Payment History</li>
                <li>Product quantities (reset to 0)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-green-700">Always preserved:</p>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 ml-2 text-green-600">
                <li>All Categories</li>
                <li>All Products (only quantities can be reset)</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto cursor-pointer transition-all hover:scale-105"
            >
              {loading ? 'Please wait...' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={fetchDatabaseInfo}
              disabled={loading}
              className="w-full sm:w-auto cursor-pointer transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Select Data to Clean
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select which data you want to delete. Review the counts and confirm your selection.
            </DialogDescription>
          </DialogHeader>

          {databaseInfo && (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading || selectAllLoading}
                  className="w-full sm:w-auto cursor-pointer transition-all hover:scale-105"
                >
                  {selectAllLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    allSelected ? 'Deselect All' : 'Select All'
                  )}
                </Button>
                <Badge variant="destructive" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Selected records to delete: </span>
                  <span className="sm:hidden">Selected: </span>
                  {getSelectedCount()}
                </Badge>
              </div>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-red-900">Select Data to Delete</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-red-700">
                    Check the items you want to remove
                    <span className="block text-xs mt-1 text-orange-600">
                      Note: Some items have dependencies
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="sales"
                        checked={selectedItems.sales}
                        onCheckedChange={() => handleCheckboxChange('sales')}
                      />
                      <label
                        htmlFor="sales"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.sales}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.sales + databaseInfo.willDelete.saleItems} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="returns"
                        checked={selectedItems.returns}
                        onCheckedChange={() => handleCheckboxChange('returns')}
                      />
                      <label
                        htmlFor="returns"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.returns}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.returns + databaseInfo.willDelete.returnItems} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="customers"
                        checked={selectedItems.customers}
                        onCheckedChange={() => handleCheckboxChange('customers')}
                      />
                      <label
                        htmlFor="customers"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.customers}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.customers} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="expenses"
                        checked={selectedItems.expenses}
                        onCheckedChange={() => handleCheckboxChange('expenses')}
                      />
                      <label
                        htmlFor="expenses"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.expenses}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.expenses} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="suppliers"
                        checked={selectedItems.suppliers}
                        onCheckedChange={() => handleCheckboxChange('suppliers')}
                      />
                      <label
                        htmlFor="suppliers"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.suppliers}
                        {selectedItems.suppliers && !selectedItems.ograiTransactions && databaseInfo.willDelete.ograiTransactions > 0 && (
                          <span className="text-xs text-orange-600 ml-1">(Will also delete transactions)</span>
                        )}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.suppliers} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="ograiTransactions"
                        checked={selectedItems.ograiTransactions}
                        onCheckedChange={() => handleCheckboxChange('ograiTransactions')}
                      />
                      <label
                        htmlFor="ograiTransactions"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.ograiTransactions}
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.ograiTransactions} records
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="paymentHistory"
                        checked={selectedItems.paymentHistory}
                        onCheckedChange={() => handleCheckboxChange('paymentHistory')}
                      />
                      <label
                        htmlFor="paymentHistory"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        All Payment History
                      </label>
                      <Badge variant="destructive" className="text-xs">
                        {databaseInfo.willDelete.paymentHistory + databaseInfo.willDelete.ograiPaymentHistory} records
                      </Badge>
                    </div>

                    <Separator />

                    <div className="flex items-center space-x-2 p-2 bg-white rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="resetProductQuantities"
                        checked={selectedItems.resetProductQuantities}
                        onCheckedChange={() => handleCheckboxChange('resetProductQuantities')}
                      />
                      <label
                        htmlFor="resetProductQuantities"
                        className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dataLabels.resetProductQuantities}
                      </label>
                      <Badge variant="secondary" className="text-xs">
                        {databaseInfo.willKeep.products} products
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base text-green-900">Data to be Preserved</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-green-700">
                    These will not be deleted
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <span className="text-xs sm:text-sm">Categories:</span>
                      <Badge variant="success" className="bg-green-600 text-xs">
                        {databaseInfo.willKeep.categories}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-md">
                      <span className="text-xs sm:text-sm">Products:</span>
                      <Badge variant="success" className="bg-green-600 text-xs">
                        {databaseInfo.willKeep.products}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {someSelected && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-xs sm:text-sm text-red-800">
                    <strong>Final Warning:</strong> This will delete {getSelectedCount()} records. 
                    <span className="hidden sm:inline">This cannot be undone!</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto cursor-pointer transition-all hover:scale-105"
            >
              {loading ? 'Please wait...' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCleanDatabase}
              disabled={loading || !someSelected}
              className="w-full sm:w-auto cursor-pointer transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Selected Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}