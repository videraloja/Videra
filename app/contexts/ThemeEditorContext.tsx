// app/contexts/ThemeEditorContext.tsx - CORRIGIDO
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTheme } from './ThemeContext';

// 🎨 Tipos para o editor
interface ThemeEditorState {
  draftTheme: any | null;
  isEditing: boolean;
  previewMode: 'desktop' | 'mobile';
  activeTab: 'colors' | 'emojis' | 'images' | 'effects';
}

interface ThemeEditorContextType {
  editorState: ThemeEditorState;
  setDraftTheme: (theme: any) => void;
  updateDraftProperty: (path: string, value: any) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  setActiveTab: (tab: 'colors' | 'emojis' | 'images' | 'effects') => void;
  resetDraft: () => void;
  saveDraft: () => void;
}

const ThemeEditorContext = createContext<ThemeEditorContextType | undefined>(undefined);

export function ThemeEditorProvider({ children }: { children: React.ReactNode }) {
  const [editorState, setEditorState] = useState<ThemeEditorState>({
    draftTheme: null,
    isEditing: false,
    previewMode: 'desktop',
    activeTab: 'colors'
  });

  // 🆕 HOOK DO THEME CONTEXT PARA INTEGRAÇÃO
  const { updateThemeConfig } = useTheme();

  // 🆕 CORREÇÃO: Estado para controlar se já carregou o tema
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);

  const setDraftTheme = useCallback((theme: any) => {
    // 🆕 CORREÇÃO: Só atualiza se o tema for diferente
    if (JSON.stringify(editorState.draftTheme) !== JSON.stringify(theme)) {
      setEditorState(prev => ({
        ...prev,
        draftTheme: theme,
        isEditing: true
      }));
      setHasLoadedTheme(true);
    }
  }, [editorState.draftTheme]);

  // 🆕 CORREÇÃO: useCallback para evitar recriação
  const updateDraftProperty = useCallback((path: string, value: any) => {
    setEditorState(prev => {
      if (!prev.draftTheme) return prev;
      
      const newDraft = { ...prev.draftTheme };
      const keys = path.split('.');
      let current: any = newDraft;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        ...prev,
        draftTheme: newDraft
      };
    });
  }, []);

  const setPreviewMode = useCallback((mode: 'desktop' | 'mobile') => {
    setEditorState(prev => ({ ...prev, previewMode: mode }));
  }, []);

  const setActiveTab = useCallback((tab: 'colors' | 'emojis' | 'images' | 'effects') => {
    setEditorState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const resetDraft = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      draftTheme: null,
      isEditing: false
    }));
    setHasLoadedTheme(false);
  }, []);

  // 🆕 FUNÇÃO SAVEDRAFT COMPLETAMENTE CORRIGIDA
  const saveDraft = useCallback(() => {
    if (editorState.draftTheme) {
      try {
        // ✅ SALVAR NO THEME CONTEXT
        updateThemeConfig(editorState.draftTheme.id, editorState.draftTheme);
        
        // ✅ ATUALIZAR LOCALSTORAGE DIRETAMENTE (backup)
        const currentThemes = JSON.parse(localStorage.getItem('videra-themes') || '[]');
        const updatedThemes = currentThemes.map((theme: any) => 
          theme.id === editorState.draftTheme.id ? editorState.draftTheme : theme
        );
        localStorage.setItem('videra-themes', JSON.stringify(updatedThemes));
        
        // ✅ SE É O TEMA ATIVO, ATUALIZAR TAMBÉM
        const currentTheme = JSON.parse(localStorage.getItem('videra-current-theme') || '{}');
        if (currentTheme.id === editorState.draftTheme.id) {
          localStorage.setItem('videra-current-theme', JSON.stringify(editorState.draftTheme));
        }
        
        alert(`🎉 Tema "${editorState.draftTheme.name}" salvo com sucesso!`);
        console.log('✅ Tema salvo:', editorState.draftTheme);
        
      } catch (error) {
        console.error('❌ Erro ao salvar tema:', error);
        alert('❌ Erro ao salvar tema. Verifique o console.');
      }
    }
  }, [editorState.draftTheme, updateThemeConfig]);

  return (
    <ThemeEditorContext.Provider value={{
      editorState,
      setDraftTheme,
      updateDraftProperty,
      setPreviewMode,
      setActiveTab,
      resetDraft,
      saveDraft
    }}>
      {children}
    </ThemeEditorContext.Provider>
  );
}

export function useThemeEditor() {
  const context = useContext(ThemeEditorContext);
  if (context === undefined) {
    throw new Error('useThemeEditor must be used within a ThemeEditorProvider');
  }
  return context;
}