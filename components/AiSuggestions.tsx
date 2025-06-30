
import React from 'react';
import { AISuggestionItem } from '../types';
import { InfoIcon, WarningIcon, CriticalIcon } from './icons/DashboardIcons';

interface AiSuggestionsProps {
  suggestions: AISuggestionItem[];
  isLoading: boolean;
}

const SuggestionIcon: React.FC<{severity: AISuggestionItem['severity']}> = ({ severity }) => {
    let iconColor = 'text-blue-500';
    if (severity === 'critical') iconColor = 'text-red-500';
    else if (severity === 'warning') iconColor = 'text-yellow-500';
    
    return (
        <div className={`flex-shrink-0 w-5 h-5 ${iconColor} mt-0.5`}>
            {severity === 'critical' && <CriticalIcon />}
            {severity === 'warning' && <WarningIcon />}
            {severity === 'info' && <InfoIcon />}
        </div>
    );
};

const AiSuggestions: React.FC<AiSuggestionsProps> = ({ suggestions, isLoading }) => {
  return (
    <div className="bg-white p-6 shadow-lg rounded-lg h-full"> {/* Standardized padding */}
      <h3 className="text-xl font-semibold text-neutral-800 mb-6">AI-Powered Suggestions</h3> {/* Standardized title */}
      {isLoading && (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-neutral-500">Loading suggestions...</p>
        </div>
      )}
      {!isLoading && suggestions.length === 0 && (
        <div className="text-center py-8">
            <InfoIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No AI suggestions available at the moment.</p>
        </div>
      )}
      {!isLoading && suggestions.length > 0 && (
        <ul className="space-y-4 max-h-[350px] overflow-y-auto pr-2"> {/* Increased max-h and added pr for scrollbar */}
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.id} 
              className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:shadow-lg transition-all duration-200 ease-in-out cursor-default"
            >
              <div className="flex items-start space-x-3">
                <SuggestionIcon severity={suggestion.severity} />
                <div className="flex-grow">
                    <h4 className="font-semibold text-neutral-800 text-md">{suggestion.title}</h4>
                    <p className="text-sm text-neutral-600 mt-1">{suggestion.description}</p>
                    {suggestion.relatedOrderIds && suggestion.relatedOrderIds.length > 0 && (
                    <p className="text-xs text-neutral-500 mt-2">
                        Related Orders: {suggestion.relatedOrderIds.join(', ')}
                    </p>
                    )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AiSuggestions;
