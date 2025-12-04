// Helper para carregar epubjs apenas no cliente
// Este arquivo é ignorado durante SSR pelo next/dynamic no BookViewer
export async function loadEpubjs() {
  if (typeof window === 'undefined') {
    throw new Error('epubjs só pode ser carregado no cliente')
  }
  
  // Usar import dinâmico direto - o next/dynamic garante que isso só roda no cliente
  // O webpack precisa ver a string literal para incluir o módulo no bundle
  return await import('epubjs')
}

