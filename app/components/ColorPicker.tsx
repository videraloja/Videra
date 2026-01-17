'use client';

import React, { useState } from 'react';

interface ColorPickerProps {
  label?: string;    // ⬅️ AGORA É OPCIONAL com "?"
  value?: string;
  color?: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export default function ColorPicker({ 
  label, 
  value, 
  color, 
  onChange, 
  presets = [] 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Usa "color" se existir, senão usa "value", senão usa padrão
  const colorValue = color || value || '#000000';

  const defaultPresets = [
    '#7c3aed', '#dc2626', '#059669', '#0369a1', '#f59e0b',
    '#8b5cf6', '#ef4444', '#10b981', '#0ea5e9', '#d97706'
  ];

  const allPresets = [...defaultPresets, ...presets];

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Label condicional - só mostra se existir */}
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          {label}
        </label>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Preview da Cor */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: colorValue,
            border: '2px solid #d1d5db',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={() => setIsOpen(!isOpen)}
        />
        
        {/* Input de Cor */}
        <input
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '60px',
            height: '40px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        />
        
        {/* Input de Texto */}
        <input
          type="text"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
          placeholder="#000000"
        />
      </div>

      {/* Presets de Cores */}
      {isOpen && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Cores Pré-definidas:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {allPresets.map((presetColor, index) => (
              <button
                key={index}
                onClick={() => onChange(presetColor)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: presetColor,
                  border: presetColor === colorValue ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}