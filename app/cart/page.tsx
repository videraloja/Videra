'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category?: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch {
          setCart([]);
        }
      }

      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        try {
          setProducts(JSON.parse(savedProducts));
        } catch {
          const { data } = await supabase.from('products').select('*');
          setProducts((data as Product[]) || []);
          localStorage.setItem('products', JSON.stringify(data || []));
        }
      } else {
        const { data } = await supabase.from('products').select('*');
        setProducts((data as Product[]) || []);
        localStorage.setItem('products', JSON.stringify(data || []));
      }

      setReady(true);
    };

    load();

    const updateHandler = () => {
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
    setTimeout(() => {
      window.dispatchEvent(new Event('cartStateChanged'));
      window.location.reload();
    }, 100);
  };

  const sendToWhatsApp = async () => {
    const phone = '5592986446677';

    if (!cart || cart.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    const client_name = prompt("Qual o nome do cliente?");
    const client_whatsapp = prompt("Qual o número de WhatsApp do cliente?");
    if (!client_name || !client_whatsapp) {
      alert("Por favor, informe o nome e o número do cliente.");
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          client_name,
          client_whatsapp,
          status: "pendente",
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      console.error("Erro ao salvar pedido no Supabase:", orderError);
      alert("Erro ao registrar o pedido. Tente novamente.");
      return;
    }

    const itemsPayload = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    console.log("DEBUG itemsPayload:", itemsPayload);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Erro ao salvar itens:", itemsError);
      alert("Erro ao salvar itens do pedido.");
      return;
    }

    for (const item of cart) {
      const newStock = item.stock;
      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.id);
      if (error) console.error("Erro ao atualizar estoque:", error);
    }

    const lines = cart.map(
      (i) => `• ${i.name} — R$ ${i.price.toFixed(2).replace(".", ",")} × ${i.quantity}`
    );
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const message = `
📦 *Pedido Videra #${order.id.slice(0, 8)}*

👤 *Cliente:* ${client_name}
📱 *WhatsApp:* ${client_whatsapp}

🛒 *Itens:*
${lines.join("\n")}

💰 *Total:* R$ ${total.toFixed(2).replace(".", ",")}

✅ Obrigado por comprar com a Videra!
`.trim();

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    clearCart();

    alert("Pedido registrado com sucesso!");
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // Loading state
  if (!ready) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">
            <div className="loading-spinner"></div>
            <p>Carregando carrinho...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h2>Seu carrinho está vazio</h2>
            <p>Que tal dar uma olhada nos nossos produtos?</p>
            <Link href="/" className="btn-shop">
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header */}
<div className="cart-header">
  <Link href="/" className="back-link">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Voltar à loja
  </Link>
  <div className="header-title">
    <h1>Seu Carrinho</h1>
    <span className="cart-icon">🛒</span>
  </div>
</div>
        {/* Cart Items */}
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                <img src={item.image_url} alt={item.name} />
              </div>
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-price">R$ {item.price.toFixed(2)}</p>
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => decreaseQuantity(item.id)}
                      className="qty-btn"
                      aria-label="Diminuir quantidade"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => increaseQuantity(item.id)}
                      className="qty-btn"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <div className="item-subtotal">
                <span className="subtotal-label">Subtotal</span>
                <span className="subtotal-value">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="cart-footer">
          <div className="footer-info">
            <div className="total-section">
              <span className="total-label">Total</span>
              <span className="total-value">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="footer-actions">
            <button onClick={clearCart} className="btn-secondary">
              Esvaziar Carrinho
            </button>
            <button onClick={sendToWhatsApp} className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
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

        /* Header */
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

        .back-link:hover {
          color: #dc2626;
        }

        .cart-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cart-count {
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        /* Cart Items */
        .cart-items {
          padding: 1rem 2rem;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .cart-item:hover {
          background: #fafafa;
          margin: 0 -1rem;
          padding: 1.5rem 1rem;
        }

        .item-image {
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          background: #f9f9f9;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
        }

        .item-details h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .item-price {
          font-size: 1rem;
          font-weight: 500;
          color: #dc2626;
          margin: 0 0 1rem 0;
        }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f3f4f6;
          border-radius: 12px;
          padding: 0.25rem;
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          border-radius: 8px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4b5563;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn:hover {
          background: #dc2626;
          color: white;
          transform: scale(1.05);
        }

        .quantity {
          min-width: 32px;
          text-align: center;
          font-weight: 600;
          color: #1f2937;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0.25rem 0.5rem;
        }

        .remove-btn:hover {
          color: #dc2626;
        }

        .item-subtotal {
          text-align: right;
          min-width: 120px;
        }

        .subtotal-label {
          display: block;
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.25rem;
        }

        .subtotal-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        /* Footer */
        .cart-footer {
          padding: 1.5rem 2rem;
          background: #f9fafb;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .total-section {
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        .total-label {
          font-size: 1.1rem;
          font-weight: 500;
          color: #4b5563;
        }

        .total-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #dc2626;
        }

        .payment-info {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0.5rem 0 0 0;
        }

        .footer-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #4b5563;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
          border-color: #dc2626;
          color: #dc2626;
        }

        .btn-primary {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }

        /* Empty State */
        .cart-empty {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .cart-empty h2 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .cart-empty p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .btn-shop {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-shop:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* Loading State */
        .cart-loading {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cart-page {
            padding: 1rem;
          }

          .cart-header {
            padding: 1rem;
          }

          .cart-header h1 {
            font-size: 1.25rem;
          }

          .cart-items {
            padding: 0.5rem 1rem;
          }

          .cart-item {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .item-image {
            width: 80px;
            height: 80px;
          }

          .item-details {
            flex: 1;
          }

          .item-subtotal {
            width: 100%;
            text-align: left;
            padding-left: 96px;
          }

          .cart-footer {
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
          }

          .footer-actions {
            flex-direction: column;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .total-section {
            justify-content: space-between;
          }
            /* Header title com ícone */
.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cart-icon {
  font-size: 1.75rem;
}
        }
      `}</style>
    </div>
  );
}