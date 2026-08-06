import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { can as permCan, isAdmin as permIsAdmin, hasRole, getUserRoles } from '../services/permissionService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  };

  const signup = async (name, email, password) => {
    const user = await authService.signup(name, email, password);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    const updatedUser = await authService.updateProfile(currentUser.id, updates);
    setCurrentUser(updatedUser);
  };

  // Convenience: check a permission for the current user
  const can = (permission) => permCan(currentUser, permission);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    updateProfile,
    can,
    isAdmin: permIsAdmin(currentUser),
    hasRole: (role) => hasRole(currentUser, role),
    getUserRoles: () => getUserRoles(currentUser),
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
