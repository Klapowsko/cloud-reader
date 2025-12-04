package http

import (
	"net/http"

	"cloud-reader/backend/internal/auth/application"

	"github.com/gin-gonic/gin"
)

// AuthHandler gerencia os handlers HTTP de autenticação
type AuthHandler struct {
	authService *application.AuthService
}

// NewAuthHandler cria uma nova instância do AuthHandler
func NewAuthHandler(authService *application.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register lida com requisições de registro
func (h *AuthHandler) Register(c *gin.Context) {
	var req application.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "dados inválidos",
			"details": err.Error(),
		})
		return
	}

	resp, err := h.authService.Register(c.Request.Context(), &req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "email já está em uso" {
			statusCode = http.StatusConflict
		}
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// Login lida com requisições de login
func (h *AuthHandler) Login(c *gin.Context) {
	var req application.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "dados inválidos",
			"details": err.Error(),
		})
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		statusCode := http.StatusUnauthorized
		c.JSON(statusCode, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

