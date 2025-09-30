package vector

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// EmbeddingConfig 嵌入服务配置
type EmbeddingConfig struct {
	Provider string `json:"provider"` // openai, azure, local
	APIKey   string `json:"api_key"`
	BaseURL  string `json:"base_url"`
	Model    string `json:"model"`
	Timeout  int    `json:"timeout"` // 秒
}

// OpenAIEmbeddingService OpenAI 嵌入服务实现
type OpenAIEmbeddingService struct {
	config     *EmbeddingConfig
	httpClient *http.Client
}

// NewOpenAIEmbeddingService 创建 OpenAI 嵌入服务
func NewOpenAIEmbeddingService(config *EmbeddingConfig) *OpenAIEmbeddingService {
	timeout := time.Duration(config.Timeout) * time.Second
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	return &OpenAIEmbeddingService{
		config: config,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Embed 生成文本嵌入
func (s *OpenAIEmbeddingService) Embed(ctx context.Context, text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// 构建请求
	requestBody := map[string]interface{}{
		"input": text,
		"model": s.config.Model,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// 发送请求
	req, err := http.NewRequestWithContext(ctx, "POST", s.config.BaseURL+"/embeddings", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var response struct {
		Data []struct {
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
	}

	err = json.Unmarshal(body, &response)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if len(response.Data) == 0 {
		return nil, fmt.Errorf("no embedding data in response")
	}

	return response.Data[0].Embedding, nil
}

// EmbedBatch 批量生成文本嵌入
func (s *OpenAIEmbeddingService) EmbedBatch(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, fmt.Errorf("texts cannot be empty")
	}

	// 构建请求
	requestBody := map[string]interface{}{
		"input": texts,
		"model": s.config.Model,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// 发送请求
	req, err := http.NewRequestWithContext(ctx, "POST", s.config.BaseURL+"/embeddings", strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var response struct {
		Data []struct {
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
	}

	err = json.Unmarshal(body, &response)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if len(response.Data) != len(texts) {
		return nil, fmt.Errorf("embedding count mismatch: expected %d, got %d", len(texts), len(response.Data))
	}

	embeddings := make([][]float32, len(response.Data))
	for i, data := range response.Data {
		embeddings[i] = data.Embedding
	}

	return embeddings, nil
}

// GetDimension 获取嵌入维度
func (s *OpenAIEmbeddingService) GetDimension() int {
	// 根据模型返回对应的维度
	switch s.config.Model {
	case "text-embedding-ada-002":
		return 1536
	case "text-embedding-3-small":
		return 1536
	case "text-embedding-3-large":
		return 3072
	default:
		return 1536 // 默认维度
	}
}

// Ping 健康检查
func (s *OpenAIEmbeddingService) Ping(ctx context.Context) error {
	// 发送一个简单的嵌入请求来检查服务状态
	_, err := s.Embed(ctx, "test")
	return err
}

// LocalEmbeddingService 本地嵌入服务（模拟实现）
type LocalEmbeddingService struct {
	dimension int
}

// NewLocalEmbeddingService 创建本地嵌入服务
func NewLocalEmbeddingService(dimension int) *LocalEmbeddingService {
	if dimension <= 0 {
		dimension = 768 // 默认维度
	}
	return &LocalEmbeddingService{
		dimension: dimension,
	}
}

// Embed 生成文本嵌入（模拟实现）
func (s *LocalEmbeddingService) Embed(ctx context.Context, text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	// 简单的模拟实现：基于文本内容生成伪随机向量
	embedding := make([]float32, s.dimension)
	hash := simpleHash(text)
	
	for i := 0; i < s.dimension; i++ {
		// 使用简单的伪随机算法生成向量
		hash = hash*1103515245 + 12345
		embedding[i] = float32((hash>>16)&0x7fff) / 32768.0 - 1.0
	}

	// 归一化向量
	norm := float32(0)
	for _, v := range embedding {
		norm += v * v
	}
	norm = float32(1.0 / (float64(norm) + 1e-8))
	
	for i := range embedding {
		embedding[i] *= norm
	}

	return embedding, nil
}

// EmbedBatch 批量生成文本嵌入
func (s *LocalEmbeddingService) EmbedBatch(ctx context.Context, texts []string) ([][]float32, error) {
	embeddings := make([][]float32, len(texts))
	for i, text := range texts {
		embedding, err := s.Embed(ctx, text)
		if err != nil {
			return nil, fmt.Errorf("failed to embed text %d: %w", i, err)
		}
		embeddings[i] = embedding
	}
	return embeddings, nil
}

// GetDimension 获取嵌入维度
func (s *LocalEmbeddingService) GetDimension() int {
	return s.dimension
}

// Ping 健康检查
func (s *LocalEmbeddingService) Ping(ctx context.Context) error {
	return nil // 本地服务总是可用
}

// EmbeddingServiceFactory 嵌入服务工厂
type EmbeddingServiceFactory struct{}

// CreateEmbeddingService 创建嵌入服务
func (f *EmbeddingServiceFactory) CreateEmbeddingService(config *EmbeddingConfig) (EmbeddingService, error) {
	switch config.Provider {
	case "openai":
		if config.BaseURL == "" {
			config.BaseURL = "https://api.openai.com/v1"
		}
		if config.Model == "" {
			config.Model = "text-embedding-ada-002"
		}
		return NewOpenAIEmbeddingService(config), nil
		
	case "azure":
		if config.Model == "" {
			config.Model = "text-embedding-ada-002"
		}
		return NewOpenAIEmbeddingService(config), nil // Azure 使用相同的 API 格式
		
	case "local":
		dimension := 768
		if config.Model != "" {
			// 从模型名称中解析维度，例如 "local-768"
			if strings.HasPrefix(config.Model, "local-") {
				fmt.Sscanf(config.Model, "local-%d", &dimension)
			}
		}
		return NewLocalEmbeddingService(dimension), nil
		
	default:
		return nil, fmt.Errorf("unsupported embedding provider: %s", config.Provider)
	}
}

// 辅助函数
func simpleHash(s string) uint32 {
	hash := uint32(0)
	for _, c := range s {
		hash = hash*31 + uint32(c)
	}
	return hash
}