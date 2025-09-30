package vector

import (
	"context"
	"fmt"

	"backend/internal/conf"
)

// VectorServiceFactory 向量服务工厂
type VectorServiceFactory struct {
	config   *conf.Data_Vector
	aiConfig *conf.AI
}

// NewVectorServiceFactory 创建向量服务工厂
func NewVectorServiceFactory(config *conf.Data_Vector, aiConfig *conf.AI) *VectorServiceFactory {
	return &VectorServiceFactory{
		config:   config,
		aiConfig: aiConfig,
	}
}

// CreateVectorClient 创建向量数据库客户端
func (f *VectorServiceFactory) CreateVectorClient() (VectorClient, error) {
	// 优先使用内存实现，避免 Milvus 依赖问题
	return NewMemoryVectorClient(), nil
}

// CreateEmbeddingService 创建嵌入服务
func (f *VectorServiceFactory) CreateEmbeddingService() (EmbeddingService, error) {
	if f.config.Embedding == nil {
		return nil, fmt.Errorf("embedding configuration is required")
	}

	// 获取引用的模型配置
	modelRef := f.config.Embedding.ModelRef
	if modelRef == "" {
		modelRef = "default" // 默认使用default模型
	}

	// 从AI配置中获取模型配置
	if f.aiConfig == nil || f.aiConfig.Models == nil {
		return nil, fmt.Errorf("AI configuration is required")
	}

	modelConfig, exists := f.aiConfig.Models[modelRef]
	if !exists {
		return nil, fmt.Errorf("model configuration not found: %s", modelRef)
	}

	embeddingConfig := &EmbeddingConfig{
		Provider: modelConfig.Provider,
		APIKey:   modelConfig.ApiKey,
		BaseURL:  modelConfig.BaseUrl,
		Model:    f.config.Embedding.Model, // 使用embedding专用的模型名称
		Timeout:  int(modelConfig.Timeout.AsDuration().Seconds()),
	}

	factory := &EmbeddingServiceFactory{}
	return factory.CreateEmbeddingService(embeddingConfig)
}

// CreateRAGService 创建 RAG 服务
func (f *VectorServiceFactory) CreateRAGService() (*RAGService, error) {
	vectorClient, err := f.CreateVectorClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create vector client: %w", err)
	}

	embeddingService, err := f.CreateEmbeddingService()
	if err != nil {
		return nil, fmt.Errorf("failed to create embedding service: %w", err)
	}

	return NewRAGService(vectorClient, embeddingService), nil
}

// InitializeServices 初始化所有向量服务
func (f *VectorServiceFactory) InitializeServices(ctx context.Context) (*RAGService, error) {
	ragService, err := f.CreateRAGService()
	if err != nil {
		return nil, fmt.Errorf("failed to create RAG service: %w", err)
	}

	// 初始化集合
	err = ragService.InitializeCollections(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize collections: %w", err)
	}

	// 健康检查
	err = ragService.embeddingService.Ping(ctx)
	if err != nil {
		return nil, fmt.Errorf("embedding service health check failed: %w", err)
	}

	err = ragService.vectorClient.Ping(ctx)
	if err != nil {
		return nil, fmt.Errorf("vector client health check failed: %w", err)
	}

	return ragService, nil
}

// CloseServices 关闭所有服务
func (f *VectorServiceFactory) CloseServices(ragService *RAGService) error {
	if ragService != nil && ragService.vectorClient != nil {
		return ragService.vectorClient.Close()
	}
	return nil
}