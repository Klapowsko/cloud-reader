// Helper para carregar pdfjs-dist apenas no cliente
// Este arquivo é ignorado durante SSR pelo next/dynamic no BookViewer
export async function loadPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs-dist só pode ser carregado no cliente')
  }
  
  // Usar import dinâmico direto - o next/dynamic garante que isso só roda no cliente
  // O webpack precisa ver a string literal para incluir o módulo no bundle
  return await import('pdfjs-dist')
}

