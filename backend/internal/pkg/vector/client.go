package vector

import (
	"context"
	"fmt"
	"time"

	"backend/internal/pkg/models"
)

// VectorClient 向量数据库客户端接口
type VectorClient interface {
	// 文档管理
	AddDocument(ctx context.Context, doc *Document) error
	UpdateDocument(ctx context.Context, doc *Document) error
	DeleteDocument(ctx context.Context, id string) error
	GetDocument(ctx context.Context, id string) (*Document, error)

	// 向量搜索
	Search(ctx context.Context, query string, options *SearchOptions) ([]*SearchResult, error)
	SimilaritySearch(ctx context.Context, embedding []float32, options *SearchOptions) ([]*SearchResult, error)

	// 集合管理
	CreateCollection(ctx context.Context, name string, dimension int) error
	DeleteCollection(ctx context.Context, name string) error
	ListCollections(ctx context.Context) ([]string, error)

	// 批量操作
	BatchAdd(ctx context.Context, docs []*Document) error
	BatchDelete(ctx context.Context, ids []string) error

	// 健康检查
	Ping(ctx context.Context) error
	Close() error
}

// Document 文档结构
type Document struct {
	ID         string                 `json:"id"`
	Content    string                 `json:"content"`
	Embedding  []float32              `json:"embedding,omitempty"`
	Metadata   map[string]interface{} `json:"metadata"`
	Collection string                 `json:"collection"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

// SearchOptions 搜索选项
type SearchOptions struct {
	Collection string                 `json:"collection"`
	TopK       int                    `json:"top_k"`        // 返回结果数量
	Threshold  float32                `json:"threshold"`    // 相似度阈值
	Filter     map[string]interface{} `json:"filter"`       // 元数据过滤
	IncludeEmbedding bool             `json:"include_embedding"`
}

// SearchResult 搜索结果
type SearchResult struct {
	Document *Document `json:"document"`
	Score    float32   `json:"score"`    // 相似度分数
	Distance float32   `json:"distance"` // 距离
}

// EmbeddingService 嵌入服务接口
type EmbeddingService interface {
	// 生成文本嵌入
	Embed(ctx context.Context, text string) ([]float32, error)
	EmbedBatch(ctx context.Context, texts []string) ([][]float32, error)
	
	// 获取嵌入维度
	GetDimension() int
	
	// 健康检查
	Ping(ctx context.Context) error
}

// RAGService RAG 检索增强生成服务
type RAGService struct {
	vectorClient     VectorClient
	embeddingService EmbeddingService
	collections      map[string]string // 集合名称映射
}

// NewRAGService 创建 RAG 服务
func NewRAGService(vectorClient VectorClient, embeddingService EmbeddingService) *RAGService {
	return &RAGService{
		vectorClient:     vectorClient,
		embeddingService: embeddingService,
		collections: map[string]string{
			"worldview":   "novel_worldview",
			"character":   "novel_character", 
			"chapter":     "novel_chapter",
			"outline":     "novel_outline",
			"context":     "novel_context",
		},
	}
}

// InitializeCollections 初始化集合
func (r *RAGService) InitializeCollections(ctx context.Context) error {
	dimension := r.embeddingService.GetDimension()
	
	for _, collection := range r.collections {
		err := r.vectorClient.CreateCollection(ctx, collection, dimension)
		if err != nil {
			return fmt.Errorf("failed to create collection %s: %w", collection, err)
		}
	}
	
	return nil
}

// AddWorldView 添加世界观文档
func (r *RAGService) AddWorldView(ctx context.Context, worldView *models.WorldView) error {
	content := fmt.Sprintf(`
标题：%s
概要：%s
背景设定：%s
核心规则：%s
主题：%s
`, worldView.Title, worldView.Synopsis, worldView.Setting,
		joinStrings(worldView.KeyRules, "；"), joinStrings(worldView.Themes, "；"))

	embedding, err := r.embeddingService.Embed(ctx, content)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	doc := &Document{
		ID:        worldView.ID,
		Content:   content,
		Embedding: embedding,
		Metadata: map[string]interface{}{
			"type":       "worldview",
			"project_id": worldView.ProjectID,
			"title":      worldView.Title,
		},
		Collection: r.collections["worldview"],
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	return r.vectorClient.AddDocument(ctx, doc)
}

// AddCharacter 添加人物文档
func (r *RAGService) AddCharacter(ctx context.Context, character *models.Character) error {
	content := fmt.Sprintf(`
人物：%s
角色：%s
年龄：%d
外貌：%s
背景：%s
动机：%s
缺点：%s
说话风格：%s
秘密：%s
`, character.Name, character.Role, character.Age, character.Appearance,
		character.Background, character.Motivation, joinStrings(character.Flaws, "；"),
		character.SpeechTone, joinStrings(character.Secrets, "；"))

	embedding, err := r.embeddingService.Embed(ctx, content)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	doc := &Document{
		ID:        character.ID,
		Content:   content,
		Embedding: embedding,
		Metadata: map[string]interface{}{
			"type":       "character",
			"project_id": character.ProjectID,
			"name":       character.Name,
			"role":       character.Role,
		},
		Collection: r.collections["character"],
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	return r.vectorClient.AddDocument(ctx, doc)
}

// AddChapter 添加章节文档
func (r *RAGService) AddChapter(ctx context.Context, chapter *models.Chapter) error {
	content := chapter.PolishedContent
	if content == "" {
		content = chapter.RawContent
	}

	// 为长章节创建摘要
	if len(content) > 2000 {
		content = fmt.Sprintf("标题：%s\n摘要：%s\n内容片段：%s", 
			chapter.Title, chapter.Summary, content[:2000])
	}

	embedding, err := r.embeddingService.Embed(ctx, content)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	doc := &Document{
		ID:        chapter.ID,
		Content:   content,
		Embedding: embedding,
		Metadata: map[string]interface{}{
			"type":       "chapter",
			"project_id": chapter.ProjectID,
			"index":      chapter.Index,
			"title":      chapter.Title,
			"word_count": chapter.WordCount,
		},
		Collection: r.collections["chapter"],
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	return r.vectorClient.AddDocument(ctx, doc)
}

// SearchRelevantContext 搜索相关上下文
func (r *RAGService) SearchRelevantContext(ctx context.Context, query string, projectID string, contextType string, topK int) ([]*SearchResult, error) {
	collection := r.collections[contextType]
	if collection == "" {
		return nil, fmt.Errorf("unknown context type: %s", contextType)
	}

	options := &SearchOptions{
		Collection: collection,
		TopK:       topK,
		Threshold:  0.7, // 相似度阈值
		Filter: map[string]interface{}{
			"project_id": projectID,
		},
	}

	return r.vectorClient.Search(ctx, query, options)
}

// GetCharacterContext 获取人物相关上下文
func (r *RAGService) GetCharacterContext(ctx context.Context, characterName string, projectID string) ([]*SearchResult, error) {
	query := fmt.Sprintf("人物 %s 性格 背景 关系", characterName)
	
	options := &SearchOptions{
		Collection: r.collections["character"],
		TopK:       5,
		Threshold:  0.6,
		Filter: map[string]interface{}{
			"project_id": projectID,
		},
	}

	return r.vectorClient.Search(ctx, query, options)
}

// GetWorldViewContext 获取世界观相关上下文
func (r *RAGService) GetWorldViewContext(ctx context.Context, query string, projectID string) ([]*SearchResult, error) {
	options := &SearchOptions{
		Collection: r.collections["worldview"],
		TopK:       3,
		Threshold:  0.7,
		Filter: map[string]interface{}{
			"project_id": projectID,
		},
	}

	return r.vectorClient.Search(ctx, query, options)
}

// GetPreviousChapters 获取前面章节的上下文
func (r *RAGService) GetPreviousChapters(ctx context.Context, currentIndex int, projectID string, count int) ([]*SearchResult, error) {
	options := &SearchOptions{
		Collection: r.collections["chapter"],
		TopK:       count,
		Filter: map[string]interface{}{
			"project_id": projectID,
			"index":      map[string]interface{}{"$lt": currentIndex}, // 小于当前章节索引
		},
	}

	// 使用空查询获取最近的章节
	return r.vectorClient.Search(ctx, "", options)
}

// BuildContextPrompt 构建上下文提示词
func (r *RAGService) BuildContextPrompt(ctx context.Context, projectID string, chapterIndex int, query string) (string, error) {
	var contextParts []string

	// 获取世界观上下文
	worldResults, err := r.GetWorldViewContext(ctx, query, projectID)
	if err == nil && len(worldResults) > 0 {
		contextParts = append(contextParts, "【世界观设定】")
		for _, result := range worldResults {
			contextParts = append(contextParts, result.Document.Content)
		}
	}

	// 获取人物上下文
	charResults, err := r.SearchRelevantContext(ctx, query, projectID, "character", 3)
	if err == nil && len(charResults) > 0 {
		contextParts = append(contextParts, "\n【相关人物】")
		for _, result := range charResults {
			contextParts = append(contextParts, result.Document.Content)
		}
	}

	// 获取前面章节上下文
	prevResults, err := r.GetPreviousChapters(ctx, chapterIndex, projectID, 2)
	if err == nil && len(prevResults) > 0 {
		contextParts = append(contextParts, "\n【前情回顾】")
		for _, result := range prevResults {
			contextParts = append(contextParts, fmt.Sprintf("第%d章：%s", 
				result.Document.Metadata["index"], result.Document.Content))
		}
	}

	if len(contextParts) == 0 {
		return "", nil
	}

	return fmt.Sprintf("参考上下文：\n%s\n", joinStrings(contextParts, "\n")), nil
}

// UpdateProject 更新项目所有文档
func (r *RAGService) UpdateProject(ctx context.Context, project *models.NovelProject) error {
	// 更新世界观
	if project.WorldView != nil {
		if err := r.AddWorldView(ctx, project.WorldView); err != nil {
			return fmt.Errorf("failed to update worldview: %w", err)
		}
	}

	// 更新人物
	for _, character := range project.Characters {
		if err := r.AddCharacter(ctx, character); err != nil {
			return fmt.Errorf("failed to update character %s: %w", character.Name, err)
		}
	}

	// 更新章节
	for _, chapter := range project.Chapters {
		if err := r.AddChapter(ctx, chapter); err != nil {
			return fmt.Errorf("failed to update chapter %d: %w", chapter.Index, err)
		}
	}

	return nil
}

// DeleteProject 删除项目所有文档
func (r *RAGService) DeleteProject(ctx context.Context, projectID string) error {
	// 获取项目相关的所有文档ID
	for _, collection := range r.collections {
		options := &SearchOptions{
			Collection: collection,
			TopK:       1000, // 获取所有相关文档
			Filter: map[string]interface{}{
				"project_id": projectID,
			},
		}

		results, err := r.vectorClient.Search(ctx, "", options)
		if err != nil {
			continue // 忽略错误，继续删除其他集合
		}

		// 批量删除
		ids := make([]string, len(results))
		for i, result := range results {
			ids[i] = result.Document.ID
		}

		if len(ids) > 0 {
			if err := r.vectorClient.BatchDelete(ctx, ids); err != nil {
				return fmt.Errorf("failed to delete documents from %s: %w", collection, err)
			}
		}
	}

	return nil
}

// GetStats 获取统计信息
func (r *RAGService) GetStats(ctx context.Context, projectID string) (map[string]int, error) {
	stats := make(map[string]int)

	for contextType, collection := range r.collections {
		options := &SearchOptions{
			Collection: collection,
			TopK:       1000,
			Filter: map[string]interface{}{
				"project_id": projectID,
			},
		}

		results, err := r.vectorClient.Search(ctx, "", options)
		if err != nil {
			stats[contextType] = 0
		} else {
			stats[contextType] = len(results)
		}
	}

	return stats, nil
}

// 辅助函数
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}