// components/Header.tsx - VERSÃO CORRIGIDA (COM CLASSES CSS PARA RESPONSIVO)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import './header.css'; // 🔥 Vamos criar este arquivo

const NICHO_LINKS = [
  { id: 'home', name: 'Início', path: '/', icon: '🏠' },
  { id: 'pokemontcg', name: 'Pokémon TCG', path: '/pokemontcg', icon: '⚡' },
  { id: 'jogosdetabuleiro', name: 'Jogos de Tabuleiro', path: '/jogosdetabuleiro', icon: '🎲' },
  { id: 'acessorios', name: 'Acessórios', path: '/acessorios', icon: '🛡️' },
  { id: 'hotwheels', name: 'Hot Wheels', path: '/hotwheels', icon: '🏎️' }
];

const DEFAULT_BACKGROUND_IMAGES = {
  'home': 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1200&h=400&fit=crop',
  'pokemontcg': 'https://images.unsplash.com/photo-1626600183959-d1ee8b293c6a?w=1200&h=400&fit=crop',
  'jogosdetabuleiro': 'https://images.unsplash.com/photo-1532597447997-2e46ad324c49?w=1200&h=400&fit=crop',
  'acessorios': 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&h=400&fit=crop',
  'hotwheels': 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=1200&h=400&fit=crop'
};

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
}

export default function Header({ onSearch, searchTerm = '' }: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isMounted, setIsMounted] = useState(false);
  
  const { 
    colors, 
    emojis, 
    applyThemeStyles, 
    getCategoryConfig,
    themeName,
    isSpecialTheme,
    theme
  } = useThemeColors();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getActiveNiche = () => {
    if (pathname === '/') return 'home';
    if (pathname.includes('pokemontcg')) return 'pokemontcg';
    if (pathname.includes('jogosdetabuleiro')) return 'jogosdetabuleiro';
    if (pathname.includes('acessorios')) return 'acessorios';
    if (pathname.includes('hotwheels')) return 'hotwheels';
    return 'home';
  };

  const activeNiche = getActiveNiche();
  
  const getSearchPlaceholder = () => {
    if (!isMounted) return "🔍 Buscando...";
    
    const placeholders = {
      'home': `${emojis.search} Busca qualquer produto da loja...`,
      'pokemontcg': `${emojis.search} Busca apenas Pokémon TCG...`,
      'jogosdetabuleiro': `${emojis.search} Busca apenas Jogos de Tabuleiro...`,
      'acessorios': `${emojis.search} Busca apenas Acessórios...`,
      'hotwheels': `${emojis.search} Busca apenas Hot Wheels...`
    };
    
    return placeholders[activeNiche as keyof typeof placeholders] || placeholders.home;
  };

  const searchPlaceholder = getSearchPlaceholder();

  const activeCategoryConfig = getCategoryConfig(activeNiche);

  const getBackgroundImage = (): string => {
    if (theme?.backgroundImage?.url) {
      return theme.backgroundImage.url;
    }
    
    return DEFAULT_BACKGROUND_IMAGES[activeNiche as keyof typeof DEFAULT_BACKGROUND_IMAGES] || 
           DEFAULT_BACKGROUND_IMAGES.home;
  };

  const getOverlayColor = (): string | undefined => {
    return theme?.backgroundImage?.overlayColor;
  };

  const getOverlayOpacity = (): number => {
    return theme?.backgroundImage?.opacity || 0;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    if (isMounted) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMounted]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  const currentBackgroundImage = getBackgroundImage();

  if (!isMounted) {
    return (
      <>
        <header style={{
          position: 'relative',
          width: '100%',
          height: '250px',
          overflow: 'hidden',
          background: '#f1f5f9'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#7c3aed',
              margin: '0 auto 16px'
            }} />
            <span style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Videra - Colecionáveis
            </span>
          </div>
        </header>
        
        <nav style={{
          background: 'white',
          padding: '16px 0',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="nav-buttons-container">
            {NICHO_LINKS.map((niche) => (
              <div
                key={niche.id}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {niche.icon} {niche.name}
              </div>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Header com Logo e Capa */}
      <header style={{
        position: 'relative',
        width: '100%',
        height: '250px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${currentBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          cursor: 'pointer'
        }}>
          <Link href="/">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/logo.png" 
                alt="Videra" 
                style={{
                  width: isScrolled ? '80px' : '100px',
                  height: isScrolled ? '80px' : '100px',
                  borderRadius: '50%',
                  border: isSpecialTheme ? '4px solid rgba(255,255,255,0.8)' : '4px solid white',
                  boxShadow: isSpecialTheme 
                    ? '0 8px 32px rgba(0,0,0,0.5)' 
                    : '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              />
            </div>
          </Link>
        </div>
      </header>

      {/* 🔥 ATUALIZADO: Menu de Navegação com Classes CSS */}
      <nav style={applyThemeStyles({
        background: colors.background,
        borderBottom: `1px solid ${colors.secondary}`,
        padding: isScrolled ? '12px 0' : '16px 0',
        boxShadow: isScrolled ? `0 4px 20px ${colors.primary}15` : 'none',
        transition: 'all 0.3s ease',
        zIndex: 100
      }, 'header')}>
        {/* 🔥 Container com classes CSS para responsividade */}
        <div className="nav-buttons-container">
          {NICHO_LINKS.map((niche) => {
            const nicheConfig = getCategoryConfig(niche.id);
            const isActive = activeNiche === niche.id;
            
            return (
              <Link
                key={niche.id}
                href={niche.path}
                className={`nav-button ${isActive ? 'nav-button-active' : ''}`}
                style={applyThemeStyles({
                  background: isActive ? nicheConfig.color : 'transparent',
                  color: isActive ? 'white' : colors.text,
                  border: isActive ? 'none' : `1px solid ${colors.secondary}`,
                }, isActive ? 'button-primary' : 'button-secondary')}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = colors.secondary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span className="nav-button-icon">{niche.icon}</span>
                <span className="nav-button-text">{niche.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Barra de Busca Inteligente */}
      <section style={applyThemeStyles({
        padding: '24px 20px',
        background: colors.background,
        borderBottom: `1px solid ${colors.secondary}`
      }, 'header')}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localSearchTerm}
            onChange={handleSearchChange}
            style={applyThemeStyles({
              width: '100%',
              padding: '16px 20px 16px 48px',
              border: `2px solid ${colors.secondary}`,
              borderRadius: '50px',
              fontSize: '16px',
              background: colors.cardBg,
              color: colors.text,
              boxShadow: `0 2px 10px ${colors.primary}10`,
              transition: 'all 0.2s ease'
            }, 'filter')}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.background = colors.background;
              e.target.style.boxShadow = `0 4px 20px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.secondary;
              e.target.style.background = colors.cardBg;
              e.target.style.boxShadow = `0 2px 10px ${colors.primary}10`;
            }}
          />
          
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px'
          }}>
            {emojis.search}
          </div>
          
          {localSearchTerm && (
            <button
              onClick={clearSearch}
              style={applyThemeStyles({
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }, 'button-primary')}
            >
              ✕
            </button>
          )}
        </div>
      </section>
    </>
  );
}