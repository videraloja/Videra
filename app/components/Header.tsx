// components/Header.tsx – ÍCONES POR IMAGEM + INSTAGRAM + BUSCA NO INÍCIO DA NAVEGAÇÃO
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import './header.css';

const NICHO_ICONS = {
  home: '/icones/inicio.png',
  pokemontcg: '/icones/pokemon.png',
  jogosdetabuleiro: '/icones/jogos.png',
  acessorios: '/icones/acessorios.png',
  hotwheels: '/icones/hotwheels.png',
};

const SEARCH_ICON = '/icones/lupa.png';

const FallbackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const FallbackSearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const NavIcon = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  if (!src || hasError) return <FallbackIcon />;
  return (
    <Image src={src} alt={alt} width={20} height={20} style={{ objectFit: 'contain' }} onError={() => setHasError(true)} />
  );
};

const SearchIconImg = () => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <FallbackSearchIcon />;
  return (
    <Image src={SEARCH_ICON} alt="Buscar" width={20} height={20} style={{ objectFit: 'contain' }} onError={() => setHasError(true)} />
  );
};

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const NICHO_LINKS = [
  { id: 'home', name: 'Início', path: '/', icon: NICHO_ICONS.home },
  { id: 'pokemontcg', name: 'Pokémon TCG', path: '/pokemontcg', icon: NICHO_ICONS.pokemontcg },
  { id: 'jogosdetabuleiro', name: 'Jogos de Tabuleiro', path: '/jogosdetabuleiro', icon: NICHO_ICONS.jogosdetabuleiro },
  { id: 'acessorios', name: 'Acessórios', path: '/acessorios', icon: NICHO_ICONS.acessorios },
  { id: 'hotwheels', name: 'Hot Wheels', path: '/hotwheels', icon: NICHO_ICONS.hotwheels },
];

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  hideSearch?: boolean;
}

const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '21:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '21:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '08:00', close: '13:00' },
  sunday: null
};

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

function getCurrentDayAndTime() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return { day, currentTime: `${hours}:${minutes}` };
}

function isStoreOpen(day: number, currentTime: string): boolean {
  const hours = BUSINESS_HOURS[getDayKey(day)];
  if (!hours) return false;
  return currentTime >= hours.open && currentTime <= hours.close;
}

function getDayKey(day: number): keyof typeof BUSINESS_HOURS {
  const keys: (keyof typeof BUSINESS_HOURS)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return keys[day];
}

export default function Header({ onSearch, searchTerm = '', hideSearch = false }: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isMounted, setIsMounted] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { colors, applyThemeStyles, getCategoryConfig, theme } = useThemeColors();
  const [storeStatus, setStoreStatus] = useState({ open: false, currentDay: '', currentTime: '' });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const updateStoreStatus = useCallback(() => {
    const { day, currentTime } = getCurrentDayAndTime();
    setStoreStatus({ open: isStoreOpen(day, currentTime), currentDay: DAY_NAMES[day], currentTime });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    updateStoreStatus();
    const interval = setInterval(updateStoreStatus, 60000);
    return () => clearInterval(interval);
  }, [isMounted, updateStoreStatus]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowHours(false);
      }
    };
    if (showHours) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHours]);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      const savedScroll = sessionStorage.getItem('navScrollPosition');
      if (savedScroll && navContainerRef.current) {
        const scrollPosition = parseInt(savedScroll, 10);
        navContainerRef.current.scrollLeft = scrollPosition;
        if (window.innerWidth <= 768) {
          navContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
        sessionStorage.removeItem('navScrollPosition');
      }
    }, 50);
    return () => clearTimeout(timer);
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
    if (!isMounted) return "Carregando...";
    const placeholders: Record<string, string> = {
      'home': `Buscar produtos...`,
      'pokemontcg': `Buscar Pokémon TCG...`,
      'jogosdetabuleiro': `Buscar Jogos de Tabuleiro...`,
      'acessorios': `Buscar Acessórios...`,
      'hotwheels': `Buscar Hot Wheels...`
    };
    return placeholders[activeNiche] || placeholders.home;
  };

  const searchPlaceholder = getSearchPlaceholder();

  const saveScrollPosition = () => {
    if (navContainerRef.current && window.innerWidth <= 768) {
      sessionStorage.setItem('navScrollPosition', navContainerRef.current.scrollLeft.toString());
    }
  };

  // Escolhe a imagem de fundo correta (desktop ou mobile)
  const currentBackgroundImage = (isMobile && theme?.backgroundImage?.mobileUrl)
    ? theme.backgroundImage.mobileUrl
    : theme?.backgroundImage?.url || undefined;


  useEffect(() => {
    if (!isMounted) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    if (onSearch) onSearch('');
  };

  const toggleSearch = () => {
    if (showSearch) {
      clearSearch();
    }
    setShowSearch(!showSearch);
  };

  if (!isMounted) {
    return (
      <>
        <header style={{ position: 'relative', width: '100%', height: '250px', overflow: 'hidden', background: '#f1f5f9' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#7c3aed', margin: '0 auto 16px' }} />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Videra - Colecionáveis</span>
          </div>
        </header>
        <nav style={{ background: 'white', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div className="nav-buttons-container">
            {NICHO_LINKS.map((niche) => (
              <div key={niche.id} style={{ padding: '12px 20px', background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '50px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <NavIcon src={niche.icon} alt={niche.name} /> {niche.name}
              </div>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <header style={{ position: 'relative', width: '100%', height: '250px', overflow: 'hidden', background: currentBackgroundImage ? 'transparent' : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
        {currentBackgroundImage ? (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${currentBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, opacity: 0.3 }} />
        )}

        {/* Indicador Aberto/Fechado */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }}>
          <button ref={triggerRef} onClick={() => setShowHours(!showHours)} aria-label="Horários de funcionamento"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '40px', padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.25s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: storeStatus.open ? '#10b981' : '#ef4444', boxShadow: `0 0 0 3px ${storeStatus.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }} />
            <span>{storeStatus.open ? 'Aberto' : 'Fechado'}</span>
            <span style={{ transition: 'transform 0.3s ease', transform: showHours ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '12px' }}>▾</span>
          </button>
        </div>

        {/* Logo + Instagram */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Link href="/">
            <img src="/logo.png" alt="Videra" style={{ width: isScrolled ? '80px' : '100px', height: isScrolled ? '80px' : '100px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
          </Link>
          <a href="https://www.instagram.com/viderastore" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', textDecoration: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: '600', letterSpacing: '0.3px', opacity: 0.9, transition: 'opacity 0.2s', lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}>
            <InstagramIcon />
            <span>@viderastore</span>
          </a>
        </div>
      </header>

      {/* Popup de horários */}
      {showHours && (
        <div ref={popupRef} style={{ position: 'fixed', top: '70px', left: '16px', zIndex: 9999, background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '20px', minWidth: '260px', color: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Horários de Funcionamento</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              const hours = BUSINESS_HOURS[day as keyof typeof BUSINESS_HOURS];
              const dayName = DAY_NAMES[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)];
              const isToday = storeStatus.currentDay === dayName;
              return (
                <li key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderRadius: '10px', background: isToday ? 'rgba(255,255,255,0.08)' : 'transparent', opacity: hours ? 1 : 0.5 }}>
                  <span style={{ fontWeight: isToday ? '600' : '400' }}>{dayName}{isToday && <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }}> • hoje</span>}</span>
                  <span>{hours ? `${hours.open} – ${hours.close}` : 'Fechado'}</span>
                </li>
              );
            })}
          </ul>
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>🕒 {storeStatus.currentDay} • {storeStatus.currentTime}</p>
        </div>
      )}

      {/* Barra de navegação + busca expansível */}
      <nav style={applyThemeStyles({
        background: colors.background,
        borderBottom: `1px solid ${colors.secondary}`,
        padding: isScrolled ? '12px 0' : '16px 0',
        boxShadow: isScrolled ? `0 4px 20px ${colors.primary}15` : 'none',
        transition: 'all 0.3s ease',
        zIndex: 100,
        position: 'relative',
      }, 'header')}>
        <div ref={navContainerRef} className="nav-buttons-container" style={{ position: 'relative', alignItems: 'center' }}>
          {/* Lupa agora é o primeiro item */}
          {!hideSearch && (
            <button onClick={toggleSearch}
              aria-label="Buscar"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showSearch ? colors.primary : 'transparent',
                border: showSearch ? 'none' : `1px solid ${colors.secondary}`,
                borderRadius: '50%',
                width: '40px', height: '40px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                marginRight: '8px',
              }}
            >
              <SearchIconImg />
            </button>
          )}

          {NICHO_LINKS.map((niche) => {
            const nicheConfig = getCategoryConfig(niche.id);
            const isActive = activeNiche === niche.id;
            return (
              <Link key={niche.id} href={niche.path}
                className={`nav-button ${isActive ? 'nav-button-active' : ''}`}
                style={{
                  ...applyThemeStyles({
                    background: isActive ? nicheConfig.color : 'transparent',
                    color: isActive ? 'white' : colors.text,
                    border: isActive ? 'none' : `1px solid ${colors.secondary}`,
                  }, isActive ? 'button-primary' : 'button-secondary'),
                  display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                }}
                onClick={saveScrollPosition}>
                <NavIcon src={niche.icon} alt={niche.name} />
                <span className="nav-button-text">{niche.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Campo de busca expansível – agora em fluxo normal, fora do nav */}
      {showSearch && !hideSearch && (
        <div style={{
          background: colors.background,
          borderBottom: `1px solid ${colors.secondary}`,
          padding: '12px 20px',
          boxShadow: `0 4px 12px ${colors.primary}10`,
          zIndex: 99,
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={localSearchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); if (onSearch) onSearch(localSearchTerm.trim()); } }}
              style={applyThemeStyles({
                width: '100%',
                padding: '12px 20px 12px 40px',
                border: `2px solid ${colors.primary}`,
                borderRadius: '50px',
                fontSize: '15px',
                background: colors.cardBg,
                color: colors.text,
                boxShadow: `0 2px 10px ${colors.primary}20`,
              }, 'filter')}
            />
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <SearchIconImg />
            </div>
            {localSearchTerm && (
              <button type="button" onClick={clearSearch}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}