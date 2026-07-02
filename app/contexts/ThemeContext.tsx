// app/contexts/ThemeContext.tsx - VERSÃO CORRIGIDA (FORÇA TEMA CLARO PARA CLIENTES)
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation'; // 🆕 PARA DETECTAR ROTA
import { supabase } from '@/lib/supabaseClient';
import { 
  getAllThemes, 
  getActiveTheme, 
  saveTheme, 
  activateTheme,
  getThemeById 
} from '@/app/lib/themeService';
import { ThemeConfig } from '@/app/types';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentThemeConfig: ThemeConfig | null;
  allThemes: ThemeConfig[];
  isLoading: boolean;
  activateSeasonalTheme: (themeId: string) => Promise<void>;
  deactivateSeasonalTheme: () => Promise<void>;
  refreshThemes: () => Promise<void>;
  updateThemeConfig: (themeId: string, updatedTheme: ThemeConfig) => Promise<boolean>;
  createNewTheme: (baseThemeId?: string, themeName?: string) => Promise<ThemeConfig>;
  deleteTheme: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const EMERGENCY_THEME: ThemeConfig = {
  id: 'emergency',
  name: 'Tema de Emergência',
  isActive: true,
  priority: 0,
  colors: {
    primary: '#7c3aed',
    secondary: '#f1f5f9',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    cardBg: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  emojis: {
    cart: '🛒',
    success: '✅',
    search: '🔍',
    filter: '🎛️',
    stock: '📦',
    category: '📁'
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // 🆕 OBTÉM A ROTA ATUAL
  const isAdmin = pathname?.startsWith('/admin') ?? false; // 🆕 VERIFICA SE É ADMIN

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentThemeConfig, setCurrentThemeConfig] = useState<ThemeConfig | null>(null);
  const [allThemes, setAllThemes] = useState<ThemeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // ✅ EFFECT PARA TEMA (DARK/LIGHT) - AGORA CONDICIONAL
  useEffect(() => {
    if (!isAdmin) {
      // 🔥 FORÇA TEMA CLARO PARA CLIENTES (NÃO ADMIN)
      setTheme('light');
      return;
    }

    // ADMIN: carrega preferência salva ou sistema
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, [isAdmin]);

  // ✅ APLICA O ATRIBUTO data-theme NO HTML (CONDICIONAL)
  useEffect(() => {
    if (!isAdmin) {
      // Força data-theme="light" para clientes
      document.documentElement.setAttribute('data-theme', 'light');
      return;
    }

    // Admin: usa o tema atual
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme, isAdmin]);

  // 🆕 FUNÇÃO TOGGLE - SÓ FUNCIONA NO ADMIN
  const toggleTheme = () => {
    if (!isAdmin) return; // Clientes não podem trocar
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 🆕 FUNÇÃO DE MIGRAÇÃO (apenas admin)
  const migrateLocalStorageToSupabase = useCallback(async (existingThemes: ThemeConfig[]) => {
    if (!isAdmin) return;
    try {
      console.log('🔄 Verificando migração do localStorage...');
      
      const savedThemes = localStorage.getItem('videra-themes');
      if (!savedThemes || savedThemes === '[]' || savedThemes === 'null') {
        console.log('📭 Nenhum tema para migrar do localStorage');
        return;
      }

      const localStorageThemes: ThemeConfig[] = JSON.parse(savedThemes);
      console.log(`📦 ${localStorageThemes.length} temas encontrados no localStorage`);
      
      let migratedCount = 0;
      
      for (const localTheme of localStorageThemes) {
        const exists = existingThemes.some(t => t.id === localTheme.id);
        if (!exists && localTheme.id !== 'default') {
          console.log(`🔄 Migrando tema "${localTheme.name}" para Supabase...`);
          const success = await saveTheme(localTheme);
          if (success) migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        localStorage.removeItem('videra-themes');
        localStorage.removeItem('videra-current-theme');
        console.log(`✅ ${migratedCount} temas migrados com sucesso!`);
      }
    } catch (error) {
      console.error('❌ Erro na migração:', error);
    }
  }, [isAdmin]);

  // 🆕 FUNÇÃO PARA CARREGAR TEMAS DO SUPABASE (CORRIGIDA)
  const loadThemesFromSupabase = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Carregando temas do Supabase...');
      
      const themes = await getAllThemes();
      const activeTheme = await getActiveTheme();
      
      setAllThemes(themes);
      setCurrentThemeConfig(activeTheme);
      
      console.log('✅ Temas carregados:', {
        total: themes.length,
        active: activeTheme.name
      });
      
      // Migração apenas para admin (se necessário)
      if (!hasInitialized && typeof window !== 'undefined' && isAdmin) {
        const hasLocalThemes = localStorage.getItem('videra-themes');
        if (hasLocalThemes && hasLocalThemes !== '[]') {
          await migrateLocalStorageToSupabase(themes);
        }
        setHasInitialized(true);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar temas do Supabase:', error);
      // Fallback para tema de emergência em caso de falha
      setAllThemes([EMERGENCY_THEME]);
      setCurrentThemeConfig(EMERGENCY_THEME);
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialized, isAdmin, migrateLocalStorageToSupabase]);

  // CARREGAR TEMAS NA INICIALIZAÇÃO (apenas admin precisa dos temas do banco)
  useEffect(() => {
    if (isAdmin) {
      loadThemesFromSupabase();
    } else {
      // Clientes não precisam carregar temas do banco, mas definimos um tema claro padrão
      setCurrentThemeConfig(EMERGENCY_THEME);
      setAllThemes([EMERGENCY_THEME]);
      setIsLoading(false);
    }
  }, [isAdmin, loadThemesFromSupabase]);

  // FUNÇÕES ADMIN (restantes) – só fazem sentido se isAdmin for true, mas mantemos para não quebrar chamadas
  const activateSeasonalTheme = async (themeId: string) => {
    if (!isAdmin) return;
    try {
      console.log(`🎯 Ativando tema ${themeId}...`);
      const success = await activateTheme(themeId);
      if (success) {
        const theme = await getThemeById(themeId);
        if (theme) {
          setCurrentThemeConfig(theme);
          const updatedThemes = allThemes.map(t => ({
            ...t,
            isActive: t.id === themeId
          }));
          setAllThemes(updatedThemes);
          console.log(`✅ Tema "${theme.name}" ativado!`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao ativar tema ${themeId}:`, error);
    }
  };

  const deactivateSeasonalTheme = async () => {
    if (!isAdmin) return;
    try {
      console.log('🔙 Voltando para tema padrão...');
      const success = await activateTheme('default');
      if (success) {
        const defaultTheme = await getThemeById('default');
        if (defaultTheme) {
          setCurrentThemeConfig(defaultTheme);
          const updatedThemes = allThemes.map(t => ({
            ...t,
            isActive: t.id === 'default'
          }));
          setAllThemes(updatedThemes);
          console.log('✅ Tema padrão ativado!');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao desativar tema sazonal:', error);
    }
  };

  const refreshThemes = async () => {
    if (!isAdmin) return;
    await loadThemesFromSupabase();
  };

  const updateThemeConfig = async (themeId: string, updatedTheme: ThemeConfig) => {
    if (!isAdmin) return false;
    try {
      console.log(`💾 Atualizando tema "${updatedTheme.name}"...`);
      const success = await saveTheme(updatedTheme);
      if (success) {
        const updatedThemes = allThemes.map(t => 
          t.id === themeId ? { ...updatedTheme, isActive: t.isActive } : t
        );
        setAllThemes(updatedThemes);
        if (currentThemeConfig?.id === themeId) {
          setCurrentThemeConfig(updatedTheme);
        }
        console.log(`✅ Tema "${updatedTheme.name}" atualizado!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao atualizar tema ${themeId}:`, error);
      return false;
    }
  };

  const createNewTheme = async (baseThemeId: string = 'default', themeName?: string): Promise<ThemeConfig> => {
    if (!isAdmin) throw new Error('Apenas admin pode criar temas');
    try {
      const baseTheme = allThemes.find(t => t.id === baseThemeId) || allThemes[0];
      const newId = `theme-${Date.now()}`;
      const newThemeName = themeName?.trim() || `${baseTheme.name} (Cópia)`;
      const newTheme: ThemeConfig = {
        ...JSON.parse(JSON.stringify(baseTheme)),
        id: newId,
        name: newThemeName,
        description: `Tema personalizado: ${newThemeName}`,
        isActive: false,
        priority: allThemes.length + 1
      };
      const success = await saveTheme(newTheme);
      if (success) {
        const updatedThemes = [...allThemes, newTheme];
        setAllThemes(updatedThemes);
        console.log(`🎨 Novo tema criado: "${newTheme.name}"`);
        return newTheme;
      }
      throw new Error('Falha ao salvar tema no Supabase');
    } catch (error) {
      console.error('❌ Erro ao criar novo tema:', error);
      throw error;
    }
  };

  const deleteTheme = async (themeId: string) => {
    if (!isAdmin) return;
    if (themeId === 'default') {
      alert('❌ Não é possível excluir o tema padrão!');
      return;
    }
    const themeToDelete = allThemes.find(t => t.id === themeId);
    if (themeToDelete?.isActive) {
      alert('❌ Não é possível excluir o tema ativo! Desative o tema primeiro.');
      return;
    }
    try {
      console.log(`🗑️ Excluindo tema "${themeToDelete?.name}"...`);
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);
      if (error) throw new Error(error.message);
      const updatedThemes = allThemes.filter(t => t.id !== themeId);
      setAllThemes(updatedThemes);
      console.log(`✅ Tema "${themeToDelete?.name}" excluído do Supabase!`);
      try {
        await supabase.from('page_themes').delete().eq('theme_id', themeId);
      } catch (pageError) {
        console.log('⚠️  Não foi possível limpar páginas:', pageError);
      }
    } catch (error) {
      console.error('❌ Erro ao excluir tema:', error);
      alert(`❌ Erro ao excluir tema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      currentThemeConfig,
      allThemes,
      isLoading,
      activateSeasonalTheme,
      deactivateSeasonalTheme,
      refreshThemes,
      updateThemeConfig,
      createNewTheme,
      deleteTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
export { ThemeContext };