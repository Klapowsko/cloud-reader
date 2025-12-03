package application

// RegisterRequest representa a requisição de registro
type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterResponse representa a resposta de registro
type RegisterResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// LoginRequest representa a requisição de login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse representa a resposta de login
type LoginResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token,omitempty"` // Para uso futuro com JWT
}

// UserResponse representa os dados do usuário na resposta
type UserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

