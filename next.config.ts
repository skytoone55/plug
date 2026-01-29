import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bnfudxssdnphfbqcoext.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // OPTIMISATIONS CRITIQUES POUR LA STABILITÉ

  // Réduire le nombre de pages en mémoire
  onDemandEntries: {
    maxInactiveAge: 15 * 1000, // 15 secondes au lieu de 60
    pagesBufferLength: 2,      // Garder seulement 2 pages en buffer
  },

  // Désactiver les fonctionnalités gourmandes en mémoire
  reactStrictMode: false,

  // Optimisations webpack
  webpack: (config, { dev }) => {
    if (dev) {
      // Réduire la consommation mémoire en dev
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // Désactiver le cache en mémoire pour éviter les fuites
      config.cache = false;
    }
    return config;
  },

  experimental: {
    webpackMemoryOptimizations: true,
  },

  // Spécifier explicitement le root pour éviter les warnings
  outputFileTracingRoot: '/Users/john/JARVIS/PLUG',
};

export default nextConfig;
