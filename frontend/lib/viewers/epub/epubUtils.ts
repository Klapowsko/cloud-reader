/**
 * Utilitários específicos para EPUB
 */

import { loadScript } from '../utils'

export interface Chapter {
  id: string
  label: string
  href?: string
  level: number
  items?: Chapter[]
}

/**
 * Carrega a biblioteca epubjs
 */
export async function loadEpubJS(): Promise<{ Book: any; Rendition: any }> {
  let ePub: any
  try {
    const epubjsModule = await import('epubjs')
    // @ts-ignore
    ePub = epubjsModule.default || epubjsModule
  } catch (importError) {
    // @ts-ignore
    ePub = window.ePub || window.EPUB || (window as any).ePub
    
    if (!ePub) {
      await loadScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js')
      let attempts = 0
      while (!ePub && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        // @ts-ignore
        ePub = window.ePub || window.EPUB || (window as any).ePub || (window as any).EPUBJS?.ePub
        attempts++
      }
    }
  }
  
  if (!ePub) {
    throw new Error('Não foi possível carregar epubjs')
  }
  
  const Book = ePub.Book || ePub.default?.Book || ePub
  const Rendition = ePub.Rendition || ePub.default?.Rendition
  
  if (!Book || !Rendition) {
    throw new Error('epubjs não foi carregado corretamente')
  }

  return { Book, Rendition }
}

/**
 * Aguarda o elemento do viewer estar disponível
 */
export async function waitForViewerElement(
  viewerRef: React.RefObject<HTMLDivElement>,
  containerId: string = 'epub-viewer-container'
): Promise<HTMLDivElement> {
  // Primeiro, tentar usar a ref diretamente
  if (viewerRef.current) {
    return viewerRef.current
  }
  
  // Se não estiver disponível, tentar pelo ID
  let elementById = document.getElementById(containerId)
  if (elementById) {
    // @ts-ignore
    viewerRef.current = elementById
    return elementById
  }
  
  // Aguardar o elemento aparecer no DOM
  let attempts = 0
  const maxAttempts = 50 // Aumentado para dar mais tempo
  
  while (attempts < maxAttempts) {
    // Tentar pela ref primeiro
    if (viewerRef.current) {
      return viewerRef.current
    }
    
    // Tentar pelo ID
    elementById = document.getElementById(containerId)
    if (elementById) {
      // @ts-ignore
      viewerRef.current = elementById
      return elementById
    }
    
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }
  
  // Última tentativa
  elementById = document.getElementById(containerId)
  if (elementById) {
    // @ts-ignore
    viewerRef.current = elementById
    return elementById
  }
  
  throw new Error('Elemento do viewer não encontrado após ' + maxAttempts + ' tentativas')
}

/**
 * Cria as opções do livro
 */
export function createBookOptions(fileUrl: string, userId?: number): any {
  const bookOptions: any = { openAs: 'epub' }
  
  if (userId) {
    bookOptions.requestMethod = (requestUrl: string): Promise<ArrayBuffer> => {
      let finalUrl = requestUrl
      if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://') && !requestUrl.startsWith('blob:')) {
        try {
          const baseUrl = new URL(fileUrl)
          finalUrl = new URL(requestUrl, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/')) + '/').href
        } catch (e) {
          finalUrl = requestUrl
        }
      }
      
      return fetch(finalUrl, {
        headers: { 'X-User-ID': userId.toString() },
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.arrayBuffer()
      })
    }
  }

  return bookOptions
}

/**
 * Aguarda o livro estar pronto
 */
export async function waitForBookReady(book: any): Promise<void> {
  if (book.isOpen) {
    return
  }
  
  if (book.ready && typeof book.ready.then === 'function') {
    let isOpenDetected = false
    const checkInterval = setInterval(() => {
      if (book.isOpen) {
        isOpenDetected = true
        clearInterval(checkInterval)
      }
    }, 500)
    
    const timeoutPromise = new Promise<void>((resolve, reject) => 
      setTimeout(() => {
        clearInterval(checkInterval)
        if (book.isOpen || isOpenDetected) {
          resolve()
        } else {
          reject(new Error('Timeout ao carregar livro EPUB (10s)'))
        }
      }, 10000)
    )
    
    try {
      await Promise.race([book.ready.then(() => { clearInterval(checkInterval) }), timeoutPromise])
      clearInterval(checkInterval)
    } catch (timeoutErr) {
      clearInterval(checkInterval)
      if (!book.isOpen && !isOpenDetected) {
        throw timeoutErr
      }
    }
  } else {
    const readyPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (book.isOpen) {
          resolve()
        } else {
          reject(new Error('Timeout ao carregar livro EPUB (60s)'))
        }
      }, 60000)
      
      const checkReady = () => {
        if (book.isOpen || book.opened) {
          clearTimeout(timeout)
          book.off('opened', checkReady)
          resolve()
        }
      }
      
      book.on('opened', checkReady)
      
      const interval = setInterval(checkReady, 500)
      setTimeout(() => {
        clearInterval(interval)
        if (book.isOpen) {
          clearTimeout(timeout)
          resolve()
        }
      }, 60000)
    })
    
    await readyPromise
  }
}

/**
 * Carrega os capítulos do livro
 */
export async function loadChapters(book: any): Promise<Chapter[]> {
  try {
    // @ts-ignore
    const navigation = book.navigation
    if (!navigation) {
      return []
    }

    // Tentar diferentes formas de acessar o TOC
    // @ts-ignore
    let toc = navigation.toc || navigation.navMap || navigation.landmarks
    
    if (!toc) {
      return []
    }

    // Função recursiva para processar o TOC
    const processToc = (items: any[], level: number = 0): Chapter[] => {
      if (!items || !Array.isArray(items)) {
        return []
      }
      
      return items.map((item: any) => {
        // epubjs pode usar diferentes propriedades para o título
        const label = item.label || item.title || item.text || 'Sem título'
        // epubjs pode usar href ou src para a referência
        const href = item.href || item.src || item.id
        // epubjs pode usar subitems, items, ou children para subcapítulos
        const subitems = item.subitems || item.items || item.children || []
        
        const chapter: Chapter = {
          id: item.id || Math.random().toString(36).substr(2, 9),
          label: label,
          href: href,
          level: level,
          items: subitems && subitems.length > 0 
            ? processToc(subitems, level + 1) 
            : []
        }
        return chapter
      })
    }
    
    // Processar o TOC dependendo do formato
    if (Array.isArray(toc)) {
      return processToc(toc)
    } else if (toc && typeof toc === 'object') {
      // Se for um objeto, tentar converter para array
      if (toc.length !== undefined) {
        const tocArray = Array.from(toc)
        return processToc(tocArray)
      } else if (toc.items && Array.isArray(toc.items)) {
        return processToc(toc.items)
      } else {
        // Tentar usar o próprio objeto como item único
        return processToc([toc])
      }
    }
    
    return []
  } catch (err) {
    console.error('Erro ao carregar capítulos:', err)
    return []
  }
}

