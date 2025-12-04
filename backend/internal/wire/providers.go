//go:build !wireinject
// +build !wireinject

package wire

import (
	authApplication "cloud-reader/backend/internal/auth/application"
	authHttp "cloud-reader/backend/internal/auth/infrastructure/http"
	"cloud-reader/backend/internal/auth/infrastructure/repository"
	bookApplication "cloud-reader/backend/internal/books/application"
	bookHttp "cloud-reader/backend/internal/books/infrastructure/http"
	bookRepo "cloud-reader/backend/internal/books/infrastructure/repository"
	"cloud-reader/backend/internal/shared/config"
	"cloud-reader/backend/internal/shared/database"

	"gorm.io/gorm"
)

// InitializeAuthHandler inicializa o handler de autenticação (implementação manual sem Wire)
func InitializeAuthHandler(db *gorm.DB) *authHttp.AuthHandler {
	userRepo := repository.NewPostgresUserRepository(db)
	authService := authApplication.NewAuthService(userRepo)
	return authHttp.NewAuthHandler(authService)
}

// InitializeBookHandler inicializa o handler de livros (implementação manual sem Wire)
func InitializeBookHandler(db *gorm.DB) *bookHttp.BookHandler {
	bookRepository := bookRepo.NewPostgresBookRepository(db)
	bookService := bookApplication.NewBookService(bookRepository)
	return bookHttp.NewBookHandler(bookService)
}

// InitializeConfig inicializa as configurações
func InitializeConfig() *config.Config {
	return config.Load()
}

// InitializeDatabase inicializa a conexão com o banco de dados
func InitializeDatabase(cfg *config.Config) (*gorm.DB, error) {
	return database.Connect(cfg)
}
