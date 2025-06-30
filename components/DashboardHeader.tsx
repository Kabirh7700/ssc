
import React from 'react';
import { Cog6ToothIcon, UserCircleIcon, UsersIcon, RefreshIcon, MagnifyingGlassIcon, XMarkIcon as XMarkIconMini } from './icons/DashboardIcons'; // Added MagnifyingGlassIcon, XMarkIconMini
import { useAuth } from '../contexts/AuthContext';

interface DashboardHeaderProps {
  onToggleDataPanel: () => void;
  lastRefreshed: Date | null;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  dataMode: 'live' | 'mock';
  onToggleUserManagement: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const BonhoefferLogoURL = "https://lh3.googleusercontent.com/fife/ALs6j_Fa2v9wf4nQm0ikochA4bCGfscrsu2KxigQWxICdNIQIJvE5qLLVCWbSTz_ys0ORoGQgqQRGComg7JFMI0enFFY1qix-zF3GdJorXtbgiZYIpFNTXRiMj5dfCsVmAimI8DQ3Qn6goSoCMvpjqkDMM4xzRW7UUamRD1x0daZzfpMlsGO39C7swm9LDyYN_aq7_1-BAcHsJg7sekpPPm_Z1o4Okz4xbMXjCpqQuXEiM_YjJ4XJzPaejo4H5zQgdy1WrGcj0qQLpsfkLo50nuQkMa274xfzuuCscLfozQxTezK-Qdnd2Ge2KtfMHeOie6ELweQp03SerTjLuwu5p-UfTtZa5dOzrnbK4dsYFIepewFep9RGxwPP61wTXrlN0z9YaYtvEoGEfykaAzRV9Flsr3aJWMolhnYU-nbibYurzkSlFI4lzrCjs_3LUWEN7O2Dja8twe-uEpQXDVq9qtD92DKbswq3LaT_oBOBNADPErzg-OV8PhmcQVm0FfIL4ffudaltrxPfIMvQyTWDnSiRoTWNuFYjFRw0-aTzkyNRh3uVk9QobqB3dXu1r-iaeIYsP7PA5l4-gH59ab6529n1nBna8BBimnLXCGY4LRC-8TQhcxH63c_qgLNST_iRnf50aYRlHBInKunmrh0kEjS2dlud8D29vZdEmE0TMJ7ABFV9t4rbSwuJVO9Ne6uYZB7Jsvghwyy1ddUsti_c8hDWD4wkDFhA1cl13sxN0Ogd3TEZ3ycME64_aovB59WVhS0U4EzEcNHy6kRntXFu9NwOiWhy_cWbkhQiN6PGf_RiZVr42BF0hmLmwrVJEpSLJ4srDq_lbH8favC8j5FAluWB2K3iwDZWjbc77u8056XqDzM6p-Qd5UxlZ_JtsI5ax2D-Kv6zsR0s6HwFAWJBgZ_CUjjGWX5XZ4Oh8HML-21Wt2kwLPjlmRzYul2gsFH8pqL1PwyCstcW5_O9qiH-rCmJoRzkdbag-dZWFGluwbUKRIZ0YQvFQCqAWpkmIm3mjcuniiUnSEgiAhqgM0D_JX8ZeQD63gQM69FWWPKoDJ1Y6ZFxV8wRfr9iL-exz-L94u9XnmyfAV65glJrZz-JW0gDBLNNAkY-2QmxsaZYapOz9df9Aqq2BlHVcuitrTq0_gRcelv_QTfk9tkOxt0KHxu0BUG7jOSJIdQKxqasBtyjUPA7vMaqFM1CQzpnbhdXm22jnMU1A5I6JLOG4LRuo3R59AmAUbo03_83NDUsaFH_CnfjDqQtOe-5oP2S8eJo8ARNDGX0AuTv_NclpFTxkA0cwDEmxLH9CrDTSpYY4lJ6i4sNjteiZV1lN6C_IRt8oco4-huS76Zu_hxrMBaLIofC-_V_6EbUoM8PFdQ0NEkSMzgrg6aSTqmHfJIsMCdvydMdZeTEAHbcatXweKBK5bvSd36a8Q4XneiKQuglab-uB6QzY3BEjKKsoBKBCwZubMpGVfGMEKsTcUixJdLXAlc2HX5kqpwHrcod4pX_HkiAB9HGzImJ65m7Cp-RJTgZ5PNW85Xr34W7tCfJFSC8xL8MlEuYTHePPVviSvIt_PO7ICUEQbeu_L-p4k-0jJbPfbOCe_yeQDwfjazFiysSimGV76K0qtWaWkc-MpH=w1920-h868?auditContext=prefetch";


const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleDataPanel,
  lastRefreshed,
  onManualRefresh,
  isRefreshing,
  dataMode,
  onToggleUserManagement,
  searchTerm,
  onSearchTermChange,
}) => {
  const { currentUser, logout } = useAuth();

  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const DataModeIndicator: React.FC = () => {
    if (dataMode === 'live') {
      return (
        <div className="flex items-center space-x-2 bg-success/20 text-success-light px-2.5 py-1 rounded-full text-xs font-medium border border-success/30">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
          <span>LIVE DATA</span>
          <span className="text-success/70">|</span>
          <span>{formatLastRefreshed(lastRefreshed)}</span>
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="ml-1 p-0.5 rounded-full hover:bg-success/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Live Data"
            aria-label="Refresh live data"
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-success-light"></div>
            ) : (
              <RefreshIcon className="w-3 h-3 text-success-light" />
            )}
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 bg-warning/20 text-yellow-300 px-2.5 py-1 rounded-full text-xs font-medium border border-warning/30">
          <span className="w-2 h-2 bg-warning rounded-full"></span>
          <span>MOCK DATA MODE</span>
        </div>
      );
    }
  };


  return (
    <header className="bg-neutral-900 text-neutral-100 p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 space-y-2 sm:space-y-0">
      <div className="flex items-center self-start sm:self-center">
        <img 
          src={BonhoefferLogoURL} 
          alt="Bonhoeffer Machines Logo" 
          className="h-10 w-auto sm:h-12 mr-2 sm:mr-3 rounded-md object-contain" 
        />
        <h1 className="text-xl sm:text-2xl font-semibold">Bonhoeffer SCM</h1>
      </div>

      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative w-full sm:w-64 md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="search"
            placeholder="Search Orders (ID, Client, Product...)"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="block w-full pl-9 pr-8 py-1.5 text-sm bg-neutral-800 text-neutral-100 border border-neutral-600 rounded-md focus:ring-primary focus:border-primary placeholder-neutral-400"
            aria-label="Search orders"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchTermChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200"
              aria-label="Clear search"
            >
              <XMarkIconMini className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 justify-end w-full sm:w-auto">
          <DataModeIndicator />
          
          {currentUser && (
            <div className="text-xs hidden lg:flex items-center bg-neutral-700/50 px-2 py-1 rounded-md border border-neutral-600/70">
              <UserCircleIcon className="w-4 h-4 mr-1.5 text-primary"/>
              <span className="font-medium text-neutral-200">{currentUser.name || currentUser.email} ({currentUser.role})</span>
            </div>
          )}
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={onToggleDataPanel}
              className="p-1.5 sm:p-2 rounded-full text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center text-sm"
              title="Manage Data (Upload/Fetch)"
            >
              <Cog6ToothIcon className="w-5 h-5" /> <span className="hidden md:inline ml-1">Data</span>
            </button>
          )}
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={onToggleUserManagement}
              className="p-1.5 sm:p-2 rounded-full text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center text-sm"
              title="User Management"
            >
              <UsersIcon className="w-5 h-5" /> <span className="hidden md:inline ml-1">Users</span>
            </button>
          )}

          {currentUser && (
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 rounded-full text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center text-sm"
              title="Logout"
            >
              <UserCircleIcon className="w-5 h-5" /> <span className="hidden sm:inline ml-1">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;