'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthGuard from '@/app/components/AuthGuard';
import ThemeToggle from '../../components/ThemeToggle';

interface Order {
  id: string;
  client_name: string;
  client_whatsapp: string;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  name?: string;
}

// Componente principal com toda a lógica existente
function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    const loadOrders = async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
        return;
      }

      setOrders(ordersData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) {
        console.error('Erro ao carregar itens:', itemsError);
        return;
      }

      const grouped: Record<string, OrderItem[]> = {};
      (itemsData || []).forEach((item) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item);
      });

      setOrderItems(grouped);
      setLoading(false);
    };

    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'pago': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'cancelado': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '🟡';
      case 'pago': return '🟢';
      case 'cancelado': return '🔴';
      default: return '⚪';
    }
  };

  // Obter meses únicos dos pedidos
  const getUniqueMonths = () => {
    const months = orders.map(order => {
      const date = new Date(order.created_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const uniqueMonths = [...new Set(months)].sort().reverse();
    
    return [
      { value: 'all', label: '📅 Todos os meses' },
      ...uniqueMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return {
          value: month,
          label: `${monthNames[parseInt(monthNum) - 1]} ${year}`
        };
      })
    ];
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    // Filtro por status
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    
    // Filtro por mês
    const orderDate = new Date(order.created_at);
    const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthMatch = monthFilter === 'all' || orderMonth === monthFilter;
    
    // Filtro por data específica
    let dateMatch = true;
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      dateMatch = orderDateOnly.getTime() === filterDate.getTime();
    }
    
    return statusMatch && monthMatch && dateMatch;
  });

  const ordersForList = filteredOrders.map((order) => {
    const items = orderItems[order.id] || [];
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      id: order.id,
      customer_name: order.client_name,
      total,
      status: order.status,
      created_at: order.created_at,
      items_count: items.length,
      client_whatsapp: order.client_whatsapp
    };
  });

  // ESTATÍSTICAS BASEADAS NOS PEDIDOS FILTRADOS
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pendente').length;
  const paidOrders = filteredOrders.filter(o => o.status === 'pago').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelado').length;

  // Calcular valor total dos pedidos filtrados
  const totalValue = ordersForList.reduce((sum, order) => sum + order.total, 0);

  // Limpar filtro de data
  const clearDateFilter = () => {
    setDateFilter('');
  };

  if (loading) return (
    <div style={{ 
      padding: 24, 
      textAlign: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <p>Carregando pedidos...</p>
    </div>
  );

  return (
    <div style={{ 
      padding: 24,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 32 
      }}>
        <div>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📦 Gestão de Pedidos
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginTop: 4,
            margin: 0
          }}>
            Gerencie todos os pedidos da sua loja
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Cartões de Estatísticas - AGORA MOSTRAM APENAS OS FILTRADOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Pedidos no Período</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{totalOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            R$ {totalValue.toFixed(2)}
          </div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#f59e0b', marginBottom: 8 }}>Pendentes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{pendingOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {totalOrders > 0 ? `${((pendingOrders / totalOrders) * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#10b981', marginBottom: 8 }}>Pagos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{paidOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {totalOrders > 0 ? `${((paidOrders / totalOrders) * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>Cancelados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{cancelledOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {totalOrders > 0 ? `${((cancelledOrders / totalOrders) * 100).toFixed(0)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)',
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Filtro por Status */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Status do Pedido:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'all' as const, label: '📋 Todos', emoji: '📋' },
                { value: 'pendente' as const, label: 'Pendentes', emoji: '🟡' },
                { value: 'pago' as const, label: 'Pagos', emoji: '🟢' },
                { value: 'cancelado' as const, label: 'Cancelados', emoji: '🔴' }
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  style={{
                    background: statusFilter === value ? '#7c3aed' : 'var(--bg-secondary)',
                    color: statusFilter === value ? 'white' : 'var(--text-primary)',
                    padding: '8px 16px',
                    border: `1px solid ${statusFilter === value ? '#7c3aed' : 'var(--border-color)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Mês e Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Filtro por Mês */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Filtrar por Mês:
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              >
                {getUniqueMonths().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Data Específica */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Filtrar por Data:
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                {dateFilter && (
                  <button
                    onClick={clearDateFilter}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden'
      }}>
        {ordersForList.length === 0 ? (
          <div style={{ 
            padding: 60, 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              marginBottom: 8,
              color: 'var(--text-primary)'
            }}>
              Nenhum pedido encontrado
            </h3>
            <p style={{ margin: 0 }}>
              {statusFilter !== 'all' || monthFilter !== 'all' || dateFilter
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Ainda não há pedidos cadastrados.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 1, background: 'var(--bg-secondary)' }}>
            {ordersForList.map((order, index) => {
              const statusColor = getStatusColor(order.status);
              
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderBottom: index < ordersForList.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto auto', 
                    gap: '16px', 
                    alignItems: 'center' 
                  }}>
                    {/* Informações do Pedido */}
                    <div>
                      {/* NOME DO CLIENTE EM DESTAQUE */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        marginBottom: 8 
                      }}>
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 700, 
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          👤 {order.customer_name}
                        </h3>
                        <div
                          style={{
                            background: statusColor.bg,
                            color: statusColor.text,
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            border: `1px solid ${statusColor.border}`
                          }}
                        >
                          {getStatusIcon(order.status)} {order.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: 16, 
                        flexWrap: 'wrap',
                        fontSize: 14, 
                        color: 'var(--text-secondary)' 
                      }}>
                        {/* TELEFONE DO CLIENTE ADICIONADO */}
                        <span>
                          <strong>📞 Telefone:</strong> {order.client_whatsapp}
                        </span>
                        <span>
                          <strong>📦 Itens:</strong> {order.items_count}
                        </span>
                        <span>
                          <strong>📅 Data:</strong> {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>
                          <strong>⏰ Hora:</strong> {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: 18, 
                        fontWeight: 700, 
                        color: 'var(--text-primary)',
                        marginBottom: 4
                      }}>
                        R$ {order.total.toFixed(2)}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: 'var(--text-secondary)' 
                      }}>
                        Total
                      </div>
                    </div>

                    {/* Ação */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/55${order.client_whatsapp}`, '_blank');
                        }}
                        style={{
                          background: '#25D366',
                          color: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        📱 WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé Informativo */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'var(--bg-secondary)', 
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 14,
          margin: 0
        }}>
          💡 <strong>Dica:</strong> Clique em qualquer pedido para ver detalhes completos e gerenciar o status.
        </p>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}