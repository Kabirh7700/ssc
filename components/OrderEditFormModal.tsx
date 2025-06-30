
import React from 'react';
import { Order } from '../types';
import { XMarkIcon } from './icons/DashboardIcons';

interface OrderEditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit: Order | null;
  onSaveChanges: (updatedOrder: Order) => void;
}

const OrderEditFormModal: React.FC<OrderEditFormModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
  onSaveChanges,
}) => {
  if (!isOpen) {
    return null;
  }

  // Basic structure, to be expanded later
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-primary">
            Edit Order: {orderToEdit ? orderToEdit.id : 'N/A'}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          <p className="text-neutral-300">
            Order editing functionality is not yet implemented.
          </p>
          {orderToEdit && (
            <div className="text-sm text-neutral-400">
              <p>Selected Order ID: {orderToEdit.id}</p>
              <p>Client: {orderToEdit.clientName}</p>
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-neutral-700 flex justify-end items-center space-x-3 sticky bottom-0 bg-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-600 text-neutral-100 rounded-md hover:bg-neutral-500 transition-colors"
          >
            Close
          </button>
          {/* <button
            // onClick={handleSave} // Implement save logic later
            disabled // Disabled until implemented
            className="px-4 py-2 bg-primary text-neutral-900 font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Save Changes
          </button> */}
        </footer>
      </div>
    </div>
  );
};

export default OrderEditFormModal;
