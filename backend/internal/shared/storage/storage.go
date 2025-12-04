package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	// MaxFileSize é o tamanho máximo permitido para upload (50MB)
	MaxFileSize = 50 * 1024 * 1024

	// AllowedExtensions são as extensões permitidas
	AllowedExtensions = ".pdf,.epub,.org"
)

// ValidateFile valida o arquivo antes do upload
func ValidateFile(fileHeader *multipart.FileHeader) error {
	// Valida tamanho
	if fileHeader.Size > MaxFileSize {
		return fmt.Errorf("arquivo muito grande. Tamanho máximo: %d MB", MaxFileSize/(1024*1024))
	}

	// Valida extensão
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowed := strings.Split(AllowedExtensions, ",")
	
	isAllowed := false
	for _, allowedExt := range allowed {
		if ext == strings.TrimSpace(allowedExt) {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return fmt.Errorf("tipo de arquivo não permitido. Tipos permitidos: %s", AllowedExtensions)
	}

	return nil
}

// SaveFile salva o arquivo no diretório de uploads
func SaveFile(file multipart.File, userID uint, originalFilename string) (string, string, error) {
	// Valida extensão
	ext := strings.ToLower(filepath.Ext(originalFilename))
	
	// Gera nome único para o arquivo
	uniqueName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	
	// Define caminho do diretório do usuário
	userDir := filepath.Join("uploads", "books", fmt.Sprintf("%d", userID))
	
	// Cria diretório se não existir
	if err := os.MkdirAll(userDir, 0755); err != nil {
		return "", "", fmt.Errorf("erro ao criar diretório: %w", err)
	}

	// Define caminho completo do arquivo
	filePath := filepath.Join(userDir, uniqueName)

	// Cria arquivo no sistema de arquivos
	dst, err := os.Create(filePath)
	if err != nil {
		return "", "", fmt.Errorf("erro ao criar arquivo: %w", err)
	}
	defer dst.Close()

	// Copia conteúdo do arquivo
	if _, err := io.Copy(dst, file); err != nil {
		return "", "", fmt.Errorf("erro ao salvar arquivo: %w", err)
	}

	return filePath, uniqueName, nil
}

// DeleteFile remove um arquivo do sistema de arquivos
func DeleteFile(filePath string) error {
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("erro ao deletar arquivo: %w", err)
	}
	return nil
}

// GetFileFormat retorna o formato do arquivo baseado na extensão
func GetFileFormat(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".pdf":
		return "pdf"
	case ".epub":
		return "epub"
	case ".org":
		return "org"
	default:
		return "unknown"
	}
}

// ExtractTitle extrai o título do nome do arquivo (remove extensão)
func ExtractTitle(filename string) string {
	name := filepath.Base(filename)
	return strings.TrimSuffix(name, filepath.Ext(name))
}

