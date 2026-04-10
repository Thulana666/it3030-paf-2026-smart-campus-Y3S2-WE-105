import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure token parsing dynamically maps onto the state during hard refreshes
  const syncAuthState = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      try {
        const decoded = jwtDecode(token);
        setUser({ token, role: decoded.role, email: decoded.sub });
        
        // Asynchronously fetch and inject the full user object (including pictures) 
        // to naturally enrich the UI across the whole context tree.
        api.get('/auth/me')
          .then(res => {
            setUser(prev => prev ? { ...prev, ...res.data } : null);
          })
          .catch(err => console.error("Failed to hydrate session profile:", err));

      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    syncAuthState(token);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    syncAuthState(token);
  };

  const register = async (name, email, password, role = 'USER') => {
    // Simply await the registration, do not auto-login
    await api.post('/auth/register', { name, email, password, role });
  };

  const loginWithGoogle = async (credentialToken) => {
    const response = await api.post('/auth/google', { token: credentialToken });
    const { token } = response.data;
    syncAuthState(token);
  };

  const logout = () => {
    syncAuthState(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
