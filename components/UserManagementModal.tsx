import React, { useState, FormEvent } from 'react';
import { ManagedUser, UserRole, AuthUser } from '../types';
import { XMarkIcon, UsersIcon, TrashIcon, PencilIcon, CheckCircleSolidIcon, XCircleSolidIcon } from './icons/DashboardIcons';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: ManagedUser[];
  onAddUser: (newUser: Omit<ManagedUser, 'id'>) => Promise<{ success: boolean; error?: string }>;
  onDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  currentUserEmail: string; 
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen, onClose, users, onAddUser, onDeleteUser, onUpdateUserRole, currentUserEmail
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
        setError("All fields (Name, Email, Password) are required.");
        setIsLoading(false);
        return;
    }
    if (password.length < 4) {
        setError("Password must be at least 4 characters long.");
        setIsLoading(false);
        return;
    }

    const result = await onAddUser({ name, email, passwordPlain: password, role });
    if (result.success) {
      setSuccessMessage('User added successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('viewer');
    } else {
      setError(result.error || 'Failed to add user.');
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUserEmail) {
        alert("You cannot delete your own account.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      setError(null);
      setSuccessMessage(null);
      const result = await onDeleteUser(userId);
      if (result.success) {
        setSuccessMessage('User deleted successfully!');
      } else {
        setError(result.error || 'Failed to delete user.');
        alert(`Error: ${result.error || 'Failed to delete user.'}`); 
      }
    }
  };

  const handleEditRole = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setEditingRole(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    if (!editingRole) return;
    setError(null);
    setSuccessMessage(null);
    const result = await onUpdateUserRole(userId, editingRole);
    if (result.success) {
        setSuccessMessage(`User role updated successfully!`);
    } else {
        setError(result.error || 'Failed to update user role.');
        alert(`Error: ${result.error || 'Failed to update role.'}`);
    }
    setEditingUserId(null);
    setEditingRole(null);
  };

  if (!isOpen) return null;
  
  const inputBaseClass = "mt-1 block w-full px-3 py-2 bg-neutral-700 border border-neutral-600 text-neutral-100 rounded-md shadow-sm focus:ring-primary focus:border-primary placeholder-neutral-400 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[110]" onClick={onClose}>
      <div 
        className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeIn"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-primary flex items-center">
            <UsersIcon className="w-6 h-6 mr-2" /> User Management
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100" aria-label="Close user management">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          {error && <div className="p-3 bg-danger/20 text-red-300 border border-danger/30 rounded-md text-sm flex items-center"><XCircleSolidIcon className="w-5 h-5 mr-2"/>{error}</div>}
          {successMessage && <div className="p-3 bg-success/20 text-green-300 border border-success/30 rounded-md text-sm flex items-center"><CheckCircleSolidIcon className="w-5 h-5 mr-2"/>{successMessage}</div>}

          <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Add New User</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-neutral-300">Full Name</label>
                  <input type="text" id="userName" value={name} onChange={e => setName(e.target.value)} required
                         className={inputBaseClass}/>
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-neutral-300">Email</label>
                  <input type="email" id="userEmail" value={email} onChange={e => setEmail(e.target.value)} required
                         className={inputBaseClass}/>
                </div>
                <div>
                  <label htmlFor="userPassword" className="block text-sm font-medium text-neutral-300">Password</label>
                  <input type="password" id="userPassword" value={password} onChange={e => setPassword(e.target.value)} required minLength={4}
                         className={inputBaseClass}/>
                </div>
                <div>
                  <label htmlFor="userRole" className="block text-sm font-medium text-neutral-300">Role</label>
                  <select id="userRole" value={role} onChange={e => setRole(e.target.value as UserRole)}
                          className={`${inputBaseClass} appearance-none`}>
                    <option value="viewer" className="bg-neutral-700 text-neutral-100">Viewer</option>
                    <option value="admin" className="bg-neutral-700 text-neutral-100">Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                      className="w-full px-4 py-2 bg-primary text-neutral-900 font-semibold rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-primary disabled:opacity-70 flex items-center justify-center">
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900 mr-2"></div>}
                Add User
              </button>
            </form>
          </section>

          <section className="border-t border-neutral-700 pt-4">
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Existing Users ({users.length})</h3>
            <div className="max-h-60 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-neutral-400">No users found.</p>
              ) : (
                <table className="min-w-full divide-y divide-neutral-700">
                  <thead className="bg-neutral-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-800 divide-y divide-neutral-700">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-100">{user.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-300">{user.email}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-300">
                           {editingUserId === user.id ? (
                                <select 
                                    value={editingRole || user.role} 
                                    onChange={(e) => setEditingRole(e.target.value as UserRole)}
                                    className={`${inputBaseClass} py-1 text-xs appearance-none w-auto`}
                                >
                                    <option value="viewer" className="bg-neutral-700 text-neutral-100">Viewer</option>
                                    <option value="admin" className="bg-neutral-700 text-neutral-100">Admin</option>
                                </select>
                           ) : (
                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-primary text-neutral-900' : 'bg-neutral-600 text-neutral-200'}`}>
                                {user.role}
                                </span>
                           )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2">
                           {editingUserId === user.id ? (
                                <button onClick={() => handleSaveRole(user.id)} className="text-green-400 hover:text-green-300" title="Save Role">
                                    <CheckCircleSolidIcon className="w-5 h-5"/>
                                </button>
                           ) : (
                                <button onClick={() => handleEditRole(user)} className="text-primary-light hover:text-primary" title="Edit Role">
                                    <PencilIcon className="w-4 h-4"/>
                                </button>
                           )}
                          <button onClick={() => handleDeleteUser(user.id, user.email)}
                                  disabled={user.email === currentUserEmail || (user.email === 'bon@gmail.com' && user.role === 'admin')} 
                                  className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete User">
                            <TrashIcon className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>

        <footer className="p-4 border-t border-neutral-700 text-right sticky bottom-0 bg-neutral-800">
          <button onClick={onClose}
                  className="px-4 py-2 bg-neutral-600 text-neutral-100 rounded-md hover:bg-neutral-500 transition-colors">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UserManagementModal;