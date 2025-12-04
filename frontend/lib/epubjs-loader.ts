'use client'

// Este arquivo é carregado apenas no cliente via next/dynamic
// Contém o import direto do epubjs

export async function loadEpubjs() {
  if (typeof window === 'undefined') {
    throw new Error('epubjs só pode ser carregado no cliente')
  }
  // @ts-ignore
  return await import('epubjs')
}

