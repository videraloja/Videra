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
  // Imagens NÃO passam mais pelo otimizador da Vercel (/_next/image): a cota
  // do plano Hobby estourou e ele passou a responder 402. Quem redimensiona
  // agora é o wsrv.nl, via lib/imageLoader.ts.
  images: {
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'synudoglvwbogfzbcdii.supabase.co',
      },
    ],
    formats: ['image/webp'],
  },
  
  // Melhorar performance no dev mode
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
};

export default nextConfig;