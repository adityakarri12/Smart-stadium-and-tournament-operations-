/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  clearStoredSession,
  readStoredProfile,
  readStoredSession,
  writeStoredProfile,
  writeStoredSession,
} from '../utils/sessionStorage';

export interface UserProfile {
  name: string;
  preferredLanguage: 'en' | 'es' | 'fr';
  accessibilityPreference: 'none' | 'step-free' | 'visual-assistance';
  ticketSection: string;
  seatNumber: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  userProfile: UserProfile;
  updateUserProfile: (profile: UserProfile) => void;
}

const defaultProfile: UserProfile = {
  name: 'Alex Johnson',
  preferredLanguage: 'en',
  accessibilityPreference: 'none',
  ticketSection: 'North Stand',
  seatNumber: 'A-12',
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);

  // Initialize from storage on mount
  useEffect(() => {
    const storedSession = readStoredSession();
    if (storedSession) {
      setIsAuthenticated(true);
    }

    setUserProfile(readStoredProfile(defaultProfile));

    const timer = window.setTimeout(() => setIsLoading(false), 300);

    return () => window.clearTimeout(timer);
  }, []);

  const login = async (code: string): Promise<boolean> => {
    // Simulate network delay and validation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple mock validation: accept any code length >= 4
        if (code.length >= 4) {
          writeStoredSession('valid_session', SESSION_TTL_MS);
          setIsAuthenticated(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
  };

  const updateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    writeStoredProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      isLoading,
      userProfile,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
