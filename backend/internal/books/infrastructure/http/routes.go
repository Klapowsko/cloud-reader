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
		books.GET("/:id", handler.GetBook)
		books.DELETE("/:id", handler.DeleteBook)
		books.GET("/:id/download", handler.DownloadBook)
	}
}

