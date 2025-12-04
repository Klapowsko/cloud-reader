package repository

import (
	"context"
	"errors"

	"cloud-reader/backend/internal/books/domain"
	"gorm.io/gorm"
)

// postgresBookRepository implementa BookRepository usando PostgreSQL/GORM
type postgresBookRepository struct {
	db *gorm.DB
}

// NewPostgresBookRepository cria uma nova instância do repositório PostgreSQL
func NewPostgresBookRepository(db *gorm.DB) domain.BookRepository {
	return &postgresBookRepository{
		db: db,
	}
}

// Create cria um novo livro
func (r *postgresBookRepository) Create(ctx context.Context, book *domain.Book) error {
	if err := r.db.WithContext(ctx).Create(book).Error; err != nil {
		return err
	}
	return nil
}

// FindByID busca um livro pelo ID e UserID (valida ownership)
func (r *postgresBookRepository) FindByID(ctx context.Context, id uint, userID uint) (*domain.Book, error) {
	var book domain.Book
	if err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&book).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("livro não encontrado")
		}
		return nil, err
	}
	return &book, nil
}

// FindByUserID busca todos os livros de um usuário
func (r *postgresBookRepository) FindByUserID(ctx context.Context, userID uint) ([]*domain.Book, error) {
	var books []*domain.Book
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&books).Error; err != nil {
		return nil, err
	}
	return books, nil
}

// Delete remove um livro (valida ownership)
func (r *postgresBookRepository) Delete(ctx context.Context, id uint, userID uint) error {
	result := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&domain.Book{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("livro não encontrado")
	}
	return nil
}

// UpdateProgress atualiza o progresso de leitura de um livro
func (r *postgresBookRepository) UpdateProgress(ctx context.Context, id uint, userID uint, currentPage int, progressPercentage float64) error {
	result := r.db.WithContext(ctx).
		Model(&domain.Book{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"current_page":        currentPage,
			"progress_percentage": progressPercentage,
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("livro não encontrado")
	}
	return nil
}

