// components/ThemeToggle.tsx - ATUALIZADO
"use client";

import { useTheme } from "../../app/contexts/ThemeContext"; // ← IMPORT DO CONTEXTO
import { useThemeColors } from "../../hooks/useThemeColors"; // ← IMPORT DO HOOK NA RAIZ

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { colors, getShadow } = useThemeColors();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.secondary}`,
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'all 0.3s ease',
        boxShadow: getShadow('small')
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = getShadow('medium');
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = getShadow('small');
      }}
      title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}