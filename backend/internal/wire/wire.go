//go:build wireinject
// +build wireinject

package wire

import (
	"cloud-reader/backend/internal/auth/application"
	authHttp "cloud-reader/backend/internal/auth/infrastructure/http"
	"cloud-reader/backend/internal/auth/infrastructure/repository"
	"cloud-reader/backend/internal/shared/config"
	"cloud-reader/backend/internal/shared/database"

	"github.com/google/wire"
	"gorm.io/gorm"
)

// InitializeConfig inicializa as configurações
func InitializeConfig() *config.Config {
	wire.Build(config.Load)
	return &config.Config{}
}

// InitializeDatabase inicializa a conexão com o banco de dados
func InitializeDatabase(cfg *config.Config) (*gorm.DB, error) {
	wire.Build(database.Connect)
	return nil, nil
}

// InitializeAuthHandler inicializa o handler de autenticação com todas as dependências
func InitializeAuthHandler(db *gorm.DB) (*authHttp.AuthHandler, error) {
	wire.Build(
		repository.NewPostgresUserRepository,
		application.NewAuthService,
		authHttp.NewAuthHandler,
	)
	return nil, nil
}

