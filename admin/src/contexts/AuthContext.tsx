// AuthContext para Admin Panel
// Versão 2.0 - Separado do site principal

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');

        if (savedUser && token) {
          // Verify token is valid and user is admin
          try {
            const response = await authAPI.getCurrentUser();
            if (response.user && response.user.isAdmin) {
              setUser(response.user);
            } else {
              // Not admin, clear storage
              authAPI.logout();
            }
          } catch (error) {
            // Token invalid, clear storage
            authAPI.logout();
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.user && response.user.isAdmin) {
        setUser(response.user);
      } else {
        throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error || 'Erro ao fazer login';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    authAPI.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: user !== null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


