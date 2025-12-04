// Utilitário para chamadas à API do backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    name: string
    email: string
  }
  token?: string
}

export interface ApiError {
  error: string
  details?: string
}

// Função auxiliar para fazer requisições
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error || data.details || 'Erro ao processar requisição'
      throw new Error(errorMessage)
    }

    return data as T
  } catch (error) {
    // Se já é um Error, apenas propaga
    if (error instanceof Error) {
      throw error
    }
    // Caso contrário, cria um novo Error
    throw new Error('Erro de conexão com o servidor')
  }
}

// Registro de usuário
export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  return fetchApi<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Login de usuário
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Interfaces para livros
export interface BookResponse {
  id: number
  user_id: number
  title: string
  filename: string
  file_path: string
  file_size: number
  format: string
  current_page?: number
  progress_percentage?: number
  created_at: string
  updated_at: string
}

export interface UpdateProgressRequest {
  current_page: number
  progress_percentage: number
}

export interface ListBooksResponse {
  books: BookResponse[]
  total: number
}

// Função auxiliar para fazer upload de arquivo
async function uploadFile(
  endpoint: string,
  file: File,
  userId: number
): Promise<BookResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId.toString(),
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error || data.details || 'Erro ao processar requisição'
      throw new Error(errorMessage)
    }

    return data as BookResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro de conexão com o servidor')
  }
}

// Função auxiliar para fazer requisições com userID
async function fetchApiWithUser<T>(
  endpoint: string,
  userId: number,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId.toString(),
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error || data.details || 'Erro ao processar requisição'
      throw new Error(errorMessage)
    }

    return data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro de conexão com o servidor')
  }
}

// Upload de livro
export async function uploadBook(
  file: File,
  userId: number
): Promise<BookResponse> {
  return uploadFile('/api/v1/books/upload', file, userId)
}

// Listar livros do usuário
export async function getBooks(userId: number): Promise<ListBooksResponse> {
  return fetchApiWithUser<ListBooksResponse>('/api/v1/books', userId, {
    method: 'GET',
  })
}

// Obter livro específico
export async function getBook(
  id: number,
  userId: number
): Promise<BookResponse> {
  return fetchApiWithUser<BookResponse>(`/api/v1/books/${id}`, userId, {
    method: 'GET',
  })
}

// Deletar livro
export async function deleteBook(id: number, userId: number): Promise<void> {
  await fetchApiWithUser(`/api/v1/books/${id}`, userId, {
    method: 'DELETE',
  })
}

// Download de livro
export async function downloadBook(
  id: number,
  userId: number
): Promise<Blob> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/books/${id}/download`,
      {
        method: 'GET',
        headers: {
          'X-User-ID': userId.toString(),
        },
      }
    )

    if (!response.ok) {
      const data = await response.json()
      const errorMessage = data.error || 'Erro ao fazer download'
      throw new Error(errorMessage)
    }

    return await response.blob()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro de conexão com o servidor')
  }
}

// Obter URL do arquivo do livro
export function getBookFileUrl(id: number, userId: number): string {
  return `${API_URL}/api/v1/books/${id}/download`
}

// Atualizar progresso de leitura
export async function updateBookProgress(
  id: number,
  userId: number,
  currentPage: number,
  progressPercentage: number
): Promise<void> {
  return fetchApiWithUser<void>(
    `/api/v1/books/${id}/progress`,
    userId,
    {
      method: 'PUT',
      body: JSON.stringify({
        current_page: currentPage,
        progress_percentage: progressPercentage,
      }),
    }
  )
}

