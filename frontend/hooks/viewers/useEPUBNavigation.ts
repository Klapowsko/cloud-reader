'use client'

import { useCallback } from 'react'
import type { Chapter } from '@/lib/viewers/epub/epubUtils'

interface UseEPUBNavigationProps {
  renditionRef: React.RefObject<any>
  bookRef: React.RefObject<any>
  onCloseChapters?: () => void
}

export function useEPUBNavigation({
  renditionRef,
  bookRef,
  onCloseChapters,
}: UseEPUBNavigationProps) {
  const navigateToChapter = useCallback(async (chapter: Chapter) => {
    if (!renditionRef.current || !bookRef.current) return
    
    try {
      let target: string | undefined = chapter.href
      
      // Se não tiver href, tentar usar o id ou label para buscar
      if (!target && chapter.id) {
        // @ts-ignore
        const spine = bookRef.current.spine
        if (spine) {
          // @ts-ignore
          const item = spine.get(chapter.id)
          if (item) {
            // @ts-ignore
            target = item.href
          }
        }
      }
      
      if (!target) {
        console.warn('Capítulo não tem href válido:', chapter)
        return
      }
      
      // Usar display com o href ou CFI
      // @ts-ignore
      const displayed = renditionRef.current.display(target)
      if (displayed && typeof displayed.then === 'function') {
        await displayed
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      if (onCloseChapters) {
        onCloseChapters()
      }
    } catch (err: any) {
      console.error('Erro ao navegar para capítulo:', err)
      // Tentar fallback: usar apenas o href como string
      try {
        if (chapter.href) {
          // @ts-ignore
          const displayed = renditionRef.current.display(chapter.href)
          if (displayed && typeof displayed.then === 'function') {
            await displayed
          }
          if (onCloseChapters) {
            onCloseChapters()
          }
        }
      } catch (fallbackErr) {
        console.error('Erro no fallback de navegação:', fallbackErr)
      }
    }
  }, [renditionRef, bookRef, onCloseChapters])

  const nextPage = useCallback(async () => {
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.next()
        if (result && typeof result.then === 'function') {
          await result
        }
      } catch (err) {
        console.error('EPUBViewer - Erro ao chamar next():', err)
      }
    }
  }, [renditionRef])

  const prevPage = useCallback(async () => {
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.prev()
        if (result && typeof result.then === 'function') {
          await result
        }
      } catch (err) {
        console.error('EPUBViewer - Erro ao chamar prev():', err)
      }
    }
  }, [renditionRef])

  return {
    navigateToChapter,
    nextPage,
    prevPage,
  }
}

