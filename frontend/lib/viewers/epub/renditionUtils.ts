/**
 * Utilitários para configuração e gerenciamento da renderização EPUB
 */

/**
 * Configura o gerenciador de views
 */
export function setupViewManager(rendition: any) {
  // @ts-ignore
  if (rendition.manager && rendition.manager.addView) {
    // @ts-ignore
    const originalAddView = rendition.manager.addView.bind(rendition.manager)
    // @ts-ignore
    rendition.manager.addView = function(view: any) {
      // @ts-ignore
      if (this.views && Array.isArray(this.views)) {
        // @ts-ignore
        const oldViews = [...this.views]
        // @ts-ignore
        oldViews.forEach((v: any) => {
          if (v && v.element) {
            try {
              if (v.element.parentNode) {
                v.element.parentNode.removeChild(v.element)
              }
            } catch (err) {
              v.element.style.display = 'none'
              v.element.style.visibility = 'hidden'
              v.element.style.opacity = '0'
              v.element.style.position = 'absolute'
              v.element.style.top = '-9999px'
              v.element.style.left = '-9999px'
              v.element.style.zIndex = '-1'
              v.element.style.width = '0'
              v.element.style.height = '0'
            }
          }
        })
        // @ts-ignore
        this.views = []
      }
      const result = originalAddView(view)
      if (view && view.element) {
        view.element.style.display = 'block'
        view.element.style.width = '100%'
        view.element.style.height = '100%'
        view.element.style.visibility = 'visible'
        view.element.style.opacity = '1'
        view.element.style.zIndex = '10'
        view.element.style.position = 'relative'
      }
      return result
    }
  }
}

/**
 * Aplica estilos à view renderizada
 */
export function applyViewStyles(view: any) {
  if (view && view.element) {
    view.element.style.display = 'block'
    view.element.style.width = '100%'
    view.element.style.height = '100%'
    view.element.style.minWidth = '100%'
    view.element.style.minHeight = '100%'
    view.element.style.maxWidth = '100%'
    view.element.style.maxHeight = '100%'
    view.element.style.position = 'relative'
    view.element.style.zIndex = '999'
    view.element.style.visibility = 'visible'
    view.element.style.opacity = '1'
    view.element.style.pointerEvents = 'auto'
    view.element.style.overflow = 'hidden'
    
    if (view.element.parentNode && view.element.parentNode.lastChild !== view.element) {
      view.element.parentNode.appendChild(view.element)
    }
    
    // @ts-ignore
    if (view.iframe) {
      // @ts-ignore
      view.iframe.style.width = '100%'
      // @ts-ignore
      view.iframe.style.height = '100%'
      // @ts-ignore
      view.iframe.style.minWidth = '100%'
      // @ts-ignore
      view.iframe.style.minHeight = '100%'
    }
  }
}

/**
 * Oculta views antigas
 */
export function hideOldViews(rendition: any, currentView: any) {
  // @ts-ignore
  if (rendition.manager && rendition.manager.views) {
    // @ts-ignore
    const views = rendition.manager.views
    if (views && Array.isArray(views)) {
      // @ts-ignore
      views.forEach((v: any) => {
        if (v && v.element) {
          if (v === currentView) {
            v.element.style.display = 'block'
            v.element.style.width = '100%'
            v.element.style.height = '100%'
            v.element.style.zIndex = '999'
            v.element.style.visibility = 'visible'
            v.element.style.opacity = '1'
            v.element.style.pointerEvents = 'auto'
            v.element.style.position = 'relative'
            if (v.element.parentNode && v.element.parentNode.lastChild !== v.element) {
              v.element.parentNode.appendChild(v.element)
            }
          } else {
            v.element.style.display = 'none'
            v.element.style.zIndex = '0'
            v.element.style.visibility = 'hidden'
            v.element.style.opacity = '0'
            v.element.style.pointerEvents = 'none'
            v.element.style.position = 'absolute'
            v.element.style.top = '-9999px'
            v.element.style.left = '-9999px'
            v.element.style.width = '0'
            v.element.style.height = '0'
          }
        }
      })
    }
  }
}

/**
 * Configura o iframe
 */
export function setupIframe(view: any) {
  // @ts-ignore
  if (view && view.iframe) {
    // @ts-ignore
    const iframe = view.iframe as HTMLIFrameElement
    iframe.style.display = 'block'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.visibility = 'visible'
    iframe.style.opacity = '1'
    iframe.style.border = 'none'
    iframe.style.position = 'relative'
    iframe.style.zIndex = '1'
    
    try {
      if (iframe && iframe.contentDocument) {
        if (iframe.hasAttribute('sandbox')) {
          const currentSandbox = iframe.getAttribute('sandbox') || ''
          if (!currentSandbox.includes('allow-scripts')) {
            iframe.setAttribute('sandbox', currentSandbox + ' allow-scripts allow-same-origin')
          }
        } else {
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
        }
      }
    } catch (err) {
      // CORS pode impedir acesso ao iframe
    }
  }
}

/**
 * Configura eventos da renderização
 */
export function setupRenditionEvents(rendition: any, book: any, onProgressChange?: (progress: number) => void) {
  rendition.on('error', (err: any) => {
    console.error('EPUBViewer - Erro na renderização:', err)
  })
  
  rendition.on('rendered', (section: any, view: any) => {
    applyViewStyles(view)
    hideOldViews(rendition, view)
    
    setTimeout(() => {
      // @ts-ignore
      if (rendition.manager && rendition.manager.views) {
        // @ts-ignore
        const views = rendition.manager.views
        if (views && Array.isArray(views)) {
          // @ts-ignore
          const currentView = views[views.length - 1] || view
          // @ts-ignore
          views.forEach((v: any) => {
            if (v && v.element) {
              if (v === currentView || v === view) {
                v.element.style.display = 'block'
                v.element.style.width = '100%'
                v.element.style.height = '100%'
                v.element.style.zIndex = '999'
                v.element.style.visibility = 'visible'
                v.element.style.opacity = '1'
                v.element.style.pointerEvents = 'auto'
              } else {
                v.element.style.display = 'none'
                v.element.style.visibility = 'hidden'
                v.element.style.opacity = '0'
                v.element.style.zIndex = '0'
                v.element.style.position = 'absolute'
                v.element.style.top = '-9999px'
                v.element.style.left = '-9999px'
              }
            }
          })
        }
      }
    }, 100)
    
    setupIframe(view)
  })
}

/**
 * Gera locations completas do livro
 */
export async function generateFullLocations(book: any): Promise<void> {
  try {
    // @ts-ignore
    const locations = book.locations
    if (!locations || typeof locations.generate !== 'function') {
      return
    }

    // Tentar obter o número total de itens no spine para calcular pontos necessários
    // @ts-ignore
    const spine = book.spine
    let estimatedPoints = 2000 // Aumentado de 1000 para 2000 como base mínima
    
    if (spine) {
      // @ts-ignore
      const spineLength = spine.length || (spine.items && spine.items.length) || 0
      // Estimar ~300 pontos por item do spine para melhor cobertura (aumentado de 200)
      estimatedPoints = Math.max(2000, spineLength * 300)
    }

    // Gerar locations com mais pontos para garantir cobertura completa
    // @ts-ignore
    await locations.generate(estimatedPoints)
    
    // Aguardar um pouco para garantir que a geração foi concluída
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    // Verificar se locations.total está disponível e se precisa de mais pontos
    // @ts-ignore
    const currentTotal = locations.total || 0
    // @ts-ignore
    if (currentTotal > 0 && currentTotal < estimatedPoints * 0.7) {
      // Se o total gerado for muito menor que o esperado, tentar gerar mais
      const additionalPoints = estimatedPoints * 1.5
      // @ts-ignore
      await locations.generate(additionalPoints)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
    
    // Verificar novamente e fazer uma última tentativa se necessário
    // @ts-ignore
    const finalTotal = locations.total || 0
    // @ts-ignore
    if (spine && finalTotal > 0) {
      // @ts-ignore
      const spineLength = spine.length || (spine.items && spine.items.length) || 0
      // Se ainda parece que falta conteúdo, gerar mais uma vez
      if (finalTotal < spineLength * 250) {
        // @ts-ignore
        await locations.generate(spineLength * 400)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }
  } catch (err) {
    console.warn('Erro ao gerar locations completas:', err)
    // Tentar geração básica como fallback
    try {
      // @ts-ignore
      const locations = book.locations
      if (locations && typeof locations.generate === 'function') {
        // @ts-ignore
        await locations.generate(2000) // Aumentado de 1000 para 2000
      }
    } catch (fallbackErr) {
      // Ignorar erro de fallback
    }
  }
}

/**
 * Calcula a localização inicial baseada no progresso
 */
export async function calculateInitialLocation(
  book: any,
  initialLocation?: string,
  initialProgress?: number
): Promise<string | undefined> {
  let targetLocation = initialLocation
  
  try {
    // Gerar locations completas primeiro
    await generateFullLocations(book)
    
    // @ts-ignore
    const locations = book.locations
    
    // Se não temos initialLocation mas temos initialProgress, calcular a CFI
    if (!targetLocation && initialProgress !== undefined && initialProgress > 0 && initialProgress < 100) {
      // @ts-ignore
      if (locations && locations.total && locations.total > 0) {
        const progress = initialProgress / 100
        
        // Tentar usar método do epubjs para converter porcentagem em CFI
        // @ts-ignore
        if (locations.cfiFromPercentage && typeof locations.cfiFromPercentage === 'function') {
          // @ts-ignore
          targetLocation = locations.cfiFromPercentage(progress)
        } else if (locations.location && typeof locations.location === 'function') {
          // Método alternativo do epubjs
          // @ts-ignore
          targetLocation = locations.location(progress)
        } else {
          // Fallback: calcular índice aproximado
          // @ts-ignore
          const targetIndex = Math.floor(progress * locations.total)
          // @ts-ignore
          if (locations.length && locations.length > targetIndex) {
            // @ts-ignore
            targetLocation = locations[targetIndex]
          } else if (locations._locations && Array.isArray(locations._locations) && locations._locations.length > targetIndex) {
            // @ts-ignore
            targetLocation = locations._locations[targetIndex]
          }
        }
      }
    }
  } catch (locErr) {
    // Não é crítico, continuar sem localização inicial
  }

  return targetLocation
}

/**
 * Exibe a página inicial
 */
export async function displayInitialPage(rendition: any, targetLocation?: string) {
  try {
    // @ts-ignore
    const displayed = targetLocation 
      ? rendition.display(targetLocation)
      : rendition.display()
      
    if (displayed && typeof displayed.then === 'function') {
      await displayed
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  } catch (displayErr: any) {
    try {
      // @ts-ignore
      const retryDisplay = rendition.display()
      if (retryDisplay && typeof retryDisplay.then === 'function') {
        await retryDisplay
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (retryErr: any) {
      throw new Error('Erro ao exibir EPUB: ' + (retryErr.message || 'Erro desconhecido'))
    }
  }
}

/**
 * Configura o handler de relocação
 */
export function setupRelocatedHandler(
  rendition: any,
  book: any,
  onLocationChange?: (location: string, progress: number) => void,
  onProgressChange?: (percentage: number) => void,
  setCurrentProgress?: (progress: number) => void
) {
  rendition.on('relocated', async (location: any) => {
    const loc = location.start?.cfi || location.location?.start?.cfi || location.start
    
    let progress = 0
    
    if (location.percentage !== undefined && location.percentage !== null && !isNaN(location.percentage)) {
      progress = location.percentage
    } else {
      try {
        // @ts-ignore
        const locations = book.locations
        if (locations && loc) {
          // @ts-ignore
          if (locations.percentageFromCfi && typeof locations.percentageFromCfi === 'function') {
            // @ts-ignore
            progress = locations.percentageFromCfi(loc)
          } else if (locations.total && locations.total > 0) {
            // @ts-ignore
            const index = locations.indexOf ? locations.indexOf(loc) : -1
            if (index >= 0) {
              // @ts-ignore
              progress = index / locations.total
            }
          }
          
          // Se o progresso estiver acima de 90% e locations.total parecer incompleto,
          // tentar gerar mais locations em background
          if (progress > 0.9 && typeof locations.generate === 'function') {
            // @ts-ignore
            const spine = book.spine
            if (spine) {
              // @ts-ignore
              const spineLength = spine.length || (spine.items && spine.items.length) || 0
              // @ts-ignore
              if (!locations.total || locations.total < spineLength * 200) {
                // Gerar mais locations em background sem bloquear
                // @ts-ignore
                locations.generate(spineLength * 400).catch(() => {
                  // Ignorar erros silenciosamente
                })
              }
            }
          }
        }
      } catch (calcErr) {
        // Ignorar erros de cálculo
      }
    }
    
    if (loc) {
      // Garantir que o progresso não ultrapasse 100%
      progress = Math.min(1, Math.max(0, progress))
      const progressPercentage = progress * 100
      
      if (setCurrentProgress) {
        setCurrentProgress(progressPercentage)
      }
      if (onLocationChange) {
        onLocationChange(loc || '', progress)
      }
      if (onProgressChange) {
        onProgressChange(progressPercentage)
      }
    }
  })
}

