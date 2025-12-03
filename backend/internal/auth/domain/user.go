package domain

import (
	"time"

	"gorm.io/gorm"
)

// User representa a entidade de usuário no domínio
type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name     string `gorm:"not null" json:"name"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // Senha não é exposta no JSON
}

// TableName define o nome da tabela no banco de dados
func (User) TableName() string {
	return "users"
}

