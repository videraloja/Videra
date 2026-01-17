"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "../components/ThemeToggle";
import AuthGuard from "../components/AuthGuard";
import { useAuth } from "../contexts/AuthContext";

function AdminDashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [todayOrders, setTodayOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      try {
        const { data: todayData, error: todayError } = await supabase
          .from('orders')
          .select('id')
          .gte('created_at', startOfToday.toISOString());

        if (!todayError) setTodayOrders(todayData?.length || 0);

        const { data: pendingData, error: pendingError } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'pendente');

        if (!pendingError) setPendingOrders(pendingData?.length || 0);

        const { data: monthOrders, error: monthError } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'pago')
          .gte('created_at', startOfMonth.toISOString());

        if (!monthError && monthOrders) {
          const orderIds = monthOrders.map(order => order.id);
          
          if (orderIds.length > 0) {
            const { data: orderItems, error: itemsError } = await supabase
              .from('order_items')
              .select('quantity, price')
              .in('order_id', orderIds);

            if (!itemsError && orderItems) {
              const total = orderItems.reduce((sum, item) => 
                sum + (item.quantity * item.price), 0
              );
              setMonthSales(total);
            }
          } else {
            setMonthSales(0);
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: "📦 Pedidos Recebidos",
      description: "Ver e gerenciar todos os pedidos",
      path: "/admin/orders",
      color: "bg-blue-500",
      icon: "📦"
    },
    {
      title: "📊 Relatórios de Vendas",
      description: "Relatórios de produtos vendidos",
      path: "/admin/reports", 
      color: "bg-green-500",
      icon: "📊"
    },
    {
      title: "📋 Estoque Completo",
      description: "Ver todos os produtos em estoque",
      path: "/admin/inventory", 
      color: "bg-orange-500",
      icon: "📋"
    },
    {
      title: "🛍️ Gerenciar Produtos",
      description: "Adicionar, editar ou excluir produtos",
      path: "/admin/products",
      color: "bg-purple-500",
      icon: "🛍️"
    },
    {
      title: "📱 WhatsApp",
      description: "Falar com clientes",
      path: "https://web.whatsapp.com",
      color: "bg-green-600",
      icon: "📱",
      external: true
    }
  ];

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 1000, 
      margin: "0 auto",
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* Cabeçalho com Toggle e Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            🎯 Painel Administrativo
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 0 }}>
            Olá, {user?.name} • Gerencie sua loja de forma rápida e prática
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <button
            onClick={signOut}
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              padding: "8px 16px",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            title="Sair do sistema"
          >
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Resto do código do dashboard permanece igual */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: 20,
        marginBottom: 40 
      }}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={() => {
              if (action.external) {
                window.open(action.path, '_blank');
              } else {
                router.push(action.path);
              }
            }}
            style={{
              background: "var(--bg-card)",
              padding: 24,
              borderRadius: 12,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              border: "1px solid var(--border-color)",
              textAlign: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow)";
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {action.icon}
            </div>
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              marginBottom: 8,
              color: "var(--text-primary)"
            }}>
              {action.title}
            </h3>
            <p style={{ 
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.4
            }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{ 
        background: "var(--bg-card)", 
        padding: 24, 
        borderRadius: 12,
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
          📈 Visão Geral {loading && "(Carregando...)"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Pedidos Hoje</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
              {loading ? "..." : todayOrders}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Pedidos Pendentes</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>
              {loading ? "..." : pendingOrders}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>Vendas do Mês</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>
              {loading ? "..." : `R$ ${monthSales.toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          💡 <strong>Dica:</strong> Acesse diretamente por:
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          {[
            { path: "/admin/orders", color: "#2563eb", label: "/admin/orders" },
            { path: "/admin/reports", color: "#059669", label: "/admin/reports" },
            { path: "/admin/inventory", color: "#ea580c", label: "/admin/inventory" },
            { path: "/admin/products", color: "#7c3aed", label: "/admin/products" }
          ].map((link) => (
            <button 
              key={link.path}
              onClick={() => router.push(link.path)}
              style={{
                background: "var(--bg-card)",
                color: link.color,
                padding: "6px 12px",
                border: `1px solid ${link.color}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard>
      <AdminDashboardContent />
    </AuthGuard>
  );
}