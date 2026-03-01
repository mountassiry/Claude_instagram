/**
 * AuthContext — REPLACED by IdentityContext.
 * Kept as a no-op stub so unused legacy files don't cause import errors.
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAuth(): any {
  return {};
}
