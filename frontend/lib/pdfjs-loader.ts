'use client'

// Este arquivo é carregado apenas no cliente via next/dynamic
// Contém o import direto do pdfjs-dist

export async function loadPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs-dist só pode ser carregado no cliente')
  }
  // @ts-ignore
  return await import('pdfjs-dist')
}

