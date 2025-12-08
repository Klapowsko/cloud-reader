/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removido output standalone - usando build padrão com npm start
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  webpack: (config, { isServer }) => {
    // Configuração para epubjs e pdfjs-dist
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    // Configurar externals apenas no servidor para evitar análise estática
    if (isServer) {
      const originalExternals = config.externals
      const externalFunction = (context, request, callback) => {
        // Ignorar completamente epubjs e pdfjs-dist no servidor
        if (request === 'epubjs' || request === 'pdfjs-dist') {
          return callback(null, 'commonjs ' + request)
        }
        if (typeof originalExternals === 'function') {
          return originalExternals(context, request, callback)
        }
        callback()
      }
      
      if (Array.isArray(originalExternals)) {
        config.externals = [...originalExternals, externalFunction]
      } else if (originalExternals) {
        config.externals = [originalExternals, externalFunction]
      } else {
        config.externals = externalFunction
      }
    } else {
      // No cliente, garantir que NÃO sejam tratados como externals
      // Remover qualquer external que possa estar configurado para esses módulos
      if (config.externals) {
        const originalExternals = config.externals
      if (Array.isArray(originalExternals)) {
        config.externals = originalExternals.filter((ext) => {
          if (typeof ext === 'function') {
            // Não filtrar funções, mas garantir que não bloqueiem nossos módulos
            return true
          }
          if (typeof ext === 'object' && ext !== null) {
            // Remover se for epubjs ou pdfjs-dist
            return !ext.epubjs && !ext['pdfjs-dist']
          }
          return true
        })
      }
      }
    }
    
    // Ignorar avisos sobre dependências dinâmicas e permitir imports dinâmicos
    config.module = config.module || {}
    config.module.unknownContextCritical = false
    config.module.unknownContextRegExp = /^\.\/.*$/
    config.module.unknownContextRequest = '.'
    
    // No cliente, garantir que os módulos sejam incluídos no bundle
    if (!isServer) {
      // Forçar resolução dos módulos no cliente
      config.resolve.alias = {
        ...config.resolve.alias,
      }
      
      // Garantir que não sejam tratados como externals no cliente
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter((ext) => {
          if (typeof ext === 'function') {
            // Manter funções mas garantir que não bloqueiem nossos módulos
            return true
          }
          if (typeof ext === 'object' && ext !== null) {
            // Remover se for epubjs ou pdfjs-dist
            return !ext.epubjs && !ext['pdfjs-dist']
          }
          return true
        })
      }
    }
    
    // Ignorar módulos específicos durante análise estática do servidor
    if (isServer) {
      const webpack = require('webpack')
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource) {
            // Ignorar epubjs, pdfjs-dist e os loaders apenas no servidor
            return (
              resource.includes('epubjs') ||
              resource.includes('pdfjs-dist') ||
              resource.includes('pdfjs-loader') ||
              resource.includes('epubjs-loader')
            )
          },
        })
      )
    }
    
    // Configuração adicional para permitir imports dinâmicos sem análise estática
    config.optimization = config.optimization || {}
    config.optimization.moduleIds = 'deterministic'
    
    // Desabilitar análise estática para imports dinâmicos
    config.module = config.module || {}
    config.module.strictExportPresence = false
    
    return config
  },
}

module.exports = nextConfig

