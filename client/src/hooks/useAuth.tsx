"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { UserResponse, LoginRequest, UserRegistrationRequest, AuthResponse } from '../types/user';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (userData: UserRegistrationRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      console.group('🔐 Initializing Authentication');
      try {
        console.log('📋 Checking existing auth status...');
        const isValid = await authService.checkAuthStatus();
        console.log('🔍 Auth status check result:', isValid);
        
        if (isValid) {
          console.log('✅ Token is valid, fetching user profile...');
          // Fetch user profile
          const userResponse = await userService.getUserProfile();
          if (userResponse.data) {
            console.log('👤 User profile fetched successfully:', userResponse.data);
            setUser(userResponse.data);
            setIsAuthenticated(true);
          } else {
            console.warn('⚠️ Token exists but user fetch failed:', userResponse.error);
            // Token exists but user fetch failed, clear auth
            authService.logout();
            setIsAuthenticated(false);
          }
        } else {
          console.log('❌ No valid token found or token expired');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log('🏁 Auth initialization complete');
        console.groupEnd();
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    console.group('🔑 User Login Attempt');
    console.log('📧 Email:', credentials.email);
    console.log('🔐 Password length:', credentials.password.length);
    
    try {
      setIsLoading(true);
      console.log('📡 Sending login request...');
      
      const response = await authService.login(credentials);
      console.log('📥 Login response received:', {
        hasData: !!response.data,
        hasError: !!response.error,
        status: response.status
      });
      
      if (response.data) {
        console.log('✅ Login successful!');
        console.log('👤 User data:', response.data.user);
        console.log('🎫 Token received:', response.data.token ? 'Yes' : 'No');
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.groupEnd();
        return { success: true };
      } else {
        const errorMsg = response.error?.error || 'Login failed';
        console.error('❌ Login failed:', {
          error: errorMsg,
          details: response.error?.details,
          status: response.status
        });
        console.groupEnd();
        return { 
          success: false, 
          error: errorMsg
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      console.error('💥 Login exception:', error);
      console.groupEnd();
      return { 
        success: false, 
        error: errorMsg
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationRequest): Promise<{ success: boolean; error?: string }> => {
    console.group('📝 User Registration Attempt');
    console.log('📋 Registration data:', {
      username: userData.username,
      email: userData.email,
      passwordLength: userData.password.length,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      heightCm: userData.heightCm,
      weightKg: userData.weightKg
    });
    
    try {
      setIsLoading(true);
      console.log('📡 Sending registration request...');
      
      const response = await authService.register(userData);
      console.log('📥 Registration response received:', {
        hasData: !!response.data,
        hasError: !!response.error,
        status: response.status,
        errorDetails: response.error
      });
      
      if (response.data) {
        console.log('🎉 Registration successful!');
        console.log('👤 User data:', response.data.user);
        console.log('🎫 Token received:', response.data.token ? 'Yes' : 'No');
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.groupEnd();
        return { success: true };
      } else {
        const errorMsg = response.error?.error || 'Registration failed';
        console.error('❌ Registration failed:', {
          error: errorMsg,
          details: response.error?.details,
          status: response.status,
          fullError: response.error
        });
        
        // Enhanced error messaging based on status code
        let detailedError = errorMsg;
        if (response.status === 403) {
          detailedError = `${errorMsg} - This appears to be a CORS (Cross-Origin) issue. The server may not be configured to accept requests from this origin.`;
        } else if (response.status === 400) {
          detailedError = `${errorMsg} - Please check that all required fields are filled correctly.`;
        } else if (response.status === 409) {
          detailedError = `${errorMsg} - A user with this email or username may already exist.`;
        } else if (response.status === 0) {
          detailedError = `${errorMsg} - Network error. Please check if the backend server is running and accessible.`;
        }
        
        console.groupEnd();
        return { 
          success: false, 
          error: detailedError
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed';
      console.error('💥 Registration exception:', error);
      console.groupEnd();
      return { 
        success: false, 
        error: `Unexpected error: ${errorMsg}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 User logging out');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    try {
      const response = await userService.getUserProfile();
      if (response.data) {
        console.log('✅ User data refreshed:', response.data);
        setUser(response.data);
      } else {
        console.error('❌ Failed to refresh user:', response.error);
      }
    } catch (error) {
      console.error('💥 Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 