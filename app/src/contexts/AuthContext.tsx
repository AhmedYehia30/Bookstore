import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  address: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading } = trpc.customAuth.me.useQuery(undefined, {
    enabled: !!authToken,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data as User);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [data, isLoading]);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem("auth_token", token);
    setAuthToken(token);
    setUser(userData);
    window.location.reload();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setAuthToken(null);
    setUser(null);
    window.location.reload();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
