// app/lib/themeService.ts - VERSÃO OTIMIZADA (SEM LOGS, COM CACHE)
import { supabase } from '@/lib/supabaseClient';
import { ThemeConfig, ComponentStyles, BackgroundImage } from '@/app/types';

// ============================================
// CACHE EM MEMÓRIA (evita buscas repetidas)
// ============================================
const themeCache = new Map<string, { theme: ThemeConfig; timestamp: number }>();
const CACHE_TTL = 2000; // 2 segundos

function getCachedTheme(key: string): ThemeConfig | null {
  const cached = themeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.theme;
  }
  themeCache.delete(key);
  return null;
}

function setCachedTheme(key: string, theme: ThemeConfig): void {
  themeCache.set(key, { theme, timestamp: Date.now() });
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

export async function getAllThemes(): Promise<ThemeConfig[]> {
  try {
    const { data: themes, error } = await supabase
      .from('themes')
      .select('id, name, is_active, is_default, priority')
      .order('priority', { ascending: true });

    if (error) {
      console.error('Erro ao buscar temas:', error);
      return getDefaultThemes();
    }

    if (!themes || themes.length === 0) {
      return getDefaultThemes();
    }

    const themesWithDetails = await Promise.all(
      themes.map(async (theme) => {
        return await getThemeById(theme.id);
      })
    );

    const validThemes = themesWithDetails.filter(Boolean) as ThemeConfig[];
    return validThemes.length > 0 ? validThemes : getDefaultThemes();

  } catch (error) {
    console.error('Erro geral ao buscar temas:', error);
    return getDefaultThemes();
  }
}

export async function getActiveTheme(): Promise<ThemeConfig> {
  try {
    const { data: activeThemes, error } = await supabase
      .from('themes')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Erro na query de tema ativo:', error.message);
      return await getDefaultThemeFallback();
    }

    if (activeThemes && activeThemes.length > 0) {
      const theme = await getThemeById(activeThemes[0].id);
      if (theme) return theme;
    }

    return await getDefaultThemeFallback();

  } catch (error) {
    console.error('Erro crítico ao buscar tema ativo:', error);
    return getDefaultThemes()[0];
  }
}

async function getDefaultThemeFallback(): Promise<ThemeConfig> {
  try {
    const { data: defaultThemes } = await supabase
      .from('themes')
      .select('id, name')
      .eq('is_default', true)
      .limit(1);

    if (defaultThemes && defaultThemes.length > 0) {
      const theme = await getThemeById(defaultThemes[0].id);
      if (theme) return theme;
    }

    const { data: anyTheme } = await supabase
      .from('themes')
      .select('id, name')
      .limit(1);

    if (anyTheme && anyTheme.length > 0) {
      const theme = await getThemeById(anyTheme[0].id);
      if (theme) return theme;
    }

    return getDefaultThemes()[0];

  } catch (error) {
    console.error('Erro no fallback de tema padrão:', error);
    return getDefaultThemes()[0];
  }
}

export async function getThemeById(themeId: string): Promise<ThemeConfig | null> {
  // Verifica cache primeiro
  const cached = getCachedTheme(themeId);
  if (cached) return cached;

  try {
    const [themeResult, colorsResult, emojisResult, stylesResult] = await Promise.all([
      supabase.from('themes').select('*').eq('id', themeId).single(),
      supabase.from('theme_colors').select('color_type, color_value').eq('theme_id', themeId),
      supabase.from('theme_emojis').select('emoji_type, emoji_value').eq('theme_id', themeId),
      supabase.from('component_styles').select('styles').eq('theme_id', themeId).eq('component_type', 'productCard').limit(1)
    ]);

    if (themeResult.error || !themeResult.data) {
      return null;
    }

    const themeData = themeResult.data;

    // Cores
    const colorsRecord: Record<string, string> = {};
    if (colorsResult.data) {
      colorsResult.data.forEach(row => {
        colorsRecord[row.color_type] = row.color_value;
      });
    }

    const colors = {
      primary: colorsRecord.primary || '#7c3aed',
      secondary: colorsRecord.secondary || '#f1f5f9',
      accent: colorsRecord.accent || '#10b981',
      background: colorsRecord.background || '#ffffff',
      text: colorsRecord.text || '#1f2937',
      cardBg: colorsRecord.cardBg || '#ffffff',
      success: colorsRecord.success || '#10b981',
      warning: colorsRecord.warning || '#f59e0b',
      error: colorsRecord.error || '#ef4444',
    };

    // Emojis
    const emojisRecord: Record<string, string> = {};
    if (emojisResult.data) {
      emojisResult.data.forEach(row => {
        emojisRecord[row.emoji_type] = row.emoji_value;
      });
    }

    const emojis = {
      cart: emojisRecord.cart || '🛒',
      success: emojisRecord.success || '✅',
      search: emojisRecord.search || '🔍',
      filter: emojisRecord.filter || '🎛️',
      stock: emojisRecord.stock || '📦',
      category: emojisRecord.category || '📁'
    };

    const componentStyles = stylesResult.data?.[0]?.styles as ComponentStyles | undefined;

    // Background image
    let backgroundImage = undefined;
    if ('background_image' in themeData) {
      try {
        const bgData = themeData.background_image;
        if (bgData && typeof bgData === 'object' && bgData !== null) {
          backgroundImage = {
            url: bgData.url || '',
            mobileUrl: (bgData as any).mobileUrl, // Adiciona a nova propriedade
            overlayColor: (bgData as any).overlayColor,
            opacity: bgData.opacity
          };
        } else if (typeof bgData === 'string' && bgData.trim() !== '') {
          const parsed = JSON.parse(bgData);
          backgroundImage = {
            url: parsed.url || '',
            overlayColor: parsed.overlayColor,
            mobileUrl: parsed.mobileUrl,
            opacity: parsed.opacity
          };
        }
      } catch (parseError) {
        console.error('Erro ao processar background_image:', parseError);
      }
    }

    const theme: ThemeConfig = {
      id: themeData.id,
      name: themeData.name,
      description: themeData.description,
      isActive: themeData.is_active,
      startDate: themeData.start_date,
      endDate: themeData.end_date,
      priority: themeData.priority,
      colors,
      emojis,
      componentStyles,
      backgroundImage,
      createdAt: themeData.created_at,
      updatedAt: themeData.updated_at
    };

    setCachedTheme(themeId, theme);
    return theme;

  } catch (error) {
    console.error(`Erro ao buscar tema ${themeId}:`, error);
    return null;
  }
}

export async function saveTheme(theme: ThemeConfig): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Usuário não autenticado ao tentar salvar tema.');
      alert('❌ Você precisa fazer login para salvar temas.');
      return false;
    }

    const backgroundImageData = theme.backgroundImage?.url
      ? {
          url: theme.backgroundImage.url,
          overlayColor: theme.backgroundImage.overlayColor || null,
          mobileUrl: theme.backgroundImage.mobileUrl || null,
          opacity: theme.backgroundImage.opacity || null
        }
      : null;

    const { error: themeError } = await supabase
      .from('themes')
      .upsert({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        is_active: theme.isActive || false,
        is_default: theme.id === 'default',
        priority: theme.priority || 1,
        start_date: theme.startDate,
        end_date: theme.endDate,
        background_image: backgroundImageData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (themeError) throw themeError;

    // Salvar cores
    if (theme.colors && Object.keys(theme.colors).length > 0) {
      const colorsToSave = { ...theme.colors };
      const colorEntries = Object.entries(colorsToSave)
        .filter(([_, value]) => value && typeof value === 'string' && value.trim() !== '')
        .map(([type, value]) => ({
          theme_id: theme.id,
          color_type: type,
          color_value: value.trim()
        }));

      if (colorEntries.length > 0) {
        const { error: colorsError } = await supabase
          .from('theme_colors')
          .upsert(colorEntries, {
            onConflict: 'theme_id,color_type',
            ignoreDuplicates: false
          });

        if (colorsError) {
          for (const entry of colorEntries) {
            await supabase
              .from('theme_colors')
              .update({ color_value: entry.color_value })
              .eq('theme_id', entry.theme_id)
              .eq('color_type', entry.color_type);
          }
        }
      }
    }

    // Salvar emojis
    if (theme.emojis && Object.keys(theme.emojis).length > 0) {
      const emojiEntries = Object.entries(theme.emojis)
        .filter(([_, value]) => value && typeof value === 'string' && value.trim() !== '')
        .map(([type, value]) => ({
          theme_id: theme.id,
          emoji_type: type,
          emoji_value: value.trim()
        }));

      if (emojiEntries.length > 0) {
        const { error: emojisError } = await supabase
          .from('theme_emojis')
          .upsert(emojiEntries, {
            onConflict: 'theme_id,emoji_type',
            ignoreDuplicates: false
          });

        if (emojisError) {
          for (const entry of emojiEntries) {
            await supabase
              .from('theme_emojis')
              .update({ emoji_value: entry.emoji_value })
              .eq('theme_id', entry.theme_id)
              .eq('emoji_type', entry.emoji_type);
          }
        }
      }
    }

    // Salvar estilos
    if (theme.componentStyles) {
      await supabase
        .from('component_styles')
        .upsert({
          theme_id: theme.id,
          component_type: 'productCard',
          styles: theme.componentStyles,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'theme_id,component_type'
        });
    }

    // Invalida cache
    themeCache.delete(theme.id);
    return true;

  } catch (error) {
    console.error(`Erro ao salvar tema "${theme.name}":`, error);
    return false;
  }
}

export async function activateTheme(themeId: string): Promise<boolean> {
  try {
    const { data: themeToActivate, error: checkError } = await supabase
      .from('themes')
      .select('id, name, is_default')
      .eq('id', themeId)
      .single();

    if (checkError || !themeToActivate) return false;

    const { data: currentlyActive } = await supabase
      .from('themes')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (currentlyActive && currentlyActive[0]?.id === themeId) return true;

    await supabase
      .from('themes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq('id', 'nonexistent');

    const { error: activateError } = await supabase
      .from('themes')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', themeId);

    if (activateError) {
      await activateDefaultTheme();
      return false;
    }

    themeCache.clear();
    return true;

  } catch (error) {
    console.error('Erro crítico ao ativar tema:', error);
    await activateDefaultTheme();
    return false;
  }
}

async function deactivateAllThemesIndividually(): Promise<void> {
  try {
    const { data: allThemes, error } = await supabase
      .from('themes')
      .select('id');

    if (error || !allThemes) return;

    for (const theme of allThemes) {
      await supabase
        .from('themes')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', theme.id);
    }
  } catch (error) {
    console.error('Erro em deactivateAllThemesIndividually:', error);
  }
}

export async function activateDefaultTheme(): Promise<boolean> {
  try {
    const { data: defaultTheme, error: findError } = await supabase
      .from('themes')
      .select('id, name')
      .eq('is_default', true)
      .limit(1);

    if (findError || !defaultTheme || defaultTheme.length === 0) return false;

    const defaultThemeId = defaultTheme[0].id;

    await supabase
      .from('themes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq('id', defaultThemeId);

    const { error: activateError } = await supabase
      .from('themes')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', defaultThemeId);

    return !activateError;
  } catch (error) {
    console.error('Erro no activateDefaultTheme:', error);
    return false;
  }
}

export async function getThemeForPage(pagePath: string): Promise<ThemeConfig | null> {
  try {
    const { data: pageThemeData, error: pageError } = await supabase
      .from('page_themes')
      .select('theme_id')
      .eq('page_path', pagePath)
      .limit(1);

    if (pageError || !pageThemeData || pageThemeData.length === 0 || !pageThemeData[0].theme_id) {
      return null;
    }

    const themeId = pageThemeData[0].theme_id;
    return await getThemeById(themeId);

  } catch (error) {
    console.error(`Erro ao buscar tema para página ${pagePath}:`, error);
    return null;
  }
}

export async function getEffectiveTheme(pagePath?: string): Promise<ThemeConfig> {
  try {
    // Cache composto pela página
    const cacheKey = `effective:${pagePath || 'global'}`;
    const cached = getCachedTheme(cacheKey);
    if (cached) return cached;

    let theme: ThemeConfig | null = null;

    if (pagePath) {
      theme = await getThemeForPage(pagePath);
      if (theme) {
        setCachedTheme(cacheKey, theme);
        return theme;
      }
    }

    theme = await getActiveTheme();
    if (theme) {
      setCachedTheme(cacheKey, theme);
      return theme;
    }

    const defaultTheme = await getThemeById('default');
    if (defaultTheme) {
      setCachedTheme(cacheKey, defaultTheme);
      return defaultTheme;
    }

    return getDefaultThemes()[0];

  } catch (error) {
    console.error('Erro ao buscar tema efetivo:', error);
    return getDefaultThemes()[0];
  }
}

function getDefaultThemes(): ThemeConfig[] {
  return [{
    id: 'default',
    name: 'Tema Padrão Videra',
    isActive: true,
    priority: 1,
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
    },
    backgroundImage: {
      url: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1200&h=400&fit=crop',
      overlayColor: '#000000',
      opacity: 0.3
    }
  }];
}