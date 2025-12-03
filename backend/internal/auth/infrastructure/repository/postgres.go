package repository

import (
	"context"
	"errors"

	"cloud-reader/backend/internal/auth/domain"
	"gorm.io/gorm"
)

// postgresUserRepository implementa UserRepository usando PostgreSQL/GORM
type postgresUserRepository struct {
	db *gorm.DB
}

// NewPostgresUserRepository cria uma nova instância do repositório PostgreSQL
func NewPostgresUserRepository(db *gorm.DB) domain.UserRepository {
	return &postgresUserRepository{
		db: db,
	}
}

// Create cria um novo usuário
func (r *postgresUserRepository) Create(ctx context.Context, user *domain.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return err
	}
	return nil
}

// FindByEmail busca um usuário pelo email
func (r *postgresUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("usuário não encontrado")
		}
		return nil, err
	}
	return &user, nil
}

// FindByID busca um usuário pelo ID
func (r *postgresUserRepository) FindByID(ctx context.Context, id uint) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("usuário não encontrado")
		}
		return nil, err
	}
	return &user, nil
}

// ExistsByEmail verifica se já existe um usuário com o email fornecido
func (r *postgresUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&domain.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

