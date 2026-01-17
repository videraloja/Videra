'use client';

import React, { useState } from 'react';

interface EmojiSelectorProps {
  label: string;
  value: string;
  onChange: (emoji: string) => void;
  category?: string;
}

const EMOJI_CATEGORIES = {
  objects: ['🛒', '📦', '🎁', '📱', '💻', '🎮', '🕹️', '🎲', '♟️', '🎴'],
  nature: ['⚡', '🔥', '💧', '🌊', '⭐', '🌟', '✨', '🎄', '❄️', '🌙'],
  symbols: ['🔍', '🔎', '🎯', '🏷️', '📍', '✅', '❌', '⭐', '💎', '🔮'],
  holidays: ['🎄', '🎅', '🦌', '🎁', '❄️', '🎃', '👻', '💀', '🍬', '🕷️'],
  vehicles: ['🏎️', '🚗', '🚀', '✈️', '🚂', '🚁', '🚲', '🛵', '🚒', '🚑'],
  animals: ['🐉', '🐲', '🦖', '🐯', '🦁', '🐍', '🦅', '🐺', '🦊', '🐼']
};

export default function EmojiSelector({ label, value, onChange, category }: EmojiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getEmojis = () => {
    if (category && EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES]) {
      return EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES];
    }
    
    // Se não especificou categoria, retorna todos os emojis
    return Object.values(EMOJI_CATEGORIES).flat();
  };

  const emojis = getEmojis();

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
      }}>
        {label}
      </label>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Preview do Emoji */}
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          {value || '😊'}
        </div>
        
        {/* Input de Texto */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '16px',
            textAlign: 'center'
          }}
          placeholder="Selecione um emoji..."
          maxLength={2}
        />
        
        {/* Botão para abrir seletor */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {isOpen ? 'Fechar' : 'Abrir'} Emojis
        </button>
      </div>

      {/* Grid de Emojis */}
      {isOpen && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            Selecione um emoji:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px'
          }}>
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(emoji);
                  setIsOpen(false);
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: emoji === value ? '#3b82f6' : 'transparent',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (emoji !== value) {
                    e.currentTarget.style.background = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (emoji !== value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}