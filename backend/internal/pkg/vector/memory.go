package vector

import (
	"context"
	"fmt"
	"math"
	"sort"
	"strings"
	"sync"
	"time"
)

// MemoryVectorClient 内存向量数据库客户端实现
type MemoryVectorClient struct {
	mu          sync.RWMutex
	collections map[string]*MemoryCollection
}

// MemoryCollection 内存集合
type MemoryCollection struct {
	name      string
	dimension int
	documents map[string]*Document
	index     *MemoryIndex
}

// MemoryIndex 内存索引
type MemoryIndex struct {
	vectors map[string][]float32
}

// NewMemoryVectorClient 创建内存向量数据库客户端
func NewMemoryVectorClient() *MemoryVectorClient {
	return &MemoryVectorClient{
		collections: make(map[string]*MemoryCollection),
	}
}

// CreateCollection 创建集合
func (m *MemoryVectorClient) CreateCollection(ctx context.Context, name string, dimension int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.collections[name]; exists {
		return fmt.Errorf("collection %s already exists", name)
	}

	m.collections[name] = &MemoryCollection{
		name:      name,
		dimension: dimension,
		documents: make(map[string]*Document),
		index: &MemoryIndex{
			vectors: make(map[string][]float32),
		},
	}

	return nil
}

// DeleteCollection 删除集合
func (m *MemoryVectorClient) DeleteCollection(ctx context.Context, name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.collections, name)
	return nil
}

// ListCollections 列出所有集合
func (m *MemoryVectorClient) ListCollections(ctx context.Context) ([]string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.collections))
	for name := range m.collections {
		names = append(names, name)
	}

	return names, nil
}

// AddDocument 添加文档
func (m *MemoryVectorClient) AddDocument(ctx context.Context, doc *Document) error {
	return m.BatchAdd(ctx, []*Document{doc})
}

// UpdateDocument 更新文档
func (m *MemoryVectorClient) UpdateDocument(ctx context.Context, doc *Document) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	collection, exists := m.collections[doc.Collection]
	if !exists {
		return fmt.Errorf("collection %s not found", doc.Collection)
	}

	// 更新文档
	doc.UpdatedAt = time.Now()
	collection.documents[doc.ID] = doc
	
	// 更新索引
	if len(doc.Embedding) > 0 {
		collection.index.vectors[doc.ID] = doc.Embedding
	}

	return nil
}

// DeleteDocument 删除文档
func (m *MemoryVectorClient) DeleteDocument(ctx context.Context, id string) error {
	return m.BatchDelete(ctx, []string{id})
}

// GetDocument 获取文档
func (m *MemoryVectorClient) GetDocument(ctx context.Context, id string) (*Document, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, collection := range m.collections {
		if doc, exists := collection.documents[id]; exists {
			return doc, nil
		}
	}

	return nil, fmt.Errorf("document %s not found", id)
}

// BatchAdd 批量添加文档
func (m *MemoryVectorClient) BatchAdd(ctx context.Context, docs []*Document) error {
	if len(docs) == 0 {
		return nil
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, doc := range docs {
		collection, exists := m.collections[doc.Collection]
		if !exists {
			return fmt.Errorf("collection %s not found", doc.Collection)
		}

		// 验证向量维度
		if len(doc.Embedding) > 0 && len(doc.Embedding) != collection.dimension {
			return fmt.Errorf("embedding dimension mismatch: expected %d, got %d", collection.dimension, len(doc.Embedding))
		}

		// 设置时间戳
		if doc.CreatedAt.IsZero() {
			doc.CreatedAt = time.Now()
		}
		doc.UpdatedAt = time.Now()

		// 添加文档
		collection.documents[doc.ID] = doc
		
		// 添加到索引
		if len(doc.Embedding) > 0 {
			collection.index.vectors[doc.ID] = doc.Embedding
		}
	}

	return nil
}

// BatchDelete 批量删除文档
func (m *MemoryVectorClient) BatchDelete(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, id := range ids {
		for _, collection := range m.collections {
			delete(collection.documents, id)
			delete(collection.index.vectors, id)
		}
	}

	return nil
}

// Search 搜索文档
func (m *MemoryVectorClient) Search(ctx context.Context, query string, options *SearchOptions) ([]*SearchResult, error) {
	// 内存实现中，需要外部提供嵌入向量
	// 这里简化处理，返回基于文本匹配的结果
	return m.textSearch(ctx, query, options)
}

// SimilaritySearch 相似度搜索
func (m *MemoryVectorClient) SimilaritySearch(ctx context.Context, embedding []float32, options *SearchOptions) ([]*SearchResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	collection, exists := m.collections[options.Collection]
	if !exists {
		return nil, fmt.Errorf("collection %s not found", options.Collection)
	}

	// 计算相似度
	type scoreDoc struct {
		doc   *Document
		score float32
	}

	var candidates []scoreDoc
	for id, vector := range collection.index.vectors {
		doc := collection.documents[id]
		
		// 应用过滤器
		if !m.matchFilter(doc, options.Filter) {
			continue
		}

		// 计算余弦相似度
		similarity := cosineSimilarity(embedding, vector)
		if similarity >= options.Threshold {
			candidates = append(candidates, scoreDoc{
				doc:   doc,
				score: similarity,
			})
		}
	}

	// 按相似度排序
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	// 限制结果数量
	if len(candidates) > options.TopK {
		candidates = candidates[:options.TopK]
	}

	// 转换结果
	results := make([]*SearchResult, len(candidates))
	for i, candidate := range candidates {
		doc := candidate.doc
		if !options.IncludeEmbedding {
			doc = &Document{
				ID:         doc.ID,
				Content:    doc.Content,
				Metadata:   doc.Metadata,
				Collection: doc.Collection,
				CreatedAt:  doc.CreatedAt,
				UpdatedAt:  doc.UpdatedAt,
			}
		}

		results[i] = &SearchResult{
			Document: doc,
			Score:    candidate.score,
			Distance: 1.0 - candidate.score,
		}
	}

	return results, nil
}

// textSearch 基于文本的搜索
func (m *MemoryVectorClient) textSearch(ctx context.Context, query string, options *SearchOptions) ([]*SearchResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	collection, exists := m.collections[options.Collection]
	if !exists {
		return nil, fmt.Errorf("collection %s not found", options.Collection)
	}

	query = strings.ToLower(query)
	var results []*SearchResult

	for _, doc := range collection.documents {
		// 应用过滤器
		if !m.matchFilter(doc, options.Filter) {
			continue
		}

		// 简单的文本匹配
		content := strings.ToLower(doc.Content)
		if strings.Contains(content, query) {
			// 计算简单的匹配分数
			score := float32(strings.Count(content, query)) / float32(len(strings.Fields(content)))
			if score >= options.Threshold {
				docCopy := doc
				if !options.IncludeEmbedding {
					docCopy = &Document{
						ID:         doc.ID,
						Content:    doc.Content,
						Metadata:   doc.Metadata,
						Collection: doc.Collection,
						CreatedAt:  doc.CreatedAt,
						UpdatedAt:  doc.UpdatedAt,
					}
				}

				results = append(results, &SearchResult{
					Document: docCopy,
					Score:    score,
					Distance: 1.0 - score,
				})
			}
		}
	}

	// 按分数排序
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	// 限制结果数量
	if len(results) > options.TopK {
		results = results[:options.TopK]
	}

	return results, nil
}

// matchFilter 检查文档是否匹配过滤器
func (m *MemoryVectorClient) matchFilter(doc *Document, filter map[string]interface{}) bool {
	if filter == nil {
		return true
	}

	for key, expectedValue := range filter {
		actualValue, exists := doc.Metadata[key]
		if !exists {
			return false
		}

		// 简单的值比较
		if actualValue != expectedValue {
			return false
		}
	}

	return true
}

// Ping 健康检查
func (m *MemoryVectorClient) Ping(ctx context.Context) error {
	return nil // 内存实现总是可用
}

// Close 关闭连接
func (m *MemoryVectorClient) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 清理所有数据
	m.collections = make(map[string]*MemoryCollection)
	return nil
}

// GetStats 获取统计信息
func (m *MemoryVectorClient) GetStats(ctx context.Context) (map[string]interface{}, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := make(map[string]interface{})
	stats["collections"] = len(m.collections)
	
	totalDocs := 0
	for _, collection := range m.collections {
		totalDocs += len(collection.documents)
	}
	stats["total_documents"] = totalDocs

	return stats, nil
}

// 辅助函数：计算余弦相似度
func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float64
	for i := 0; i < len(a); i++ {
		dotProduct += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return float32(dotProduct / (math.Sqrt(normA) * math.Sqrt(normB)))
}