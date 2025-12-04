package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL      string
	DatabaseHost     string
	DatabasePort     string
	DatabaseUser     string
	DatabasePassword string
	DatabaseName     string
	ServerPort       string
	Environment      string
}

// Load carrega as configurações do ambiente
func Load() *Config {
	// Carrega .env se existir (não falha se não existir)
	_ = godotenv.Load()

	config := &Config{
		DatabaseHost:     getEnv("DB_HOST", "localhost"),
		DatabasePort:     getEnv("DB_PORT", "5432"),
		DatabaseUser:     getEnv("DB_USER", "postgres"),
		DatabasePassword: getEnv("DB_PASSWORD", "postgres"),
		DatabaseName:     getEnv("DB_NAME", "cloud_reader"),
		ServerPort:       getEnv("SERVER_PORT", "8080"),
		Environment:      getEnv("ENVIRONMENT", "development"),
	}

	// Constrói a URL de conexão se não fornecida diretamente
	if config.DatabaseURL == "" {
		config.DatabaseURL = getEnv("DATABASE_URL", "")
		if config.DatabaseURL == "" {
			config.DatabaseURL = buildDatabaseURL(config)
		}
	} else {
		config.DatabaseURL = getEnv("DATABASE_URL", buildDatabaseURL(config))
	}

	return config
}

func buildDatabaseURL(config *Config) string {
	return "host=" + config.DatabaseHost +
		" port=" + config.DatabasePort +
		" user=" + config.DatabaseUser +
		" password=" + config.DatabasePassword +
		" dbname=" + config.DatabaseName +
		" sslmode=disable TimeZone=UTC"
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// IsDevelopment retorna true se estiver em ambiente de desenvolvimento
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction retorna true se estiver em ambiente de produção
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// Log imprime as configurações (sem senha)
func (c *Config) Log() {
	log.Printf("Configurações carregadas:")
	log.Printf("  Database Host: %s", c.DatabaseHost)
	log.Printf("  Database Port: %s", c.DatabasePort)
	log.Printf("  Database User: %s", c.DatabaseUser)
	log.Printf("  Database Name: %s", c.DatabaseName)
	log.Printf("  Server Port: %s", c.ServerPort)
	log.Printf("  Environment: %s", c.Environment)
}

