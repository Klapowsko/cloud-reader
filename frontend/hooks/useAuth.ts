// Hook customizado para acessar o contexto de autenticação
import { useAuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  return useAuthContext()
}

