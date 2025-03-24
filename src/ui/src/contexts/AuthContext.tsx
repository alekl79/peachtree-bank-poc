import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSessionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearSessionTimeout();
    await signOut(auth);
  }, [clearSessionTimeout]);

  const setNewSessionTimeout = useCallback(() => {
    clearSessionTimeout();
    timeoutRef.current = setTimeout(() => {
      logout();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
  }, [clearSessionTimeout, logout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        setNewSessionTimeout();
      } else {
        clearSessionTimeout();
      }
    });

    return () => {
      unsubscribe();
      clearSessionTimeout();
    };
  }, [clearSessionTimeout, setNewSessionTimeout]);

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    setNewSessionTimeout();
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setNewSessionTimeout();
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 