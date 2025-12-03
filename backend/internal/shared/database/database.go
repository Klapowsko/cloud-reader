package database

import (
	"log"

	"cloud-reader/backend/internal/shared/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB é a instância global do banco de dados
var DB *gorm.DB

// Connect estabelece conexão com o banco de dados PostgreSQL
func Connect(cfg *config.Config) (*gorm.DB, error) {
	var err error

	// Configura o logger do GORM baseado no ambiente
	gormConfig := &gorm.Config{}
	if cfg.IsDevelopment() {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormConfig.Logger = logger.Default.LogMode(logger.Error)
	}

	// Conecta ao banco de dados
	DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), gormConfig)
	if err != nil {
		return nil, err
	}

	log.Println("Conexão com banco de dados estabelecida com sucesso")

	return DB, nil
}

// Close fecha a conexão com o banco de dados
func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// GetDB retorna a instância do banco de dados
func GetDB() *gorm.DB {
	return DB
}

