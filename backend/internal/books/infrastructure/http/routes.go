package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registra todas as rotas de livros no router
func RegisterRoutes(router *gin.RouterGroup, handler *BookHandler) {
	books := router.Group("/books")
	{
		books.POST("/upload", handler.UploadBook)
		books.GET("", handler.ListBooks)
		// Rotas específicas devem vir antes das rotas com parâmetros genéricos
		books.GET("/:id/download", handler.DownloadBook)
		books.PUT("/:id/progress", handler.UpdateProgress)
		// Rotas genéricas por último
		books.GET("/:id", handler.GetBook)
		books.DELETE("/:id", handler.DeleteBook)
	}
}
