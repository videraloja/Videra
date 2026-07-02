import { supabase } from './supabaseClient';
import { Product } from '@/app/types';

export interface PromotionalPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  hero_image_url?: string;
  hero_image_mobile_url?: string | null;
  filters: Record<string, any>;
  product_ids: string[];
  theme_id?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  show_overlay?: boolean;
}

export interface PromotionalPageWithTheme extends PromotionalPage {
  theme?: {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      cardBackground?: string;
      border?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
    emojis: {
      cart: string;
      search: string;
      info: string;
      discount: string;
      [key: string]: string;
    };
    backgroundImage?: string;
    backgroundEffect?: string;
  };
}

class PromotionalPagesService {
  // 🎯 BUSCAR PÁGINA POR SLUG - CORRIGIDO!
  async getPageBySlug(slug: string): Promise<PromotionalPageWithTheme | null> {
    try {
      console.log('🔍 Buscando página por slug:', slug);
      
      // 🔥 PRIMEIRO: Buscar a página (SEM JOIN)
      const { data: page, error: pageError } = await supabase
        .from('promotional_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (pageError || !page) {
        console.error('❌ Página promocional não encontrada:', slug, pageError);
        return null;
      }

      console.log('✅ Página encontrada:', page.title);

      // Verificar se está dentro do período válido
      const now = new Date();
      if (page.start_date && new Date(page.start_date) > now) {
        console.log('⏳ Página ainda não disponível:', slug);
        return null;
      }
      if (page.end_date && new Date(page.end_date) < now) {
        console.log('⏰ Página expirada:', slug);
        return null;
      }

      // 🔥 SEGUNDO: Buscar tema separadamente (se existir)
      let theme = null;
      if (page.theme_id) {
        console.log('🎨 Buscando tema:', page.theme_id);
        const { data: themeData, error: themeError } = await supabase
          .from('themes')
          .select('*')
          .eq('id', page.theme_id)
          .single();

        if (!themeError && themeData) {
          theme = themeData;
          console.log('✅ Tema encontrado:', theme.name);
        } else {
          console.log('⚠️ Tema não encontrado para ID:', page.theme_id);
        }
      }

      const result = {
        ...page,
        theme
      } as PromotionalPageWithTheme;

      console.log('🎨 PÁGINA COM TEMA:', result.theme ? 'Sim' : 'Não');
      return result;

    } catch (error) {
      console.error('❌ Erro ao buscar página promocional:', error);
      return null;
    }
  }

  // 🎯 BUSCAR PRODUTOS DA PÁGINA (filtros + específicos)
  async getPageProducts(page: PromotionalPage): Promise<Product[]> {
    let products: Product[] = [];

    try {
      // 1. Buscar por filtros (se existirem)
      if (page.filters && Object.keys(page.filters).length > 0) {
        const filteredProducts = await this.applyFilters(page.filters);
        products = [...products, ...filteredProducts];
      }

      // 2. Buscar produtos específicos (se existirem)
      if (page.product_ids && page.product_ids.length > 0) {
        const specificProducts = await this.getSpecificProducts(page.product_ids);
        products = [...products, ...specificProducts];
      }

      // 3. Remover duplicados por ID
      products = this.removeDuplicates(products);

      // 4. Ordenar (produtos específicos primeiro, depois por nome)
      products.sort((a, b) => {
        const aIsSpecific = page.product_ids?.includes(a.id.toString()) || false;
        const bIsSpecific = page.product_ids?.includes(b.id.toString()) || false;
        
        if (aIsSpecific && !bIsSpecific) return -1;
        if (!aIsSpecific && bIsSpecific) return 1;
        
        return a.name.localeCompare(b.name);
      });

      return products;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos da página:', error);
      return [];
    }
  }

  // 🔧 APLICAR FILTROS
  private async applyFilters(filters: Record<string, any>): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*');

      // Aplicar filtros dinamicamente
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.collection) {
        const normalizedCollection = filters.collection
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-');
        
        query = query.eq('collection', normalizedCollection);
      }
      if (filters.product_type) {
        query = query.eq('product_type', filters.product_type);
      }
      if (filters.on_sale) {
        query = query.eq('on_sale', true);
      }
      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters.in_stock) {
        query = query.gt('stock', 0);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao aplicar filtros:', error);
        return [];
      }

      return data as Product[];
    } catch (error) {
      console.error('❌ Erro ao aplicar filtros:', error);
      return [];
    }
  }

  // 🔧 BUSCAR PRODUTOS ESPECÍFICOS
  private async getSpecificProducts(productIds: string[]): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) {
        console.error('❌ Erro ao buscar produtos específicos:', error);
        return [];
      }

      return data as Product[];
    } catch (error) {
      console.error('❌ Erro ao buscar produtos específicos:', error);
      return [];
    }
  }

  // 🔧 REMOVER DUPLICADOS
  private removeDuplicates(products: Product[]): Product[] {
    const seen = new Set();
    return products.filter(product => {
      const duplicate = seen.has(product.id);
      seen.add(product.id);
      return !duplicate;
    });
  }

  // 🎯 LISTAR TODAS PÁGINAS (para admin)
  async getAllPages(signal?: AbortSignal): Promise<PromotionalPage[]> {
    try {
      const query = supabase
        .from('promotional_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (signal) query.abortSignal(signal);
      const { data, error } = await query;

      if (error) {
        if (error.name !== 'AbortError' && !(error.message && error.message.includes('AbortError'))) {
          console.error('❌ Erro ao listar páginas:', error);
        }
        return [];
      }

      return data as PromotionalPage[];
    } catch (error: any) {
      if (error.name !== 'AbortError' && !(error.message && error.message.includes('AbortError'))) {
        console.error('❌ Erro ao listar páginas:', error);
      }
      return [];
    }
  }

  // 🎯 BUSCAR PÁGINA POR ID (para admin)
  async getPageById(id: string, signal?: AbortSignal): Promise<PromotionalPage | null> {
    try {
      let query = supabase
        .from('promotional_pages')
        .select('*')
        .eq('id', id);

      if (signal) query.abortSignal(signal);
      const { data, error } = await query.single();

      if (error) {
        if (error.name !== 'AbortError' && !(error.message && error.message.includes('AbortError'))) {
          console.error(`❌ Erro ao buscar página com ID ${id}:`, error);
        }
        return null;
      }
      return data as PromotionalPage;
    } catch (error: any) {
      if (error.name !== 'AbortError' && !(error.message && error.message.includes('AbortError'))) {
        console.error(`❌ Erro ao buscar página com ID ${id}:`, error);
      }
      return null;
    }
  }

  // 🎯 CRIAR NOVA PÁGINA (para admin)
  async createPage(data: Omit<PromotionalPage, 'id' | 'created_at'>): Promise<PromotionalPage | null> {
    try {
      const { data: page, error } = await supabase
        .from('promotional_pages')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar página:', error);
        return null;
      }

      return page as PromotionalPage;
    } catch (error) {
      console.error('❌ Erro ao criar página:', error);
      return null;
    }
  }

  // 🎯 ATUALIZAR PÁGINA (para admin)
  async updatePage(id: string, data: Partial<PromotionalPage>): Promise<PromotionalPage | null> {
    try {      
      // 1. Executa o update
      const { error: updateError } = await supabase
        .from('promotional_pages')
        .update(data)
        .eq('id', id);

      if (updateError) {
        console.error('❌ Erro na operação de UPDATE da página:', updateError);
        throw updateError;
      }

      // 2. Se o update foi bem sucedido, busca os dados atualizados para garantir consistência
      const { data: page, error: fetchError } = await supabase
        .from('promotional_pages')
        .select('*')
        .eq('id', id)
        .select()
        .single();

      if (fetchError) {
        console.error('❌ Erro ao RE-BUSCAR a página após o update:', fetchError);
        // Mesmo que o update tenha funcionado, não podemos confirmar. Lançar erro.
        throw fetchError;
      }

      console.log('✅ Página atualizada e re-buscada com sucesso.');
      return page as PromotionalPage;
    } catch (error: any) {
      console.error('❌ Erro geral na função updatePage:', error);
      throw error; // Relança o erro para o componente que chamou
    }
  }

  // 🎯 EXCLUIR PÁGINA (para admin)
  async deletePage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotional_pages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir página:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir página:', error);
      return false;
    }
  }
}

export const promotionalPagesService = new PromotionalPagesService();