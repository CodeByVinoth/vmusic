import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './axiosInstance';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const response = await api.post('/admin/login', {
        username,
        password
      });
      const { token } = response.data;
      setToken(token);
      localStorage.setItem('token', token);
      setUser({ username });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      setError(message);
      return { 
        success: false, 
        message
      };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    if (token) {
      // In a real app, we might verify the token with the server here
      setUser({ username: 'admin' }); // Mock user info from token
    }
    setIsLoading(false);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
