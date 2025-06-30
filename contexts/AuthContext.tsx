import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, ManagedUser, UserRole } from '../types'; // Ensure correct path and types

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoadingAuth: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  managedUsers: ManagedUser[];
  addManagedUser: (newUser: Omit<ManagedUser, 'id' | 'role'> & { role: UserRole, passwordPlain: string }) => Promise<{ success: boolean; error?: string }>;
  deleteManagedUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateManagedUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_EMAIL = 'bon@gmail.com';
const MOCK_ADMIN_PASS = '1234';
const MOCK_ADMIN_NAME = 'SCM Admin';
const AUTH_STORAGE_KEY = 'bonhoefferScmAuthUser';
const MANAGED_USERS_STORAGE_KEY = 'bonhoefferScmManagedUsers';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);

  useEffect(() => {
    // Load managed users from localStorage
    try {
      const persistedManagedUsersJson = localStorage.getItem(MANAGED_USERS_STORAGE_KEY);
      if (persistedManagedUsersJson) {
        setManagedUsers(JSON.parse(persistedManagedUsersJson));
      } else {
        // Initialize with default admin if no users exist (for first-time setup or if cleared)
        const defaultAdminUser: ManagedUser = {
          id: 'admin-001',
          email: MOCK_ADMIN_EMAIL,
          name: MOCK_ADMIN_NAME,
          passwordPlain: MOCK_ADMIN_PASS, // Store plain for mock, hash in real app
          role: 'admin',
        };
        setManagedUsers([defaultAdminUser]);
        localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify([defaultAdminUser]));
      }
    } catch (error) {
      console.error("Error reading managed users from localStorage:", error);
    }

    // Check localStorage for persisted logged-in user session
    try {
      const persistedUserJson = localStorage.getItem(AUTH_STORAGE_KEY);
      if (persistedUserJson) {
        const persistedUser = JSON.parse(persistedUserJson) as AuthUser;
        setCurrentUser(persistedUser);
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoadingAuth(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundUser = managedUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordPlain === pass
        );

        if (foundUser) {
          const loggedInUser: AuthUser = {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
          };
          setCurrentUser(loggedInUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
          setIsLoadingAuth(false);
          resolve(true);
        } else {
          setCurrentUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setIsLoadingAuth(false);
          resolve(false);
        }
      }, 500);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const addManagedUser = async (newUserFields: Omit<ManagedUser, 'id'>): Promise<{ success: boolean; error?: string }> => {
    if (managedUsers.some(u => u.email.toLowerCase() === newUserFields.email.toLowerCase())) {
      return { success: false, error: 'User with this email already exists.' };
    }
    const newUser: ManagedUser = {
      ...newUserFields,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updatedUsers = [...managedUsers, newUser];
    setManagedUsers(updatedUsers);
    localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return { success: true };
  };

  const deleteManagedUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser && currentUser.id === userId) {
        return { success: false, error: "Cannot delete the currently logged-in user." };
    }
    // Prevent deletion of the initial mock admin if they are the only admin left or by ID.
    // This is a simple safeguard. A more robust system would check for at least one admin.
    const userToDelete = managedUsers.find(u => u.id === userId);
    if (userToDelete && userToDelete.email === MOCK_ADMIN_EMAIL && userToDelete.role === 'admin') {
         const adminCount = managedUsers.filter(u => u.role ==='admin').length;
         if (adminCount <=1) {
            return { success: false, error: "Cannot delete the last administrator." };
         }
    }

    const updatedUsers = managedUsers.filter(u => u.id !== userId);
    setManagedUsers(updatedUsers);
    localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return { success: true };
  };

  const updateManagedUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    const userToUpdate = managedUsers.find(u => u.id === userId);
    if (!userToUpdate) {
        return { success: false, error: "User not found."};
    }

    // Prevent changing the role of the last admin to non-admin
    if (userToUpdate.role === 'admin' && newRole !== 'admin') {
        const adminCount = managedUsers.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
            return { success: false, error: "Cannot change the role of the last administrator."};
        }
    }
    
    const updatedUsers = managedUsers.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
    );
    setManagedUsers(updatedUsers);
    localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return { success: true };
  };


  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, login, logout, managedUsers, addManagedUser, deleteManagedUser, updateManagedUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};