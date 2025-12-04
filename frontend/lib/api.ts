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

