package domain

import (
	"time"

	"gorm.io/gorm"
)

// Book representa a entidade de livro no domínio
type Book struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID   uint   `gorm:"not null;index" json:"user_id"`
	Title    string `gorm:"not null" json:"title"`
	Filename string `gorm:"not null" json:"filename"`
	FilePath string `gorm:"not null" json:"file_path"`
	FileSize int64  `gorm:"not null" json:"file_size"` // Tamanho em bytes
	Format   string `gorm:"not null" json:"format"`    // pdf, epub, org
}

// TableName define o nome da tabela no banco de dados
func (Book) TableName() string {
	return "books"
}

