import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthorizedUser: (phone?: string, email?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthorizedUser = async (phone?: string, email?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_user_authorized', {
        user_phone: phone || null,
        user_email: email || null
      });
      
      if (error) {
        console.error('Erro ao verificar autorização:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Erro ao verificar autorização:', error);
      return false;
    }
  };

  const signInWithPhone = async (phone: string) => {
    // Verificar se telefone está autorizado
    const authorized = await isAuthorizedUser(phone);
    if (!authorized) {
      return { error: { message: 'Telefone não autorizado para acesso ao sistema' } };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms'
      }
    });
    
    return { error };
  };

  const signInWithEmail = async (email: string) => {
    // Verificar se email está autorizado
    const authorized = await isAuthorizedUser(undefined, email);
    if (!authorized) {
      return { error: { message: 'Email não autorizado para acesso ao sistema' } };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    return { error };
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithPhone,
    signInWithEmail,
    verifyOtp,
    verifyEmailOtp,
    signOut,
    isAuthorizedUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}