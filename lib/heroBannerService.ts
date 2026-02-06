// lib/heroBannerService.ts
import { supabase } from './supabaseClient';

export interface HeroBanner {
  id: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  transition_time: number; // 3-5 segundos
   start_date?: string | null; // ← ACEITA string OU null
  end_date?: string | null;
  created_at: string;
}

// Função auxiliar PRIVADA (fora do objeto)
const sanitizeDates = (data: any): any => {
  const sanitized = { ...data };
  
  // Converter string vazia para null
  if (sanitized.start_date === '') {
    sanitized.start_date = null;
  }
  
  if (sanitized.end_date === '') {
    sanitized.end_date = null;
  }
  
  return sanitized;
};

export const heroBannerService = {
  // Buscar todos os banners ativos
  async getActiveBanners(): Promise<HeroBanner[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar banners:', error);
      return [];
    }
    
    return data || [];
  },

  // Upload de imagem
  async uploadImage(file: File): Promise<string | null> {
    const fileName = `hero-banner-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `hero-banners/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return publicUrl;
  },

  // CRUD completo
  async createBanner(banner: Omit<HeroBanner, 'id' | 'created_at'>): Promise<HeroBanner | null> {
    // Sanitizar datas antes de enviar
    const sanitizedBanner = sanitizeDates(banner);
    
    const { data, error } = await supabase
      .from('hero_banners')
      .insert([sanitizedBanner])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar banner:', error);
      console.error('Detalhes do erro:', error.details, error.hint, error.message);
      return null;
    }
    
    return data;
  },

  async updateBanner(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner | null> {
    // Sanitizar datas antes de enviar
    const sanitizedUpdates = sanitizeDates(updates);
    
    const { data, error } = await supabase
      .from('hero_banners')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar banner:', error);
      return null;
    }
    
    return data;
  },

  async deleteBanner(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('hero_banners')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar banner:', error);
      return false;
    }
    
    return true;
  },

  async reorderBanners(orderedIds: string[]): Promise<boolean> {
    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index
    }));
    
    const { error } = await supabase
      .from('hero_banners')
      .upsert(updates);
    
    if (error) {
      console.error('Erro ao reordenar banners:', error);
      return false;
    }
    
    return true;
  }
};