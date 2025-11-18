import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isTwoFactorEnabled?: boolean;
  birthDate?: string | Date;
  cpf?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, cpf?: string, birthDate?: string) => Promise<void>;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
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
        const token = localStorage.getItem('token');

        if (savedUser && token) {
          // Primeiro, restaurar usuário do localStorage imediatamente (sem esperar servidor)
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setLoading(false); // Marcar como carregado imediatamente
          } catch (e) {
            console.error('Error parsing saved user:', e);
            setLoading(false);
            return;
          }

          // Depois, verificar token em background (não bloquear se falhar)
          // Isso é apenas para sincronizar dados, não para autenticar
          authAPI.getCurrentUser()
            .then((response) => {
              // Se a verificação for bem-sucedida, atualizar com dados do servidor
              setUser(response.user);
              localStorage.setItem('user', JSON.stringify(response.user));
            })
            .catch((error: any) => {
              // Só limpar se for erro 401 (não autorizado) - token realmente inválido
              if (error.response?.status === 401) {
                console.warn('Token inválido detectado, fazendo logout');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
              } else {
                // Erro de rede, timeout, ou outro erro - manter usuário logado
                // Não fazer nada, apenas logar o erro
                if (error.response?.status !== 401) {
                  console.warn('Erro ao verificar token (mantendo usuário logado):', error.message);
                }
              }
            });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error || 'Erro ao fazer login';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const register = async (name: string, email: string, password: string, cpf?: string, birthDate?: string) => {
    try {
      const response = await authAPI.register(name, email, password, cpf, birthDate);
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error || 'Erro ao criar conta';
      throw new Error(errorMessage);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      // Se for erro 401, fazer logout
      if (error.response?.status === 401) {
        logout();
      } else {
        console.error('Error refreshing user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        updateUser,
        refreshUser,
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
