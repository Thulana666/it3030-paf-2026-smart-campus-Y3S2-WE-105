import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT or fetch user details if needed. 
      // For this app we simply rely on the token presence as isAuthenticated.
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    setUser({ token });
  };

  const register = async (name, email, password, role = 'USER') => {
    // Simply await the registration, do not auto-login
    await api.post('/auth/register', { name, email, password, role });
  };

  const loginWithGoogle = async (credentialToken) => {
    const response = await api.post('/auth/google', { token: credentialToken });
    const { token } = response.data;
    localStorage.setItem('token', token);
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
