// Funções de rastreamento de e-commerce (GA4 + Meta Pixel). Todas são no-op
// silencioso se o script correspondente não carregou (variável de ambiente
// ausente/vazia) — nunca lançam erro nem bloqueiam a UI.
'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

interface AnalyticsProduct {
  id: number | string;
  name: string;
  price: number;
  category?: string;
}

function safeGtag(...args: unknown[]) {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag(...args);
  } catch {
    // nunca deixa uma falha de analytics quebrar a página
  }
}

function safeFbq(...args: unknown[]) {
  if (typeof window === 'undefined' || !window.fbq) return;
  try {
    window.fbq(...args);
  } catch {
    // nunca deixa uma falha de analytics quebrar a página
  }
}

export function trackViewItem(product: AnalyticsProduct) {
  safeGtag('event', 'view_item', {
    currency: 'BRL',
    value: product.price,
    items: [{
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      price: product.price,
    }],
  });
  safeFbq('track', 'ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'BRL',
  });
}

export function trackAddToCart(product: AnalyticsProduct, quantity: number = 1) {
  safeGtag('event', 'add_to_cart', {
    currency: 'BRL',
    value: product.price * quantity,
    items: [{
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity,
    }],
  });
  safeFbq('track', 'AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.price * quantity,
    currency: 'BRL',
  });
}

export function trackBeginCheckout(items: (AnalyticsProduct & { quantity: number })[], total: number) {
  safeGtag('event', 'begin_checkout', {
    currency: 'BRL',
    value: total,
    items: items.map((item) => ({
      item_id: String(item.id),
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
  safeFbq('track', 'InitiateCheckout', {
    content_ids: items.map((item) => String(item.id)),
    contents: items.map((item) => ({ id: String(item.id), quantity: item.quantity })),
    content_type: 'product',
    value: total,
    currency: 'BRL',
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  });
}

// Evento customizado no clique de "Enviar Pedido no WhatsApp" — não altera a
// mensagem nem o comportamento do botão, só registra que o pedido foi enviado.
export function trackWhatsAppOrder(orderCode: string, total: number) {
  safeGtag('event', 'send_whatsapp_order', {
    order_code: orderCode,
    value: total,
    currency: 'BRL',
  });
  safeFbq('trackCustom', 'WhatsAppOrder', {
    order_code: orderCode,
    value: total,
    currency: 'BRL',
  });
}
