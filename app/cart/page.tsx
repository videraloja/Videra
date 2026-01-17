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
      window.location.reload(); // Se necessário, recarregar a página
    }, 100);
  }


 // 🔥 NOVA VERSÃO — registra pedido e itens no Supabase
const sendToWhatsApp = async () => {
  const phone = '5592986446677'; // seu número WhatsApp com DDI

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

  // 🔹 1. Cria o pedido principal
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

  // 🔹 2. Cria os registros de itens relacionados
const itemsPayload = cart.map((item) => ({
  order_id: order.id,
  product_id: item.id,
  name: item.name, // 🔹 novo campo
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

  // 🔹 3. Atualiza estoque no Supabase
  for (const item of cart) {
    const newStock = item.stock; // já atualizado localmente
    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.id);
    if (error) console.error("Erro ao atualizar estoque:", error);
  }

  // 🔹 4. Envia mensagem para o WhatsApp
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

  // 🔹 5. Limpa o carrinho local
  clearCart();

  alert("Pedido registrado com sucesso!");
};

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="cart-page">
      <header className="cart-header">
        <Link href="/" className="btn-link">← Voltar à loja</Link>
        <h1>Seu Carrinho</h1>
      </header>

      {!ready ? (
        <p>Carregando...</p>
      ) : cart.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p>R$ {item.price.toFixed(2)}</p>
                  <div className="cart-controls">
                    <button onClick={() => decreaseQuantity(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)}>+</button>
                    <button onClick={() => removeFromCart(item.id)} className="remove">
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-footer">
            <h3>Total: R$ {total.toFixed(2)}</h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={sendToWhatsApp} className="btn-primary">
                Enviar via WhatsApp
              </button>
              <button onClick={clearCart} className="btn-muted">
                Esvaziar carrinho
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
