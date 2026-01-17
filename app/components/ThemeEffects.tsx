// components/ThemeEffects.tsx - ATUALIZADO PARA TEMAS POR PÁGINA
'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../../hooks/useThemeColors'; // 🆕 IMPORT DO HOOK

export const ThemeEffects: React.FC = () => {
  const { currentThemeConfig } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🆕 CORREÇÃO: Calcula se tem efeitos baseado no nome do tema
  const themeName = currentThemeConfig?.name?.toLowerCase() || '';
  const shouldShowEffects = 
    themeName.includes('natal') || 
    themeName.includes('halloween') ||
    themeName.includes('confetti') ||
    false;
  // 🆕 CORREÇÃO: Usar o hook que já tem a lógica hierárquica
 
  // Efeito de Neve
  useEffect(() => {
    if (!shouldShowEffects || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const snowflakes: Array<{ x: number; y: number; radius: number; speed: number }> = [];

    // Criar flocos de neve
    for (let i = 0; i < 100; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1
      });
    }

    const drawSnow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      snowflakes.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        // Mover floco
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y * 0.01) * 0.5;

        // Reset quando sair da tela
        if (flake.y > canvas.height) {
          flake.y = 0;
          flake.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(drawSnow);
    };

    drawSnow();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldShowEffects]); // 🆕 CORREÇÃO: Dependência do hook

  // 🆕 CORREÇÃO: Verificar usando o hook hierárquico
  if (!shouldShowEffects) {
    return null;
  }

  return (
    <>
      {/* 🆕 CORREÇÃO: Mostrar efeitos baseado no tema efetivo (página ou global) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9998
        }}
      />
    </>
  );
};