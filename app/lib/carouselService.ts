import { supabase } from '../../lib/supabaseClient';
import { CarouselConfig } from '../types';

export const carouselService = {
  // Obter configurações de carrossel para uma página
  async getCarouselConfigs(pageSlug: string): Promise<CarouselConfig[]> {
    try {
      const { data, error } = await supabase
        .from('carousel_configs')
        .select('*')
        .eq('page_slug', pageSlug)
        .order('carousel_type', { ascending: true });

      if (error) {
        console.error('Erro ao buscar configurações de carrossel:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço de carrosséis:', error);
      return [];
    }
  },

  // Salvar configuração de carrossel
  async saveCarouselConfig(config: Partial<CarouselConfig>): Promise<CarouselConfig | null> {
    try {
      const { data, error } = await supabase
        .from('carousel_configs')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar configuração de carrossel:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return null;
    }
  },

  // Obter produtos mais vendidos
  async getBestsellers(category: string, limit: number = 10): Promise<any[]> {
    try {
      // Buscar produtos com mais vendas do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        console.error('Erro ao buscar itens de pedidos:', error);
        return [];
      }

      // Contar vendas por produto
      const salesCount: Record<string, number> = {};
      orderItems?.forEach(item => {
        salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
      });

      // Buscar produtos da categoria
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .in('id', Object.keys(salesCount));

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        return [];
      }

      // Adicionar contagem de vendas e ordenar
      const productsWithSales = (products || []).map(product => ({
        ...product,
        sales_count: salesCount[product.id] || 0
      })).sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, limit);

      return productsWithSales;
    } catch (error) {
      console.error('Erro ao buscar mais vendidos:', error);
      return [];
    }
  },

  // Obter lançamentos
  async getNewArrivals(category: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      return [];
    }
  },

  // Criar configurações padrão para uma página
  async createDefaultConfigs(pageSlug: string): Promise<boolean> {
    try {
      // DETERMINAR QUAIS CONFIGURAÇÕES USAR BASEADO NA PÁGINA
      let defaultConfigs: any[] = [];
      
      // CONFIGURAÇÕES PARA POKÉMON TCG
      if (pageSlug === 'pokemontcg') {
        defaultConfigs = [
          {
            page_slug: pageSlug,
            carousel_type: 'all',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#ef4444',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#ef4444',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#dc2626',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#ef4444',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff', // BRANCO em vez de 'transparent'
            view_all_button_text_color: '#ef4444',
            view_all_button_border_color: '#ef4444',
            view_all_button_hover_bg_color: '#ef4444',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#ef4444',
            view_all_back_button_bg_color: '#ffffff', // BRANCO em vez de 'transparent'
            view_all_back_button_text_color: '#ef4444',
            view_all_back_button_hover_bg_color: '#ef4444',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'bestsellers',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#059669',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#059669',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#047857',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#059669',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#059669',
            view_all_button_border_color: '#059669',
            view_all_button_hover_bg_color: '#059669',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#059669',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#059669',
            view_all_back_button_hover_bg_color: '#059669',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'new_arrivals',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#7c3aed',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#7c3aed',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#6d28d9',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#7c3aed',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#7c3aed',
            view_all_button_border_color: '#7c3aed',
            view_all_button_hover_bg_color: '#7c3aed',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#7c3aed',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#7c3aed',
            view_all_back_button_hover_bg_color: '#7c3aed',
            view_all_back_button_hover_text_color: '#ffffff'
          }
        ];
      }
      
      // CONFIGURAÇÕES PARA JOGOS DE TABULEIRO
      else if (pageSlug === 'jogosdetabuleiro') {
        defaultConfigs = [
          {
            page_slug: pageSlug,
            carousel_type: 'all',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#059669',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#059669',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#047857',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#059669',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#059669',
            view_all_button_border_color: '#059669',
            view_all_button_hover_bg_color: '#059669',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#059669',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#059669',
            view_all_back_button_hover_bg_color: '#059669',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'bestsellers',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#dc2626',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#dc2626',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#b91c1c',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#dc2626',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#dc2626',
            view_all_button_border_color: '#dc2626',
            view_all_button_hover_bg_color: '#dc2626',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#dc2626',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#dc2626',
            view_all_back_button_hover_bg_color: '#dc2626',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'new_arrivals',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#7c3aed',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#7c3aed',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#6d28d9',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#7c3aed',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#7c3aed',
            view_all_button_border_color: '#7c3aed',
            view_all_button_hover_bg_color: '#7c3aed',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#7c3aed',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#7c3aed',
            view_all_back_button_hover_bg_color: '#7c3aed',
            view_all_back_button_hover_text_color: '#ffffff'
          }
        ];
      }
      
      // CONFIGURAÇÕES PARA ACESSÓRIOS
      else if (pageSlug === 'acessorios') {
        defaultConfigs = [
          {
            page_slug: pageSlug,
            carousel_type: 'all',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#7c3aed',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#7c3aed',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#6d28d9',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#7c3aed',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#7c3aed',
            view_all_button_border_color: '#7c3aed',
            view_all_button_hover_bg_color: '#7c3aed',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#7c3aed',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#7c3aed',
            view_all_back_button_hover_bg_color: '#7c3aed',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'bestsellers',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#dc2626',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#dc2626',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#b91c1c',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#dc2626',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#dc2626',
            view_all_button_border_color: '#dc2626',
            view_all_button_hover_bg_color: '#dc2626',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#dc2626',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#dc2626',
            view_all_back_button_hover_bg_color: '#dc2626',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'new_arrivals',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#059669',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#059669',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#047857',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#059669',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#059669',
            view_all_button_border_color: '#059669',
            view_all_button_hover_bg_color: '#059669',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#059669',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#059669',
            view_all_back_button_hover_bg_color: '#059669',
            view_all_back_button_hover_text_color: '#ffffff'
          }
        ];
      }
      
      // CONFIGURAÇÕES PARA HOT WHEELS
      else if (pageSlug === 'hotwheels') {
        defaultConfigs = [
          {
            page_slug: pageSlug,
            carousel_type: 'all',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#dc2626',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#dc2626',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#b91c1c',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#dc2626',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#dc2626',
            view_all_button_border_color: '#dc2626',
            view_all_button_hover_bg_color: '#dc2626',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#dc2626',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#dc2626',
            view_all_back_button_hover_bg_color: '#dc2626',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'bestsellers',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#7c3aed',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#7c3aed',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#6d28d9',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#7c3aed',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#7c3aed',
            view_all_button_border_color: '#7c3aed',
            view_all_button_hover_bg_color: '#7c3aed',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#7c3aed',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#7c3aed',
            view_all_back_button_hover_bg_color: '#7c3aed',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'new_arrivals',
            title_text_color: '#000000',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#059669',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#059669',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#047857',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#000000',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#059669',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#059669',
            view_all_button_border_color: '#059669',
            view_all_button_hover_bg_color: '#059669',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#059669',
            view_all_back_button_bg_color: '#ffffff',
            view_all_back_button_text_color: '#059669',
            view_all_back_button_hover_bg_color: '#059669',
            view_all_back_button_hover_text_color: '#ffffff'
          }
        ];
      }
      
      // PÁGINA NÃO RECONHECIDA - RETORNA VAZIO
      else {
        console.log(`ℹ️ Página não reconhecida para configurações padrão: ${pageSlug}`);
        console.log(`ℹ️ As configurações devem ser criadas manualmente via SQL ou editor`);
        return false;
      }

      // SE ENCONTRAMOS CONFIGURAÇÕES PARA ESTA PÁGINA, TENTA INSERIR
      if (defaultConfigs.length > 0) {
        const { error } = await supabase
          .from('carousel_configs')
          .upsert(defaultConfigs, {
            onConflict: 'page_slug,carousel_type'
          });

        if (error) {
          console.error('Erro ao criar configurações padrão:', error);
          console.error('Detalhes:', error.message);
          return false;
        }

        console.log(`✅ Configurações padrão criadas para: ${pageSlug}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao criar configurações padrão:', error);
      return false;
    }
  }
};