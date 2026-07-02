"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    const getSession = async () => {
      // console.log('🔄 Verificando sessão...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        // console.log('Sessão:', session);
        // console.log('Erro sessão:', error);

        if (session?.user) {
          // console.log('✅ Usuário autenticado:', session.user.email);
          
          // VERIFICAÇÃO SIMPLIFICADA - tenta buscar da tabela, mas se der erro, usa fallback
          try {
            const { data: adminUsers, error: queryError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('email', session.user.email)
              .abortSignal(controller.signal);

            // console.log('Admin users:', adminUsers);
            // console.log('Query error:', queryError);

            if (!queryError && adminUsers && adminUsers.length > 0) {
              setUser(adminUsers[0]);
              // console.log('✅ Admin user encontrado na tabela');
            } else {
              // FALLBACK: Se não encontrar na tabela, usa dados básicos do auth
              // console.log('⚠️  Usando fallback - dados do auth');
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: 'Administrador',
                role: 'admin'
              });
            }
          } catch (tableError) {
            // console.log('❌ Erro na tabela, usando fallback:', tableError);
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: 'Administrador',
              role: 'admin'
            });
          }
        } else {
          // console.log('❌ Nenhuma sessão ativa');
          setUser(null);
        }
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          // console.log('💥 Erro geral no auth:', error);
        }
        setUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 Auth state changed:', event);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: 'Administrador',
            role: 'admin'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      controller.abort();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // console.log('🔐 Tentando login:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // console.log('Resposta login:', { data, error });

      if (error) {
        // console.log('❌ Erro no login:', error.message);
        return { error };
      }

      if (data.user) {
        // console.log('✅ Login auth sucesso!');
        // Login bem sucedido - redireciona para admin
        router.push('/admin');
        return { error: null };
      }
      
      return { error: new Error('Erro desconhecido') };
    } catch (error) {
      // console.log('💥 Erro no login:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // console.log('🚪 Fazendo logout');
    await supabase.auth.signOut();
    setUser(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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