package vector

import (
	"context"
	"testing"

	"backend/internal/conf"
)

func TestVectorServiceFactory_CreateVectorClient(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: &conf.Data_Vector_Embedding{
			ModelRef: "default",
			Model:    "local",
		},
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-768",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	client, err := factory.CreateVectorClient()
	if err != nil {
		t.Fatalf("Failed to create vector client: %v", err)
	}

	if client == nil {
		t.Fatal("Vector client should not be nil")
	}

	// 验证客户端类型
	_, ok := client.(*MemoryVectorClient)
	if !ok {
		t.Fatal("Expected MemoryVectorClient")
	}
}

func TestVectorServiceFactory_CreateEmbeddingService(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: &conf.Data_Vector_Embedding{
			ModelRef: "default",
			Model:    "local-768",
		},
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-768",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	service, err := factory.CreateEmbeddingService()
	if err != nil {
		t.Fatalf("Failed to create embedding service: %v", err)
	}

	if service == nil {
		t.Fatal("Embedding service should not be nil")
	}

	// 验证服务类型
	localService, ok := service.(*LocalEmbeddingService)
	if !ok {
		t.Fatal("Expected LocalEmbeddingService")
	}

	if localService.GetDimension() != 768 {
		t.Fatalf("Expected dimension 768, got %d", localService.GetDimension())
	}
}

func TestVectorServiceFactory_CreateRAGService(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: &conf.Data_Vector_Embedding{
			ModelRef: "default",
			Model:    "local-768",
		},
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-768",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	ragService, err := factory.CreateRAGService()
	if err != nil {
		t.Fatalf("Failed to create RAG service: %v", err)
	}

	if ragService == nil {
		t.Fatal("RAG service should not be nil")
	}
}

func TestVectorServiceFactory_InitializeServices(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: &conf.Data_Vector_Embedding{
			ModelRef: "default",
			Model:    "local-768",
		},
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-768",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	ctx := context.Background()
	
	ragService, err := factory.InitializeServices(ctx)
	if err != nil {
		t.Fatalf("Failed to initialize services: %v", err)
	}

	if ragService == nil {
		t.Fatal("RAG service should not be nil")
	}
}

func TestVectorServiceFactory_CloseServices(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: &conf.Data_Vector_Embedding{
			ModelRef: "default",
			Model:    "local-128",
		},
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-128",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	ctx := context.Background()
	
	// 先初始化服务
	ragService, err := factory.InitializeServices(ctx)
	if err != nil {
		t.Fatalf("Failed to initialize services: %v", err)
	}

	// 然后关闭服务
	err = factory.CloseServices(ragService)
	if err != nil {
		t.Fatalf("Failed to close services: %v", err)
	}
}

func TestVectorServiceFactory_MissingEmbeddingConfig(t *testing.T) {
	config := &conf.Data_Vector{
		Embedding: nil,
	}

	aiConfig := &conf.AI{
		Models: map[string]*conf.AI_ModelConfig{
			"default": {
				Provider:  "local",
				ModelName: "local-768",
			},
		},
	}

	factory := NewVectorServiceFactory(config, aiConfig)
	_, err := factory.CreateEmbeddingService()
	if err == nil {
		t.Fatal("Expected error for missing embedding config")
	}
}