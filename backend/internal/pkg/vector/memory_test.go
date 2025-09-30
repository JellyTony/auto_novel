package vector

import (
	"context"
	"testing"
)

func TestMemoryVectorClient_CreateCollection(t *testing.T) {
	client := NewMemoryVectorClient()
	ctx := context.Background()

	// 测试创建集合
	err := client.CreateCollection(ctx, "test_collection", 128)
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	// 测试重复创建集合
	err = client.CreateCollection(ctx, "test_collection", 128)
	if err == nil {
		t.Fatal("Expected error when creating duplicate collection")
	}
}

func TestMemoryVectorClient_AddDocument(t *testing.T) {
	client := NewMemoryVectorClient()
	ctx := context.Background()

	// 创建集合
	err := client.CreateCollection(ctx, "test_collection", 3)
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	// 添加文档
	doc := &Document{
		ID:         "doc1",
		Collection: "test_collection",
		Content:    "This is a test document",
		Embedding:  []float32{0.1, 0.2, 0.3},
		Metadata: map[string]interface{}{
			"type": "test",
		},
	}

	err = client.AddDocument(ctx, doc)
	if err != nil {
		t.Fatalf("Failed to add document: %v", err)
	}

	// 获取文档
	retrieved, err := client.GetDocument(ctx, "doc1")
	if err != nil {
		t.Fatalf("Failed to get document: %v", err)
	}

	if retrieved.ID != doc.ID || retrieved.Content != doc.Content {
		t.Fatalf("Retrieved document doesn't match original")
	}
}

func TestMemoryVectorClient_Search(t *testing.T) {
	client := NewMemoryVectorClient()
	ctx := context.Background()

	// 创建集合
	err := client.CreateCollection(ctx, "test_collection", 3)
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	// 添加测试文档
	docs := []*Document{
		{
			ID:         "doc1",
			Collection: "test_collection",
			Content:    "This is about cats",
			Embedding:  []float32{1.0, 0.0, 0.0},
		},
		{
			ID:         "doc2",
			Collection: "test_collection",
			Content:    "This is about dogs",
			Embedding:  []float32{0.0, 1.0, 0.0},
		},
		{
			ID:         "doc3",
			Collection: "test_collection",
			Content:    "This is about birds",
			Embedding:  []float32{0.0, 0.0, 1.0},
		},
	}

	for _, doc := range docs {
		err = client.AddDocument(ctx, doc)
		if err != nil {
			t.Fatalf("Failed to add document %s: %v", doc.ID, err)
		}
	}

	// 测试相似性搜索
	queryEmbedding := []float32{0.9, 0.1, 0.0} // 应该与 doc1 最相似
	options := &SearchOptions{
		Collection: "test_collection",
		TopK:       2,
	}

	results, err := client.SimilaritySearch(ctx, queryEmbedding, options)
	if err != nil {
		t.Fatalf("Failed to perform similarity search: %v", err)
	}

	if len(results) == 0 {
		t.Fatal("No search results returned")
	}

	// 第一个结果应该是 doc1
	if results[0].Document.ID != "doc1" {
		t.Fatalf("Expected first result to be doc1, got %s", results[0].Document.ID)
	}
}

func TestMemoryVectorClient_BatchOperations(t *testing.T) {
	client := NewMemoryVectorClient()
	ctx := context.Background()

	// 创建集合
	err := client.CreateCollection(ctx, "test_collection", 2)
	if err != nil {
		t.Fatalf("Failed to create collection: %v", err)
	}

	// 批量添加文档
	docs := []*Document{
		{
			ID:         "batch1",
			Collection: "test_collection",
			Content:    "Batch document 1",
			Embedding:  []float32{0.1, 0.2},
		},
		{
			ID:         "batch2",
			Collection: "test_collection",
			Content:    "Batch document 2",
			Embedding:  []float32{0.3, 0.4},
		},
	}

	err = client.BatchAdd(ctx, docs)
	if err != nil {
		t.Fatalf("Failed to batch add documents: %v", err)
	}

	// 验证文档已添加
	for _, doc := range docs {
		retrieved, err := client.GetDocument(ctx, doc.ID)
		if err != nil {
			t.Fatalf("Failed to get document %s: %v", doc.ID, err)
		}
		if retrieved.Content != doc.Content {
			t.Fatalf("Document content mismatch for %s", doc.ID)
		}
	}

	// 批量删除文档
	ids := []string{"batch1", "batch2"}
	err = client.BatchDelete(ctx, ids)
	if err != nil {
		t.Fatalf("Failed to batch delete documents: %v", err)
	}

	// 验证文档已删除
	for _, id := range ids {
		_, err := client.GetDocument(ctx, id)
		if err == nil {
			t.Fatalf("Document %s should have been deleted", id)
		}
	}
}

func TestMemoryVectorClient_CollectionManagement(t *testing.T) {
	client := NewMemoryVectorClient()
	ctx := context.Background()

	// 创建多个集合
	collections := []string{"collection1", "collection2", "collection3"}
	for _, name := range collections {
		err := client.CreateCollection(ctx, name, 128)
		if err != nil {
			t.Fatalf("Failed to create collection %s: %v", name, err)
		}
	}

	// 列出集合
	listed, err := client.ListCollections(ctx)
	if err != nil {
		t.Fatalf("Failed to list collections: %v", err)
	}

	if len(listed) != len(collections) {
		t.Fatalf("Expected %d collections, got %d", len(collections), len(listed))
	}

	// 删除集合
	err = client.DeleteCollection(ctx, "collection2")
	if err != nil {
		t.Fatalf("Failed to delete collection: %v", err)
	}

	// 验证集合已删除
	listed, err = client.ListCollections(ctx)
	if err != nil {
		t.Fatalf("Failed to list collections after deletion: %v", err)
	}

	if len(listed) != len(collections)-1 {
		t.Fatalf("Expected %d collections after deletion, got %d", len(collections)-1, len(listed))
	}
}