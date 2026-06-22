import React, { createContext, useState, ReactNode } from 'react';
import type { User } from '../types';
import { useApp } from '../hooks/useApp';

interface AuthContextType {
  user: User | null;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { state } = useApp(); // Get dynamic state from AppContext

  const login = (id: string, pass: string): boolean => {
    // Use the up-to-date user list from the global state
    // Convert user ID from sheet (which might be a number) to a string for comparison.
    const foundUser = state.users.find(u => String(u.id) === id); 
    
    if (foundUser) {
        // Convert password from sheet (which might be a number) to a string for comparison.
        const storedPassword = String(foundUser.password);
        if (storedPassword === pass) {
            setUser(foundUser);
            return true;
        }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};