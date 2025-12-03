package application

import (
	"context"
	"errors"

	"cloud-reader/backend/internal/auth/domain"
	"cloud-reader/backend/pkg/password"
)

// AuthService define os casos de uso de autenticação
type AuthService struct {
	userRepo domain.UserRepository
}

// NewAuthService cria uma nova instância do AuthService
func NewAuthService(userRepo domain.UserRepository) *AuthService {
	return &AuthService{
		userRepo: userRepo,
	}
}

// Register registra um novo usuário
func (s *AuthService) Register(ctx context.Context, req *RegisterRequest) (*RegisterResponse, error) {
	// Verifica se o email já está em uso
	exists, err := s.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email já está em uso")
	}

	// Gera hash da senha
	hashedPassword, err := password.Hash(req.Password)
	if err != nil {
		return nil, errors.New("erro ao processar senha")
	}

	// Cria o usuário
	user := &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return &RegisterResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}, nil
}

// Login autentica um usuário
func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	// Busca o usuário pelo email
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("credenciais inválidas")
	}

	// Verifica a senha
	if !password.Verify(req.Password, user.Password) {
		return nil, errors.New("credenciais inválidas")
	}

	// TODO: Gerar token JWT no futuro
	token := ""

	return &LoginResponse{
		User: UserResponse{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		},
		Token: token,
	}, nil
}

