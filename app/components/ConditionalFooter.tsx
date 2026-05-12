// app/components/ConditionalFooter.tsx – VERSÃO FINAL SINCRONIZADA (ESCUTA EVENTO + POLLING ATIVO)
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

const MapIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E4405F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <rect x="2" y="5" width="20" height="16" rx="3" />
    <circle cx="12" cy="13" r="3" />
    <path d="M7 5h10l1-2H6l1 2z" />
  </svg>
);

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (['/cart'].includes(pathname)) return null;

  const { colors, refreshTheme, forceRefreshTheme } = useThemeColors();
  const pathnameRef = useRef(pathname);

  // Sempre que o pathname mudar, força a atualização do tema imediatamente
  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      forceRefreshTheme();
    }
  }, [pathname, forceRefreshTheme]);

  // Escuta o evento theme-changed (disparado pelo PageThemeContext ao alterar tema de página)
  useEffect(() => {
    const handleThemeChanged = () => {
      forceRefreshTheme();
    };
    window.addEventListener('theme-changed', handleThemeChanged);
    return () => window.removeEventListener('theme-changed', handleThemeChanged);
  }, [forceRefreshTheme]);

  const footerBg = colors.background;
  const textColor = colors.text;
  const primaryColor = colors.primary;
  const mutedColor = colors.text + '90';

  return (
    <footer style={{
      background: footerBg,
      borderTop: `3px solid ${primaryColor}`,
      marginTop: 'auto',
      padding: '48px 20px 32px',
      color: textColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div className="footer-grid-premium" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Endereço */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '12px' }}>
            <MapIcon color={primaryColor} />
          </div>
          <h4 style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: mutedColor,
            margin: '0 0 12px'
          }}>
            Endereço
          </h4>
          <p style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: textColor,
            margin: 0,
            opacity: 0.9
          }}>
            Rua Áurea Graciano, 15<br />
            Col. Santo Antônio<br />
            Manaus – AM<br />
            69093-045
          </p>
        </div>

        {/* WhatsApp */}
        <div style={{ textAlign: 'center' }}>
          <a href="https://wa.me/5592986446677" target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div style={{ marginBottom: '12px' }}>
              <ChatIcon />
            </div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: mutedColor,
              margin: '0 0 8px'
            }}>
              WhatsApp
            </h4>
            <p style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>(92) 98644-6677</p>
          </a>
        </div>

        {/* Instagram */}
        <div style={{ textAlign: 'center' }}>
          <a href="https://www.instagram.com/videra_lojavirtual?igsh=bzBoYmFpanVvM2N5" target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div style={{ marginBottom: '12px' }}>
              <CameraIcon />
            </div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: mutedColor,
              margin: '0 0 8px'
            }}>
              Instagram
            </h4>
            <p style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>@videra_lojavirtual</p>
          </a>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: `1px solid ${colors.secondary}`,
        fontSize: '12px',
        color: mutedColor,
        letterSpacing: '0.3px'
      }}>
        © {new Date().getFullYear()} Videra — Todos os direitos reservados.
      </div>
    </footer>
  );
}