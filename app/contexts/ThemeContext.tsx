// app/contexts/ThemeContext.tsx - VERSÃO CORRIGIDA COM SUPABASE
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // 🆕 IMPORT CRÍTICO QUE FALTAVA
import { 
  getAllThemes, 
  getActiveTheme, 
  saveTheme, 
  activateTheme,
  getThemeById 
} from '@/app/lib/themeService';
import { ThemeConfig } from '@/app/types';

interface ThemeContextType {
  // ✅ SISTEMA EXISTENTE
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // 🆕 SISTEMA COM SUPABASE
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

// 🆕 TEMA PADRÃO DE EMERGÊNCIA
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentThemeConfig, setCurrentThemeConfig] = useState<ThemeConfig | null>(null);
  const [allThemes, setAllThemes] = useState<ThemeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // ✅ EFFECT EXISTENTE (dark/light) - mantido igual
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

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
      
      // 🆕 CORREÇÃO: MIGRAÇÃO APENAS PARA ADMIN (não clientes)
      if (!hasInitialized && typeof window !== 'undefined') {
        // Verifica se estamos no contexto do admin (tem localStorage com temas)
        const hasLocalThemes = localStorage.getItem('videra-themes');
        if (hasLocalThemes && hasLocalThemes !== '[]') {
          await migrateLocalStorageToSupabase(themes);
        }
        setHasInitialized(true);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar temas do Supabase:', error);
      
      // 🆕 CORREÇÃO CRÍTICA: NÃO USA LOCALSTORAGE PARA CLIENTES!
      // Apenas tema de emergência
      if (allThemes.length === 0) {
        setAllThemes([EMERGENCY_THEME]);
        setCurrentThemeConfig(EMERGENCY_THEME);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialized, allThemes.length]);

  // 🆕 FUNÇÃO DE MIGRAÇÃO (apenas para admin, executa uma vez)
  const migrateLocalStorageToSupabase = async (existingThemes: ThemeConfig[]) => {
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
      
      // Migrar cada tema que não existe no Supabase
      for (const localTheme of localStorageThemes) {
        const exists = existingThemes.some(t => t.id === localTheme.id);
        if (!exists && localTheme.id !== 'default') {
          console.log(`🔄 Migrando tema "${localTheme.name}" para Supabase...`);
          const success = await saveTheme(localTheme);
          if (success) migratedCount++;
        }
      }
      
      // Limpar localStorage após migração bem-sucedida
      if (migratedCount > 0) {
        localStorage.removeItem('videra-themes');
        localStorage.removeItem('videra-current-theme');
        console.log(`✅ ${migratedCount} temas migrados com sucesso!`);
      } else {
        console.log('ℹ️  Nenhum tema novo para migrar');
      }
      
    } catch (error) {
      console.error('❌ Erro na migração:', error);
    }
  };

  // 🆕 CARREGAR TEMAS NA INICIALIZAÇÃO
  useEffect(() => {
    loadThemesFromSupabase();
  }, [loadThemesFromSupabase]);

  // ✅ FUNÇÃO EXISTENTE (dark/light)
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 🆕 FUNÇÕES ATUALIZADAS PARA SUPABASE
  const activateSeasonalTheme = async (themeId: string) => {
    try {
      console.log(`🎯 Ativando tema ${themeId}...`);
      
      const success = await activateTheme(themeId);
      if (success) {
        const theme = await getThemeById(themeId);
        if (theme) {
          setCurrentThemeConfig(theme);
          
          // Atualizar lista de temas
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
      alert(`Erro ao ativar tema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const deactivateSeasonalTheme = async () => {
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
    await loadThemesFromSupabase();
  };

  const updateThemeConfig = async (themeId: string, updatedTheme: ThemeConfig) => {
    try {
      console.log(`💾 Atualizando tema "${updatedTheme.name}"...`);
      
      const success = await saveTheme(updatedTheme);
      if (success) {
        // Atualizar estado local
        const updatedThemes = allThemes.map(t => 
          t.id === themeId ? { ...updatedTheme, isActive: t.isActive } : t
        );
        
        setAllThemes(updatedThemes);
        
        // Se é o tema ativo, atualizar também
        if (currentThemeConfig?.id === themeId) {
          setCurrentThemeConfig(updatedTheme);
        }
        
        console.log(`✅ Tema "${updatedTheme.name}" atualizado!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao atualizar tema ${themeId}:`, error);
      alert(`Erro ao salvar tema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  };

  const createNewTheme = async (baseThemeId: string = 'default', themeName?: string): Promise<ThemeConfig> => {
    try {
      const baseTheme = allThemes.find(t => t.id === baseThemeId) || allThemes[0];
      
      // Gerar ID único
      const newId = `theme-${Date.now()}`;
      const newThemeName = themeName?.trim() || `${baseTheme.name} (Cópia)`;
      
      // Criar novo tema
      const newTheme: ThemeConfig = {
        ...JSON.parse(JSON.stringify(baseTheme)),
        id: newId,
        name: newThemeName,
        description: `Tema personalizado: ${newThemeName}`,
        isActive: false,
        priority: allThemes.length + 1
      };
      
      // Salvar no Supabase
      const success = await saveTheme(newTheme);
      if (success) {
        // Atualizar estado local
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
    // 🛡️ IMPEDIR EXCLUSÃO DO TEMA PADRÃO
    if (themeId === 'default') {
      alert('❌ Não é possível excluir o tema padrão!');
      return;
    }

    // 🛡️ IMPEDIR EXCLUSÃO DO TEMA ATIVO
    const themeToDelete = allThemes.find(t => t.id === themeId);
    if (themeToDelete?.isActive) {
      alert('❌ Não é possível excluir o tema ativo! Desative o tema primeiro.');
      return;
    }

    try {
      console.log(`🗑️ Excluindo tema "${themeToDelete?.name}"...`);
      
      // 🆕 CORREÇÃO: Usando supabase importado corretamente
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      // Atualizar estado local
      const updatedThemes = allThemes.filter(t => t.id !== themeId);
      setAllThemes(updatedThemes);
      
      console.log(`✅ Tema "${themeToDelete?.name}" excluído do Supabase!`);
      
      // 🆕 CORREÇÃO: Remover das páginas se estiver sendo usado
      try {
        const { data: pageThemes } = await supabase
          .from('page_themes')
          .select('page_path')
          .eq('theme_id', themeId);
        
        if (pageThemes && pageThemes.length > 0) {
          console.log(`🔄 Removendo tema das ${pageThemes.length} páginas...`);
          await supabase
            .from('page_themes')
            .delete()
            .eq('theme_id', themeId);
        }
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