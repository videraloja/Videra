// app/lib/themeService.ts - VERSÃO ATUALIZADA COM FUNÇÕES DE PÁGINA
import { supabase } from '@/lib/supabaseClient';
import { ThemeConfig, ComponentStyles, } from '@/app/types';

console.log('🔄 themeService.ts CARREGADO');

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

export async function getAllThemes(): Promise<ThemeConfig[]> {
  try {
    console.log('📦 Buscando todos os temas...');
    
    const { data: themes, error } = await supabase
      .from('themes')
      .select('id, name, is_active, is_default, priority')
      .order('priority', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar temas:', error);
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
    console.log('✅ Temas carregados:', validThemes.length);
    
    return validThemes.length > 0 ? validThemes : getDefaultThemes();

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return getDefaultThemes();
  }
}

export async function getActiveTheme(): Promise<ThemeConfig> {
  try {
    console.log('🎯 Buscando tema ativo...');
    
    const { data: activeThemes, error } = await supabase
      .from('themes')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('❌ Erro na query:', error.message);
      return await getDefaultThemeFallback();
    }

    if (activeThemes && activeThemes.length > 0) {
      const theme = await getThemeById(activeThemes[0].id);
      if (theme) {
        console.log('✅ Tema ativo encontrado:', theme.name);
        return theme;
      }
    }

    console.log('🔍 Nenhum tema ativo, buscando padrão...');
    return await getDefaultThemeFallback();

  } catch (error) {
    console.error('❌ Erro crítico:', error);
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
      if (theme) {
        console.log('✅ Usando tema padrão:', theme.name);
        return theme;
      }
    }

    const { data: anyTheme } = await supabase
      .from('themes')
      .select('id, name')
      .limit(1);

    if (anyTheme && anyTheme.length > 0) {
      const theme = await getThemeById(anyTheme[0].id);
      if (theme) {
        console.log('✅ Usando primeiro tema disponível:', theme.name);
        return theme;
      }
    }

    console.log('⚠️  Usando fallback padrão');
    return getDefaultThemes()[0];

  } catch (error) {
    console.error('❌ Erro no fallback:', error);
    return getDefaultThemes()[0];
  }
}

export async function getThemeById(themeId: string): Promise<ThemeConfig | null> {
  try {
    console.log(`🔍 Buscando tema ${themeId}...`);
    
    const [themeResult, colorsResult, emojisResult, stylesResult] = await Promise.all([
      supabase.from('themes').select('*').eq('id', themeId).single(),
      supabase.from('theme_colors').select('color_type, color_value').eq('theme_id', themeId),
      supabase.from('theme_emojis').select('emoji_type, emoji_value').eq('theme_id', themeId),
      supabase.from('component_styles').select('styles').eq('theme_id', themeId).eq('component_type', 'productCard').limit(1)
    ]);

    if (themeResult.error || !themeResult.data) {
      console.log(`❌ Tema não encontrado:`, themeResult.error?.message);
      return null;
    }

    const themeData = themeResult.data;
    
    // 1. Primeiro coleta como Record
    const colorsRecord: Record<string, string> = {};
    if (colorsResult.data) {
      colorsResult.data.forEach(row => {
        colorsRecord[row.color_type] = row.color_value;
      });
    }

    // 2. Converte para ThemeColors com valores padrão
      const colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  cardBg: string;
  success: string;
  warning: string;
  error: string;
  headerBg?: string;
} = {
      primary: colorsRecord.primary || '#7c3aed',
      secondary: colorsRecord.secondary || '#f1f5f9',
      accent: colorsRecord.accent || '#10b981',
      background: colorsRecord.background || '#ffffff',
      text: colorsRecord.text || '#1f2937',
      cardBg: colorsRecord.cardBg || '#ffffff',
      success: colorsRecord.success || '#10b981',
      warning: colorsRecord.warning || '#f59e0b',
      error: colorsRecord.error || '#ef4444',
      headerBg: colorsRecord.headerBg // opcional - pode ser undefined
    };

    // 1. Primeiro coleta como Record
const emojisRecord: Record<string, string> = {};
if (emojisResult.data) {
  emojisResult.data.forEach(row => {
    emojisRecord[row.emoji_type] = row.emoji_value;
  });
}

// 2. Converte para o tipo esperado por ThemeConfig
const emojis: {
  cart: string;
  success: string;
  search: string;
  filter: string;
  stock: string;
  category: string;
} = {
  cart: emojisRecord.cart || '🛒',
  success: emojisRecord.success || '✅',
  search: emojisRecord.search || '🔍',
  filter: emojisRecord.filter || '🎛️',
  stock: emojisRecord.stock || '📦',
  category: emojisRecord.category || '📁'
};

    const componentStyles = stylesResult.data?.[0]?.styles as ComponentStyles | undefined;

    const theme: ThemeConfig = {
      id: themeData.id,
      name: themeData.name,
      description: themeData.description,
      isActive: themeData.is_active,
      startDate: themeData.start_date,
      endDate: themeData.end_date,
      priority: themeData.priority,
      colors,  // ⬅️ Agora é ThemeColors, não Record<string, string>
      emojis,
      componentStyles,
      createdAt: themeData.created_at,
      updatedAt: themeData.updated_at
    };

    console.log(`✅ Tema carregado: ${theme.name}`, {
      cores: Object.keys(colors).length,
      emojis: Object.keys(emojis).length,
      temEstilos: !!componentStyles
    });

    return theme;

  } catch (error) {
    console.error(`❌ Erro ao buscar tema ${themeId}:`, error);
    return null;
  }
}

export async function saveTheme(theme: ThemeConfig): Promise<boolean> {
  try {
    console.log(`💾 Salvando tema "${theme.name}"...`);

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
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (themeError) throw themeError;

    if (theme.colors && Object.keys(theme.colors).length > 0) {
      const colorEntries = Object.entries(theme.colors).map(([type, value]) => ({
        theme_id: theme.id,
        color_type: type,
        color_value: value
      }));

      const { error: colorsError } = await supabase
        .from('theme_colors')
        .upsert(colorEntries, { onConflict: 'theme_id,color_type' });

      if (colorsError) throw colorsError;
    }

    if (theme.emojis && Object.keys(theme.emojis).length > 0) {
      const emojiEntries = Object.entries(theme.emojis).map(([type, value]) => ({
        theme_id: theme.id,
        emoji_type: type,
        emoji_value: value
      }));

      const { error: emojisError } = await supabase
        .from('theme_emojis')
        .upsert(emojiEntries, { onConflict: 'theme_id,emoji_type' });

      if (emojisError) throw emojisError;
    }

    if (theme.componentStyles) {
      const { error: stylesError } = await supabase
        .from('component_styles')
        .upsert({
          theme_id: theme.id,
          component_type: 'productCard',
          styles: theme.componentStyles
        }, { onConflict: 'theme_id,component_type' });

      if (stylesError) throw stylesError;
    }

    console.log(`✅ Tema "${theme.name}" salvo!`);
    return true;

  } catch (error) {
    console.error(`❌ Erro ao salvar tema:`, error);
    return false;
  }
}

// FUNÇÃO activateTheme CORRIGIDA - AGORA COM WHERE CLAUSE
export async function activateTheme(themeId: string): Promise<boolean> {
  try {
    console.log(`🎯 Ativando tema ${themeId}...`);

    // 1. Primeiro verifica se o tema existe
    const { data: themeToActivate, error: checkError } = await supabase
      .from('themes')
      .select('id, name, is_default')
      .eq('id', themeId)
      .single();

    if (checkError || !themeToActivate) {
      console.error(`❌ Tema ${themeId} não encontrado:`, checkError);
      return false;
    }

    console.log(`📋 Tema encontrado: ${themeToActivate.name}`);

    // 2. Se for o mesmo tema que já está ativo, não faz nada
    const { data: currentlyActive } = await supabase
      .from('themes')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (currentlyActive && currentlyActive[0]?.id === themeId) {
      console.log(`ℹ️  Tema ${themeToActivate.name} já está ativo`);
      return true;
    }

    // 3. Inicia uma transação
    console.log('🔄 Iniciando ativação...');
    
    // Primeiro: Desativa todos os temas (COM WHERE para evitar erro)
    const { error: deactivateError } = await supabase
      .from('themes')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .neq('id', 'nonexistent'); // Usando neq para atualizar todos (trick seguro)

    if (deactivateError) {
      console.error('❌ Erro ao desativar temas:', deactivateError);
      // Tentar abordagem alternativa: desativar um por um
      await deactivateAllThemesIndividually();
    } else {
      console.log('✅ Todos os temas foram desativados');
    }

    // Segundo: Ativa apenas o tema selecionado
    const { error: activateError } = await supabase
      .from('themes')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', themeId);

    if (activateError) {
      console.error('❌ Erro ao ativar novo tema:', activateError);
      
      // EM CASO DE ERRO: Tenta ativar o tema padrão
      console.log('🔄 Tentando fallback para tema padrão...');
      await activateDefaultTheme();
      return false;
    }

    console.log(`✅ Tema ${themeToActivate.name} ativado com sucesso!`);
    return true;

  } catch (error) {
    console.error(`❌ Erro crítico ao ativar tema:`, error);
    
    // Fallback para tema padrão em caso de erro
    await activateDefaultTheme();
    return false;
  }
}

// 🆕 NOVA FUNÇÃO: Buscar tema específico de uma página
export async function getThemeForPage(pagePath: string): Promise<ThemeConfig | null> {
  try {
    console.log(`🔍 Buscando tema para página: ${pagePath}`);
    
    // Primeiro, busca se há um tema específico para esta página
    const { data: pageThemeData, error: pageError } = await supabase
      .from('page_themes')
      .select('theme_id')
      .eq('page_path', pagePath)
      .limit(1);

    if (pageError) {
      console.error('❌ Erro ao buscar tema da página:', pageError);
      return null;
    }

    // Se encontrou um tema específico para a página
    if (pageThemeData && pageThemeData.length > 0 && pageThemeData[0].theme_id) {
      const themeId = pageThemeData[0].theme_id;
      console.log(`🎯 Tema específico encontrado para página ${pagePath}: ${themeId}`);
      
      // Busca os detalhes do tema
      const theme = await getThemeById(themeId);
      if (theme) {
        console.log(`✅ Tema da página carregado: ${theme.name}`);
        return theme;
      }
    }

    console.log(`📭 Nenhum tema específico para a página ${pagePath}`);
    return null;

  } catch (error) {
    console.error(`❌ Erro ao buscar tema para página ${pagePath}:`, error);
    return null;
  }
}

// 🆕 NOVA FUNÇÃO: Buscar tema efetivo considerando página
export async function getEffectiveTheme(pagePath?: string): Promise<ThemeConfig> {
  try {
    console.log(`🎯 Buscando tema efetivo${pagePath ? ` para página ${pagePath}` : ''}...`);
    
    let theme: ThemeConfig | null = null;

    // 1. PRIORIDADE: Tema específico da página (se página for fornecida)
    if (pagePath) {
      theme = await getThemeForPage(pagePath);
      if (theme) {
        console.log(`✅ Usando tema específico da página: ${theme.name}`);
        return theme;
      }
    }

    // 2. PRIORIDADE: Tema ativo global
    theme = await getActiveTheme();
    if (theme) {
      console.log(`✅ Usando tema ativo global: ${theme.name}`);
      return theme;
    }

    // 3. PRIORIDADE: Tema padrão como fallback final
    console.log('⚠️  Nenhum tema encontrado, usando padrão');
    const defaultTheme = await getThemeById('default');
    if (defaultTheme) {
      return defaultTheme;
    }

    // 4. EMERGÊNCIA: Tema de emergência
    return getDefaultThemes()[0];

  } catch (error) {
    console.error('❌ Erro ao buscar tema efetivo:', error);
    return getDefaultThemes()[0];
  }
}

// Função auxiliar para desativar todos os temas individualmente
async function deactivateAllThemesIndividually(): Promise<void> {
  try {
    console.log('🔄 Desativando temas individualmente...');
    
    // Busca todos os temas
    const { data: allThemes, error } = await supabase
      .from('themes')
      .select('id');
    
    if (error) {
      console.error('❌ Erro ao buscar temas:', error);
      return;
    }
    
    if (!allThemes || allThemes.length === 0) {
      console.log('ℹ️  Nenhum tema encontrado para desativar');
      return;
    }
    
    // Desativa cada tema individualmente
    for (const theme of allThemes) {
      const { error: updateError } = await supabase
        .from('themes')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', theme.id);
      
      if (updateError) {
        console.error(`❌ Erro ao desativar tema ${theme.id}:`, updateError);
      }
    }
    
    console.log(`✅ ${allThemes.length} temas desativados individualmente`);
    
  } catch (error) {
    console.error('❌ Erro em deactivateAllThemesIndividually:', error);
  }
}

// Nova função específica para ativar o tema padrão
export async function activateDefaultTheme(): Promise<boolean> {
  try {
    console.log('🔄 Ativando tema padrão...');
    
    // 1. Busca o tema padrão
    const { data: defaultTheme, error: findError } = await supabase
      .from('themes')
      .select('id, name')
      .eq('is_default', true)
      .limit(1);

    if (findError || !defaultTheme || defaultTheme.length === 0) {
      console.error('❌ Não foi possível encontrar tema padrão:', findError);
      return false;
    }

    const defaultThemeId = defaultTheme[0].id;
    const defaultThemeName = defaultTheme[0].name;
    
    // 2. Desativa todos os outros temas (exceto o padrão)
    const { error: deactivateError } = await supabase
      .from('themes')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .neq('id', defaultThemeId);

    if (deactivateError) {
      console.error('❌ Erro ao desativar temas:', deactivateError);
      // Tenta a abordagem individual
      await deactivateAllThemesIndividuallyExcept(defaultThemeId);
    }

    // 3. Ativa apenas o tema padrão
    const { error: activateError } = await supabase
      .from('themes')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', defaultThemeId);

    if (activateError) {
      console.error('❌ Erro ao ativar tema padrão:', activateError);
      return false;
    }

    console.log(`✅ Tema padrão "${defaultThemeName}" ativado com sucesso!`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro no activateDefaultTheme:', error);
    return false;
  }
}

// Função auxiliar para desativar todos exceto um
async function deactivateAllThemesIndividuallyExcept(exceptThemeId: string): Promise<void> {
  try {
    console.log(`🔄 Desativando todos os temas exceto ${exceptThemeId}...`);
    
    const { data: allThemes, error } = await supabase
      .from('themes')
      .select('id')
      .neq('id', exceptThemeId);
    
    if (error || !allThemes) {
      console.error('❌ Erro ao buscar temas:', error);
      return;
    }
    
    for (const theme of allThemes) {
      const { error: updateError } = await supabase
        .from('themes')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', theme.id);
      
      if (updateError) {
        console.error(`❌ Erro ao desativar tema ${theme.id}:`, updateError);
      }
    }
    
    console.log(`✅ ${allThemes.length} temas desativados (exceto ${exceptThemeId})`);
    
  } catch (error) {
    console.error('❌ Erro em deactivateAllThemesIndividuallyExcept:', error);
  }
}

// ============================================
// FUNÇÕES DEFAULT
// ============================================

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
      headerBg: '#ffffff',
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
  }];
}