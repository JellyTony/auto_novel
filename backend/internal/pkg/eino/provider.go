package eino

import (
	"context"
	"backend/internal/conf"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
)

// ProviderSet is eino providers.
var ProviderSet = wire.NewSet(NewModelFactory, NewModelSwitcher, NewDefaultEinoClient)

// NewDefaultEinoClient 创建默认的eino客户端
func NewDefaultEinoClient(config *conf.AI, logger log.Logger) (*EinoLLMClient, error) {
	factory, err := NewModelFactory(config)
	if err != nil {
		log.NewHelper(logger).Errorf("Failed to create model factory: %v", err)
		return nil, err
	}
	
	ctx := context.Background()
	client, err := factory.GetDefaultClient(ctx)
	if err != nil {
		log.NewHelper(logger).Errorf("Failed to create default eino client: %v", err)
		return nil, err
	}
	
	log.NewHelper(logger).Info("Default eino client created successfully")
	return client, nil
}