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
    if (!renditionRef.current || !bookRef.current) return
    
    try {
      // Verificar se há mais conteúdo antes de tentar navegar
      // @ts-ignore
      const currentLocation = renditionRef.current.currentLocation()
      if (!currentLocation) {
        return
      }
      
      // Tentar gerar mais locations se necessário
      // @ts-ignore
      const locations = bookRef.current.locations
      if (locations && typeof locations.generate === 'function') {
        // @ts-ignore
        const currentProgress = locations.percentageFromCfi 
          ? locations.percentageFromCfi(currentLocation.start?.cfi || currentLocation.start || '')
          : null
        
        // Se estiver perto do fim (acima de 90%), tentar gerar mais locations
        if (currentProgress !== null && currentProgress > 0.9) {
          // @ts-ignore
          const spine = bookRef.current.spine
          if (spine) {
            // @ts-ignore
            const spineLength = spine.length || (spine.items && spine.items.length) || 0
            // @ts-ignore
            if (!locations.total || locations.total < spineLength * 100) {
              // Gerar mais locations em background
              // @ts-ignore
              locations.generate(spineLength * 200).catch(() => {
                // Ignorar erros silenciosamente
              })
            }
          }
        }
      }
      
      // Tentar navegar para próxima página
      // @ts-ignore
      const result = renditionRef.current.next()
      if (result && typeof result.then === 'function') {
        await result
      } else {
        // Se next() não retornou uma promise, pode significar que não há mais páginas
        // Tentar verificar se realmente chegou ao fim
        await new Promise((resolve) => setTimeout(resolve, 100))
        // @ts-ignore
        const newLocation = renditionRef.current.currentLocation()
        if (newLocation && newLocation.start?.cfi === currentLocation.start?.cfi) {
          // Não mudou de localização, pode ter chegado ao fim
          // Tentar forçar geração de mais locations e tentar novamente
          if (locations && typeof locations.generate === 'function') {
            // @ts-ignore
            const spine = bookRef.current.spine
            if (spine) {
              // @ts-ignore
              const spineLength = spine.length || (spine.items && spine.items.length) || 0
              // @ts-ignore
              await locations.generate(spineLength * 300)
              await new Promise((resolve) => setTimeout(resolve, 300))
              // Tentar novamente
              // @ts-ignore
              const retryResult = renditionRef.current.next()
              if (retryResult && typeof retryResult.then === 'function') {
                await retryResult
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('EPUBViewer - Erro ao chamar next():', err)
    }
  }, [renditionRef, bookRef])

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

