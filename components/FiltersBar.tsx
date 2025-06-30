

import React, { useState, useEffect } from 'react';
import { FilterOptions, Supplier } from '../types';
import { ProductType } from '../constants';

interface FiltersBarProps {
  suppliers: Supplier[];
  clientCountriesList: string[];
  productTypesList: ProductType[];
  yearsList: string[];
  onFiltersChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
    suppliers, 
    clientCountriesList, 
    productTypesList, 
    yearsList,
    onFiltersChange, 
    initialFilters,
}) => {
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(initialFilters);

  useEffect(() => {
    setCurrentFilters(initialFilters);
  }, [initialFilters]);

  const handleDateChange = <K extends keyof FilterOptions['dateRange'],>(
    key: K, 
    value: string
  ) => {
    setCurrentFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: value },
    }));
  };

  const handleCheckboxChange = (key: keyof Pick<FilterOptions, 'showCancelledOrders'>, checked: boolean) => {
     setCurrentFilters(prev => ({
        ...prev,
        [key]: checked
     }));
  };
  
  const applyFilters = () => {
    onFiltersChange(currentFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: {},
      supplierIds: [],
      clientCountries: [],
      productTypes: [],
      year: '',
      showCancelledOrders: false,
    };
    setCurrentFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };
  
  const inputBaseClass = "mt-1 block w-full p-2 bg-neutral-700 border border-neutral-600 text-neutral-100 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400";

  return (
    <div className="p-4 bg-neutral-700 shadow-md rounded-lg mb-6 border border-neutral-600/70">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-neutral-300">Year</label>
          <select 
            id="year"
            value={currentFilters.year || ''} 
            onChange={(e) => setCurrentFilters(prev => ({ ...prev, year: e.target.value }))}
            className={inputBaseClass}
          >
            <option value="" className="text-neutral-400">All Years</option>
            {yearsList.map(y => <option key={y} value={y} className="bg-neutral-700 text-neutral-100">{y}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-neutral-300">Order Date From</label>
          <input
            type="date"
            id="startDate"
            value={currentFilters.dateRange.start || ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className={`${inputBaseClass} dark:[color-scheme:dark]`} // Help date picker icon visibility
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-neutral-300">Order Date To</label>
          <input
            type="date"
            id="endDate"
            value={currentFilters.dateRange.end || ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className={`${inputBaseClass} dark:[color-scheme:dark]`}
          />
        </div>
        
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-neutral-300">Supplier</label>
          <select 
            id="supplier"
            value={currentFilters.supplierIds[0] || ''} 
            onChange={(e) => setCurrentFilters(prev => ({...prev, supplierIds: e.target.value ? [e.target.value] : []}))}
            className={inputBaseClass}
          >
            <option value="" className="text-neutral-400">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-neutral-700 text-neutral-100">{s.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="clientCountry" className="block text-sm font-medium text-neutral-300">Client Country</label>
          <select 
            id="clientCountry"
            value={currentFilters.clientCountries[0] || ''} 
            onChange={(e) => setCurrentFilters(prev => ({...prev, clientCountries: e.target.value ? [e.target.value] : []}))}
            className={inputBaseClass}
          >
            <option value="" className="text-neutral-400">All Countries</option>
            {clientCountriesList.map(c => <option key={c} value={c} className="bg-neutral-700 text-neutral-100">{c}</option>)}
          </select>
        </div>
        
        <div>
          <label htmlFor="productType" className="block text-sm font-medium text-neutral-300">Product Type</label>
          <select 
            id="productType"
            value={currentFilters.productTypes[0] || ''} 
            onChange={(e) => setCurrentFilters(prev => ({...prev, productTypes: e.target.value ? [e.target.value as ProductType] : []}))}
            className={inputBaseClass}
          >
            <option value="" className="text-neutral-400">All Products</option>
            {productTypesList.map(p => <option key={p} value={p} className="bg-neutral-700 text-neutral-100">{p}</option>)}
          </select>
        </div>

        <div className="flex items-center pt-6"> 
          <input
            id="showCancelled"
            type="checkbox"
            checked={currentFilters.showCancelledOrders || false}
            onChange={(e) => handleCheckboxChange('showCancelledOrders', e.target.checked)}
            className="h-4 w-4 text-primary bg-neutral-600 border-neutral-500 rounded focus:ring-primary"
          />
          <label htmlFor="showCancelled" className="ml-2 block text-sm text-neutral-300">
            Show Cancelled Orders
          </label>
        </div>

      </div>
      <div className="mt-6 flex flex-col md:flex-row justify-end items-start md:items-end space-y-4 md:space-y-0">
        <div className="flex space-x-3 self-end md:self-auto pt-2 md:pt-0">
            <button
                onClick={resetFilters}
                className="px-4 py-2 border border-neutral-500 rounded-md shadow-sm text-sm font-medium text-neutral-200 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-700 focus:ring-primary transition-colors"
            >
                Reset
            </button>
            <button
                onClick={applyFilters}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-900 bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-700 focus:ring-primary transition-colors"
            >
                Apply Filters
            </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;