// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'patient' | 'caregiver' | null;

export interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => void;
  signUp: (name: string, email: string, password: string) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);

  const signIn = (email: string, _password: string) => {
    // Mock auth — any credentials work
    setUser({ name: 'Mary', email });
  };

  const signUp = (name: string, email: string, _password: string) => {
    setUser({ name, email });
  };

  const signOut = () => {
    setUser(null);
    setRoleState(null);
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn: user !== null,
        signIn,
        signUp,
        signOut,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}