'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../components/Toast';

interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number | null;
  sale_price?: number | null;
  on_sale?: boolean | null;
  image_url: string;
  category?: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface OrderSuccessData {
  orderCode: string;
  message: string;
  total: number;
  items: CartItem[];
  paymentMethod: string;
  pickupOption: string;
  observations: string;
  timestamp: number;
}

const generateOrderCode = () => {
  const prefix = 'VID';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-2);
  return `${prefix}-${random}${timestamp}`;
};

const hasPromotion = (product: Product) => {
  const isSaleActive = product.on_sale && product.sale_price && product.sale_price > 0;
  const isPriceLower = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
  return !!(isSaleActive || isPriceLower);
};

const getCurrentPrice = (product: Product) => {
  return hasPromotion(product) && product.sale_price && product.sale_price > 0 
    ? product.sale_price 
    : product.price;
};

const getOriginalPrice = (product: Product) => {
  if (product.original_price && product.original_price > 0) {
    return product.original_price;
  }
  return product.price;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [pickupOption, setPickupOption] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showPickupInfoModal, setShowPickupInfoModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalData, setStockModalData] = useState<{ adjustedItems: any[]; unavailableItems: any[] }>({ adjustedItems: [], unavailableItems: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);

  const { showToast, ToastContainer } = useToast();

  const persistState = (nextCart: CartItem[], nextProducts: Product[]) => {
    setCart(nextCart);
    setProducts(nextProducts);
    try {
      localStorage.setItem('cart', JSON.stringify(nextCart));
      localStorage.setItem('products', JSON.stringify(nextProducts));
    } catch (e) {
      console.error('Erro salvando localStorage:', e);
    }
    window.dispatchEvent(new Event('cart-updated'));
  };

  const persistOrderSuccess = (data: OrderSuccessData | null) => {
    setOrderSuccess(data);
    if (data) {
      sessionStorage.setItem('orderSuccess', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('orderSuccess');
    }
  };

  const clearOrderSuccess = () => {
    persistOrderSuccess(null);
  };

  useEffect(() => {
    if (orderSuccess && orderSuccess.timestamp) {
      const now = Date.now();
      const elapsed = now - orderSuccess.timestamp;
      const oneHour = 60 * 60 * 1000;
      if (elapsed >= oneHour) {
        clearOrderSuccess();
      } else {
        const timer = setTimeout(() => {
          clearOrderSuccess();
        }, oneHour - elapsed);
        return () => clearTimeout(timer);
      }
    }
  }, [orderSuccess]);

  useEffect(() => {
    const savedSuccess = sessionStorage.getItem('orderSuccess');
    if (savedSuccess) {
      try {
        const data = JSON.parse(savedSuccess) as OrderSuccessData;
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
          setOrderSuccess(data);
        } else {
          sessionStorage.removeItem('orderSuccess');
        }
      } catch (e) {
        console.error('Erro ao recuperar sucesso:', e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('wasInCart', 'true');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const { data: freshProducts, error } = await supabase
        .from('products')
        .select('*')
        .abortSignal(controller.signal);

      if (error) {
        if (error.name !== 'AbortError' && !(error.message && error.message.includes('AbortError'))) {
          console.error('Erro ao buscar produtos:', error);
        }
        return;
      }

      const updatedProducts = (freshProducts as Product[]) || [];

      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);

      const savedCart = localStorage.getItem('cart');
      let currentCart: CartItem[] = [];

      if (savedCart) {
        try {
          currentCart = JSON.parse(savedCart);

          currentCart = currentCart.map(cartItem => {
            const freshProduct = updatedProducts.find(p => p.id === cartItem.id);
            if (freshProduct) {
              return {
                ...cartItem,
                price: freshProduct.price,
                original_price: freshProduct.original_price,
                sale_price: freshProduct.sale_price,
                on_sale: freshProduct.on_sale,
                stock: freshProduct.stock,
                name: freshProduct.name,
                image_url: freshProduct.image_url,
              };
            }
            return cartItem;
          });

          setCart(currentCart);
          localStorage.setItem('cart', JSON.stringify(currentCart));
        } catch {
          setCart([]);
        }
      }

      setReady(true);
    };

    load();

    const updateHandler = () => {
      // This handler is synchronous, no need for abort controller here.
      const sCart = localStorage.getItem('cart');
      const sProducts = localStorage.getItem('products');
      if (sCart) {
        try {
          const parsed = JSON.parse(sCart) as CartItem[];
          setCart((prev) => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(parsed);
            return prevStr !== newStr ? parsed : prev;
          });
        } catch {}
      }
      if (sProducts) {
        try {
          const parsedP = JSON.parse(sProducts) as Product[];
          setProducts((prev) => {
            const prevStr = JSON.stringify(prev);
            const newStr = JSON.stringify(parsedP);
            return prevStr !== newStr ? parsedP : prev;
          });
        } catch {}
      }
    };

    window.addEventListener('cart-updated', updateHandler);
    window.addEventListener('storage', updateHandler);

    return () => {
      controller.abort();
      window.removeEventListener('cart-updated', updateHandler);
      window.removeEventListener('storage', updateHandler);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Erro ao salvar cart:', e);
    }
    window.dispatchEvent(new Event('cart-updated'));
  }, [cart, ready]);

  const increaseQuantity = (id: number) => {
    const prod = products.find((p) => p.id === id);
    if (!prod || prod.stock <= 0) return;

    const nextProducts = products.map((p) =>
      p.id === id ? { ...p, stock: p.stock - 1 } : p
    );

    const nextCart = cart.map((c) =>
      c.id === id ? { ...c, quantity: c.quantity + 1 } : c
    );

    persistState(nextCart, nextProducts);
  };

  const decreaseQuantity = (id: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;

    if (item.quantity <= 1) {
      const nextCart = cart.filter((c) => c.id !== id);
      const nextProducts = products.map((p) =>
        p.id === id ? { ...p, stock: p.stock + item.quantity } : p
      );
      persistState(nextCart, nextProducts);
      return;
    }

    const nextCart = cart.map((c) =>
      c.id === id ? { ...c, quantity: c.quantity - 1 } : c
    );
    const nextProducts = products.map((p) =>
      p.id === id ? { ...p, stock: p.stock + 1 } : p
    );
    persistState(nextCart, nextProducts);
  };

  const removeFromCart = (id: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    const nextCart = cart.filter((c) => c.id !== id);
    const nextProducts = products.map((p) =>
      p.id === id ? { ...p, stock: p.stock + item.quantity } : p
    );
    persistState(nextCart, nextProducts);
  };

  const clearCart = () => {
    const nextProducts = products.map((p) => {
      const inCart = cart.find((c) => c.id === p.id);
      if (inCart) return { ...p, stock: p.stock + inCart.quantity };
      return p;
    });
    persistState([], nextProducts);
    if (orderSuccess) clearOrderSuccess();
    setTimeout(() => {
      window.dispatchEvent(new Event('cartStateChanged'));
      window.location.reload();
    }, 100);
  };

  const paymentMethodLabels: Record<string, string> = {
    pix: 'Pix',
    credito: 'Cartão de Crédito',
    dinheiro: 'Dinheiro'
  };

  const pickupOptionLabels: Record<string, string> = {
    buscar: 'Vou buscar',
    mandar: 'Vou mandar buscar'
  };

  const handleCreditClick = () => {
    setPaymentMethod('credito');
    setShowCreditModal(true);
  };

  const handleCashClick = () => {
    setPaymentMethod('dinheiro');
    if (pickupOption === 'mandar') {
      setPickupOption('buscar');
    }
    setShowCashModal(true);
  };

  const handlePickupClick = () => {
    setPickupOption('buscar');
    setShowPickupInfoModal(true);
  };

  const handleSendPickupClick = () => {
    if (paymentMethod === 'dinheiro') {
      showToast('Indisponível devido à opção de pagamento em dinheiro. Para pagar em dinheiro, você precisa retirar pessoalmente.', 'warning');
      return;
    }
    setPickupOption('mandar');
    setShowPickupModal(true);
  };

  const createReservations = async (orderId: string, cartItems: CartItem[]) => {
    const itemsForReservation = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const { error } = await supabase.rpc('create_reservations', {
      p_order_id: orderId,
      p_items: itemsForReservation
    });

    if (error) {
      console.error('Erro ao criar reservas:', error);
      throw error;
    }

    console.log(`✅ Reservas criadas para ${cartItems.length} produtos`);
  };

  const processOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const productIds = cart.map(i => i.id);
    const { data: stockData, error: stockError } = await supabase.rpc('get_available_stock', {
      p_product_ids: productIds
    });

    if (stockError) {
      console.error('Erro ao verificar estoque:', stockError);
      showToast('Erro ao verificar disponibilidade. Tente novamente.', 'error');
      setIsProcessing(false);
      return;
    }

    const availableMap = new Map();
    stockData?.forEach((s: { product_id: number; available_stock: number }) => {
      availableMap.set(s.product_id, s.available_stock);
    });

    const unavailableItems: { name: string; available: number; requested: number }[] = [];
    const adjustedItems: { name: string; oldQty: number; newQty: number }[] = [];

    for (const item of cart) {
      const available = availableMap.get(item.id) ?? 0;
      if (available < item.quantity) {
        if (available > 0) {
          adjustedItems.push({
            name: item.name,
            oldQty: item.quantity,
            newQty: available
          });
        } else {
          unavailableItems.push({
            name: item.name,
            available,
            requested: item.quantity
          });
        }
      }
    }

    if (adjustedItems.length > 0 || unavailableItems.length > 0) {
      setStockModalData({ adjustedItems, unavailableItems });
      setShowStockModal(true);
      setIsProcessing(false);
      return;
    }

    const orderCode = generateOrderCode();
    const { data: orderResult, error: orderError } = await supabase.rpc('create_order', {
      p_order_code: orderCode,
      p_status: 'pendente',
      p_payment_method: paymentMethodLabels[paymentMethod],
      p_pickup_option: pickupOptionLabels[pickupOption],
      p_observations: observations || null
    });

    if (orderError || !orderResult?.id) {
      console.error('Erro ao criar pedido:', orderError);
      showToast('Erro ao registrar o pedido. Tente novamente.', 'error');
      setIsProcessing(false);
      return;
    }

    const orderId = orderResult.id;

    try {
      await createReservations(orderId, cart);
    } catch (err) {
      console.error('Erro ao criar reservas:', err);
      await supabase.from('orders').delete().eq('id', orderId);
      showToast('Erro ao processar pedido. Tente novamente.', 'error');
      setIsProcessing(false);
      return;
    }

    const itemsPayload = cart.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: getCurrentPrice(item),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Erro ao salvar itens:", itemsError);
      showToast('Erro ao salvar itens do pedido.', 'error');
      setIsProcessing(false);
      return;
    }

    const total = cart.reduce((s, i) => s + getCurrentPrice(i) * i.quantity, 0);
    const lines = cart.map((i) => {
      const price = getCurrentPrice(i);
      const hasPromo = hasPromotion(i);
      const priceFormatted = `R$ ${price.toFixed(2).replace(".", ",")}`;
      const quantityText = `${i.quantity} ${i.quantity === 1 ? 'uni' : 'uni'}`;

      if (hasPromo) {
        const originalPriceFormatted = `R$ ${getOriginalPrice(i).toFixed(2).replace(".", ",")}`;
        return `• ${i.name} — ${originalPriceFormatted} por ${priceFormatted}\n  ${quantityText}`;
      }
      return `• ${i.name} — ${priceFormatted}\n  ${quantityText}`;
    });

    const message = `
*PEDIDO:* ${orderCode} - ${paymentMethodLabels[paymentMethod]} - ${pickupOptionLabels[pickupOption]}

${lines.join("\n\n")}

*TOTAL: R$ ${total.toFixed(2).replace(".", ",")}*
${observations ? `\n*Observações:* ${observations}` : ''}

___/___/___/___/___
⚠️ *ATENÇÃO:* Não reservamos/seguramos produtos. Seu pedido tem limite de *1 hora* para pagamento/confirmação. Após esse prazo, será necessário fazer um novo pedido.

Aguarde enquanto processamos seu pedido : )
`.trim();

    const phone = '5592986446677';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    const successData: OrderSuccessData = {
      orderCode,
      message,
      total,
      items: [...cart],
      paymentMethod: paymentMethodLabels[paymentMethod],
      pickupOption: pickupOptionLabels[pickupOption],
      observations: observations || '',
      timestamp: Date.now()
    };
    persistOrderSuccess(successData);

    try {
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow) {
        console.warn('Pop-up bloqueado, redirecionamento manual necessário');
      }
    } catch (e) {
      console.error('Erro ao abrir WhatsApp:', e);
    }

    setIsProcessing(false);
  };

  const handleSendOrder = async () => {
    if (!cart || cart.length === 0) {
      showToast('Seu carrinho está vazio!', 'warning');
      return;
    }

    if (!paymentMethod) {
      showToast('Por favor, selecione uma forma de pagamento antes de enviar o pedido.', 'warning');
      return;
    }

    if (!pickupOption) {
      showToast('Por favor, selecione uma opção de retirada antes de enviar o pedido.', 'warning');
      return;
    }

    await processOrder();
  };

  const confirmStockAdjustments = () => {
    const { adjustedItems, unavailableItems } = stockModalData;

    const updatedCart = cart.map(item => {
      const adjusted = adjustedItems.find(a => a.name === item.name);
      if (adjusted) {
        return { ...item, quantity: adjusted.newQty };
      }
      const isRemoved = unavailableItems.find(u => u.name === item.name);
      if (isRemoved) {
        return null;
      }
      return item;
    }).filter(item => item !== null) as CartItem[];

    let updatedProducts = [...products];
    for (const item of cart) {
      const adjusted = adjustedItems.find(a => a.name === item.name);
      const isRemoved = unavailableItems.find(u => u.name === item.name);

      if (adjusted) {
        const diff = item.quantity - adjusted.newQty;
        updatedProducts = updatedProducts.map(p =>
          p.id === item.id ? { ...p, stock: p.stock + diff } : p
        );
      } else if (isRemoved) {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.id ? { ...p, stock: p.stock + item.quantity } : p
        );
      }
    }

    persistState(updatedCart, updatedProducts);
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cartStateChanged'));

    setShowStockModal(false);
    setStockModalData({ adjustedItems: [], unavailableItems: [] });
  };

  const total = cart.reduce((s, i) => s + getCurrentPrice(i) * i.quantity, 0);

  const copyOrderMessage = () => {
    if (orderSuccess) {
      navigator.clipboard.writeText(orderSuccess.message);
      showToast('Pedido copiado! Envie no WhatsApp.', 'success');
    }
  };

  const backToCart = () => {
    clearOrderSuccess();
  };

  if (orderSuccess) {
    return (
      <div className="cart-page" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
        <div className="cart-container" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1f2937' }}>Pedido Registrado!</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Seu pedido foi registrado em nosso sistema.
            </p>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Caso não tenha sido redirecionado automaticamente, copie a mensagem abaixo e envie para o nosso WhatsApp.
            </p>

            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px', textAlign: 'left', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto', fontSize: '14px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {orderSuccess.message}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={copyOrderMessage}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#1e9c33',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 Copiar Pedido
              </button>
              <button
                onClick={backToCart}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#a59d9d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                 Voltar ao Carrinho
              </button>
              <button
                onClick={clearCart}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#a59d9d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                 Limpar Carrinho
              </button>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (!ready) {
    return (
      <>
        <style jsx global>{`
          footer.site-footer, footer:not([class]) {
            display: none !important;
          }
        `}</style>
        <div className="cart-page">
          <div className="cart-container">
            <div className="global-loading-container" style={{ padding: '4rem 2rem' }}>
              <div className="global-spinner" style={{ borderTopColor: '#dc2626' }}></div>
              <p className="global-loading-text">Carregando carrinho...</p>
            </div>
          </div>
          <ToastContainer />
        </div>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
        <div className="cart-container" style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🛍️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>Seu carrinho está vazio</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Parece que você ainda não escolheu seus produtos favoritos.</p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '2rem' }}>Que tal dar uma olhada nas nossas coleções?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
              <Link href="/pokemontcg" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '40px', color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>
                🎴 Pokémon TCG
              </Link>
              <Link href="/jogosdetabuleiro" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '40px', color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>
                🎲 Jogos de Tabuleiro
              </Link>
              <Link href="/acessorios" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '40px', color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>
                🎒 Acessórios
              </Link>
              <Link href="/hotwheels" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '40px', color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem' }}>
                🏎️ Hot Wheels
              </Link>
            </div>
            
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', textDecoration: 'none', borderRadius: '40px', fontWeight: '600' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9L12 3L21 9L12 15L3 9Z" />
                <path d="M5 12V18L12 21L19 18V12" />
              </svg>
              Continuar Comprando
            </Link>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <button 
            onClick={() => {
              window.dispatchEvent(new Event('cart-updated'));
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new CustomEvent('cartStateChanged'));
              window.history.back();
            }} 
            className="back-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Voltar
          </button>
          <div className="header-title">
            <span className="cart-icon">🛒</span>
            <h1>Seu Carrinho</h1>
          </div>
        </div>

        <div className="cart-items">
          {cart.map((item) => {
            const promotionActive = hasPromotion(item);
            const currentPrice = getCurrentPrice(item);
            const originalPrice = getOriginalPrice(item);
            
            return (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <Image
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name}
                    fill
                    sizes="100px"
                    unoptimized
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">
                    {promotionActive ? (
                      <>
                        <span className="original-price-small">R$ {originalPrice.toFixed(2)}</span>
                        <span className="promotional-price-small">R$ {currentPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="current-price-text">R$ {item.price.toFixed(2)}</span>
                    )}
                  </p>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button onClick={() => decreaseQuantity(item.id)} className="qty-btn">-</button>
                      <span className="quantity">{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.id)} className="qty-btn">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">Remover</button>
                  </div>
                </div>
                <div className="item-subtotal">
                  <span className="subtotal-label">Subtotal</span>
                  <span className="subtotal-value">R$ {(currentPrice * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-footer">
          <div className="footer-info">
            <div className="total-section">
              <span className="total-label">Total</span>
              <span className="total-value">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="options-section">
            <label className="section-label"> Forma de Pagamento</label>
            <div className="options-group">
              <button onClick={() => setPaymentMethod('pix')} className={`option-btn ${paymentMethod === 'pix' ? 'active' : ''}`}>Pix</button>
              <button onClick={handleCreditClick} className={`option-btn ${paymentMethod === 'credito' ? 'active' : ''}`}>Cartão de Crédito</button>
              <button onClick={handleCashClick} className={`option-btn ${paymentMethod === 'dinheiro' ? 'active' : ''}`}>Dinheiro</button>
            </div>
          </div>

          <div className="options-section">
            <label className="section-label"> Método Retirada</label>
            <div className="options-group">
              <button onClick={handlePickupClick} className={`option-btn ${pickupOption === 'buscar' ? 'active' : ''}`}>Vou buscar</button>
              <button onClick={handleSendPickupClick} className={`option-btn ${pickupOption === 'mandar' ? 'active' : ''} ${paymentMethod === 'dinheiro' ? 'disabled-option' : ''}`} style={paymentMethod === 'dinheiro' ? { opacity: 0.5, cursor: 'not-allowed' } : {}} disabled={paymentMethod === 'dinheiro'}>Vou mandar buscar</button>
            </div>
            {paymentMethod === 'dinheiro' && <p className="disabled-warning" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>⚠️ Opção indisponível para pagamento em dinheiro</p>}
          </div>

          <div className="store-address-section">
            <div className="address-card">
              <div className="address-icon">🗺️</div>
              <div className="address-content">
                <h4>Nosso Endereço</h4>
                <p><strong>Videra Loja virtual</strong><br />Rua Áurea Graciano, 15 - Col. Santo Antônio<br />Manaus - AM, 69093-045</p>
                <div className="address-actions">
                  <a href="https://www.google.com/maps/place/Videra+Loja+virtual/@-3.0340442,-60.0101189,20.16z/data=!4m6!3m5!1s0x926c1b372da27575:0x4daf1b91802bc5e5!8m2!3d-3.0340946!4d-60.0102163!16s%2Fg%2F11lcmykf0m?entry=ttu&g_ep=EgoyMDI2MDQwNS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="map-link">🗺️ Abrir no Google Maps</a>
                  <button onClick={() => { navigator.clipboard.writeText('Rua Áurea Graciano, 15 - Col. Santo Antônio, Manaus - AM, 69093-045'); showToast('Endereço copiado!', 'success'); }} className="copy-address-btn">📋 Copiar endereço</button>
                </div>
              </div>
            </div>
          </div>

          <div className="options-section">
            <label className="section-label">✏️ Observações (opcional)</label>
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Ex: Horário para retirada, informações adicionais, etc..." className="observations-input" rows={3} />
          </div>

          <div className="footer-actions">
            <button onClick={clearCart} className="btn-secondary">Esvaziar Carrinho</button>
            <button onClick={handleSendOrder} className="btn-primary-whatsapp" disabled={isProcessing}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              {isProcessing ? 'Enviando...' : 'Enviar Pedido no WhatsApp'}
            </button>
          </div>
        </div>
      </div>

      {showCreditModal && (
        <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-icon">💳</span><h3>Pagamento com Cartão de Crédito</h3></div>
            <div className="modal-body"><p>Para pagar no crédito, utilizamos um <strong>Link de Pagamento</strong> que será enviado após a confirmação do pedido.</p><p>Você pode parcelar em até <strong>12x</strong> e pagar diretamente pelo aplicativo do seu banco.</p><div className="alert-message"><span>⚠️</span><span><strong>Atenção:</strong> O valor total sofre um acréscimo devido às taxas do banco.</span></div></div>
            <div className="modal-footer"><button onClick={() => setShowCreditModal(false)} className="modal-btn-primary">Entendi</button></div>
          </div>
        </div>
      )}

      {showPickupModal && (
        <div className="modal-overlay" onClick={() => setShowPickupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-icon">🛵</span><h3>Você escolheu "Vou mandar buscar"</h3></div>
            <div className="modal-body"><p>Nessa modalidade, você precisa solicitar um motorista de aplicativo (Uber, 99, etc.) para retirar o item em nossa loja.</p><p><strong>Não solicitamos o envio.</strong> Fazemos dessa forma para sua melhor comodidade:</p><ul className="modal-list"><li>✓ Você acompanha a corrida em tempo real</li><li>✓ Realiza o pagamento da corrida diretamente no app</li><li>✓ Entra em contato com o motorista caso precise resolver algo</li></ul><p className="modal-note">Após a confirmação do pedido, lhe será enviado nosso endereço e você poderá solicitar a retirada.</p></div>
            <div className="modal-footer"><button onClick={() => setShowPickupModal(false)} className="modal-btn-primary">Entendi</button></div>
          </div>
        </div>
      )}

      {showCashModal && (
        <div className="modal-overlay" onClick={() => setShowCashModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-icon">💵</span><h3>Pagamento em Dinheiro</h3></div>
            <div className="modal-body"><p>Para pagar em dinheiro, você precisa retirar o produto pessoalmente em nossa loja.</p><p>Por favor, informe se precisará de troco ao retirar o pedido.</p><div className="alert-message" style={{ background: '#e6f7e6', borderLeftColor: '#22c55e' }}><span>ℹ️</span><span><strong>Importante:</strong> Esta modalidade não permite envio por motoboy. A retirada deve ser feita presencialmente.</span></div></div>
            <div className="modal-footer"><button onClick={() => setShowCashModal(false)} className="modal-btn-primary">Entendi</button></div>
          </div>
        </div>
      )}

      {showPickupInfoModal && (
        <div className="modal-overlay" onClick={() => setShowPickupInfoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-icon">🏠</span><h3>Retirada Pessoal</h3></div>
            <div className="modal-body"><p>💙 Obrigado por escolher retirar seu pedido pessoalmente!</p><p>Gostaríamos de esclarecer que a Videra Colecionáveis é uma loja 100% online. Não possuímos uma loja física com ponto comercial.</p><p>A retirada dos produtos acontece em nossa residência, localizada em um condomínio residencial. Você será recebido na portaria, onde entregaremos seu pedido em mãos com todo carinho e segurança.</p></div>
            <div className="modal-footer"><button onClick={() => setShowPickupInfoModal(false)} className="modal-btn-primary">Entendi</button></div>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #fef3c7, #fff)', borderBottomColor: '#fde68a' }}><span className="modal-icon">⚠️</span><h3 style={{ color: '#d97706' }}>Atualização do Carrinho</h3></div>
            <div className="modal-body">
              {stockModalData.adjustedItems.length > 0 && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>📦 Quantidades ajustadas:</p>
                  {stockModalData.adjustedItems.map((item, idx) => (
                    <div key={idx} style={{ background: '#fef3c7', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid #f59e0b' }}>
                      <strong>{item.name}</strong> — de <strong>{item.oldQty}</strong> para <strong>{item.newQty}</strong> unidade{item.newQty !== 1 ? 's' : ''}
                    </div>
                  ))}
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.875rem', color: '#92400e', fontStyle: 'italic' }}>⚡ Isso ocorre porque outro cliente acabou comprando antes de você.</p>
                </>
              )}
              {stockModalData.unavailableItems.length > 0 && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: stockModalData.adjustedItems.length > 0 ? '1rem' : '0' }}>❌ Produtos removidos:</p>
                  {stockModalData.unavailableItems.map((item, idx) => (
                    <div key={idx} style={{ background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid #ef4444' }}>
                      <strong>{item.name}</strong>
                    </div>
                  ))}
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.875rem', color: '#991b1b', fontStyle: 'italic' }}>❌ Infelizmente outros clientes compraram antes de você e o produto esgotou.</p>
                </>
              )}
              <div className="alert-message" style={{ background: '#e0f2fe', borderLeftColor: '#0ea5e9', marginTop: '1rem' }}><span>ℹ️</span><span style={{ fontSize: '0.875rem' }}>Seu carrinho foi atualizado automaticamente. Por favor, revise os itens e tente novamente.</span></div>
            </div>
            <div className="modal-footer"><button onClick={confirmStockAdjustments} className="modal-btn-primary">Entendi, revisar carrinho</button></div>
          </div>
        </div>
      )}

      <ToastContainer />

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
          padding: 2rem 1rem;
        }
        .cart-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .cart-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          background: white;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #dc2626; }
        .header-title { display: flex; align-items: center; gap: 0.75rem; }
        .cart-icon { font-size: 1.75rem; }
        .cart-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0; background: linear-gradient(135deg, #dc2626, #b91c1c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cart-items { padding: 1rem 2rem; }
        .cart-item { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem 0; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
        .cart-item:hover { background: #fafafa; margin: 0 -1rem; padding: 1.5rem 1rem; }
        .item-image { width: 100px; height: 100px; flex-shrink: 0; background: #f9f9f9; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: relative; }
        .item-image img { display: none; } /* Oculta tag img se existir, pois usamos next/image */
        .item-details { flex: 1; }
        .item-details h3 { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #1f2937; }
        .item-price { font-size: 1rem; font-weight: 500; margin: 0 0 1rem 0; }
        .current-price-text { color: #dc2626; }
        .original-price-small { text-decoration: line-through; color: #9ca3af; font-size: 0.75rem; margin-right: 6px; }
        .promotional-price-small { color: #dc2626; font-size: 1rem; font-weight: 600; }
        .item-controls { display: flex; align-items: center; gap: 1rem; }
        .quantity-controls { display: flex; align-items: center; gap: 0.5rem; background: #f3f4f6; border-radius: 12px; padding: 0.25rem; }
        .qty-btn { width: 32px; height: 32px; border: none; background: white; border-radius: 8px; font-size: 1.2rem; font-weight: 600; cursor: pointer; transition: all 0.2s; color: #4b5563; display: flex; align-items: center; justify-content: center; }
        .qty-btn:hover { background: #dc2626; color: white; transform: scale(1.05); }
        .quantity { min-width: 32px; text-align: center; font-weight: 600; color: #1f2937; }
        .remove-btn { background: none; border: none; color: #9ca3af; font-size: 0.875rem; cursor: pointer; transition: color 0.2s; padding: 0.25rem 0.5rem; }
        .remove-btn:hover { color: #dc2626; }
        .item-subtotal { text-align: right; min-width: 120px; }
        .subtotal-label { display: block; font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.25rem; }
        .subtotal-value { font-size: 1.1rem; font-weight: 600; color: #1f2937; }
        .cart-footer { padding: 1.5rem 2rem; background: #f9fafb; border-top: 1px solid #e9ecef; }
        .total-section { display: flex; align-items: baseline; gap: 1rem; justify-content: flex-end; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px dashed #e5e7eb; }
        .total-label { font-size: 1.1rem; font-weight: 500; color: #4b5563; }
        .total-value { font-size: 1.75rem; font-weight: 700; color: #dc2626; }
        .options-section { margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; }
        .section-label { display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem; width: 100%; text-align: left; }
        .options-group { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end; width: 100%; }
        .option-btn { padding: 0.6rem 1.25rem; background: white; border: 1px solid #e5e7eb; border-radius: 40px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #4b5563; }
        .option-btn:hover:not(:disabled) { background: #dc2626; border-color: #dc2626; color: #e5e7eb; }
        .option-btn.active { background: #dc2626; border-color: #dc2626; color: white; }
        .disabled-option { opacity: 0.5; cursor: not-allowed; }
        .observations-input { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; font-family: inherit; resize: vertical; transition: border-color 0.2s; }
        .observations-input:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
        .footer-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
        .btn-secondary { padding: 0.75rem 1.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #4b5563; }
        .btn-secondary:hover { background: #f3f4f6; border-color: #dc2626; color: #dc2626; }
        .btn-primary-whatsapp { padding: 0.75rem 2rem; background: #25D366; border: none; border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; color: white; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
        .btn-primary-whatsapp:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37,211,102,0.4); background: #20b859; }
        .btn-primary-whatsapp:disabled { opacity: 0.7; cursor: not-allowed; }
        .store-address-section { margin: 1.5rem 0; padding: 0; }
        .address-card { background: #f8fafc; border-radius: 16px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; border: 1px solid #e2e8f0; transition: all 0.2s ease; }
        .address-card:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .address-icon { font-size: 1.5rem; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .address-content { flex: 1; }
        .address-content h4 { margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; letter-spacing: -0.2px; }
        .address-content p { margin: 0 0 1rem 0; font-size: 0.875rem; line-height: 1.5; color: #475569; }
        .address-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .map-link, .copy-address-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1rem; background: white; border: 1px solid #cbd5e1; border-radius: 40px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; color: #475569; }
        .map-link:hover, .copy-address-btn:hover { background: #334155; border-color: #334155; color: white; }
        @media (max-width: 768px) {
          .address-card { flex-direction: column; align-items: center; text-align: center; }
          .address-icon { margin-bottom: 0.5rem; }
          .address-actions { justify-content: center; }
          .map-link, .copy-address-btn { font-size: 0.7rem; padding: 0.4rem 0.75rem; }
        }
        .cart-loading { text-align: center; padding: 4rem 2rem; }
        .loading-spinner { width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 24px; max-width: 500px; width: 90%; margin: 1rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalSlideIn 0.3s ease-out; }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { padding: 1.5rem; background: linear-gradient(135deg, #fef2f2, #fff); border-bottom: 1px solid #fee2e2; display: flex; align-items: center; gap: 0.75rem; }
        .modal-icon { font-size: 1.75rem; }
        .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: #dc2626; }
        .modal-body { padding: 1.5rem; color: #374151; line-height: 1.5; }
        .alert-message { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.75rem; border-radius: 8px; display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1rem; }
        .modal-list { margin: 0.75rem 0; padding-left: 1.5rem; list-style: none; }
        .modal-list li { margin: 0.5rem 0; color: #4b5563; }
        .modal-note { font-size: 0.875rem; color: #6b7280; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; }
        .modal-footer { padding: 1rem 1.5rem 1.5rem; display: flex; justify-content: flex-end; }
        .modal-btn-primary { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #dc2626, #b91c1c); border: none; border-radius: 40px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; color: white; }
        .modal-btn-primary:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
        @media (max-width: 768px) {
          .cart-page { padding: 1rem; }
          .cart-header { padding: 1rem; }
          .cart-header h1 { font-size: 1.25rem; }
          .cart-icon { font-size: 1.5rem; }
          .cart-items { padding: 0.5rem 1rem; }
          .cart-item { flex-wrap: wrap; gap: 1rem; }
          .item-image { width: 80px; height: 80px; }
          .item-details { flex: 1; }
          .item-subtotal { width: 100%; text-align: left; padding-left: 96px; }
          .cart-footer { padding: 1rem; }
          .total-section { justify-content: space-between; }
          .options-group { flex-direction: column; }
          .option-btn { width: 100%; text-align: center; }
          .footer-actions { flex-direction: column; }
          .btn-primary-whatsapp, .btn-secondary { width: 100%; justify-content: center; }
          .modal-content { width: 95%; margin: 0.5rem; }
          .modal-header { padding: 1rem; }
          .modal-body { padding: 1rem; }
          .address-card { flex-direction: column; align-items: center; text-align: center; }
          .address-icon { margin-bottom: 0.5rem; }
          .address-actions { justify-content: center; }
          .map-link, .copy-address-btn { font-size: 0.7rem; padding: 0.4rem 0.75rem; }
        }
      `}</style>
    </div>
  );
}