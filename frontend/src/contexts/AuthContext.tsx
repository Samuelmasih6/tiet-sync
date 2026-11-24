import { createContext, useContext, useState, ReactNode } from 'react';
import { post } from '../services/api';

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'FACULTY';
  rollNumber?: string;
  branch?: string;
  department?: string;
  cabinLocation?: string;
};

const C = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    JSON.parse(localStorage.getItem('tiet-user') || 'null')
  );

  const login = async (email: string, password: string) => {
    const x = await post('/auth/login', { email, password });
    localStorage.setItem('tiet-token', x.token);
    localStorage.setItem('tiet-user', JSON.stringify(x.user));
    setUser(x.user);
    return x.user;
  };

  const logout = () => {
    localStorage.removeItem('tiet-token');
    localStorage.removeItem('tiet-user');
    setUser(null);
  };

  return (
    <C.Provider value={{ user, login, logout, setUser }}>{children}</C.Provider>
  );
}

export const useAuth = () => useContext(C);
