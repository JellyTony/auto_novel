package vector

import (
	"context"
	"testing"
)

func TestLocalEmbeddingService_Embed(t *testing.T) {
	service := &LocalEmbeddingService{
		dimension: 128,
	}
	ctx := context.Background()

	// 测试单个文本嵌入
	text := "This is a test text"
	embedding, err := service.Embed(ctx, text)
	if err != nil {
		t.Fatalf("Failed to embed text: %v", err)
	}

	if len(embedding) != 128 {
		t.Fatalf("Expected embedding dimension 128, got %d", len(embedding))
	}

	// 验证嵌入向量不全为零
	hasNonZero := false
	for _, val := range embedding {
		if val != 0 {
			hasNonZero = true
			break
		}
	}
	if !hasNonZero {
		t.Fatal("Embedding vector should not be all zeros")
	}
}

func TestLocalEmbeddingService_EmbedBatch(t *testing.T) {
	service := &LocalEmbeddingService{
		dimension: 64,
	}
	ctx := context.Background()

	// 测试批量文本嵌入
	texts := []string{
		"First test text",
		"Second test text",
		"Third test text",
	}

	embeddings, err := service.EmbedBatch(ctx, texts)
	if err != nil {
		t.Fatalf("Failed to embed batch texts: %v", err)
	}

	if len(embeddings) != len(texts) {
		t.Fatalf("Expected %d embeddings, got %d", len(texts), len(embeddings))
	}

	// 验证每个嵌入向量的维度
	for i, embedding := range embeddings {
		if len(embedding) != 64 {
			t.Fatalf("Expected embedding %d dimension 64, got %d", i, len(embedding))
		}
	}
}

func TestLocalEmbeddingService_GetDimension(t *testing.T) {
	service := &LocalEmbeddingService{
		dimension: 256,
	}

	dimension := service.GetDimension()
	if dimension != 256 {
		t.Fatalf("Expected dimension 256, got %d", dimension)
	}
}

func TestLocalEmbeddingService_Ping(t *testing.T) {
	service := &LocalEmbeddingService{
		dimension: 128,
	}
	ctx := context.Background()

	err := service.Ping(ctx)
	if err != nil {
		t.Fatalf("Ping should not fail for local service: %v", err)
	}
}

func TestEmbeddingServiceFactory(t *testing.T) {
	// 测试创建本地嵌入服务
	config := &EmbeddingConfig{
		Provider: "local",
		Model:    "local-128",
	}

	factory := &EmbeddingServiceFactory{}
	service, err := factory.CreateEmbeddingService(config)
	if err != nil {
		t.Fatalf("Failed to create local embedding service: %v", err)
	}

	if service == nil {
		t.Fatal("Service should not be nil")
	}

	// 验证服务类型
	localService, ok := service.(*LocalEmbeddingService)
	if !ok {
		t.Fatal("Expected LocalEmbeddingService")
	}

	if localService.GetDimension() != 128 {
		t.Fatalf("Expected dimension 128, got %d", localService.GetDimension())
	}
}

func TestEmbeddingServiceFactory_OpenAI(t *testing.T) {
	// 测试创建 OpenAI 嵌入服务
	config := &EmbeddingConfig{
		Provider: "openai",
		APIKey:   "test-key",
		Model:    "text-embedding-ada-002",
		BaseURL:  "https://api.openai.com/v1",
	}

	factory := &EmbeddingServiceFactory{}
	service, err := factory.CreateEmbeddingService(config)
	if err != nil {
		t.Fatalf("Failed to create OpenAI embedding service: %v", err)
	}

	if service == nil {
		t.Fatal("Service should not be nil")
	}

	// 验证服务类型
	_, ok := service.(*OpenAIEmbeddingService)
	if !ok {
		t.Fatal("Expected OpenAIEmbeddingService")
	}
}

func TestEmbeddingServiceFactory_Azure(t *testing.T) {
	// 测试创建 Azure 嵌入服务
	config := &EmbeddingConfig{
		Provider: "azure",
		APIKey:   "test-key",
		Model:    "text-embedding-ada-002",
		BaseURL:  "https://test.openai.azure.com",
	}

	factory := &EmbeddingServiceFactory{}
	service, err := factory.CreateEmbeddingService(config)
	if err != nil {
		t.Fatalf("Failed to create Azure embedding service: %v", err)
	}

	if service == nil {
		t.Fatal("Service should not be nil")
	}

	// 验证服务类型
	_, ok := service.(*OpenAIEmbeddingService)
	if !ok {
		t.Fatal("Expected OpenAIEmbeddingService for Azure")
	}
}

func TestEmbeddingServiceFactory_InvalidProvider(t *testing.T) {
	// 测试无效的提供商
	config := &EmbeddingConfig{
		Provider: "invalid",
	}

	factory := &EmbeddingServiceFactory{}
	service, err := factory.CreateEmbeddingService(config)
	if err == nil {
		t.Fatal("Expected error for invalid provider")
	}

	if service != nil {
		t.Fatal("Service should be nil for invalid provider")
	}
}

func TestEmbeddingConsistency(t *testing.T) {
	service := &LocalEmbeddingService{
		dimension: 64,
	}
	ctx := context.Background()

	text := "Consistent test text"

	// 多次嵌入同一文本，结果应该一致
	embedding1, err := service.Embed(ctx, text)
	if err != nil {
		t.Fatalf("Failed to embed text first time: %v", err)
	}

	embedding2, err := service.Embed(ctx, text)
	if err != nil {
		t.Fatalf("Failed to embed text second time: %v", err)
	}

	// 比较两个嵌入向量
	if len(embedding1) != len(embedding2) {
		t.Fatal("Embedding dimensions should be consistent")
	}

	for i := range embedding1 {
		if embedding1[i] != embedding2[i] {
			t.Fatal("Embeddings should be consistent for the same text")
		}
	}
}