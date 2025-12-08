/**
 * Utilitários específicos para PDF
 */

import { loadScript } from '../utils'

export interface OutlineItem {
  title: string
  dest?: any
  items?: OutlineItem[]
}

/**
 * Carrega a biblioteca PDF.js
 */
export async function loadPDFJS(): Promise<any> {
  // @ts-ignore
  let pdfjsLib = window.pdfjsLib || window.pdfjs || (window as any).pdfjs
  
  if (!pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
    await new Promise((resolve) => setTimeout(resolve, 100))
    // @ts-ignore
    pdfjsLib = window.pdfjsLib || window.pdfjs || (window as any).pdfjs
  }
  
  if (!pdfjsLib) {
    throw new Error('Não foi possível carregar pdfjs-dist do CDN')
  }
  
  // Configurar worker do PDF.js
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`
  }

  return pdfjsLib
}

/**
 * Configura supressão de avisos do PDF.js
 */
export function setupPDFJSWarnings() {
  const originalWarn = console.warn
  
  console.warn = (...args: any[]) => {
    // Ignorar avisos sobre knockout groups e outros avisos não críticos
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Knockout groups')) {
      return
    }
    originalWarn.apply(console, args)
  }
  
  return () => {
    console.warn = originalWarn
  }
}

/**
 * Carrega o PDF com autenticação se necessário
 */
export async function loadPDFFile(
  fileUrl: string,
  blobUrlRef: React.MutableRefObject<string | null>,
  userId?: number
): Promise<string> {
  let url = fileUrl
  
  if (userId) {
    const response = await fetch(fileUrl, {
      headers: {
        'X-User-ID': userId.toString(),
      },
    })
    
    if (!response.ok) {
      throw new Error('Erro ao carregar PDF')
    }
    
    const blob = await response.blob()
    
    // Limpar blob URL anterior se existir
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }
    
    blobUrlRef.current = URL.createObjectURL(blob)
    url = blobUrlRef.current
  }
  
  return url
}

/**
 * Carrega o outline (capítulos) do PDF
 */
export async function loadPDFOutline(pdfDoc: any): Promise<OutlineItem[]> {
  try {
    const pdfOutline = await pdfDoc.getOutline()
    return pdfOutline || []
  } catch (err) {
    // Se não houver outline, retorna array vazio
    return []
  }
}

/**
 * Resolve o número da página de um item do outline
 */
export async function resolveOutlinePage(pdf: any, item: OutlineItem, totalPages: number): Promise<number | null> {
  const dest = item.dest
  if (!dest) {
    return null
  }
  
  let pageNumber = 1
  
  try {
    // Se o destino for um array, o primeiro elemento é geralmente a referência da página
    if (Array.isArray(dest) && dest.length > 0) {
      const destRef = dest[0]
      
      // Se for um objeto com referência, usar getPageIndex
      if (destRef && typeof destRef === 'object') {
        try {
          const pageIndex = await pdf.getPageIndex(destRef)
          pageNumber = pageIndex + 1
        } catch (err) {
          // Se getPageIndex falhar, tentar usar a propriedade 'num' se existir
          if ('num' in destRef && typeof destRef.num === 'number') {
            pageNumber = destRef.num + 1
          } else {
            return null
          }
        }
      } else if (typeof destRef === 'number') {
        // Se for número direto (índice baseado em 0)
        pageNumber = destRef + 1
      }
    } else if (typeof dest === 'string') {
      // Se for uma string (nome de destino), tentar resolver
      try {
        if (typeof pdf.getDestination === 'function') {
          const resolvedDest = await pdf.getDestination(dest)
          if (resolvedDest && Array.isArray(resolvedDest) && resolvedDest.length > 0) {
            const destRef = resolvedDest[0]
            if (destRef && typeof destRef === 'object') {
              const pageIndex = await pdf.getPageIndex(destRef)
              pageNumber = pageIndex + 1
            }
          }
        } else {
          const pageIndex = await pdf.getPageIndex(dest)
          pageNumber = pageIndex + 1
        }
      } catch (err) {
        return null
      }
    } else {
      return null
    }
    
    // Garantir que o número da página está dentro dos limites
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages))
    
    return pageNumber >= 1 && pageNumber <= totalPages ? pageNumber : null
  } catch (err) {
    return null
  }
}

