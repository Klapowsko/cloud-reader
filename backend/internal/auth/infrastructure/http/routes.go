package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registra todas as rotas de autenticação no router
func RegisterRoutes(router *gin.RouterGroup, handler *AuthHandler) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
	}
}

