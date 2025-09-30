package vector

import (
	"fmt"
	"backend/internal/conf"
	"github.com/google/wire"
)

// ProviderSet is vector providers.
var ProviderSet = wire.NewSet(NewVectorServiceFactory, NewRAGServiceProvider)

// NewRAGServiceProvider 创建RAG服务提供者（用于依赖注入）
func NewRAGServiceProvider(config *conf.Data, aiConfig *conf.AI) (*RAGService, error) {
	if config.Vector == nil {
		return nil, fmt.Errorf("vector configuration is required")
	}

	factory := NewVectorServiceFactory(config.Vector, aiConfig)
	return factory.CreateRAGService()
}