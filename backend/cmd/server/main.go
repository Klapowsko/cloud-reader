package main

import (
	"log"
	"net/http"

	"cloud-reader/backend/internal/auth/domain"
	authHttp "cloud-reader/backend/internal/auth/infrastructure/http"
	"cloud-reader/backend/internal/shared/database"
	"cloud-reader/backend/internal/shared/middleware"
	"cloud-reader/backend/internal/wire"

	"github.com/gin-gonic/gin"
)

func main() {
	// Carrega configurações
	cfg := wire.InitializeConfig()
	cfg.Log()

	// Conecta ao banco de dados
	db, err := wire.InitializeDatabase(cfg)
	if err != nil {
		log.Fatal("Erro ao conectar ao banco de dados:", err)
	}
	defer database.Close()

	// Executa migrations automáticas (cria tabelas se não existirem)
	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Printf("Aviso: Erro ao executar migrations: %v", err)
	} else {
		log.Println("Migrations executadas com sucesso")
	}

	// Configura o router do Gin
	r := gin.Default()

	// Middleware CORS
	r.Use(middleware.CORSMiddleware())

	// Rotas de health check
	r.GET("/health", healthCheck)
	r.GET("/api/health", healthCheck)

	// Rotas da API
	api := r.Group("/api/v1")
	{
		api.GET("/", welcome)

		// Registra rotas de autenticação
		authHandler := wire.InitializeAuthHandler(db)
		authHttp.RegisterRoutes(api, authHandler)
	}

	// Inicia o servidor
	port := ":" + cfg.ServerPort
	log.Printf("Servidor iniciado na porta %s", port)
	if err := r.Run(port); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}

// healthCheck retorna o status do servidor
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Servidor está funcionando",
	})
}

// welcome retorna mensagem de boas-vindas
func welcome(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Bem-vindo à API Cloud Reader",
		"version": "1.0.0",
	})
}

