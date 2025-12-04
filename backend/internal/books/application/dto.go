package application

// BookResponse representa a resposta com dados do livro
type BookResponse struct {
	ID                uint    `json:"id"`
	UserID            uint    `json:"user_id"`
	Title             string  `json:"title"`
	Filename          string  `json:"filename"`
	FilePath          string  `json:"file_path"`
	FileSize          int64   `json:"file_size"`
	Format            string  `json:"format"`
	CurrentPage       int     `json:"current_page"`
	ProgressPercentage float64 `json:"progress_percentage"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

// UpdateProgressRequest representa a requisição de atualização de progresso
type UpdateProgressRequest struct {
	CurrentPage       int     `json:"current_page" binding:"required,min=0"`
	ProgressPercentage float64 `json:"progress_percentage" binding:"required,min=0,max=100"`
}

// ListBooksResponse representa a resposta com lista de livros
type ListBooksResponse struct {
	Books []BookResponse `json:"books"`
	Total int           `json:"total"`
}

