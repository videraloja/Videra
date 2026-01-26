// app/hooks/useThemeColors.ts - VERSÃO COM backgroundImage (CORRIGIDA)
'use client';

import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ThemeContext } from '../app/contexts/ThemeContext';
import { PageThemeContext } from '../app/contexts/PageThemeContext';
import { ThemeConfig, ComponentStyles, ProductCardStyles } from '../app/types';
import { getEffectiveTheme } from '@/app/lib/themeService';

// CONSTANTES DE EMERGÊNCIA
const emergencyColors = {
  primary: '#7c3aed',
  secondary: '#f1f5f9', 
  accent: '#10b981',
  background: '#ffffff',
  text: '#1f2937',
  cardBg: '#ffffff',
  headerBg: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

const emergencyEmojis = {
  cart: '🛒',
  success: '✅', 
  search: '🔍',
  filter: '🎛️',
  stock: '📦',
  category: '📁'
};

const emergencyComponentStyles: ComponentStyles = {
  productCard: {
    productName: { color: '#1f2937', fontSize: '16px', fontWeight: '600' },
    price: { color: '#059669', fontSize: '18px', fontWeight: '700' },
    originalPrice: { 
      color: '#6b7280', 
      fontSize: '16px', 
      fontWeight: '500',
      strikethrough: true 
    },
    salePrice: { color: '#dc2626', fontSize: '20px', fontWeight: '700' },
    stockInfo: { color: '#6b7280', fontSize: '14px', fontWeight: '500' },
    collectionName: { color: '#7c3aed', fontSize: '12px', fontWeight: '600' },
    description: { color: '#6b7280', fontSize: '14px', fontWeight: '400' },
    
    badgeDiscount: {
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      position: 'right' as const
    },
    badgeType: {
      backgroundColor: '#7c3aed', 
      textColor: '#ffffff',
      position: 'left' as const
    },
    badgeUrgent: {
      backgroundColor: '#dc2626',
      textColor: '#ffffff', 
      position: 'bottom-left' as const
    },
    
    addToCart: {
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      hoverBackgroundColor: '#6d28d9',
      disabledBackgroundColor: '#9ca3af'
    },
    
    cardBackground: '#ffffff',
    borderColor: '#f1f5f9',
    shadow: '0 4px 20px rgba(0,0,0,0.1)',
    hoverShadow: '0 20px 40px rgba(0,0,0,0.15)',
    cornerRadius: '20px',
    imageOverlay: 'transparent'
  }
};

// 🆕 🆕 🆕 IMAGEM DE FUNDO PADRÃO PARA TEMAS
const defaultBackgroundImage = {
  url: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1200&h=400&fit=crop',
  overlayColor: '#000000',
  opacity: 0.3
};

export const useThemeColors = () => {
  const themeContext = useContext(ThemeContext);
  const pageThemeContext = useContext(PageThemeContext);
  const [isMounted, setIsMounted] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<ThemeConfig>(createDefaultTheme());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // 🆕 REF PARA CONTROLAR POLLING
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef<string>('');

  // 🔧 SÓ RODA NO CLIENTE
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // Limpar polling ao desmontar
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 🎯 FUNÇÃO PRINCIPAL PARA BUSCAR TEMA EFETIVO
  const fetchEffectiveTheme = useCallback(async (forceRefresh = false) => {
    try {
      if (!isMounted) return;

      setLoading(true);
      console.log('🔍 [useThemeColors] Iniciando busca de tema...');

      const currentPage = pageThemeContext?.currentPageId || window.location.pathname;
      currentPageRef.current = currentPage;
      
      console.log(`🎯 [useThemeColors] Página atual: ${currentPage}`);
      console.log(`🔄 [useThemeColors] Forçar refresh: ${forceRefresh}`);
      
      const theme = await getEffectiveTheme(currentPage);

      if (theme) {
        setEffectiveTheme(theme);
        setLastUpdate(Date.now());
        
        console.log(`✅✅✅ [useThemeColors] TEMA EFETIVO DEFINIDO: "${theme.name}"`);
        console.log(`📊 [useThemeColors] Página: ${currentPage}`);
        console.log(`🎨 [useThemeColors] Cores: ${Object.keys(theme.colors || {}).length}`);
        console.log(`😀 [useThemeColors] Emojis: ${Object.keys(theme.emojis || {}).length}`);
        console.log(`🖼️ [useThemeColors] Background Image: ${theme.backgroundImage ? '✅' : '❌'}`);
        console.log(`🔄 [useThemeColors] Tem estilos: ${!!theme.componentStyles}`);
        console.log(`⏰ [useThemeColors] Última atualização: ${new Date().toLocaleTimeString()}`);
      } else {
        console.error('❌❌❌ [useThemeColors] NENHUM TEMA ENCONTRADO! Usando emergência.');
        setEffectiveTheme(createEmergencyTheme());
      }

    } catch (error) {
      console.error('❌ [useThemeColors] Erro crítico ao buscar tema:', error);
      setEffectiveTheme(createEmergencyTheme());
    } finally {
      setLoading(false);
    }
  }, [isMounted, pageThemeContext?.currentPageId]);

  // 🆕 EFFECT PARA INICIAR POLLING
  useEffect(() => {
    if (!isMounted) return;

    // Limpar polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const currentPage = pageThemeContext?.currentPageId || window.location.pathname;
    
    // Não fazer polling em páginas de admin
    if (currentPage.startsWith('/admin')) {
      console.log('⚡ [useThemeColors] Desativando polling para página admin');
      return;
    }

    console.log(`🔄 [useThemeColors] Iniciando polling para: ${currentPage}`);
    
    pollingRef.current = setInterval(() => {
      console.log(`⏰ [useThemeColors] Verificando atualizações... (${new Date().toLocaleTimeString()})`);
      fetchEffectiveTheme(true);
    }, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isMounted, pageThemeContext?.currentPageId, fetchEffectiveTheme]);

  // 🎯 EFFECT PARA BUSCAR TEMA QUANDO MUDAR A PÁGINA
  useEffect(() => {
    if (isMounted) {
      fetchEffectiveTheme();
    }
  }, [fetchEffectiveTheme, isMounted]);

  // 🎯 EFFECT PARA OUVIR MUDANÇAS NO CONTEXTO DE PÁGINA
  useEffect(() => {
    if (isMounted && pageThemeContext?.currentPageId) {
      fetchEffectiveTheme();
    }
  }, [pageThemeContext?.currentPageId, isMounted, fetchEffectiveTheme]);

  // 🆕 FUNÇÃO PARA FORÇAR ATUALIZAÇÃO MANUAL
  const forceRefreshTheme = useCallback(() => {
    console.log('🔄 [useThemeColors] Forçando atualização manual do tema');
    fetchEffectiveTheme(true);
  }, [fetchEffectiveTheme]);

  // 🎨 EXTRAIR DADOS COM FALLBACK SEGURO
  const colors = effectiveTheme.colors || emergencyColors;
  const emojis = effectiveTheme.emojis || emergencyEmojis;
  const componentStyles = effectiveTheme.componentStyles || emergencyComponentStyles;
  const backgroundImage = effectiveTheme.backgroundImage || defaultBackgroundImage;

  // 🎯 FUNÇÕES BÁSICAS
  const applyThemeStyles = (styles: React.CSSProperties, elementType?: string) => {
    const baseStyles = { ...styles };
    
    if (elementType === 'hero') {
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
      };
    }
    
    return baseStyles;
  };

  const getGradient = (type: 'primary' | 'secondary' | 'hero' | 'accent') => {
    const gradients = {
      primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
      secondary: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondary}dd 100%)`,
      hero: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
      accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`
    };
    return gradients[type] || gradients.primary;
  };

  const getShadow = (size: 'small' | 'medium' | 'large') => {
    const shadows = {
      small: '0 4px 20px rgba(0,0,0,0.1)',
      medium: '0 8px 30px rgba(0,0,0,0.15)',
      large: '0 20px 40px rgba(0,0,0,0.2)'
    };
    return shadows[size];
  };

  const getCategoryConfig = (category: string) => {
    const configs = {
      'pokemon': { color: colors.primary, icon: '🎴', badgeText: 'POKÉMON' },
      'board-games': { color: colors.primary, icon: '🎲', badgeText: 'TABULEIRO' },
      'acessorios': { color: colors.primary, icon: '🛡️', badgeText: 'ACESSÓRIO' },
      'hot-wheels': { color: colors.primary, icon: '🏎️', badgeText: 'HOT WHEELS' },
      'home': { color: colors.primary, icon: '🏠', badgeText: 'DESTAQUE' },
      'pokemontcg': { color: colors.primary, icon: '🎴', badgeText: 'POKÉMON' },
      'jogosdetabuleiro': { color: colors.primary, icon: '🎲', badgeText: 'TABULEIRO' },
      'hotwheels': { color: colors.primary, icon: '🏎️', badgeText: 'HOT WHEELS' },
      'default': { color: colors.primary, icon: '📦', badgeText: 'PRODUTO' }
    };
    return (configs as any)[category] || configs.default;
  };

  // 🎨 FUNÇÕES DE COMPONENTES
  const getComponentStyles = <K extends keyof ComponentStyles>(
    component: K, 
    usePageTheme: boolean = true
  ): ComponentStyles[K] => {
    
    // 🎯 PRIORIDADE 1: ESTILOS DA PÁGINA ATUAL
    if (usePageTheme && pageThemeContext?.currentPageId) {
      const pageThemeId = pageThemeContext.getPageTheme(pageThemeContext.currentPageId);
      if (pageThemeId && effectiveTheme.componentStyles?.[component]) {
        console.log(`🎨 [useThemeColors] Usando estilos específicos da página para ${component}`);
        return effectiveTheme.componentStyles[component];
      }
    }
    
    // 🎯 PRIORIDADE 2: ESTILOS DO TEMA ATUAL
    if (effectiveTheme.componentStyles?.[component]) {
      return effectiveTheme.componentStyles[component];
    }
    
    // 🎯 PRIORIDADE 3: ESTILOS DE EMERGÊNCIA
    return emergencyComponentStyles[component];
  };

  const getCardStyles = (usePageTheme: boolean = true): ProductCardStyles => {
    return getComponentStyles('productCard', usePageTheme);
  };

  const applyCardStyles = (
    element: keyof ProductCardStyles, 
    defaultStyles: React.CSSProperties,
    usePageTheme: boolean = true
  ) => {
    const cardStyles = getCardStyles(usePageTheme);
    const elementStyles = cardStyles[element];
    
    if (!elementStyles) return defaultStyles;

    if (typeof elementStyles === 'object' && 'color' in elementStyles) {
      const textStyles = elementStyles as any;
      return {
        ...defaultStyles,
        color: textStyles.color,
        fontSize: textStyles.fontSize,
        fontWeight: textStyles.fontWeight,
        textDecoration: textStyles.strikethrough ? 'line-through' : 'none'
      };
    }
    
    if (typeof elementStyles === 'object' && 'backgroundColor' in elementStyles && 'textColor' in elementStyles) {
      const badgeStyles = elementStyles as any;
      return {
        ...defaultStyles,
        backgroundColor: badgeStyles.backgroundColor,
        color: badgeStyles.textColor,
        fontSize: badgeStyles.fontSize || '12px',
        fontWeight: badgeStyles.fontWeight || '700'
      };
    }
    
    if (typeof elementStyles === 'object' && 'hoverBackgroundColor' in elementStyles) {
      const buttonStyles = elementStyles as any;
      return {
        ...defaultStyles,
        backgroundColor: buttonStyles.backgroundColor,
        color: buttonStyles.textColor
      };
    }
    
    if (typeof elementStyles === 'string') {
      if (element === 'cardBackground' || element === 'imageOverlay') {
        return { ...defaultStyles, background: elementStyles };
      }
      if (element === 'borderColor') {
        return { ...defaultStyles, borderColor: elementStyles };
      }
      if (element === 'shadow' || element === 'hoverShadow') {
        return { ...defaultStyles, boxShadow: elementStyles };
      }
      if (element === 'cornerRadius') {
        return { ...defaultStyles, borderRadius: elementStyles };
      }
    }
    
    return defaultStyles;
  };

  // 🎯 FUNÇÃO PARA VERIFICAR SE TEM ESTILOS DA PÁGINA
  const hasPageSpecificStyles = (): boolean => {
    return !!pageThemeContext?.currentPageId && 
           !!pageThemeContext.getPageTheme(pageThemeContext.currentPageId);
  };

  return {
    // 🎨 DADOS DO TEMA
    colors,
    emojis,
    themeName: effectiveTheme.name,
    isSpecialTheme: effectiveTheme.name !== 'Tema Padrão Videra',
    theme: effectiveTheme, // TEMA COMPLETO
    
    // 🎨 FUNÇÕES DE ESTILO
    applyThemeStyles,
    getGradient,
    getShadow,
    getCategoryConfig,
    
    // 🎨 FUNÇÕES DE COMPONENTES
    getComponentStyles,
    getCardStyles,
    applyCardStyles,
    
    // 🔧 INFORMACOES
    currentPageId: pageThemeContext?.currentPageId || '/',
    effectiveTheme,
    isPageSpecific: hasPageSpecificStyles(),
    isMounted,
    loading,
    lastUpdate,
    
    // 🆕 NOVAS FUNÇÕES
    hasPageSpecificStyles,
    getCurrentTheme: () => effectiveTheme,
    refreshTheme: fetchEffectiveTheme,
    forceRefreshTheme,
    stopPolling: () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  };
};

// 🎯 TEMA PADRÃO
function createDefaultTheme(): ThemeConfig {
  return {
    id: 'default',
    name: 'Tema Padrão Videra',
    isActive: true,
    priority: 1,
    colors: emergencyColors,
    emojis: emergencyEmojis,
    componentStyles: emergencyComponentStyles,
    backgroundImage: defaultBackgroundImage // 🆕 AGORA É backgroundImage, NÃO pageBackgrounds
  };
}

// 🚨 TEMA DE EMERGÊNCIA
function createEmergencyTheme(): ThemeConfig {
  console.error('🚨 [useThemeColors] Usando tema de emergência!');
  return {
    id: 'emergency',
    name: '🚨 Tema de Emergência',
    isActive: false,
    priority: 0,
    colors: emergencyColors,
    emojis: emergencyEmojis,
    componentStyles: emergencyComponentStyles,
    backgroundImage: defaultBackgroundImage // 🆕 AGORA É backgroundImage
  };
}