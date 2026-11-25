"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { DEMO_USERS, ROLE_ROUTES } from "../../src/lib/demo-user";

const AuthContext = createContext(null);

const STORAGE_KEY = "cleancity_demo_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore existing demo session
  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      try {
        const savedSession = localStorage.getItem(STORAGE_KEY);

        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);

          const validUser = DEMO_USERS.find(
            (item) =>
              item.id === parsedUser.id && item.role === parsedUser.role,
          );

          if (validUser) {
            const { password, ...safeUser } = validUser;
            if (active) setUser(safeUser);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) setReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const login = (email, password) => {
    const account = DEMO_USERS.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password,
    );

    if (!account) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const { password: ignoredPassword, ...safeUser } = account;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));

    setUser(safeUser);

    return {
      success: true,
      user: safeUser,
      redirect: ROLE_ROUTES[safeUser.role],
    };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
