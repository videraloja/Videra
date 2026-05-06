// hooks/useThemeColors.ts - VERSÃO OTIMIZADA (SEM LOOP, SEM LOGS EXCESSIVOS)
'use client';

import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ThemeContext } from '../app/contexts/ThemeContext';
import { PageThemeContext } from '../app/contexts/PageThemeContext';
import { ThemeConfig, ComponentStyles, ProductCardStyles } from '../app/types';
import { getEffectiveTheme } from '@/app/lib/themeService';

// CONSTANTES DE EMERGÊNCIA (inalteradas)
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

  // REFS PARA CONTROLE
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const previousThemeId = useRef<string | null>(null);
  const fetching = useRef(false);
  const lastFetchTime = useRef(0);
  const lastFetchedPage = useRef<string>('');

  // MONTA/DESMONTA
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // FUNÇÃO PRINCIPAL OTIMIZADA - evita buscas repetidas
  const fetchEffectiveTheme = useCallback(async (forceRefresh = false) => {
    if (!isMounted || fetching.current) return;

    const currentPage = pageThemeContext?.currentPageId || window.location.pathname;
    const now = Date.now();

    // Se já buscou há menos de 2 segundos e não é forçado, ignora
    if (!forceRefresh && lastFetchedPage.current === currentPage && now - lastFetchTime.current < 2000) {
      return;
    }

    fetching.current = true;
    lastFetchTime.current = now;
    lastFetchedPage.current = currentPage;

    try {
      setLoading(true);

      const theme = await getEffectiveTheme(currentPage);

      if (theme) {
        const themeId = theme.id + (theme.updatedAt || '');
        // Só atualiza estado se o tema realmente mudou
        if (previousThemeId.current !== themeId) {
          previousThemeId.current = themeId;
          setEffectiveTheme(theme);
          setLastUpdate(Date.now());
        }
      }
    } catch (error) {
      // Silencioso em produção, apenas log de emergência se necessário
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar tema:', error);
      }
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [isMounted, pageThemeContext?.currentPageId]);

  // INICIAR POLLING (APENAS UMA VEZ)
  useEffect(() => {
    if (!isMounted) return;

    const currentPage = pageThemeContext?.currentPageId || window.location.pathname;

    if (currentPage.startsWith('/admin')) return;

    // Limpa polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Busca inicial
    fetchEffectiveTheme();

    // Polling a cada 10s, mas sem forçar atualização se não mudou
    pollingRef.current = setInterval(() => {
      fetchEffectiveTheme(true);
    }, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // ATENÇÃO: dependência intencionalmente apenas [isMounted], não recria o intervalo
    // pois pageThemeContext.currentPageId é acessado por ref ou diretamente na função.
    // Reagimos a mudanças de página pelo efeito abaixo.
  }, [isMounted]);

  // ATUALIZA QUANDO A PÁGINA MUDA (contexto de página)
  useEffect(() => {
    if (isMounted && pageThemeContext?.currentPageId) {
      fetchEffectiveTheme(true);
    }
  }, [pageThemeContext?.currentPageId, isMounted, fetchEffectiveTheme]);

  // FORÇAR ATUALIZAÇÃO MANUAL
  const forceRefreshTheme = useCallback(() => {
    fetchEffectiveTheme(true);
  }, [fetchEffectiveTheme]);

  // EXTRAIR DADOS
  const colors = effectiveTheme.colors || emergencyColors;
  const emojis = effectiveTheme.emojis || emergencyEmojis;
  const componentStyles = effectiveTheme.componentStyles || emergencyComponentStyles;
  const backgroundImage = effectiveTheme.backgroundImage || defaultBackgroundImage;

  // FUNÇÕES DE ESTILO (inalteradas, mas sem logs)
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
    const configs: Record<string, { color: string; icon: string; badgeText: string }> = {
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
    return configs[category] || configs.default;
  };

  // FUNÇÕES DE COMPONENTES (SEM LOGS)
  const getComponentStyles = <K extends keyof ComponentStyles>(
    component: K,
    usePageTheme: boolean = true
  ): ComponentStyles[K] => {
    if (usePageTheme && pageThemeContext?.currentPageId) {
      const pageThemeId = pageThemeContext.getPageTheme(pageThemeContext.currentPageId);
      if (pageThemeId && effectiveTheme.componentStyles?.[component]) {
        return effectiveTheme.componentStyles[component];
      }
    }
    if (effectiveTheme.componentStyles?.[component]) {
      return effectiveTheme.componentStyles[component];
    }
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

  const hasPageSpecificStyles = (): boolean => {
    return !!pageThemeContext?.currentPageId &&
      !!pageThemeContext.getPageTheme(pageThemeContext.currentPageId);
  };

  return {
    colors,
    emojis,
    themeName: effectiveTheme.name,
    isSpecialTheme: effectiveTheme.name !== 'Tema Padrão Videra',
    theme: effectiveTheme,
    applyThemeStyles,
    getGradient,
    getShadow,
    getCategoryConfig,
    getComponentStyles,
    getCardStyles,
    applyCardStyles,
    currentPageId: pageThemeContext?.currentPageId || '/',
    effectiveTheme,
    isPageSpecific: hasPageSpecificStyles(),
    isMounted,
    loading,
    lastUpdate,
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

function createDefaultTheme(): ThemeConfig {
  return {
    id: 'default',
    name: 'Tema Padrão Videra',
    isActive: true,
    priority: 1,
    colors: emergencyColors,
    emojis: emergencyEmojis,
    componentStyles: emergencyComponentStyles,
    backgroundImage: defaultBackgroundImage
  };
}

function createEmergencyTheme(): ThemeConfig {
  return {
    id: 'emergency',
    name: '🚨 Tema de Emergência',
    isActive: false,
    priority: 0,
    colors: emergencyColors,
    emojis: emergencyEmojis,
    componentStyles: emergencyComponentStyles,
    backgroundImage: defaultBackgroundImage
  };
}