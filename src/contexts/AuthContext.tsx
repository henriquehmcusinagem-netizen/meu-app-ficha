import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthorizedUser: (email: string) => Promise<boolean>;
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

  const isAuthorizedUser = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 Verificando autorização para email:', email);
      
      const { data, error } = await supabase.rpc('is_user_authorized', {
        user_phone: null,
        user_email: email
      });
      
      console.log('📊 Resposta da função RPC:', { data, error });
      
      if (error) {
        console.error('❌ Erro ao verificar autorização:', error);
        return false;
      }
      
      const isAuthorized = data || false;
      console.log('✅ Usuário autorizado:', isAuthorized);
      
      return isAuthorized;
    } catch (error) {
      console.error('❌ Erro inesperado ao verificar autorização:', error);
      return false;
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    console.log('🔐 Iniciando processo de login para:', email);
    
    try {
      // Verificar se email está autorizado
      console.log('📋 Verificando autorização do usuário...');
      const authorized = await isAuthorizedUser(email);
      console.log('✅ Resultado da autorização:', authorized);
      
      if (!authorized) {
        console.log('❌ Email não autorizado:', email);
        return { error: { message: 'Email não autorizado para acesso ao sistema' } };
      }

      console.log('🔑 Tentando fazer login com Supabase Auth...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Erro no login:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          status: error.status,
          statusText: error.name
        });
      } else {
        console.log('✅ Login realizado com sucesso!');
      }
      
      return { error };
    } catch (err) {
      console.error('❌ Erro inesperado no login:', err);
      return { error: { message: 'Erro interno no processo de login' } };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    // Verificar se email está autorizado
    const authorized = await isAuthorizedUser(email);
    if (!authorized) {
      return { error: { message: 'Email não autorizado para acesso ao sistema' } };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
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
    signInWithPassword,
    signUpWithPassword,
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