// app/components/ConditionalFooter.tsx – VERSÃO COM INSTAGRAM OCULTO NO MOBILE
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

// Ícones SVG (estilo minimalista)
const MapIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EmailIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E4405F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (['/cart'].includes(pathname)) return null;

  const { colors, forceRefreshTheme } = useThemeColors();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      forceRefreshTheme();
    }
  }, [pathname, forceRefreshTheme]);

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
  const mutedColor = colors.text + '99';
  const borderColor = colors.secondary;

  return (
    <footer style={{
      background: footerBg,
      borderTop: `3px solid ${primaryColor}`,
      marginTop: 'auto',
      padding: '48px 20px 24px',
      color: textColor,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Frase da loja */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '0 20px 32px',
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <p style={{
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '1.6',
            color: textColor,
            opacity: 0.9,
            margin: 0,
            letterSpacing: '0.2px',
          }}>
            Pokémon TCG, Board Games, Acessórios e Hot Wheels —<br />tudo original e lacrado. Do jeito que o colecionador gosta!
          </p>
        </div>

        {/* Grid de contatos */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* Endereço (ocupa sempre 1 coluna) */}
          <div className="footer-item footer-address" style={{ textAlign: 'center' }}>
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
            <a
              href="https://www.google.com/maps/place/Videra+Loja+virtual/@-3.0340442,-60.0101189,20.16z/data=!4m6!3m5!1s0x926c1b372da27575:0x4daf1b91802bc5e5!8m2!3d-3.0340946!4d-60.0102163!16s%2Fg%2F11lcmykf0m?entry=ttu&g_ep=EgoyMDI2MDQwNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: textColor, display: 'block' }}
            >
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
                opacity: 0.9
              }}>
                Rua Áurea Graciano, 15<br />
                Col. Santo Antônio<br />
                Manaus – AM<br />
                69093-045
              </p>
            </a>
          </div>

          {/* E‑mail */}
          <div className="footer-item" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '12px' }}>
              <EmailIcon color={primaryColor} />
            </div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: mutedColor,
              margin: '0 0 8px'
            }}>
              E‑mail
            </h4>
            <a
              href="mailto:videraloja@gmail.com"
              style={{
                textDecoration: 'none',
                color: textColor,
                fontSize: '14px',
                fontWeight: '500',
                opacity: 0.9,
              }}
            >
              videraloja@gmail.com
            </a>
          </div>

          {/* WhatsApp */}
          <div className="footer-item" style={{ textAlign: 'center' }}>
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

          {/* Instagram – oculto no mobile */}
          <div className="footer-item footer-instagram" style={{ textAlign: 'center' }}>
            <a href="https://www.instagram.com/viderastore" target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ marginBottom: '12px' }}>
                <InstagramIcon />
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
              <p style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>@viderastore</p>
            </a>
          </div>
        </div>

        {/* CNPJ e Copyright */}
        <div style={{
          textAlign: 'center',
          paddingTop: '24px',
          borderTop: `1px solid ${borderColor}`,
          fontSize: '12px',
          color: mutedColor,
          letterSpacing: '0.3px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <span>CNPJ: 58.756.836/0001-09</span>
          <span>© {new Date().getFullYear()} Videra — Todos os direitos reservados.</span>
        </div>
      </div>

      {/* Estilos responsivos */}
      <style jsx>{`
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-address {
            grid-column: 1 / -1; /* ocupar toda a largura em cima */
          }
          .footer-instagram {
            display: none; /* remover Instagram no mobile */
          }
        }
      `}</style>
    </footer>
  );
}