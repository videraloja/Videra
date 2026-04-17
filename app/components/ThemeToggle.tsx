"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "../../app/contexts/ThemeContext";
import { useThemeColors } from "../../hooks/useThemeColors";

export default function ThemeToggle() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const { theme, toggleTheme } = useTheme();
  const { colors, getShadow } = useThemeColors();

  // Se não estiver na área admin, não renderiza nada
  if (!isAdmin) return null;

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