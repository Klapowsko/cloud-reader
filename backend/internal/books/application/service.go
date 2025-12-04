package application

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"time"

	"cloud-reader/backend/internal/books/domain"
	"cloud-reader/backend/internal/shared/storage"
)

// BookService define os casos de uso de livros
type BookService struct {
	bookRepo domain.BookRepository
}

// NewBookService cria uma nova instância do BookService
func NewBookService(bookRepo domain.BookRepository) *BookService {
	return &BookService{
		bookRepo: bookRepo,
	}
}

// UploadBook faz upload de um livro
func (s *BookService) UploadBook(ctx context.Context, userID uint, fileHeader *multipart.FileHeader, file multipart.File) (*BookResponse, error) {
	// Valida arquivo
	if err := storage.ValidateFile(fileHeader); err != nil {
		return nil, err
	}

	// Salva arquivo no sistema de arquivos
	filePath, _, err := storage.SaveFile(file, userID, fileHeader.Filename)
	if err != nil {
		return nil, fmt.Errorf("erro ao salvar arquivo: %w", err)
	}

	// Extrai informações do arquivo
	title := storage.ExtractTitle(fileHeader.Filename)
	format := storage.GetFileFormat(fileHeader.Filename)

	// Cria registro no banco de dados
	book := &domain.Book{
		UserID:   userID,
		Title:    title,
		Filename: fileHeader.Filename,
		FilePath: filePath,
		FileSize: fileHeader.Size,
		Format:   format,
	}

	if err := s.bookRepo.Create(ctx, book); err != nil {
		// Se falhar ao criar no BD, remove o arquivo
		storage.DeleteFile(filePath)
		return nil, fmt.Errorf("erro ao criar registro: %w", err)
	}

	return &BookResponse{
		ID:                book.ID,
		UserID:            book.UserID,
		Title:             book.Title,
		Filename:          book.Filename,
		FilePath:          book.FilePath,
		FileSize:          book.FileSize,
		Format:            book.Format,
		CurrentPage:       book.CurrentPage,
		ProgressPercentage: book.ProgressPercentage,
		CreatedAt:         book.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         book.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// ListBooks lista todos os livros de um usuário
func (s *BookService) ListBooks(ctx context.Context, userID uint) (*ListBooksResponse, error) {
	books, err := s.bookRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	bookResponses := make([]BookResponse, len(books))
	for i, book := range books {
		bookResponses[i] = BookResponse{
			ID:                book.ID,
			UserID:            book.UserID,
			Title:             book.Title,
			Filename:          book.Filename,
			FilePath:          book.FilePath,
			FileSize:          book.FileSize,
			Format:            book.Format,
			CurrentPage:       book.CurrentPage,
			ProgressPercentage: book.ProgressPercentage,
			CreatedAt:         book.CreatedAt.Format(time.RFC3339),
			UpdatedAt:         book.UpdatedAt.Format(time.RFC3339),
		}
	}

	return &ListBooksResponse{
		Books: bookResponses,
		Total: len(bookResponses),
	}, nil
}

// GetBook obtém um livro específico
func (s *BookService) GetBook(ctx context.Context, id uint, userID uint) (*BookResponse, error) {
	book, err := s.bookRepo.FindByID(ctx, id, userID)
	if err != nil {
		return nil, errors.New("livro não encontrado")
	}

	return &BookResponse{
		ID:                book.ID,
		UserID:            book.UserID,
		Title:             book.Title,
		Filename:          book.Filename,
		FilePath:          book.FilePath,
		FileSize:          book.FileSize,
		Format:            book.Format,
		CurrentPage:       book.CurrentPage,
		ProgressPercentage: book.ProgressPercentage,
		CreatedAt:         book.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         book.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// UpdateReadingProgress atualiza o progresso de leitura de um livro
func (s *BookService) UpdateReadingProgress(ctx context.Context, id uint, userID uint, currentPage int, progressPercentage float64) error {
	// Valida ownership primeiro
	_, err := s.bookRepo.FindByID(ctx, id, userID)
	if err != nil {
		return errors.New("livro não encontrado")
	}

	// Atualiza o progresso
	if err := s.bookRepo.UpdateProgress(ctx, id, userID, currentPage, progressPercentage); err != nil {
		return fmt.Errorf("erro ao atualizar progresso: %w", err)
	}

	return nil
}

// DeleteBook remove um livro
func (s *BookService) DeleteBook(ctx context.Context, id uint, userID uint) error {
	// Busca o livro para obter o caminho do arquivo
	book, err := s.bookRepo.FindByID(ctx, id, userID)
	if err != nil {
		return errors.New("livro não encontrado")
	}

	// Remove do banco de dados
	if err := s.bookRepo.Delete(ctx, id, userID); err != nil {
		return err
	}

	// Remove arquivo do sistema de arquivos
	if err := storage.DeleteFile(book.FilePath); err != nil {
		// Log do erro mas não falha a operação se o arquivo já não existir
		fmt.Printf("Aviso: erro ao deletar arquivo %s: %v\n", book.FilePath, err)
	}

	return nil
}

// GetBookFile retorna o caminho do arquivo para download
func (s *BookService) GetBookFile(ctx context.Context, id uint, userID uint) (string, error) {
	book, err := s.bookRepo.FindByID(ctx, id, userID)
	if err != nil {
		return "", errors.New("livro não encontrado")
	}

	// Verifica se o arquivo existe
	if _, err := os.Stat(book.FilePath); os.IsNotExist(err) {
		return "", errors.New("arquivo não encontrado")
	}

	return book.FilePath, nil
}
