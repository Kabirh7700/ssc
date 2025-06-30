import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateOrderSheetTemplateCSV, generateSupplierSheetTemplateCSV, processSeparateSheetsData } from '../services/dataTemplateService';
import { downloadCSVString } from '../utils/csvUtils';
import { Order, Supplier } from '../types';
import { FileArrowDownIcon, FileArrowUpIcon, GlobeAltIcon as GlobeIcon, CheckCircleSolidIcon, XCircleSolidIcon, ExclamationTriangleSolidIcon, Cog6ToothIcon } from './icons/DashboardIcons';
import { getExportUrlFromGoogleSheetUrl } from '../utils/googleSheetUtils';
import { DEFAULT_ORDER_SHEET_URL, DEFAULT_SUPPLIER_SHEET_URL } from '../constants'; // Import default URLs

interface DataManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadLiveData: (
    data: { orders: Order[]; suppliers: Supplier[]; errors: string[] },
    sourceDetails?: { type: 'googleSheet', orderSheetUrl: string, supplierSheetUrl: string } | { type: 'files', orderFileName?: string, supplierFileName?: string }
  ) => void;
  onSwitchToMockData: () => void;
  processingErrors: string[];
  setProcessingErrors: (updater: (prevErrors: string[]) => string[]) => void; 
  dataStats: { ordersCount: number; suppliersCount: number} | null;
  currentDataMode: 'mock' | 'live';
  setIsLoading: (loading: boolean) => void;
}

const DataManagementPanel: React.FC<DataManagementPanelProps> = ({
  isOpen, onClose, onLoadLiveData, onSwitchToMockData, 
  processingErrors, setProcessingErrors, dataStats, currentDataMode, setIsLoading
}) => {
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [supplierFile, setSupplierFile] = useState<File | null>(null);
  
  const [internalLoadingMessage, setInternalLoadingMessage] = useState<string | null>(null);


  const processAndLoadDualData = useCallback((
    orderCsvString: string,
    supplierCsvString: string,
    sourceDescription: string,
    sourceDetails?: { type: 'googleSheet', orderSheetUrl: string, supplierSheetUrl: string } | { type: 'files', orderFileName?: string, supplierFileName?: string }
  ) => {
    setInternalLoadingMessage(`Processing data from ${sourceDescription}...`);
    setIsLoading(true); 

    const result = processSeparateSheetsData(orderCsvString, supplierCsvString);
    
    onLoadLiveData(result, sourceDetails);

    if (result.errors.length > 0) {
        setProcessingErrors(prev => [...prev, ...result.errors.map(e => `${e} (Source: ${sourceDescription})`)]);
    } else if (result.orders.length === 0 && result.suppliers.length === 0 && result.errors.length === 0) { 
        setProcessingErrors(prev => [...prev, `No data found or processed from ${sourceDescription}. Ensure format is correct and data exists.`]);
    }
    
    setInternalLoadingMessage(null);
    if (sourceDetails?.type === 'files') {
        setOrderFile(null);
        setSupplierFile(null);
    }
    setIsLoading(false);
  }, [onLoadLiveData, setIsLoading, setProcessingErrors]);


  const handleDownloadOrderTemplate = () => {
    const csvContent = generateOrderSheetTemplateCSV();
    downloadCSVString(csvContent, 'order_data_template.csv');
  };
  const handleDownloadSupplierTemplate = () => {
    const csvContent = generateSupplierSheetTemplateCSV();
    downloadCSVString(csvContent, 'supplier_lineitem_data_template.csv');
  };

  const handleOrderFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setOrderFile(event.target.files[0]);
      setProcessingErrors(() => []); 
    }
  };
  const handleSupplierFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSupplierFile(event.target.files[0]);
      setProcessingErrors(() => []); 
    }
  };

  const handleFilesUpload = () => {
    if (!orderFile || !supplierFile) {
      setProcessingErrors(() => ['Please select both Order Data CSV and Supplier Data CSV files to upload.']);
      return;
    }
    setProcessingErrors(() => []);
    setInternalLoadingMessage(`Reading files...`);
    setIsLoading(true);

    Promise.all([orderFile.text(), supplierFile.text()])
      .then(([orderCsvString, supplierCsvString]) => {
        processAndLoadDualData(
          orderCsvString,
          supplierCsvString,
          `files "${orderFile.name}" & "${supplierFile.name}"`,
          { type: 'files', orderFileName: orderFile.name, supplierFileName: supplierFile.name }
        );
      })
      .catch(error => {
        console.error("Error reading files:", error);
        setProcessingErrors(() => [`Error reading files: ${(error as Error).message}`]);
        setInternalLoadingMessage(null);
        setIsLoading(false);
      });
  };

  const handleFetchFromUrls = async () => {
    const currentOrderUrl = DEFAULT_ORDER_SHEET_URL;
    const currentSupplierUrl = DEFAULT_SUPPLIER_SHEET_URL;

    if (!currentOrderUrl || !currentSupplierUrl) {
      setProcessingErrors(() => ['Default Google Sheet URLs are not configured in the application.']);
      return;
    }
    setProcessingErrors(() => []);

    const exportOrderUrl = getExportUrlFromGoogleSheetUrl(currentOrderUrl);
    const exportSupplierUrl = getExportUrlFromGoogleSheetUrl(currentSupplierUrl);

    if (!exportOrderUrl) {
        setProcessingErrors(() => ["Invalid Default Order Data Google Sheet URL format."]);
        return;
    }
    if (!exportSupplierUrl) {
        setProcessingErrors(() => ["Invalid Default Supplier Data Google Sheet URL format."]);
        return;
    }
    
    const fetchAndCheck = async (url: string, name: string): Promise<string> => {
        const response = await fetch(url, { cache: 'no-cache' });

        if (!response.ok) {
            const statusText = response.statusText || 'Request Failed';
            throw new Error(`${name} (${response.status}): ${statusText}. Ensure the Google Sheet is public ('Anyone with the link can view').`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/csv')) {
            throw new Error(`${name}: Expected CSV content, but received '${contentType || 'unknown'}'. This often happens if the sheet is private, causing a redirect to a login page.`);
        }

        return response.text();
    };

    setInternalLoadingMessage(`Fetching data from default Google Sheets...`);
    setIsLoading(true);
    try {
      const [orderCsvString, supplierCsvString] = await Promise.all([
        fetchAndCheck(exportOrderUrl, 'Order Sheet'),
        fetchAndCheck(exportSupplierUrl, 'Supplier Sheet')
      ]);

      if (!orderCsvString) {
        setProcessingErrors(prev => [...prev, 'Received empty data from the Order Sheet URL.']);
      }
      if (!supplierCsvString) {
         setProcessingErrors(prev => [...prev, 'Received empty data from the Supplier Sheet URL.']);
      }

      if (orderCsvString && supplierCsvString) {
         processAndLoadDualData(
            orderCsvString, 
            supplierCsvString, 
            'default Google Sheets URLs', 
            { type: 'googleSheet', orderSheetUrl: currentOrderUrl, supplierSheetUrl: currentSupplierUrl }
        );
      } else {
        setInternalLoadingMessage(null);
        setIsLoading(false);
      }

    } catch (error) {
      console.error("Error fetching from default URLs:", error);
      let detailedErrorMsg = `Error fetching from default URLs: ${(error as Error).message}`;
      // Generic message for network errors that are not handled by fetchAndCheck
      if ((error as Error).message.toLowerCase().includes('failed to fetch')) {
        detailedErrorMsg += " This may be a network issue or a browser extension blocking the request. Please check your internet connection and Google Sheet sharing settings.";
      }
      setProcessingErrors(() => [detailedErrorMsg]);
      setInternalLoadingMessage(null);
      setIsLoading(false);
    }
  };

  const handleSwitchToMock = () => {
    onSwitchToMockData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[120]" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeIn" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-primary flex items-center">
            <Cog6ToothIcon className="w-6 h-6 mr-2" /> Data Management
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">&times;</button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto text-neutral-300">
            {internalLoadingMessage && (
                 <div className="p-3 bg-primary/20 text-primary-light rounded-md text-sm flex items-center border border-primary/30">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-light mr-2"></div>
                    {internalLoadingMessage}
                </div>
            )}

            {processingErrors.length > 0 && (
              <div className="p-3 bg-danger/20 text-red-300 border border-danger/30 rounded-md space-y-1 text-sm max-h-40 overflow-y-auto">
                <p className="font-semibold flex items-center"><XCircleSolidIcon className="w-5 h-5 mr-1.5"/>Processing Errors:</p>
                <ul className="list-disc list-inside pl-1">
                  {processingErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {currentDataMode === 'live' && dataStats && processingErrors.length === 0 && !internalLoadingMessage && (
                 <div className="p-3 bg-success/20 text-green-300 border border-success/30 rounded-md text-sm flex items-center">
                    <CheckCircleSolidIcon className="w-5 h-5 mr-1.5"/>
                    Live data loaded: {dataStats.ordersCount} orders, {dataStats.suppliersCount} suppliers.
                    (Using default Google Sheet URLs)
                </div>
            )}
             {currentDataMode === 'mock' && !internalLoadingMessage && (
                 <div className="p-3 bg-warning/20 text-yellow-300 border border-warning/30 rounded-md text-sm flex items-center">
                    <ExclamationTriangleSolidIcon className="w-5 h-5 mr-1.5"/>
                    Currently using sample mock data.
                </div>
            )}

          <section>
            <h3 className="text-md font-semibold text-neutral-100 mb-2">1. Get Data Templates (Optional)</h3>
            <p className="text-sm text-neutral-300 mb-2">Download CSV templates for structuring your data. A common 'OrderID' column is used to link the two sheets.</p>
            <div className="grid grid-cols-2 gap-2">
                <button
                onClick={handleDownloadOrderTemplate}
                className="w-full px-3 py-2 bg-neutral-700 text-primary-light border border-primary/50 rounded-md hover:bg-neutral-600 hover:border-primary transition-colors flex items-center justify-center text-sm"
                >
                <FileArrowDownIcon className="w-4 h-4 mr-1 sm:mr-2" /> Order Data Template
                </button>
                <button
                onClick={handleDownloadSupplierTemplate}
                className="w-full px-3 py-2 bg-neutral-700 text-primary-light border border-primary/50 rounded-md hover:bg-neutral-600 hover:border-primary transition-colors flex items-center justify-center text-sm"
                >
                <FileArrowDownIcon className="w-4 h-4 mr-1 sm:mr-2" /> Supplier/Line Template
                </button>
            </div>
          </section>

          <section className="border-t border-neutral-700 pt-4">
            <h3 className="text-md font-semibold text-neutral-100 mb-1">2. Load from Default Google Sheets</h3>
            <p className="text-xs text-neutral-400 mb-2">Click below to fetch and load data from the pre-configured Bonhoeffer Google Sheets. Ensure you have internet access and the sheets are publicly viewable.</p>
             <button
                onClick={handleFetchFromUrls}
                disabled={!!internalLoadingMessage}
                className="mt-2 w-full px-4 py-2 bg-primary text-neutral-900 font-semibold rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center text-sm disabled:opacity-60"
              >
                <GlobeIcon className="w-5 h-5 mr-2" /> Fetch & Load from Default Google Sheets
              </button>
          </section>
          
          <section className="border-t border-neutral-700 pt-4">
            <h3 className="text-md font-semibold text-neutral-100 mb-1">OR Upload CSV Files</h3>
             <p className="text-xs text-neutral-400 mb-2">Select your Order data CSV and Supplier/Line Item data CSV.</p>
            <div className="space-y-3">
                <div>
                    <label className="text-sm text-neutral-300 block mb-1">Order Data CSV File:</label>
                    <input
                        type="file" accept=".csv" onChange={handleOrderFileChange}
                        className="text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-600 file:text-primary-light hover:file:bg-neutral-500 w-full"
                    />
                    {orderFile && <p className="text-xs text-neutral-400 mt-1">Selected: {orderFile.name}</p>}
                </div>
                <div>
                    <label className="text-sm text-neutral-300 block mb-1">Supplier/Line Item Data CSV File:</label>
                     <input
                        type="file" accept=".csv" onChange={handleSupplierFileChange}
                        className="text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-600 file:text-primary-light hover:file:bg-neutral-500 w-full"
                    />
                    {supplierFile && <p className="text-xs text-neutral-400 mt-1">Selected: {supplierFile.name}</p>}
                </div>
             
              <button
                onClick={handleFilesUpload}
                disabled={!orderFile || !supplierFile || !!internalLoadingMessage}
                className="w-full px-4 py-2 bg-accent text-neutral-900 font-semibold rounded-md hover:bg-accent-hover transition-colors flex items-center justify-center text-sm disabled:opacity-60"
              >
                <FileArrowUpIcon className="w-5 h-5 mr-2" /> Upload & Process Files
              </button>
            </div>
          </section>

        </main>
        <footer className="p-4 border-t border-neutral-700 flex justify-between items-center sticky bottom-0 bg-neutral-800">
           <button
                onClick={handleSwitchToMock}
                disabled={!!internalLoadingMessage || currentDataMode === 'mock'}
                className="px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 rounded-md disabled:opacity-50"
            >
                Switch to Mock Data
            </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-600 text-neutral-100 rounded-md hover:bg-neutral-500 transition-colors"
          >
            Close Panel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DataManagementPanel;