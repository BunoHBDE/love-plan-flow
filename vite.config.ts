import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ============================================
  // OTIMIZAÇÕES DE BUILD
  // ============================================
  build: {
    // Gera source maps para debugging
    sourcemap: true,
    
    // Configuração de chunks otimizada
    rollupOptions: {
      output: {
        // Separação manual de chunks para melhor cache
        manualChunks: {
          // Vendors do React - muda raramente
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Componentes UI do Radix - agrupa todos
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
          ],
          
          // Animações - pode ser carregado depois
          'animations': ['framer-motion'],
          
          // Utilitários
          'utils': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'date-fns',
          ],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Fontes (carregam separadamente)
          'fonts': [
            '@fontsource/inter',
            '@fontsource/playfair-display',
          ],
        },
        
        // Nomes de arquivo com hash para cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Target para browsers modernos (menos polyfills)
    target: 'esnext',
    
    // Limite de aviso para chunks grandes (em KB)
    chunkSizeWarningLimit: 500,
  },

  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));