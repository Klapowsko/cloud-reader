// +build !wireinject

package wire

import (
	"cloud-reader/backend/internal/auth/application"
	authHttp "cloud-reader/backend/internal/auth/infrastructure/http"
	"cloud-reader/backend/internal/auth/infrastructure/repository"
	"cloud-reader/backend/internal/shared/config"
	"cloud-reader/backend/internal/shared/database"

	"gorm.io/gorm"
)

// InitializeAuthHandler inicializa o handler de autenticação (implementação manual sem Wire)
func InitializeAuthHandler(db *gorm.DB) *authHttp.AuthHandler {
	userRepo := repository.NewPostgresUserRepository(db)
	authService := application.NewAuthService(userRepo)
	return authHttp.NewAuthHandler(authService)
}

// InitializeConfig inicializa as configurações
func InitializeConfig() *config.Config {
	return config.Load()
}

// InitializeDatabase inicializa a conexão com o banco de dados
func InitializeDatabase(cfg *config.Config) (*gorm.DB, error) {
	return database.Connect(cfg)
}

