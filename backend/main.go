package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Configurar o router do Gin
	r := gin.Default()

	// Middleware CORS básico
	r.Use(corsMiddleware())

	// Rotas de health check
	r.GET("/health", healthCheck)
	r.GET("/api/health", healthCheck)

	// Rotas da API
	api := r.Group("/api/v1")
	{
		api.GET("/", welcome)
	}

	// Iniciar servidor
	port := ":8080"
	log.Printf("Servidor iniciado na porta %s", port)
	if err := r.Run(port); err != nil {
		log.Fatal("Erro ao iniciar servidor:", err)
	}
}

// healthCheck retorna o status do servidor
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
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

// corsMiddleware configura CORS básico
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

