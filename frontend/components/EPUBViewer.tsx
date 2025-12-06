'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Função helper para carregar scripts via CDN
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
  onLocationChange?: (location: string, progress: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function EPUBViewer({
  fileUrl,
  userId,
  initialLocation,
  onLocationChange,
  onProgressChange,
}: EPUBViewerProps) {
  // Log removido para reduzir ruído - o componente renderiza frequentemente durante navegação
  
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string | null>(initialLocation || null)
  
  // Refs para callbacks para evitar re-execução do useEffect
  const onLocationChangeRef = useRef(onLocationChange)
  const onProgressChangeRef = useRef(onProgressChange)
  
  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
    onProgressChangeRef.current = onProgressChange
  }, [onLocationChange, onProgressChange])
  const [totalLocations, setTotalLocations] = useState(0)

  useEffect(() => {
    console.log('EPUBViewer - useEffect executado', {
      viewerRef: !!viewerRef.current,
      window: typeof window !== 'undefined',
      fileUrl,
      userId
    })
    
    if (typeof window === 'undefined') {
      console.log('EPUBViewer - window não disponível, saindo')
      return
    }

    setIsLoading(true)
    setError(null)

    const loadEpub = async () => {
      // Aguardar o elemento estar disponível - usar querySelector como fallback
      let attempts = 0
      while (!viewerRef.current && attempts < 30) {
        console.log(`EPUBViewer - Aguardando viewerRef.current (tentativa ${attempts + 1}/30)`)
        // Tentar encontrar por ID também
        const elementById = document.getElementById('epub-viewer-container')
        if (elementById && !viewerRef.current) {
          console.log('EPUBViewer - Elemento encontrado por ID, atualizando ref')
          // @ts-ignore
          viewerRef.current = elementById
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }
      
      // Se ainda não encontrou, tentar pelo ID
      if (!viewerRef.current) {
        const elementById = document.getElementById('epub-viewer-container')
        if (elementById) {
          console.log('EPUBViewer - Usando elemento encontrado por ID')
          // @ts-ignore
          viewerRef.current = elementById
        }
      }
      
      if (!viewerRef.current) {
        console.error('EPUBViewer - Elemento não encontrado após todas as tentativas')
        throw new Error('Elemento do viewer não encontrado após 3 segundos')
      }
      
      console.log('EPUBViewer - viewerRef.current disponível, iniciando carregamento', viewerRef.current)
      try {
        console.log('EPUBViewer - Iniciando carregamento do EPUB:', fileUrl)
        
        // Carregar epubjs usando import dinâmico (já está instalado como dependência)
        console.log('EPUBViewer - Carregando epubjs...')
        let ePub: any
        try {
          const epubjsModule = await import('epubjs')
          // @ts-ignore
          ePub = epubjsModule.default || epubjsModule
          console.log('EPUBViewer - epubjs carregado via import')
        } catch (importError) {
          console.warn('EPUBViewer - Falha no import, tentando CDN...', importError)
          // Fallback para CDN se o import falhar
          // @ts-ignore
          ePub = window.ePub || window.EPUB || (window as any).ePub
          
          if (!ePub) {
            await loadScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js')
            // Aguardar e tentar múltiplas vezes encontrar o objeto ePub
            let attempts = 0
            while (!ePub && attempts < 10) {
              await new Promise((resolve) => setTimeout(resolve, 200))
              // @ts-ignore
              ePub = window.ePub || window.EPUB || (window as any).ePub || (window as any).EPUBJS?.ePub
              attempts++
            }
            console.log('EPUBViewer - epubjs carregado via CDN')
          }
        }
        
        if (!ePub) {
          throw new Error('Não foi possível carregar epubjs')
        }
        
        console.log('EPUBViewer - epubjs carregado com sucesso', ePub)
        
        // epubjs pode exportar de diferentes formas
        const Book = ePub.Book || ePub.default?.Book || ePub
        const Rendition = ePub.Rendition || ePub.default?.Rendition
        
        if (!Book || !Rendition) {
          console.error('EPUBViewer - Estrutura do epubjs:', ePub)
          throw new Error('epubjs não foi carregado corretamente - Book ou Rendition não encontrados')
        }
        
        console.log('EPUBViewer - Book e Rendition encontrados')

        let url = fileUrl
        // Para epubjs funcionar corretamente, precisamos usar a URL do servidor diretamente
        // e configurar uma função request que adicione os headers necessários
        // Não usar blob URL pois causa problemas com requisições relativas dentro do EPUB
        
        console.log('EPUBViewer - Usando URL do servidor diretamente:', url)
        
        // Se tiver userId, vamos configurar uma função request customizada
        // que adiciona o header X-User-ID em todas as requisições
        let bookOptions: any = {
          openAs: 'epub',
        }
        
        if (userId) {
          // Criar função request que adiciona o header X-User-ID
          bookOptions.requestMethod = (requestUrl: string, type: string): Promise<ArrayBuffer> => {
            // Se for uma URL relativa, resolver em relação à URL base
            let finalUrl = requestUrl
            if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://') && !requestUrl.startsWith('blob:')) {
              // URL relativa - resolver em relação à URL base do arquivo
              try {
                const baseUrl = new URL(fileUrl)
                finalUrl = new URL(requestUrl, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/')) + '/').href
              } catch (e) {
                // Se falhar, usar a URL original
                finalUrl = requestUrl
              }
            }
            
            return fetch(finalUrl, {
              headers: {
                'X-User-ID': userId.toString(),
              },
            }).then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }
              return response.arrayBuffer()
            })
          }
        }

        // Criar instância do livro
        console.log('EPUBViewer - Criando instância do livro com URL:', url.substring(0, 100))
        console.log('EPUBViewer - Opções do livro:', bookOptions)
        const bookStart = Date.now()
        
        // Configurar o epubjs com as opções
        const book = new Book(url, bookOptions)
        bookRef.current = book
        console.log('EPUBViewer - Instância do livro criada em', Date.now() - bookStart, 'ms')

        // Adicionar listeners de eventos ANTES de aguardar ready
        let errorCount = 0
        const maxErrors = 5 // Limitar número de erros para evitar loops infinitos
        
        const errorHandler = (err: any) => {
          errorCount++
          console.error('EPUBViewer - Erro no livro:', err, `(erro ${errorCount}/${maxErrors})`)
          
          if (errorCount >= maxErrors) {
            console.error('EPUBViewer - Muitos erros, parando carregamento')
            setError('Erro ao processar livro EPUB: Muitas requisições falharam. O arquivo pode estar corrompido.')
            setIsLoading(false)
            return
          }
          
          // Não definir erro imediatamente, apenas logar
          // Alguns erros podem ser recuperáveis
        }
        
        const openedHandler = () => {
          console.log('EPUBViewer - Evento "opened" disparado')
        }
        
        book.on('error', errorHandler)
        book.on('opened', openedHandler)
        
        // Aguardar o livro estar pronto com timeout maior
        console.log('EPUBViewer - Aguardando livro estar pronto...')
        console.log('EPUBViewer - book.ready tipo:', typeof book.ready)
        console.log('EPUBViewer - book.ready é Promise?', book.ready && typeof book.ready.then === 'function')
        
        // book.ready é uma Promise no epubjs
        try {
          // Verificar primeiro se o livro já está aberto - se estiver, não precisamos aguardar book.ready
          console.log('EPUBViewer - Verificando estado inicial do livro:', { isOpen: book.isOpen, hasReady: !!book.ready })
          if (book.isOpen) {
            console.log('EPUBViewer - Livro já está aberto (isOpen: true), prosseguindo sem aguardar book.ready')
          } else {
            if (book.ready && typeof book.ready.then === 'function') {
            // É uma Promise - usar Promise.race com timeout menor (10s)
            // Se o livro já estiver aberto, podemos prosseguir
            console.log('EPUBViewer - book.ready é Promise, aguardando (timeout 10s)...')
            const readyStart = Date.now()
            
            // Verificar periodicamente se o livro já está aberto
            let isOpenDetected = false
            const checkInterval = setInterval(() => {
              if (book.isOpen) {
                console.log('EPUBViewer - Livro aberto detectado durante espera, prosseguindo...')
                isOpenDetected = true
                clearInterval(checkInterval)
              }
            }, 500)
            
            const timeoutPromise = new Promise<void>((resolve, reject) => 
              setTimeout(() => {
                clearInterval(checkInterval)
                const elapsed = Date.now() - readyStart
                // Se o livro já está aberto, não é um erro crítico
                if (book.isOpen || isOpenDetected) {
                  console.warn('EPUBViewer - Timeout no book.ready, mas livro está aberto. Prosseguindo...')
                  resolve() // Resolver ao invés de rejeitar
                  return
                }
                console.error('EPUBViewer - Timeout ao aguardar book.ready após', elapsed, 'ms')
                console.error('EPUBViewer - Estado do livro:', {
                  isOpen: book.isOpen,
                  opened: book.opened,
                  loading: book.loading
                })
                reject(new Error('Timeout ao carregar livro EPUB (10s). O arquivo pode estar corrompido ou muito grande.'))
              }, 10000) // Reduzido para 10 segundos
            )
            
            try {
              await Promise.race([book.ready.then(() => { clearInterval(checkInterval) }), timeoutPromise])
              clearInterval(checkInterval)
              const readyTime = Date.now() - readyStart
              console.log('EPUBViewer - Promise book.ready resolvida em', readyTime, 'ms')
            } catch (timeoutErr) {
              clearInterval(checkInterval)
              // Se o livro está aberto, continuar mesmo com timeout
              if (book.isOpen || isOpenDetected) {
                console.warn('EPUBViewer - Timeout no book.ready, mas livro está aberto. Prosseguindo...')
              } else {
                throw timeoutErr
              }
            }
            } else {
              // Se não for Promise, usar eventos com timeout
              console.log('EPUBViewer - book.ready não é Promise, usando eventos (timeout 60s)...')
            const readyStart = Date.now()
            
            const readyPromise = new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                const elapsed = Date.now() - readyStart
                // Se o livro está aberto, não é um erro crítico
                if (book.isOpen) {
                  console.warn('EPUBViewer - Timeout ao aguardar evento ready, mas livro está aberto. Prosseguindo...')
                  resolve()
                  return
                }
                console.error('EPUBViewer - Timeout ao aguardar evento ready após', elapsed, 'ms')
                reject(new Error('Timeout ao carregar livro EPUB (60s)'))
              }, 60000)
              
              // Tentar múltiplos eventos
              const checkReady = () => {
                console.log('EPUBViewer - Verificando se livro está pronto...', {
                  isOpen: book.isOpen,
                  opened: book.opened,
                  ready: book.ready
                })
                
                if (book.isOpen || book.opened) {
                  clearTimeout(timeout)
                  book.off('opened', checkReady)
                  const readyTime = Date.now() - readyStart
                  console.log('EPUBViewer - Livro pronto via eventos em', readyTime, 'ms')
                  resolve()
                }
              }
              
              book.on('opened', checkReady)
              
              // Verificar periodicamente
              const interval = setInterval(checkReady, 500)
              setTimeout(() => {
                clearInterval(interval)
                // Se ainda não resolveu e o livro está aberto, resolver
                if (book.isOpen) {
                  clearTimeout(timeout)
                  resolve()
                }
              }, 60000)
            })
            
            await readyPromise
            }
          }
        } catch (err: any) {
          // Limpar blob URL em caso de erro
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          book.off('error', errorHandler)
          book.off('opened', openedHandler)
          throw err
        }
        
        console.log('EPUBViewer - Livro pronto!', {
          isOpen: book.isOpen,
          opened: book.opened,
          locations: !!book.locations
        })

        // Criar renderização
        console.log('EPUBViewer - Criando renderização...')
        if (!viewerRef.current) {
          throw new Error('Elemento do viewer não encontrado')
        }
        
        // Criar renderização - API do epubjs 0.3.93
        // @ts-ignore
        const rendition = new Rendition(book, {
          width: viewerRef.current.offsetWidth || '100%',
          height: viewerRef.current.offsetHeight || '100%',
          spread: 'none', // Não mostrar páginas lado a lado
          manager: 'default', // Manager padrão (uma view por vez)
          flow: 'paginated', // Modo paginado (uma página por vez)
          allowScriptedContent: true, // Permitir scripts no conteúdo EPUB
        })
        
        // Interceptar o manager para controlar views
        // @ts-ignore
        rendition.attachTo(viewerRef.current)
        renditionRef.current = rendition
        
        // Interceptar addView do manager para controlar quais views são adicionadas
        // @ts-ignore
        if (rendition.manager && rendition.manager.addView) {
          // @ts-ignore
          const originalAddView = rendition.manager.addView.bind(rendition.manager)
          // @ts-ignore
          rendition.manager.addView = function(view: any) {
            console.log('EPUBViewer - addView interceptado, removendo views antigas antes de adicionar nova')
            // REMOVER todas as views antigas do DOM antes de adicionar a nova
            // @ts-ignore
            if (this.views && Array.isArray(this.views)) {
              // @ts-ignore
              const oldViews = [...this.views] // Copiar array para evitar problemas
              // @ts-ignore
              oldViews.forEach((v: any) => {
                if (v && v.element) {
                  try {
                    // Remover do DOM completamente
                    if (v.element.parentNode) {
                      v.element.parentNode.removeChild(v.element)
                      console.log('EPUBViewer - View antiga removida do DOM no addView')
                    }
                  } catch (err) {
                    // Se não conseguir remover, ocultar completamente
                    v.element.style.display = 'none'
                    v.element.style.visibility = 'hidden'
                    v.element.style.opacity = '0'
                    v.element.style.position = 'absolute'
                    v.element.style.top = '-9999px'
                    v.element.style.left = '-9999px'
                    v.element.style.zIndex = '-1'
                    v.element.style.width = '0'
                    v.element.style.height = '0'
                    console.warn('EPUBViewer - Erro ao remover view no addView, ocultando:', err)
                  }
                }
              })
              // Limpar o array de views, mantendo apenas a nova
              // @ts-ignore
              this.views = []
            }
            // Adicionar a nova view
            const result = originalAddView(view)
            // Garantir que a nova view seja visível e ocupe todo o espaço
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
        
        console.log('EPUBViewer - Renderização anexada ao container:', {
          containerExists: !!viewerRef.current,
          containerWidth: viewerRef.current?.offsetWidth,
          containerHeight: viewerRef.current?.offsetHeight,
          containerChildren: viewerRef.current?.children.length
        })
        
        // Configurar viewport para garantir tamanho correto após anexar
        setTimeout(() => {
          if (viewerRef.current) {
            const width = viewerRef.current.offsetWidth || window.innerWidth
            const height = viewerRef.current.offsetHeight || window.innerHeight
            console.log('EPUBViewer - Redimensionando viewport:', { width, height, containerWidth: viewerRef.current.offsetWidth, containerHeight: viewerRef.current.offsetHeight })
            
            // @ts-ignore
            if (rendition.resize) {
              // @ts-ignore
              rendition.resize(width, height)
              console.log('EPUBViewer - Viewport redimensionado')
            }
            
            // Garantir que o container tenha o tamanho correto
            viewerRef.current.style.width = '100%'
            viewerRef.current.style.height = '100%'
            
            // Verificar se há elementos no container
            const iframes = viewerRef.current.querySelectorAll('iframe')
            const divs = viewerRef.current.querySelectorAll('div')
            console.log('EPUBViewer - Elementos no container após resize:', {
              iframes: iframes.length,
              divs: divs.length,
              totalChildren: viewerRef.current.children.length
            })
            
            // Garantir que todas as views ocupem 100% do espaço
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

        console.log('EPUBViewer - Renderização criada e anexada', { rendition: !!rendition, hasNext: typeof rendition.next === 'function', hasPrev: typeof rendition.prev === 'function' })
        
        // Adicionar listener de erro na renderização
        rendition.on('error', (err: any) => {
          console.error('EPUBViewer - Erro na renderização:', err)
        })
        
        // Adicionar listener para quando a renderização estiver pronta
        rendition.on('rendered', (section: any, view: any) => {
          console.log('EPUBViewer - Página renderizada:', { 
            section, 
            view, 
            hasElement: !!view?.element, 
            hasIframe: !!view?.iframe,
            elementDisplay: view?.element?.style?.display,
            elementWidth: view?.element?.style?.width,
            elementHeight: view?.element?.style?.height
          })
          
          // Primeiro, garantir que a view atual seja visível e ocupe TODO o espaço
          if (view && view.element) {
            view.element.style.display = 'block'
            view.element.style.width = '100%'
            view.element.style.height = '100%'
            view.element.style.position = 'relative'
            view.element.style.zIndex = '10'
            view.element.style.visibility = 'visible'
            view.element.style.opacity = '1'
            view.element.style.overflow = 'visible'
            console.log('EPUBViewer - View atual configurada como visível:', {
              display: view.element.style.display,
              width: view.element.style.width,
              height: view.element.style.height,
              position: view.element.style.position
            })
          }
          
          // Configurar o iframe se existir
          // @ts-ignore
          if (view && view.iframe) {
            // @ts-ignore
            const iframe = view.iframe
            iframe.style.display = 'block'
            iframe.style.width = '100%'
            iframe.style.height = '100%'
            iframe.style.visibility = 'visible'
            iframe.style.opacity = '1'
            iframe.style.border = 'none'
            console.log('EPUBViewer - Iframe configurado como visível')
          }
          
          // PRIMEIRO: Garantir que a view atual esteja visível e ocupe TODO o espaço
          if (view && view.element) {
            // Garantir tamanho completo
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
            // Mover para o final do container para garantir que fique por cima
            if (view.element.parentNode && view.element.parentNode.lastChild !== view.element) {
              view.element.parentNode.appendChild(view.element)
            }
            
            // Garantir que o iframe também ocupe 100%
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
            
            console.log('EPUBViewer - View atual configurada como visível com tamanho completo')
          }
          
          // DEPOIS: Ocultar TODAS as views antigas IMEDIATAMENTE (antes mesmo do setTimeout)
          // @ts-ignore
          if (rendition.manager && rendition.manager.views) {
            // @ts-ignore
            const views = rendition.manager.views
            if (views && Array.isArray(views)) {
              console.log('EPUBViewer - Ocultando views antigas IMEDIATAMENTE, total:', views.length)
              // @ts-ignore
              views.forEach((v: any, index: number) => {
                if (v && v.element) {
                  if (v === view) {
                    // Garantir que a view atual esteja visível e no topo
                    v.element.style.display = 'block'
                    v.element.style.width = '100%'
                    v.element.style.height = '100%'
                    v.element.style.zIndex = '999'
                    v.element.style.visibility = 'visible'
                    v.element.style.opacity = '1'
                    v.element.style.pointerEvents = 'auto'
                    v.element.style.position = 'relative'
                    // Mover para o final do container
                    if (v.element.parentNode && v.element.parentNode.lastChild !== v.element) {
                      v.element.parentNode.appendChild(v.element)
                    }
                    console.log('EPUBViewer - View atual mantida visível (índice', index, ')')
                  } else {
                    // OCULTAR views antigas COMPLETAMENTE - usar position absolute para tirar do fluxo
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
                    console.log('EPUBViewer - View antiga ocultada e removida do fluxo (índice', index, ')')
                  }
                }
              })
            }
          }
          
          // Verificar novamente após um pequeno delay para garantir
          setTimeout(() => {
            // @ts-ignore
            if (rendition.manager && rendition.manager.views) {
              // @ts-ignore
              const views = rendition.manager.views
              if (views && Array.isArray(views)) {
                // @ts-ignore
                const currentView = views[views.length - 1] || view
                console.log('EPUBViewer - Verificação final, total de views:', views.length)
                // @ts-ignore
                views.forEach((v: any, index: number) => {
                  if (v && v.element) {
                    if (v === currentView || v === view) {
                      // Garantir que a view atual esteja visível
                      v.element.style.display = 'block'
                      v.element.style.width = '100%'
                      v.element.style.height = '100%'
                      v.element.style.zIndex = '999'
                      v.element.style.visibility = 'visible'
                      v.element.style.opacity = '1'
                      v.element.style.pointerEvents = 'auto'
                      console.log('EPUBViewer - View atual confirmada visível (índice', index, ')')
                    } else {
                      // OCULTAR views antigas novamente
                      v.element.style.display = 'none'
                      v.element.style.visibility = 'hidden'
                      v.element.style.opacity = '0'
                      v.element.style.zIndex = '0'
                      v.element.style.position = 'absolute'
                      v.element.style.top = '-9999px'
                      v.element.style.left = '-9999px'
                      console.log('EPUBViewer - View antiga confirmada oculta (índice', index, ')')
                    }
                  }
                })
              }
            }
          }, 100)
          
          // Configurar o iframe para permitir scripts e garantir visibilidade
          // @ts-ignore
          if (view && view.iframe) {
            // @ts-ignore
            const iframe = view.iframe as HTMLIFrameElement
            // Garantir que o iframe seja visível
            iframe.style.display = 'block'
            iframe.style.width = '100%'
            iframe.style.height = '100%'
            iframe.style.visibility = 'visible'
            iframe.style.opacity = '1'
            iframe.style.border = 'none'
            iframe.style.position = 'relative'
            iframe.style.zIndex = '1'
            
            console.log('EPUBViewer - Iframe configurado:', {
              display: iframe.style.display,
              width: iframe.style.width,
              height: iframe.style.height,
              hasContent: !!iframe.contentDocument,
              sandbox: iframe.getAttribute('sandbox')
            })
            
            try {
              if (iframe && iframe.contentDocument) {
                // Remover sandbox ou adicionar permissões necessárias
                if (iframe.hasAttribute('sandbox')) {
                  const currentSandbox = iframe.getAttribute('sandbox') || ''
                  if (!currentSandbox.includes('allow-scripts')) {
                    iframe.setAttribute('sandbox', currentSandbox + ' allow-scripts allow-same-origin')
                    console.log('EPUBViewer - Permissões de sandbox atualizadas:', iframe.getAttribute('sandbox'))
                  }
                } else {
                  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
                  console.log('EPUBViewer - Sandbox configurado com permissões')
                }
              }
            } catch (err) {
              console.warn('EPUBViewer - Não foi possível configurar iframe (pode ser CORS):', err)
            }
          }
        })
        
        // Aguardar um pouco para a renderização inicializar
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // Gerar locations para cálculo de progresso
        try {
          // @ts-ignore
          const locations = book.locations
          if (locations && typeof locations.generate === 'function') {
            console.log('EPUBViewer - Gerando locations para cálculo de progresso...')
            // @ts-ignore
            await locations.generate(1000) // Gerar locations com resolução de 1000
            // @ts-ignore
            const total = locations.total || 0
            if (total > 0) {
              setTotalLocations(total)
              console.log('EPUBViewer - Locations geradas, total:', total)
            }
          } else if (locations && typeof locations === 'object') {
            // @ts-ignore
            const total = locations.total || locations.length || (locations._locations && locations._locations.length) || 0
            if (total > 0) {
              setTotalLocations(total)
              console.log('EPUBViewer - Total de localizações:', total)
            }
          }
        } catch (locErr) {
          console.warn('EPUBViewer - Erro ao gerar/acessar locations:', locErr)
          // Não é crítico, continuar sem definir totalLocations
        }

        // Navegar para localização inicial se fornecida, senão mostrar primeira página
        console.log('EPUBViewer - Exibindo conteúdo...')
        try {
          // @ts-ignore
          const displayed = initialLocation 
            ? rendition.display(initialLocation)
            : rendition.display()
            
          // Se display retornar uma Promise, aguardar
          if (displayed && typeof displayed.then === 'function') {
            await displayed
            console.log('EPUBViewer - Display Promise resolvida')
          } else {
            // Aguardar um pouco para garantir que renderizou
            await new Promise((resolve) => setTimeout(resolve, 500))
            console.log('EPUBViewer - Display executado (não é Promise)')
          }
        } catch (displayErr: any) {
          console.error('EPUBViewer - Erro ao exibir:', displayErr)
          // Tentar novamente sem localização
          try {
            // @ts-ignore
            const retryDisplay = rendition.display()
            if (retryDisplay && typeof retryDisplay.then === 'function') {
              await retryDisplay
            } else {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
            console.log('EPUBViewer - Página exibida após retry')
          } catch (retryErr: any) {
            console.error('EPUBViewer - Erro no retry:', retryErr)
            throw new Error('Erro ao exibir EPUB: ' + (retryErr.message || 'Erro desconhecido'))
          }
        }
        
        console.log('EPUBViewer - Conteúdo exibido com sucesso')

        // Listener para mudanças de localização
        rendition.on('relocated', (location: any) => {
          console.log('EPUBViewer - Evento relocated disparado:', {
            location,
            percentage: location.percentage,
            start: location.start,
            end: location.end,
            hasLocation: !!location.location
          })
          
          const loc = location.start?.cfi || location.location?.start?.cfi || location.start
          if (loc) {
            setCurrentLocation(loc)
          }
          
          // Calcular progresso de diferentes formas possíveis
          let progress = 0
          
          // Primeiro, tentar usar location.percentage (mais preciso)
          if (location.percentage !== undefined && location.percentage !== null && !isNaN(location.percentage)) {
            progress = location.percentage
          } else {
            // Tentar calcular progresso usando locations do livro
            try {
              // @ts-ignore
              const locations = book.locations
              if (locations && loc) {
                // @ts-ignore
                if (locations.percentageFromCfi && typeof locations.percentageFromCfi === 'function') {
                  // @ts-ignore
                  progress = locations.percentageFromCfi(loc)
                } else if (locations.total && locations.total > 0) {
                  // Calcular progresso aproximado baseado na posição
                  // @ts-ignore
                  const index = locations.indexOf ? locations.indexOf(loc) : -1
                  if (index >= 0) {
                    // @ts-ignore
                    progress = index / locations.total
                  }
                }
              }
            } catch (calcErr) {
              console.warn('EPUBViewer - Erro ao calcular progresso:', calcErr)
            }
          }
          
          console.log('EPUBViewer - Progresso calculado:', { progress, loc, percentage: location.percentage })
          
          // Sempre chamar callbacks se tiver localização, mesmo que progresso seja 0
          // O progresso 0 pode ser válido (início do livro)
          if (loc) {
            // Usar refs para evitar dependências no useEffect
            if (onLocationChangeRef.current) {
              console.log('EPUBViewer - Chamando onLocationChange:', { loc, progress })
              onLocationChangeRef.current(loc || '', progress)
            }
            
            if (onProgressChangeRef.current) {
              const progressPercentage = progress * 100
              console.log('EPUBViewer - Chamando onProgressChange:', { progress: progressPercentage })
              onProgressChangeRef.current(progressPercentage)
            }
          } else {
            console.log('EPUBViewer - Sem localização, ignorando callbacks')
          }
        })

        console.log('EPUBViewer - Carregamento completo!')
        setIsLoading(false)
      } catch (err: any) {
        console.error('EPUBViewer - Erro ao carregar EPUB:', err)
        setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
        setIsLoading(false)
      }
    }

    console.log('EPUBViewer - Chamando loadEpub()')
    loadEpub().catch((err) => {
      console.error('EPUBViewer - Erro não capturado em loadEpub:', err)
      setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
      setIsLoading(false)
    })

    return () => {
      console.log('EPUBViewer - Cleanup do useEffect')
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy()
        } catch (err) {
          console.error('EPUBViewer - Erro ao destruir renderização:', err)
        }
      }
      // Limpar blob URL se foi criado
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        } catch (err) {
          console.error('EPUBViewer - Erro ao revogar blob URL:', err)
        }
      }
    }
  }, [fileUrl, userId, initialLocation]) // Removido onLocationChange e onProgressChange das dependências

  // Função helper para calcular e salvar progresso
  const calculateAndSaveProgress = useCallback((location: any) => {
    if (!location) {
      // Tentar obter location atual da renderização
      // @ts-ignore
      if (renditionRef.current?.currentLocation) {
        // @ts-ignore
        location = renditionRef.current.currentLocation()
      }
    }
    
    if (!location) return
    
    const loc = location.start?.cfi || location.location?.start?.cfi || location.start || location.cfi
    if (!loc) return
    
    // Calcular progresso
    let progress = 0
    
    // Primeiro, tentar usar location.percentage (mais preciso)
    if (location.percentage !== undefined && location.percentage !== null && !isNaN(location.percentage)) {
      progress = location.percentage
    } else {
      // Tentar calcular progresso usando locations do livro
      try {
        // @ts-ignore
        const locations = bookRef.current?.locations
        if (locations && loc) {
          // @ts-ignore
          if (locations.percentageFromCfi && typeof locations.percentageFromCfi === 'function') {
            // @ts-ignore
            progress = locations.percentageFromCfi(loc)
          } else if (locations.total && locations.total > 0) {
            // Calcular progresso aproximado baseado na posição
            // @ts-ignore
            const index = locations.indexOf ? locations.indexOf(loc) : -1
            if (index >= 0) {
              // @ts-ignore
              progress = index / locations.total
            }
          }
        }
      } catch (calcErr) {
        console.warn('EPUBViewer - Erro ao calcular progresso:', calcErr)
      }
    }
    
    console.log('EPUBViewer - Progresso calculado após navegação:', { progress, loc, percentage: location.percentage })
    
    // Chamar callbacks se o progresso for válido
    if (progress > 0 || location.percentage !== undefined) {
      if (onLocationChangeRef.current) {
        console.log('EPUBViewer - Chamando onLocationChange após navegação:', { loc, progress })
        onLocationChangeRef.current(loc || '', progress)
      }
      
      if (onProgressChangeRef.current) {
        const progressPercentage = progress * 100
        console.log('EPUBViewer - Chamando onProgressChange após navegação:', { progress: progressPercentage })
        onProgressChangeRef.current(progressPercentage)
      }
    }
  }, [])

  // Função helper para ocultar views antigas (não remover para evitar problemas)
  const cleanupOldViews = useCallback(() => {
    if (!viewerRef.current || !renditionRef.current) return
    
    console.log('EPUBViewer - Ocultando views antigas...')
    
    // @ts-ignore
    const manager = renditionRef.current.manager
    if (manager && manager.views) {
      // @ts-ignore
      const views = manager.views
      if (views && Array.isArray(views) && views.length > 1) {
        console.log('EPUBViewer - Ocultando', views.length - 1, 'views antigas')
        // Manter apenas a última view (mais recente) visível
        // @ts-ignore
        const currentView = views[views.length - 1]
        // @ts-ignore
        views.forEach((view: any) => {
          if (view && view.element) {
            if (view === currentView) {
              // Mostrar view atual
              view.element.style.display = 'block'
              view.element.style.width = '100%'
              view.element.style.height = '100%'
              view.element.style.position = 'relative'
              view.element.style.zIndex = '10'
              view.element.style.visibility = 'visible'
              view.element.style.opacity = '1'
              console.log('EPUBViewer - View atual mantida visível')
            } else {
              // Ocultar views antigas (não remover para evitar problemas)
              view.element.style.display = 'none'
              view.element.style.zIndex = '0'
              view.element.style.visibility = 'hidden'
              view.element.style.opacity = '0'
              console.log('EPUBViewer - View antiga ocultada')
            }
          }
        })
      }
    }
    
    console.log('EPUBViewer - Limpeza de views concluída')
  }, [])

  const nextPage = useCallback(async () => {
    console.log('EPUBViewer - nextPage chamado', { hasRendition: !!renditionRef.current })
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.next()
        console.log('EPUBViewer - next() chamado', { result, type: typeof result })
        // Se next() retornar uma Promise, aguardar
        if (result && typeof result.then === 'function') {
          await result.then(async (location: any) => {
            console.log('EPUBViewer - next() Promise resolvida, página avançada', { location })
            // Aguardar um pouco para garantir que a nova view foi renderizada
            await new Promise(resolve => setTimeout(resolve, 300))
            // Limpar views antigas após a nova view ser renderizada
            cleanupOldViews()
            // Forçar cálculo e salvamento do progresso
            if (location) {
              calculateAndSaveProgress(location)
            } else {
              // Se não receber location, tentar obter da renderização
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
          console.log('EPUBViewer - next() não retornou Promise')
          // Aguardar e então limpar views antigas
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
    } else {
      console.warn('EPUBViewer - renditionRef.current é null ao tentar avançar')
    }
  }, [calculateAndSaveProgress, cleanupOldViews])

  const prevPage = useCallback(async () => {
    console.log('EPUBViewer - prevPage chamado', { hasRendition: !!renditionRef.current })
    if (renditionRef.current) {
      try {
        // @ts-ignore
        const result = renditionRef.current.prev()
        console.log('EPUBViewer - prev() chamado', { result, type: typeof result })
        // Se prev() retornar uma Promise, aguardar
        if (result && typeof result.then === 'function') {
          await result.then(async (location: any) => {
            console.log('EPUBViewer - prev() Promise resolvida, página voltou', { location })
            // Aguardar um pouco para garantir que a nova view foi renderizada
            await new Promise(resolve => setTimeout(resolve, 300))
            // Limpar views antigas após a nova view ser renderizada
            cleanupOldViews()
            // Forçar cálculo e salvamento do progresso
            if (location) {
              calculateAndSaveProgress(location)
            } else {
              // Se não receber location, tentar obter da renderização
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
          console.log('EPUBViewer - prev() não retornou Promise')
          // Aguardar e então limpar views antigas
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
    } else {
      console.warn('EPUBViewer - renditionRef.current é null ao tentar voltar')
    }
  }, [calculateAndSaveProgress, cleanupOldViews])

  // Atalhos de teclado
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
      {/* Controles */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={prevPage} className="btn btn-outline-primary" disabled={isLoading || !!error}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            {error ? 'Erro' : isLoading ? 'Carregando...' : currentLocation ? 'Lendo...' : 'Pronto'}
          </span>
          <button onClick={nextPage} className="btn btn-outline-primary" disabled={isLoading || !!error}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100 relative" style={{ minHeight: '600px' }}>
        {/* Elemento do viewer - sempre renderizado */}
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
          {/* CSS inline para garantir que apenas a última view seja visível */}
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
        
        {/* Overlay de loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando EPUB...</p>
            </div>
          </div>
        )}
        
        {/* Overlay de erro */}
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

