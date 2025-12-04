package domain

import (
	"context"
)

// BookRepository define a interface do repositório de livros (port)
type BookRepository interface {
	// Create cria um novo livro
	Create(ctx context.Context, book *Book) error

	// FindByID busca um livro pelo ID e UserID (valida ownership)
	FindByID(ctx context.Context, id uint, userID uint) (*Book, error)

	// FindByUserID busca todos os livros de um usuário
	FindByUserID(ctx context.Context, userID uint) ([]*Book, error)

	// Delete remove um livro (valida ownership)
	Delete(ctx context.Context, id uint, userID uint) error
}

