'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

interface EPUBViewerProps {
  fileUrl: string
  userId?: number
  initialLocation?: string
  initialProgress?: number // Progresso percentual inicial (0-100)
  onLocationChange?: (location: string, progress: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function EPUBViewer({
  fileUrl,
  userId,
  initialLocation,
  initialProgress,
  onLocationChange,
  onProgressChange,
}: EPUBViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentProgress, setCurrentProgress] = useState<number>(initialProgress || 0)
  
  const onLocationChangeRef = useRef(onLocationChange)
  const onProgressChangeRef = useRef(onProgressChange)
  
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
    onProgressChangeRef.current = onProgressChange
  }, [onLocationChange, onProgressChange])

  // Função auxiliar: aguarda o elemento do viewer estar disponível
  const waitForViewerElement = async (): Promise<HTMLDivElement> => {
    let attempts = 0
    while (!viewerRef.current && attempts < 30) {
      const elementById = document.getElementById('epub-viewer-container')
      if (elementById && !viewerRef.current) {
        // @ts-ignore
        viewerRef.current = elementById
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    
    if (!viewerRef.current) {
      const elementById = document.getElementById('epub-viewer-container')
      if (elementById) {
        // @ts-ignore
        viewerRef.current = elementById
      }
    }
    
    if (!viewerRef.current) {
      throw new Error('Elemento do viewer não encontrado')
    }
    
    return viewerRef.current
  }

  // Função auxiliar: carrega a biblioteca epubjs
  const loadEpubJS = async (): Promise<{ Book: any; Rendition: any }> => {
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

  // Função auxiliar: cria as opções do livro
  const createBookOptions = (): any => {
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

  // Função auxiliar: aguarda o livro estar pronto
  const waitForBookReady = async (book: any): Promise<void> => {
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

  // Função auxiliar: configura o gerenciador de views
  const setupViewManager = (rendition: any) => {
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

  // Função auxiliar: aplica estilos à view renderizada
  const applyViewStyles = (view: any) => {
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

  // Função auxiliar: oculta views antigas
  const hideOldViews = (rendition: any, currentView: any) => {
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

  // Função auxiliar: configura o iframe
  const setupIframe = (view: any) => {
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

  // Função auxiliar: configura eventos da renderização
  const setupRenditionEvents = (rendition: any, book: any) => {
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

  // Função auxiliar: calcula a localização inicial
  const calculateInitialLocation = async (book: any): Promise<string | undefined> => {
    let targetLocation = initialLocation
    
    try {
      // @ts-ignore
      const locations = book.locations
      if (locations && typeof locations.generate === 'function') {
        // @ts-ignore
        await locations.generate(1000)
      }
      
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

  // Função auxiliar: exibe a página inicial
  const displayInitialPage = async (rendition: any, targetLocation: string | undefined) => {
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

  // Função auxiliar: configura o handler de relocação
  const setupRelocatedHandler = (rendition: any, book: any) => {
    rendition.on('relocated', (location: any) => {
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
          }
        } catch (calcErr) {
          // Ignorar erros de cálculo
        }
      }
      
      if (loc) {
        setCurrentProgress(progress * 100)
        if (onLocationChangeRef.current) {
          onLocationChangeRef.current(loc || '', progress)
        }
        
        if (onProgressChangeRef.current) {
          onProgressChangeRef.current(progress * 100)
        }
      }
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsLoading(true)
    setError(null)

    const loadEpub = async () => {
      try {
        // 1. Aguardar elemento do viewer
        const viewerElement = await waitForViewerElement()
        
        // 2. Carregar biblioteca epubjs
        const { Book, Rendition } = await loadEpubJS()
        
        // 3. Criar opções do livro
        const bookOptions = createBookOptions()
        
        // 4. Criar instância do livro
        const book = new Book(fileUrl, bookOptions)
        bookRef.current = book

        // 5. Configurar handler de erros
        let errorCount = 0
        const maxErrors = 5
        const errorHandler = (err: any) => {
          errorCount++
          if (errorCount >= maxErrors) {
            setError('Erro ao processar livro EPUB: Muitas requisições falharam. O arquivo pode estar corrompido.')
            setIsLoading(false)
            return
          }
        }
        book.on('error', errorHandler)

        // 6. Aguardar livro estar pronto
        try {
          await waitForBookReady(book)
        } catch (err: any) {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          book.off('error', errorHandler)
          throw err
        }

        if (!viewerRef.current) {
          throw new Error('Elemento do viewer não encontrado')
        }
        
        // 7. Criar e configurar renderização
        // @ts-ignore
        const rendition = new Rendition(book, {
          width: viewerRef.current.offsetWidth || '100%',
          height: viewerRef.current.offsetHeight || '100%',
          spread: 'none',
          manager: 'default',
          flow: 'paginated',
          allowScriptedContent: true,
        })
        
        // @ts-ignore
        rendition.attachTo(viewerRef.current)
        renditionRef.current = rendition
        
        // 8. Configurar gerenciador de views
        setupViewManager(rendition)
        
        // 9. Ajustar tamanho após um delay
        setTimeout(() => {
          if (viewerRef.current) {
            const width = viewerRef.current.offsetWidth || window.innerWidth
            const height = viewerRef.current.offsetHeight || window.innerHeight
            
            // @ts-ignore
            if (rendition.resize) {
              // @ts-ignore
              rendition.resize(width, height)
            }
            
            viewerRef.current.style.width = '100%'
            viewerRef.current.style.height = '100%'
            
            // @ts-ignore
            if (rendition.manager && rendition.manager.views) {
              // @ts-ignore
              const views = rendition.manager.views
              if (views && Array.isArray(views)) {
                // @ts-ignore
                views.forEach((v: any) => {
                  if (v && v.element) {
                    v.element.style.width = '100%'
                    v.element.style.height = '100%'
                  }
                })
              }
            }
          }
        }, 200)
        
        // 10. Configurar eventos da renderização
        setupRenditionEvents(rendition, book)
        
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // 11. Calcular localização inicial
        const targetLocation = await calculateInitialLocation(book)
        
        // 12. Exibir página inicial
        await displayInitialPage(rendition, targetLocation)
        
        // 13. Configurar handler de relocação
        setupRelocatedHandler(rendition, book)

        setIsLoading(false)
      } catch (err: any) {
        console.error('EPUBViewer - Erro ao carregar EPUB:', err)
        setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
        setIsLoading(false)
      }
    }

    loadEpub().catch((err) => {
      console.error('EPUBViewer - Erro não capturado:', err)
      setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
      setIsLoading(false)
    })

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy()
        } catch (err) {
          console.error('EPUBViewer - Erro ao destruir renderização:', err)
        }
      }
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        } catch (err) {
          // Ignorar erros na limpeza
        }
      }
    }
  }, [fileUrl, userId, initialLocation, initialProgress])

  const calculateAndSaveProgress = useCallback((location: any) => {
    if (!location) {
      // @ts-ignore
      if (renditionRef.current?.currentLocation) {
        // @ts-ignore
        location = renditionRef.current.currentLocation()
      }
    }
    
    if (!location) return
    
    const loc = location.start?.cfi || location.location?.start?.cfi || location.start || location.cfi
    if (!loc) return
    
    let progress = 0
    
    if (location.percentage !== undefined && location.percentage !== null && !isNaN(location.percentage)) {
      progress = location.percentage
    } else {
      try {
        // @ts-ignore
        const locations = bookRef.current?.locations
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
        }
      } catch (calcErr) {
        // Ignorar erros
      }
    }
    
    if (progress > 0 || location.percentage !== undefined) {
      if (onLocationChangeRef.current) {
        onLocationChangeRef.current(loc || '', progress)
      }
      
      if (onProgressChangeRef.current) {
        onProgressChangeRef.current(progress * 100)
      }
    }
  }, [])

  const cleanupOldViews = useCallback(() => {
    if (!viewerRef.current || !renditionRef.current) return
    
    // @ts-ignore
    const manager = renditionRef.current.manager
    if (manager && manager.views) {
      // @ts-ignore
      const views = manager.views
      if (views && Array.isArray(views) && views.length > 1) {
        // @ts-ignore
        const currentView = views[views.length - 1]
        // @ts-ignore
        views.forEach((view: any) => {
          if (view && view.element) {
            if (view === currentView) {
              view.element.style.display = 'block'
              view.element.style.width = '100%'
              view.element.style.height = '100%'
              view.element.style.position = 'relative'
              view.element.style.zIndex = '10'
              view.element.style.visibility = 'visible'
              view.element.style.opacity = '1'
            } else {
              view.element.style.display = 'none'
              view.element.style.zIndex = '0'
              view.element.style.visibility = 'hidden'
              view.element.style.opacity = '0'
            }
          }
        })
      }
    }
  }, [])

  const nextPage = useCallback(async () => {
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.next()
        if (result && typeof result.then === 'function') {
          await result.then(async (location: any) => {
            await new Promise(resolve => setTimeout(resolve, 300))
            cleanupOldViews()
            if (location) {
              calculateAndSaveProgress(location)
            } else {
              // @ts-ignore
              const currentLocation = renditionRef.current?.currentLocation()
              if (currentLocation) {
                calculateAndSaveProgress(currentLocation)
              }
            }
          }).catch((err: any) => {
            console.error('EPUBViewer - Erro ao avançar página:', err)
          })
        } else {
          setTimeout(() => {
            cleanupOldViews()
            // @ts-ignore
            const currentLocation = renditionRef.current?.currentLocation()
            if (currentLocation) {
              calculateAndSaveProgress(currentLocation)
            }
          }, 300)
        }
      } catch (err) {
        console.error('EPUBViewer - Erro ao chamar next():', err)
      }
    }
  }, [calculateAndSaveProgress, cleanupOldViews])

  const prevPage = useCallback(async () => {
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.prev()
        if (result && typeof result.then === 'function') {
          await result.then(async (location: any) => {
            await new Promise(resolve => setTimeout(resolve, 300))
            cleanupOldViews()
            if (location) {
              calculateAndSaveProgress(location)
            } else {
              // @ts-ignore
              const currentLocation = renditionRef.current?.currentLocation()
              if (currentLocation) {
                calculateAndSaveProgress(currentLocation)
              }
            }
          }).catch((err: any) => {
            console.error('EPUBViewer - Erro ao voltar página:', err)
          })
        } else {
          setTimeout(() => {
            cleanupOldViews()
            // @ts-ignore
            const currentLocation = renditionRef.current?.currentLocation()
            if (currentLocation) {
              calculateAndSaveProgress(currentLocation)
            }
          }, 300)
        }
      } catch (err) {
        console.error('EPUBViewer - Erro ao chamar prev():', err)
      }
    }
  }, [calculateAndSaveProgress, cleanupOldViews])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        nextPage()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prevPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, prevPage])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={prevPage} className="btn btn-outline-primary" disabled={isLoading || !!error}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            {error ? 'Erro' : isLoading ? 'Carregando...' : currentProgress > 0 ? `${Math.round(currentProgress)}%` : 'Pronto'}
          </span>
          <button onClick={nextPage} className="btn btn-outline-primary" disabled={isLoading || !!error}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-100 relative" style={{ minHeight: '600px' }}>
        <div 
          ref={viewerRef} 
          className="w-full h-full" 
          style={{ 
            minHeight: '600px',
            height: '100%',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'white'
          }}
          id="epub-viewer-container"
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              #epub-viewer-container > div:not(:last-child) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                z-index: -1 !important;
                pointer-events: none !important;
              }
              #epub-viewer-container > div:last-child {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10 !important;
              }
            `
          }} />
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando EPUB...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
              <p className="text-red-600 font-semibold mb-2">Erro ao carregar EPUB</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
