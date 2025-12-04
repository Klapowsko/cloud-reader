package application

// BookResponse representa a resposta com dados do livro
type BookResponse struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	Title     string `json:"title"`
	Filename  string `json:"filename"`
	FilePath  string `json:"file_path"`
	FileSize  int64  `json:"file_size"`
	Format    string `json:"format"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// ListBooksResponse representa a resposta com lista de livros
type ListBooksResponse struct {
	Books []BookResponse `json:"books"`
	Total int           `json:"total"`
}

