import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para permitir acesso do IP local durante desenvolvimento
  allowedDevOrigins: [
    'localhost',
    '192.168.100.5',
    '0.0.0.0',
    '127.0.0.1'
  ],
  headers: async () => {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
  ];
},
  // Configurações de otimização de imagens (importante para e-commerce)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite imagens de qualquer domínio HTTPS
      },
    ],
    formats: ['image/avif', 'image/webp'], // Formatos modernos
  },
  
  // Melhorar performance no dev mode
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
};

export default nextConfig;