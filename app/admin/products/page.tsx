"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "../../components/ThemeToggle";
import AuthGuard from "@/app/components/AuthGuard";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  supplier_code?: string;
  cost_price?: number;
  image_url?: string;
  created_at: string;
  category?: string;
  product_type?: string;
  collection?: string;
  on_sale?: boolean;
  sale_price?: number;
}

// 🆕 TIPOS PARA FILTROS
interface Filters {
  category: string;
  searchTerm: string;
}

// Componente principal com toda a lógica existente
function ProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [allCategories, setAllCategories] = useState<string[]>([]); // 🆕 State for all categories
  // 🆕 ESTADOS PARA PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(15); // Itens por página
  const [totalProducts, setTotalProducts] = useState(0);

  
  // 🆕 ESTADOS PARA PROMOÇÕES EM MASSA
  const [isProcessingPromotion, setIsProcessingPromotion] = useState(false);
  const [promoType, setPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoValue, setPromoValue] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showRemovePromoModal, setShowRemovePromoModal] = useState(false);


  // ESTADOS PARA FILTROS
  // searchTermInput é o valor visível no campo de busca, atualizado instantaneamente.
  const [searchTermInput, setSearchTermInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('adminProductsSearch') || '';
    }
    return '';
  });

  // filters.searchTerm é o valor "debounced", usado para fazer a busca no banco de dados.
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window !== 'undefined') {
      return {
        category: sessionStorage.getItem('adminProductsCategory') || '',
        searchTerm: sessionStorage.getItem('adminProductsSearch') || ''
      };
    }
    return { category: '', searchTerm: "" };
  });

  // Salvar filtros para manter a lista igual ao voltar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminProductsCategory', filters.category);
      sessionStorage.setItem('adminProductsSearch', searchTermInput);
    }
  }, [filters.category, searchTermInput]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, filters]); // Recarrega quando a página ou filtros mudam

  // 🆕 Resetar para a página 1 quando os filtros mudam para uma nova busca
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters]);

  // 🆕 FUNÇÃO PARA BUSCAR AO PRESSIONAR ENTER
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Previne o comportamento padrão de submissão de formulário
      setFilters(prev => ({ ...prev, searchTerm: searchTermInput }));
    }
  };

  // 🆕 Carregar todas as categorias uma vez para o dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('products').select('category');
      if (!error && data) {
        const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))] as string[];
        setAllCategories(uniqueCategories.sort());
      }
    };
    fetchCategories();
  }, []);

  // 🆕 ATUALIZAÇÃO AUTOMÁTICA: Recarrega os produtos quando a página fica visível.
  // Isso garante que as edições feitas em outra tela apareçam ao voltar.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Calcular o range da paginação
      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;

      // 🆕 Constrói a query com base nos filtros
      let query = supabase
        .from("products")
        .select("*", { count: 'exact' }); // Pede a contagem total junto com os dados

      // Aplica filtro de categoria
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Aplica filtro de busca
      if (filters.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`;
        // Busca em múltiplos campos
        query = query.or(
          `name.ilike.${searchTerm},supplier_code.ilike.${searchTerm},collection.ilike.${searchTerm},product_type.ilike.${searchTerm}`
        );
      }

      // Adiciona ordenação e paginação
      query = query
        .order("created_at", { ascending: false })
        .range(from, to);

      // Executa a query
      const { data, error, count } = await query;

      if (error) throw error;
      setProducts(data as Product[] || []);
      if (count) setTotalProducts(count); // Atualiza a contagem total para a paginação
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const deleteProduct = async (productId: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      
      alert("Produto excluído com sucesso!");
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  // 🆕 FUNÇÕES PARA PROMOÇÕES EM MASSA
  const handleApplyPromotion = async () => {
    const value = parseFloat(promoValue);
    if (isNaN(value) || value <= 0) {
      alert('Por favor, insira um valor de desconto válido e maior que zero.');
      return;
    }

    setIsProcessingPromotion(true);
    try {
      // 1. Contar quantos produtos serão afetados para confirmação
      let countQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (filters.category) {
        countQuery = countQuery.eq('category', filters.category);
      }
      if (filters.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`;
        countQuery = countQuery.or(`name.ilike.${searchTerm},supplier_code.ilike.${searchTerm},collection.ilike.${searchTerm},product_type.ilike.${searchTerm}`);
      }

      const { count: totalMatchingProducts, error: countError } = await countQuery;

      if (countError) throw countError;

      if (!totalMatchingProducts || totalMatchingProducts === 0) {
        alert('Nenhum produto encontrado com os filtros atuais para aplicar a promoção.');
        setIsProcessingPromotion(false);
        return;
      }

      const confirmation = prompt(
        `⚠️ ATENÇÃO! Você está prestes a aplicar uma promoção em ${totalMatchingProducts} produto(s) que correspondem aos filtros atuais.\n\nEsta ação não pode ser desfeita facilmente.\n\nPara confirmar, digite "APLICAR".`
      );

      if (confirmation?.toUpperCase() !== 'APLICAR') {
        alert('Ação cancelada.');
        setIsProcessingPromotion(false);
        return;
      }

      // 2. Buscar os produtos que correspondem aos filtros para calcular os novos preços
      let productsQuery = supabase.from('products').select('id, price');
      if (filters.category) {
        productsQuery = productsQuery.eq('category', filters.category);
      }
      if (filters.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`;
        productsQuery = productsQuery.or(`name.ilike.${searchTerm},supplier_code.ilike.${searchTerm},collection.ilike.${searchTerm},product_type.ilike.${searchTerm}`);
      }

      const { data: productsToUpdate, error: fetchError } = await productsQuery.limit(10000); // Limite alto para garantir que todos sejam pegos

      if (fetchError) throw fetchError;

      // 3. Preparar os dados para atualização
      const updates = productsToUpdate.map(product => {
        const originalPrice = product.price;
        let salePrice = 0;

        if (promoType === 'percentage') {
          salePrice = originalPrice * (1 - value / 100);
        } else { // fixed
          salePrice = originalPrice - value;
        }

        salePrice = Math.max(salePrice, 0.01); // Garante que o preço não seja negativo

        return {
          id: product.id,
          on_sale: true,
          original_price: originalPrice,
          sale_price: salePrice,
          updated_at: new Date().toISOString()
        };
      });

      const { error: upsertError, count } = await supabase.from('products').upsert(updates);
      if (upsertError) throw upsertError;

      alert(`✅ Sucesso! ${count || 0} produtos foram atualizados com a promoção.`);
      loadProducts(); // Recarrega a lista para mostrar os novos preços
      setShowPromoModal(false);
      setPromoValue('');

    } catch (error) {
      console.error('Erro ao aplicar promoção em massa:', error);
      alert('❌ Ocorreu um erro ao aplicar a promoção. Tente novamente.');
    } finally {
      setIsProcessingPromotion(false);
    }
  };

  const handleRemoveAllPromotions = async () => {
    const confirmation = prompt(
      '⚠️ ATENÇÃO! Esta ação removerá TODAS as promoções ativas.\n\nTodos os produtos voltarão ao seu preço normal. Esta ação não pode ser desfeita.\n\nPara confirmar, digite "REMOVER".'
    );

    if (confirmation?.toUpperCase() !== 'REMOVER') {
      alert('Ação cancelada.');
      return;
    }

    setIsProcessingPromotion(true);
    try {
      const { error, count } = await supabase
        .from('products')
        .update({
          on_sale: false,
          original_price: null,
          sale_price: null,
          updated_at: new Date().toISOString()
        })
        .eq('on_sale', true);

      if (error) throw error;

      alert(`✅ Sucesso! ${count || 0} promoções foram removidas.`);
      loadProducts();
      setShowRemovePromoModal(false);

    } catch (error) {
      console.error('Erro ao remover promoções:', error);
      alert('❌ Ocorreu um erro ao remover as promoções. Tente novamente.');
    } finally {
      setIsProcessingPromotion(false);
    }
  };

  // 🆕 FILTRAGEM AVANÇADA
  // A filtragem agora é feita no backend (Supabase).
  // A variável `products` já contém os produtos filtrados.
  const filteredProducts = products;

  // 🆕 EXTRAIR CATEGORIAS ÚNICAS

  // 🆕 FUNÇÃO PARA BADGE DE CATEGORIA
  const getCategoryBadge = (category?: string) => {
    if (!category) return null;

    const badgeStyles = {
      pokemon: { background: '#ef4444', color: 'white', icon: '⚡' },
      'board-games': { background: '#059669', color: 'white', icon: '🎲' },
      'acessorios': { background: '#7c3aed', color: 'white', icon: '🛡️' },
      'hot-wheels': { background: '#dc2626', color: 'white', icon: '🏎️' }
    };

    const style = badgeStyles[category as keyof typeof badgeStyles] || 
                 { background: '#6b7280', color: 'white', icon: '📦' };

    return (
      <span style={{
        background: style.background,
        color: style.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {style.icon} {category.toUpperCase()}
      </span>
    );
  };

  // 🆕 FUNÇÃO PARA BADGE DE TIPO (POKÉMON)
  const getTypeBadge = (productType?: string) => {
    if (!productType) return null;

    const typeNames: { [key: string]: string } = {
      'deck': 'DECK',
      'booster-pack': 'BOOSTER',
      'booster-box': 'BOX',
      'elite-trainer-box': 'ETB',
      'single': 'CARTA',
      'collection-box': 'COLLECTION',
      'mini-box': 'MINI BOX',
      'triple-box': 'TRIPLE',
      'quadruple-box': 'QUADRUPLE',
      'accessory': 'ACESSÓRIO'
    };

    return (
      <span style={{
        background: '#8b5cf6',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '500'
      }}>
        {typeNames[productType] || productType.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        maxWidth: 1200, 
        margin: "0 auto",
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 1200, 
      margin: "0 auto",
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 24 
      }}>
        <div>
          <button
            onClick={() => router.push("/admin")}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Voltar para Admin
          </button>
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            🛍️ Gerenciar Produtos
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle />
          <button
            onClick={() => router.push("/admin/products/new")}
            style={{
              background: "#7c3aed",
              color: "white",
              padding: "12px 20px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            ➕ Adicionar Produto
          </button>
        </div>
      </div>

      {/* 🆕 SEÇÃO DE PROMOÇÕES EM MASSA */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          🔥 Promoções em Massa
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Card para Aplicar Promoção */}
          <div style={{
            flex: 1,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '300px'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#15803d' }}>Aplicar Promoção em Massa</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#16a34a' }}>
                Aplica um desconto em todos os produtos do site.
              </p>
            </div>
            <button
              onClick={() => setShowPromoModal(true)}
              style={{
                background: '#22c55e',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Aplicar
            </button>
          </div>

          {/* Card para Remover Promoção */}
          <div style={{
            flex: 1,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '300px'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#b91c1c' }}>Remover Todas as Promoções</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#dc2626' }}>
                Reverte todos os produtos para seus preços originais.
              </p>
            </div>
            <button
              onClick={() => setShowRemovePromoModal(true)}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>

      {/* 🆕 MODAL PARA APLICAR PROMOÇÃO */}
      {showPromoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Aplicar Promoção em Massa</h3>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
              <button onClick={() => setPromoType('percentage')} style={{ flex: 1, padding: '8px', background: promoType === 'percentage' ? '#fff' : 'transparent', border: '1px solid', borderColor: promoType === 'percentage' ? 'var(--accent-color)' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: promoType === 'percentage' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>% Porcentagem</button>
              <button onClick={() => setPromoType('fixed')} style={{ flex: 1, padding: '8px', background: promoType === 'fixed' ? '#fff' : 'transparent', border: '1px solid', borderColor: promoType === 'fixed' ? 'var(--accent-color)' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: promoType === 'fixed' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>R$ Valor Fixo</button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Valor do Desconto</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{promoType === 'percentage' ? '%' : 'R$'}</span>
                <input
                  type="number"
                  value={promoValue}
                  onChange={(e) => setPromoValue(e.target.value)}
                  placeholder={promoType === 'percentage' ? 'Ex: 15 para 15% OFF' : 'Ex: 10 para R$10 OFF'}
                  style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowPromoModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button onClick={handleApplyPromotion} disabled={isProcessingPromotion} style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: isProcessingPromotion ? 0.7 : 1 }}>{isProcessingPromotion ? 'Aplicando...' : 'Aplicar Promoção'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL PARA REMOVER PROMOÇÃO */}
      {showRemovePromoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#b91c1c' }}>Remover Todas as Promoções?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              Esta ação é irreversível e fará com que todos os produtos em promoção voltem para o seu preço original.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowRemovePromoModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button onClick={handleRemoveAllPromotions} disabled={isProcessingPromotion} style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: isProcessingPromotion ? 0.7 : 1 }}>{isProcessingPromotion ? 'Removendo...' : 'Sim, Remover'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 BARRA DE FILTROS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto', 
        gap: '16px', 
        marginBottom: 24,
        alignItems: 'end'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Filtro por Categoria */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}>
              📂 Filtrar por Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                minWidth: '180px'
              }}
            >
              <option value="">Todas as categorias</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Barra de Pesquisa */}
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}>
              🔍 Buscar Produtos
            </label>
            <input
              type="text"
              placeholder="Buscar por nome, código, coleção ou tipo..."
              value={searchTermInput}
              onChange={(e) => setSearchTermInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                fontSize: "14px",
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* 🆕 BOTÃO LIMPAR FILTROS */}
        {(filters.category || searchTermInput) && (
          <button
            onClick={() => {
              setSearchTermInput('');
              setFilters({ category: '', searchTerm: '' });
            }}
            style={{
              background: 'transparent',
              color: '#ef4444',
              padding: '10px 16px',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            🗑️ Limpar Filtros
          </button>
        )}
      </div>

      {/* 🆕 CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          padding: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Lista de Produtos */}
      <div style={{ 
        background: "var(--bg-card)", 
        borderRadius: 12, 
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border-color)"
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{ 
            padding: 40, 
            textAlign: "center", 
            color: "var(--text-secondary)" 
          }}>
            {filters.searchTerm || filters.category ? 
              "Nenhum produto encontrado com os filtros aplicados" : 
              "Nenhum produto cadastrado"
            }
          </div>
        ) : (
          <div style={{ display: "grid", gap: 1, background: "var(--bg-secondary)" }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "var(--bg-card)",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "16px",
                  alignItems: "center"
                }}
              >
                {/* Imagem do Produto */}
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 8, 
                  overflow: "hidden",
                  border: "1px solid var(--border-color)"
                }}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      background: "var(--bg-secondary)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: 12
                    }}>
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* 🆕 INFORMAÇÕES DO PRODUTO EXPANDIDAS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      margin: 0,
                      color: "var(--text-primary)"
                    }}>
                      {product.name}
                    </h3>
                    {getCategoryBadge(product.category)}
                    {product.category === 'pokemon' && getTypeBadge(product.product_type)}
                    {product.on_sale && (
                      <span style={{ 
                        background: '#fef2f2', 
                        color: '#dc2626', 
                        padding: '2px 6px', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        fontWeight: '600' 
                      }}>
                        🔥 PROMO
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    gap: 16, 
                    flexWrap: "wrap", 
                    fontSize: 14, 
                    color: "var(--text-secondary)",
                    marginBottom: '4px'
                  }}>
                    <span>
                      <strong>Preço:</strong>{' '}
                      {product.on_sale && product.sale_price ? (
                        <>
                          <span style={{ textDecoration: 'line-through', fontSize: '12px', marginRight: '6px', opacity: 0.7 }}>R$ {product.price.toFixed(2)}</span>
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>R$ {product.sale_price.toFixed(2)}</span>
                        </>
                      ) : (
                        `R$ ${product.price.toFixed(2)}`
                      )}
                    </span>
                    <span>
                      <strong>Estoque:</strong> {product.stock}
                    </span>
                    {product.supplier_code && (
                      <span>
                        <strong>Código:</strong> {product.supplier_code}
                      </span>
                    )}
                  </div>

                  {/* 🆕 INFORMAÇÕES ESPECÍFICAS */}
                  <div style={{ 
                    display: "flex", 
                    gap: 12, 
                    flexWrap: "wrap", 
                    fontSize: 13, 
                    color: "var(--text-muted)" 
                  }}>
                    {product.collection && (
                      <span>
                        <strong>Coleção:</strong> {product.collection}
                      </span>
                    )}
                    {product.cost_price && (
                      <span>
                        <strong>Custo:</strong> R$ {product.cost_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🆕 RESUMO EXPANDIDO */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: "var(--bg-secondary)", 
        borderRadius: 8,
        border: "1px solid var(--border-color)"
      }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <p style={{ 
            color: "var(--text-secondary)", 
            fontSize: 14,
            margin: 0
          }}>
            📊 <strong>Total:</strong> {filteredProducts.length} produto(s) • 
            <strong> Estoque total:</strong> {filteredProducts.reduce((sum, p) => sum + p.stock, 0)} unidades
          </p>
          
          {/* 🆕 ESTATÍSTICAS POR CATEGORIA */}
          {allCategories.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {allCategories.map(category => {
                const categoryCount = filteredProducts.filter(p => p.category === category).length;
                if (categoryCount === 0) return null;
                
                return (
                  <span key={category} style={{ 
                    color: "var(--text-secondary)", 
                    fontSize: 14 
                  }}>
                    <strong>{category}:</strong> {categoryCount}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function ProductsPage() {
  return (
    <AuthGuard>
      <ProductsContent />
    </AuthGuard>
  );
}