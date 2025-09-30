package vector

import (
	"backend/internal/conf"
	"github.com/google/wire"
)

// ProviderSet is vector providers.
var ProviderSet = wire.NewSet(NewVectorServiceFactory, NewRAGServiceProvider)

// NewRAGServiceProvider 创建RAG服务提供者（用于依赖注入）
func NewRAGServiceProvider(config *conf.Data) (*RAGService, error) {
	if config.Vector == nil {
		// 如果没有配置向量服务，返回nil
		return nil, nil
	}
	
	factory := NewVectorServiceFactory(config.Vector)
	return factory.CreateRAGService()
}