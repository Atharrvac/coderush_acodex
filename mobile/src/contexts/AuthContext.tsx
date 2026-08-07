/**
 * Authentication Context - GovTech CRM
 * Role-based authentication with citizen, officer, department_head, admin roles
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase } from '../config/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: 'citizen' | 'officer' }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
  canAccessDepartment: (departmentId: string) => boolean;
  isCitizen: () => boolean;
  isOfficer: () => boolean;
  isDepartmentHead: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          officers (
            id,
            department_id,
            designation,
            is_available
          )
        `)
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet - get email from auth and create basic profile
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
          
          // Try to create the profile
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: authUser.email!,
              name,
              phone: authUser.user_metadata?.phone || null,
              role: 'citizen', // Default role
              is_active: true
            });

          if (!insertError || insertError.message.includes('duplicate')) {
            // Profile created or already exists, fetch it
            const { data: newData } = await supabase
              .from('users')
              .select(`
                *,
                officers (
                  id,
                  department_id,
                  designation,
                  is_available
                )
              `)
              .eq('id', userId)
              .single();
            
            if (newData) {
              setUser({
                id: newData.id,
                email: newData.email,
                name: newData.name,
                phone: newData.phone,
                avatar_url: newData.avatar_url,
                role: newData.role || 'citizen',
                department_id: newData.department_id,
                employee_id: newData.employee_id,
                problems_posted: newData.problems_posted || 0,
                problems_solved: newData.problems_solved || 0,
                is_active: newData.is_active,
                created_at: newData.created_at,
                officers: newData.officers
              });
            }
          }
        }
        return;
      }

      if (data && !error) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: data.role || 'citizen',
          department_id: data.department_id,
          employee_id: data.employee_id,
          problems_posted: data.problems_posted || 0,
          problems_solved: data.problems_solved || 0,
          is_active: data.is_active,
          created_at: data.created_at,
          officers: data.officers
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string; role?: 'citizen' | 'officer' }) => {
    const { email, password, name, phone, role = 'citizen' } = data;

    // Sign up with Supabase Auth
    // The database trigger will automatically create the user profile
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: undefined, // Disable email confirmation redirect
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Registration failed');
    }

    // Check if email confirmation is required
    if (authData.session === null) {
      // Email confirmation is enabled - inform user
      throw new Error('Please check your email to confirm your account. If you don\'t see the email, check your spam folder or contact support.');
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch the created profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      // Profile doesn't exist, create it manually
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone: phone || null,
          role: role,
          is_active: true
        });
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('Profile creation error:', insertError);
      }

      // Set user state with provided data
      setUser({
        id: authData.user.id,
        email,
        name,
        phone: phone || undefined,
        role: role,
        problems_posted: 0,
        problems_solved: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    } else {
      // Profile exists, use it
      setUser({
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        problems_posted: profileData.problems_posted || 0,
        problems_solved: profileData.problems_solved || 0,
        is_active: profileData.is_active,
        created_at: profileData.created_at,
      });
    }

    router.replace('/(tabs)');
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const { email, password } = credentials;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Login failed');
    }

    // Fetch user profile
    await fetchUserProfile(authData.user.id);

    router.replace('/(tabs)');
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/login');
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user?.id) return;

    const { data: updatedData, error } = await supabase
      .from('users')
      .update({
        name: data.name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (updatedData) {
      setUser(prev => prev ? { ...prev, ...updatedData } : null);
    }
  }, [user?.id]);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    await fetchUserProfile(user.id);
  }, [user?.id]);

  // Role-based helper functions
  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role || 'citizen');
  }, [user]);

  const canAccessDepartment = useCallback((departmentId: string) => {
    if (!user) return false;
    
    // Admin can access everything
    if (user.role === 'admin') return true;
    
    // Department head and officers can access their department
    if ((user.role === 'department_head' || user.role === 'officer') && user.department_id === departmentId) {
      return true;
    }
    
    return false;
  }, [user]);

  const isCitizen = useCallback(() => {
    return user?.role === 'citizen' || !user?.role;
  }, [user]);

  const isOfficer = useCallback(() => {
    return user?.role === 'officer';
  }, [user]);

  const isDepartmentHead = useCallback(() => {
    return user?.role === 'department_head';
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        hasRole,
        canAccessDepartment,
        isCitizen,
        isOfficer,
        isDepartmentHead,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
