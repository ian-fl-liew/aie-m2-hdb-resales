import { createContext, useState, useCallback } from "react";
import { usersApi } from "../services/listingsApi";

// ---------------------------------------------------------------------------
// MOCK AUTHENTICATION — not real security.
//
// Passwords are stored in plain text in db.json and checked in the browser.
// A real app hashes passwords on a server and issues a signed token. We are
// building a front-end module, so this stands in for the flow without the
// backend. Be ready to say exactly this if you are asked about it.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "hdb-resale-marketplace.user";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

/**
 * Read the saved session. Runs once, as a lazy useState initializer rather
 * than in an effect: localStorage is synchronous, so the user is available on
 * the very first render and ProtectedRoute never flashes the login page during
 * a refresh. (Restoring it in an effect would also trip React's
 * set-state-in-effect rule, and for good reason — it causes a cascading
 * second render on every page load.)
 */
function readStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    // Corrupt or blocked storage — start signed out rather than crashing.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/** Strip the password before a user object goes into state or localStorage. */
function withoutPassword(user) {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persist = (userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const login = useCallback(async (email, password) => {
    const match = await usersApi.findByEmail(email);

    if (!match || match.password !== password) {
      throw new Error("Incorrect email or password.");
    }

    // Never hold the password in app state.
    const safeUser = withoutPassword(match);
    persist(safeUser);
    return safeUser;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    const existing = await usersApi.findByEmail(email);
    if (existing) {
      throw new Error("An account with that email already exists.");
    }

    const created = await usersApi.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "buyer",
      createdAt: new Date().toISOString().slice(0, 10),
    });

    const safeUser = withoutPassword(created);
    persist(safeUser);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback((role) => user?.role === role, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
