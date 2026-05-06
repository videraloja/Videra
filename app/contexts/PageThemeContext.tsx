// app/contexts/PageThemeContext.tsx - VERSÃO OTIMIZADA (SEM LOGS)
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const PAGE_IDS = {
  '/': 'home',
  '/pokemontcg': 'pokemon-tcg',
  '/jogosdetabuleiro': 'board-games',
  '/acessorios': 'accessories',
  '/hotwheels': 'hot-wheels',
  '/cart': 'cart'
} as const;

export type PageId = keyof typeof PAGE_IDS;

interface PageThemeConfig {
  pageId: string;
  themeId: string | null;
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
  const pathname = usePathname();
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  useEffect(() => {
    const pageId = Object.keys(PAGE_IDS).find(key =>
      pathname === key || pathname.startsWith(key + '/')
    ) || pathname;

    setCurrentPageId(pageId);
  }, [pathname]);

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

  const savePageThemes = (themes: Record<string, PageThemeConfig>) => {
    localStorage.setItem('videra-page-themes', JSON.stringify(themes));
  };

  const setPageTheme = (pageId: string, themeId: string | null) => {
    const updatedThemes = {
      ...pageThemes,
      [pageId]: { pageId, themeId }
    };

    setPageThemes(updatedThemes);
    savePageThemes(updatedThemes);

    if (currentPageId === pageId) {
      window.dispatchEvent(new Event('theme-changed'));
    }
  };

  const getPageTheme = (pageId: string): string | null => {
    return pageThemes[pageId]?.themeId || null;
  };

  const clearPageTheme = (pageId: string) => {
    const updatedThemes = { ...pageThemes };
    delete updatedThemes[pageId];

    setPageThemes(updatedThemes);
    savePageThemes(updatedThemes);

    if (currentPageId === pageId) {
      window.dispatchEvent(new Event('theme-changed'));
    }
  };

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