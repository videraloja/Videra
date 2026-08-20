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

  // Obter produtos mais vendidos (corrigido para Home)
  async getBestsellers(category: string, limit: number = 10): Promise<any[]> {
    try {
      // Buscar vendas do mês atual
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

      const soldProductIds = Object.keys(salesCount);
      if (soldProductIds.length === 0) {
        // Sem vendas no período: id=in.() nunca retorna nada, evita a requisição
        return [];
      }

      // Buscar produtos: se for 'home', não filtrar por categoria
      let productQuery = supabase
        .from('products')
        .select('id, name, slug, price, original_price, sale_price, on_sale, image_url, category, stock, collection, is_preorder');
      if (category && category !== 'home') {
        productQuery = productQuery.eq('category', category);
      }

      const { data: products, error: productsError } = await productQuery
        .in('id', soldProductIds);

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        return [];
      }

      // Ordenar por vendas e limitar
      const productsWithSales = (products || [])
        .map(product => ({
          ...product,
          sales_count: salesCount[product.id] || 0
        }))
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, limit);

      return productsWithSales;
    } catch (error) {
      console.error('Erro ao buscar mais vendidos:', error);
      return [];
    }
  },

  // Obter lançamentos (corrigido para Home)
  async getNewArrivals(category: string, limit: number = 10): Promise<any[]> {
    try {
      let query = supabase
        .from('products')
        .select('id, name, slug, price, original_price, sale_price, on_sale, image_url, category, stock, collection, is_preorder, created_at');
      if (category && category !== 'home') {
        query = query.eq('category', category);
      }
      const { data, error } = await query
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
      let defaultConfigs: any[] = [];

      if (pageSlug === 'home') {
        defaultConfigs = [
          {
            page_slug: pageSlug,
            carousel_type: 'all',
            title_text_color: '#1f2937',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#10b981',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#10b981',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#059669',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#1f2937',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#10b981',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: 'transparent',
            view_all_button_text_color: '#10b981',
            view_all_button_border_color: '#10b981',
            view_all_button_hover_bg_color: '#10b981',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#10b981',
            view_all_back_button_bg_color: 'transparent',
            view_all_back_button_text_color: '#10b981',
            view_all_back_button_hover_bg_color: '#10b981',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'bestsellers',
            title_text_color: '#1f2937',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#f59e0b',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#f59e0b',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#d97706',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#1f2937',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#f59e0b',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: 'transparent',
            view_all_button_text_color: '#f59e0b',
            view_all_button_border_color: '#f59e0b',
            view_all_button_hover_bg_color: '#f59e0b',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#f59e0b',
            view_all_back_button_bg_color: 'transparent',
            view_all_back_button_text_color: '#f59e0b',
            view_all_back_button_hover_bg_color: '#f59e0b',
            view_all_back_button_hover_text_color: '#ffffff'
          },
          {
            page_slug: pageSlug,
            carousel_type: 'new_arrivals',
            title_text_color: '#1f2937',
            title_font_size: 24,
            title_font_weight: '700',
            badge_bg_color: '#8b5cf6',
            badge_text_color: '#ffffff',
            arrow_bg_color: '#8b5cf6',
            arrow_text_color: '#ffffff',
            arrow_hover_bg_color: '#7c3aed',
            arrow_hover_text_color: '#ffffff',
            show_arrows: true,
            show_badges: true,
            items_per_view: 4,
            auto_scroll: false,
            auto_scroll_interval: 5000,
            view_all_title_color: '#1f2937',
            view_all_title_font_size: 28,
            view_all_title_font_weight: '700',
            view_all_badge_bg_color: '#8b5cf6',
            view_all_badge_text_color: '#ffffff',
            view_all_button_bg_color: 'transparent',
            view_all_button_text_color: '#8b5cf6',
            view_all_button_border_color: '#8b5cf6',
            view_all_button_hover_bg_color: '#8b5cf6',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#8b5cf6',
            view_all_back_button_bg_color: 'transparent',
            view_all_back_button_text_color: '#8b5cf6',
            view_all_back_button_hover_bg_color: '#8b5cf6',
            view_all_back_button_hover_text_color: '#ffffff'
          }
        ];
      } else if (pageSlug === 'pokemontcg') {
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
            view_all_button_bg_color: '#ffffff',
            view_all_button_text_color: '#ef4444',
            view_all_button_border_color: '#ef4444',
            view_all_button_hover_bg_color: '#ef4444',
            view_all_button_hover_text_color: '#ffffff',
            view_all_button_hover_border_color: '#ef4444',
            view_all_back_button_bg_color: '#ffffff',
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
      } else if (pageSlug === 'jogosdetabuleiro') {
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
      } else if (pageSlug === 'acessorios') {
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
      } else if (pageSlug === 'hotwheels') {
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
      } else {
        console.log(`ℹ️ Página não reconhecida para configurações padrão: ${pageSlug}`);
        console.log(`ℹ️ As configurações devem ser criadas manualmente via SQL ou editor`);
        return false;
      }

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