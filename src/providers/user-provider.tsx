'use client';

import { createContext, useContext } from 'react';

import type { User } from '@/types/user';

const UserContext = createContext<User | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
  value: User;
}

export function UserProvider({ children, value }: UserProviderProps) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): User {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
