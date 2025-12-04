package http

import (
	"fmt"
	"net/http"
	"strconv"

	"cloud-reader/backend/internal/books/application"

	"github.com/gin-gonic/gin"
)

// BookHandler gerencia os handlers HTTP de livros
type BookHandler struct {
	bookService *application.BookService
}

// NewBookHandler cria uma nova instância do BookHandler
func NewBookHandler(bookService *application.BookService) *BookHandler {
	return &BookHandler{
		bookService: bookService,
	}
}

// getUserID obtém o userID da requisição
// TODO: Quando JWT for implementado, extrair do token
// Por enquanto, usa header X-User-ID temporário
func (h *BookHandler) getUserID(c *gin.Context) (uint, error) {
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr == "" {
		return 0, fmt.Errorf("user ID não fornecido")
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("user ID inválido: %w", err)
	}

	return uint(userID), nil
}

// UploadBook lida com upload de livros
func (h *BookHandler) UploadBook(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	// Obtém o arquivo do form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "arquivo não fornecido",
			"details": err.Error(),
		})
		return
	}

	// Abre o arquivo
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "erro ao abrir arquivo",
			"details": err.Error(),
		})
		return
	}
	defer src.Close()

	// Faz upload do livro
	resp, err := h.bookService.UploadBook(c.Request.Context(), userID, file, src)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "arquivo muito grande. Tamanho máximo: 50 MB" ||
			err.Error() == "tipo de arquivo não permitido. Tipos permitidos: .pdf,.epub,.org" {
			statusCode = http.StatusBadRequest
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// ListBooks lista todos os livros do usuário
func (h *BookHandler) ListBooks(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	resp, err := h.bookService.ListBooks(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetBook obtém um livro específico
func (h *BookHandler) GetBook(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	resp, err := h.bookService.GetBook(c.Request.Context(), uint(id), userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "livro não encontrado" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// DeleteBook remove um livro
func (h *BookHandler) DeleteBook(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	if err := h.bookService.DeleteBook(c.Request.Context(), uint(id), userID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "livro não encontrado" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "livro deletado com sucesso",
	})
}

// DownloadBook faz download de um livro
func (h *BookHandler) DownloadBook(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	filePath, err := h.bookService.GetBookFile(c.Request.Context(), uint(id), userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "livro não encontrado" || err.Error() == "arquivo não encontrado" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Envia o arquivo
	c.File(filePath)
}

// UpdateProgress atualiza o progresso de leitura de um livro
func (h *BookHandler) UpdateProgress(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user ID não fornecido ou inválido",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID inválido",
		})
		return
	}

	var req application.UpdateProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "dados inválidos",
			"details": err.Error(),
		})
		return
	}

	if err := h.bookService.UpdateReadingProgress(c.Request.Context(), uint(id), userID, req.CurrentPage, req.ProgressPercentage); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "livro não encontrado" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "progresso atualizado com sucesso",
	})
}

