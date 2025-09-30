package eino

import (
	"context"
	"fmt"
	"os"
	"strings"

	"backend/internal/conf"
)

// ModelFactory AI模型工厂
type ModelFactory struct {
	configs map[string]*Config
}

// NewModelFactory 创建模型工厂
func NewModelFactory(aiConfig *conf.AI) (*ModelFactory, error) {
	if aiConfig == nil || len(aiConfig.Models) == 0 {
		return nil, fmt.Errorf("AI configuration is required")
	}

	configs := make(map[string]*Config)
	
	for name, modelConfig := range aiConfig.Models {
		// 处理环境变量替换
		apiKey := expandEnvVars(modelConfig.ApiKey)
		baseURL := expandEnvVars(modelConfig.BaseUrl)
		
		config := &Config{
			Provider:    modelConfig.Provider,
			ModelName:   modelConfig.ModelName,
			Temperature: modelConfig.Temperature,
			MaxTokens:   int(modelConfig.MaxTokens),
			TopP:        modelConfig.TopP,
			APIKey:      apiKey,
			BaseURL:     baseURL,
			Timeout:     modelConfig.Timeout.AsDuration(),
		}
		
		configs[name] = config
	}
	
	return &ModelFactory{
		configs: configs,
	}, nil
}

// CreateClient 创建指定模型的客户端
func (f *ModelFactory) CreateClient(ctx context.Context, modelName string) (*EinoLLMClient, error) {
	config, exists := f.configs[modelName]
	if !exists {
		return nil, fmt.Errorf("model configuration not found: %s", modelName)
	}
	
	return NewEinoLLMClient(ctx, config)
}

// GetDefaultClient 获取默认模型客户端
func (f *ModelFactory) GetDefaultClient(ctx context.Context) (*EinoLLMClient, error) {
	return f.CreateClient(ctx, "default")
}

// ListAvailableModels 列出可用的模型
func (f *ModelFactory) ListAvailableModels() []string {
	models := make([]string, 0, len(f.configs))
	for name := range f.configs {
		models = append(models, name)
	}
	return models
}

// GetModelConfig 获取模型配置
func (f *ModelFactory) GetModelConfig(modelName string) (*Config, error) {
	config, exists := f.configs[modelName]
	if !exists {
		return nil, fmt.Errorf("model configuration not found: %s", modelName)
	}
	return config, nil
}

// expandEnvVars 展开环境变量
func expandEnvVars(value string) string {
	if strings.HasPrefix(value, "${") && strings.HasSuffix(value, "}") {
		envVar := value[2 : len(value)-1]
		return os.Getenv(envVar)
	}
	return value
}

// ModelSwitcher 模型切换器
type ModelSwitcher struct {
	factory       *ModelFactory
	currentClient *EinoLLMClient
	currentModel  string
}

// NewModelSwitcher 创建模型切换器
func NewModelSwitcher(factory *ModelFactory) *ModelSwitcher {
	return &ModelSwitcher{
		factory: factory,
	}
}

// SwitchModel 切换到指定模型
func (s *ModelSwitcher) SwitchModel(ctx context.Context, modelName string) error {
	client, err := s.factory.CreateClient(ctx, modelName)
	if err != nil {
		return fmt.Errorf("failed to switch to model %s: %w", modelName, err)
	}
	
	s.currentClient = client
	s.currentModel = modelName
	return nil
}

// ListModels 列出可用的模型
func (s *ModelSwitcher) ListModels() []string {
	return s.factory.ListAvailableModels()
}

// GetCurrentClient 获取当前客户端
func (s *ModelSwitcher) GetCurrentClient() (*EinoLLMClient, error) {
	if s.currentClient == nil {
		return nil, fmt.Errorf("no model selected, please switch to a model first")
	}
	return s.currentClient, nil
}

// GetCurrentModel 获取当前模型名称
func (s *ModelSwitcher) GetCurrentModel() string {
	return s.currentModel
}

// InitializeDefault 初始化为默认模型
func (s *ModelSwitcher) InitializeDefault(ctx context.Context) error {
	return s.SwitchModel(ctx, "default")
}