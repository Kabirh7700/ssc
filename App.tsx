import React, { useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import { useAuth } from './contexts/AuthContext'; // Import useAuth

const App: React.FC = () => {
  const { currentUser, isLoadingAuth } = useAuth(); // Get user and loading state, changed `user` to `currentUser`

  useEffect(() => {
    if (!currentUser) {
      document.body.classList.add('login-page-active');
    } else {
      document.body.classList.remove('login-page-active');
    }
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, [currentUser]);


  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-xl text-neutral-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-800 text-neutral-300">
      {currentUser ? <DashboardPage /> : <LoginPage />} {/* Conditional rendering based on currentUser */}
    </div>
  );
};

export default App;