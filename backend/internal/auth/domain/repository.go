package domain

import (
	"context"
)

// UserRepository define a interface do repositório de usuários (port)
type UserRepository interface {
	// Create cria um novo usuário
	Create(ctx context.Context, user *User) error

	// FindByEmail busca um usuário pelo email
	FindByEmail(ctx context.Context, email string) (*User, error)

	// FindByID busca um usuário pelo ID
	FindByID(ctx context.Context, id uint) (*User, error)

	// ExistsByEmail verifica se já existe um usuário com o email fornecido
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}

