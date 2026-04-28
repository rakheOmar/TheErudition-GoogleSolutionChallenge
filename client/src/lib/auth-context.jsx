import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, signIn as firebaseSignIn, signUp as firebaseSignUp, logOut } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    return firebaseSignIn(email, password);
  };

  const signUp = async (email, password, displayName) => {
    return firebaseSignUp(email, password, displayName);
  };

  const logout = async () => {
    return logOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}