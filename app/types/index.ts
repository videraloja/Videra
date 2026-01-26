// app/types/index.ts - ATUALIZADO COM backgroundImage (ÚNICA IMAGEM POR TEMA)
export interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  sale_price?: number;
  on_sale: boolean;
  image_url: string;
  stock: number;
  category?: string;
  product_type?: string;
  collection?: string;
  rarity?: string;
  description?: string;
  tags?: string[];
  card_set?: string;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Filters {
  productType: string;
  collection: string;
  rarity: string;
  priceRange: string;
  searchTerm: string;
  inStock: boolean;
}

// 🆕 NOVAS INTERFACES PARA EDIÇÃO GRANULAR
export interface ProductCardTextStyles {
  color: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string;
}

export interface ProductCardBadgeStyles {
  backgroundColor: string;
  textColor: string;
  position: 'left' | 'right' | 'bottom-left';
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  padding?: string;
}

export interface ProductCardButtonStyles {
  backgroundColor: string;
  textColor: string;
  hoverBackgroundColor: string;
  disabledBackgroundColor: string;
  borderRadius?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: string;
}

export interface ProductCardStyles {
  // 🎨 CORES DOS TEXTOS
  productName: ProductCardTextStyles;
  price: ProductCardTextStyles;
  originalPrice: ProductCardTextStyles & { strikethrough?: boolean };
  salePrice: ProductCardTextStyles;
  stockInfo: ProductCardTextStyles;
  collectionName: ProductCardTextStyles;
  description: ProductCardTextStyles;
  
  // 🔴 BADGES (COM POSIÇÕES FIXAS)
  badgeDiscount: ProductCardBadgeStyles;
  badgeType: ProductCardBadgeStyles;
  badgeUrgent: ProductCardBadgeStyles;
  
  // 🛒 BOTÃO ADICIONAR AO CARRINHO
  addToCart: ProductCardButtonStyles;
  
  // 🎭 ESTILOS DO CARD
  cardBackground: string;
  borderColor: string;
  shadow: string;
  hoverShadow: string;
  cornerRadius: string;
  
  // 🖼️ ELEMENTOS VISUAIS
  imageOverlay: string;
  padding?: string;
  boxShadow?: string;
  border?: string;
}

export interface ComponentStyles {
  productCard: ProductCardStyles;
  // FUTURO: header, filters, buttons, etc.
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBg: string;
    success: string;
    warning: string;
    error: string;
  };
  emojis: {
    cart: string;
    success: string;
    search: string;
    filter: string;
    stock: string;
    category: string;
  };
  effects?: {
    hasSnow?: boolean;
    hasConfetti?: boolean;
    hasSparkles?: boolean;
  };
  
  // 🆕 NOVA PROPRIEDADE PARA EDIÇÃO GRANULAR
  componentStyles?: ComponentStyles;
  
  // 🆕 🆕 🆕 CORREÇÃO: AGORA É backgroundImage (ÚNICA IMAGEM POR TEMA)
  backgroundImage?: {
    url: string;
    overlayColor?: string;
    opacity?: number;
  };
  
  // METADADOS DO TEMA
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Adicione estas interfaces
export interface CarouselConfig {
  id: string;
  page_slug: string;
  carousel_type: 'all' | 'bestsellers' | 'new_arrivals';
  title_text_color: string;
  title_font_size: number;
  title_font_weight: string;
  badge_bg_color: string;
  badge_text_color: string;
  arrow_bg_color: string;
  arrow_text_color: string;
  arrow_hover_bg_color: string;
  arrow_hover_text_color: string;
  show_arrows: boolean;
  show_badges: boolean;
  items_per_view: number;
  auto_scroll: boolean;
  auto_scroll_interval: number;
  created_at: string;
  updated_at: string;
  // 🆕 CAMPOS PARA PÁGINA "VER TODOS"
  view_all_title_color: string;
  view_all_title_font_size: number;
  view_all_title_font_weight: string;
  view_all_badge_bg_color: string;
  view_all_badge_text_color: string;
  view_all_button_bg_color: string;
  view_all_button_text_color: string;
  view_all_button_hover_bg_color: string;
  view_all_button_hover_text_color: string;
  view_all_back_button_bg_color: string;
  view_all_back_button_text_color: string;
  view_all_back_button_hover_bg_color: string;
  view_all_back_button_hover_text_color: string;
  // 🆕 CAMPOS PARA BOTÃO "VER TODOS" NO CARROSSEL
  view_all_button_border_color: string;
  view_all_button_hover_border_color: string;
}

export interface CarouselProduct extends Product {
  sales_count?: number;
}

// 🆕 🆕 🆕 INTERFACE PARA IMAGEM DE FUNDO DO TEMA (MANTIDA PARA COMPATIBILIDADE)
export interface PageBackground {
  pageId?: string; // OPCIONAL - para compatibilidade
  imageUrl: string;
  overlayColor?: string;
  opacity?: number;
}