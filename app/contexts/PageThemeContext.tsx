'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation'; // 🆕 IMPORT DO NEXT.JS

// 🗺️ MAPA DE PÁGINAS SIMPLIFICADO
export const PAGE_IDS = {
  '/': 'home',
  '/pokemontcg': 'pokemon-tcg',
  '/jogosdetabuleiro': 'board-games',
  '/acessorios': 'accessories', 
  '/hotwheels': 'hot-wheels',
  '/cart': 'cart'
} as const;

export type PageId = keyof typeof PAGE_IDS;

// 🎨 ESTRUTURA SIMPLIFICADA - Só o essencial
interface PageThemeConfig {
  pageId: string;
  themeId: string | null; // null = usa tema global
}

interface PageThemeContextType {
  pageThemes: Record<string, PageThemeConfig>;
  currentPageId: string | null;
  setPageTheme: (pageId: string, themeId: string | null) => void;
  getPageTheme: (pageId: string) => string | null;
  clearPageTheme: (pageId: string) => void;
}

const PageThemeContext = createContext<PageThemeContextType | undefined>(undefined);

export function PageThemeProvider({ children }: { children: React.ReactNode }) {
  const [pageThemes, setPageThemes] = useState<Record<string, PageThemeConfig>>({});
  
  // 🆕 CORREÇÃO: Usar usePathname do Next.js para detecção automática
  const pathname = usePathname();
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // 🆕 CORREÇÃO: Detectar página atual automaticamente com Next.js
  useEffect(() => {
    const detectCurrentPage = () => {
      // Encontrar a página correspondente ao path atual
      const pageId = Object.keys(PAGE_IDS).find(key => 
        pathname === key || pathname.startsWith(key + '/')
      ) || pathname;
      
      console.log('🔍 Detectando página:', { pathname, pageId });
      setCurrentPageId(pageId);
    };

    detectCurrentPage();
  }, [pathname]); // 🆕 Agora depende do pathname que muda automaticamente

  // 💾 CARREGAR TEMAS DAS PÁGINAS
  useEffect(() => {
    const savedPageThemes = localStorage.getItem('videra-page-themes');
    if (savedPageThemes) {
      try {
        setPageThemes(JSON.parse(savedPageThemes));
      } catch (error) {
        console.error('Erro ao carregar temas das páginas:', error);
      }
    }
  }, []);

  // 💾 SALVAR TEMAS DAS PÁGINAS
  const savePageThemes = (themes: Record<string, PageThemeConfig>) => {
    localStorage.setItem('videra-page-themes', JSON.stringify(themes));
  };

  // 🎨 DEFINIR TEMA PARA PÁGINA
  const setPageTheme = (pageId: string, themeId: string | null) => {
    const updatedThemes = {
      ...pageThemes,
      [pageId]: { pageId, themeId }
    };
    
    setPageThemes(updatedThemes);
    savePageThemes(updatedThemes);
    
    // 🆕 CORREÇÃO: Se estamos na página que acabou de ser modificada, forçar atualização
    if (currentPageId === pageId) {
      window.dispatchEvent(new Event('theme-changed'));
    }
  };

  // 🎨 OBTER TEMA DA PÁGINA
  const getPageTheme = (pageId: string): string | null => {
    return pageThemes[pageId]?.themeId || null;
  };

  // 🗑️ REMOVER TEMA DA PÁGINA
  const clearPageTheme = (pageId: string) => {
    const updatedThemes = { ...pageThemes };
    delete updatedThemes[pageId];
    
    setPageThemes(updatedThemes);
    savePageThemes(updatedThemes);
    
    // 🆕 CORREÇÃO: Se estamos na página que acabou de ser modificada, forçar atualização
    if (currentPageId === pageId) {
      window.dispatchEvent(new Event('theme-changed'));
    }
  };

  // 🆕 CORREÇÃO: Log para debug
  useEffect(() => {
    console.log('🎯 PageThemeContext - Estado atual:', {
      currentPageId,
      pageThemes,
      currentPageTheme: currentPageId ? getPageTheme(currentPageId) : null
    });
  }, [currentPageId, pageThemes]);

  return (
    <PageThemeContext.Provider value={{
      pageThemes,
      currentPageId,
      setPageTheme,
      getPageTheme,
      clearPageTheme
    }}>
      {children}
    </PageThemeContext.Provider>
  );
}

export function usePageTheme() {
  const context = useContext(PageThemeContext);
  if (context === undefined) {
    throw new Error('usePageTheme must be used within a PageThemeProvider');
  }
  return context;
}
export { PageThemeContext };