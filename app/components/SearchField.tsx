// app/components/SearchField.tsx
// Campo de busca extraído do Header.tsx pra ser reaproveitado também na
// página de produto (overlay de busca) — mesma aparência e comportamento,
// só o destino do texto digitado muda por quem usa (Header filtra uma lista
// já carregada; a página de produto dispara uma consulta própria).
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useThemeColors } from '../../hooks/useThemeColors';

const SEARCH_ICON = '/icones/lupa.png';

const FallbackSearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SearchIconImg = () => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <FallbackSearchIcon />;
  return (
    <Image src={SEARCH_ICON} alt="Buscar" width={20} height={20} style={{ objectFit: 'contain' }} onError={() => setHasError(true)} />
  );
};

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: (value: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}

export default function SearchField({ value, onChange, onEnter, placeholder, inputRef, autoFocus }: SearchFieldProps) {
  const { colors, applyThemeStyles } = useThemeColors();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        placeholder={placeholder || 'Buscar produtos...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
            onEnter?.(value.trim());
          }
        }}
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
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
