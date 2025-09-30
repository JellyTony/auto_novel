package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"backend/internal/pkg/llm"
)

func main() {
	// 创建 Mock LLM 客户端
	mockLLM := llm.NewMockLLMClient()

	// 模拟 OutlineAgent 的实际调用
	prompt := `
基于以下世界观和人物设定，生成 5 章的小说大纲：

世界观：

主要人物：


要求：
1. 每章都要有明确的剧情目标
2. 章节之间要有逻辑连贯性
3. 包含适当的冲突和转折点
4. 符合小说的整体节奏
5. 每章1-3句概要，突出关键情节

请以JSON格式返回，格式为：
{
  "chapters": [
    {
      "index": 1,
      "title": "章节标题",
      "summary": "章节概要",
      "goal": "剧情目标",
      "twist_hint": "冲突/转折点",
      "important_items": ["关键道具1", "关键线索2"]
    }
  ]
}
`

	// 调用 GenerateJSON 方法（这是 OutlineAgent 实际使用的方法）
	result, err := mockLLM.GenerateJSON(context.Background(), prompt, nil)
	if err != nil {
		log.Fatalf("GenerateJSON failed: %v", err)
	}

	// 检查返回的结果
	fmt.Printf("Raw result type: %T\n", result)
	fmt.Printf("Raw result: %+v\n", result)

	// 检查是否有 chapters 字段
	if chaptersData, ok := result["chapters"]; ok {
		fmt.Printf("Found 'chapters' field, type: %T\n", chaptersData)
		if chapters, ok := chaptersData.([]interface{}); ok {
			fmt.Printf("Chapters array length: %d\n", len(chapters))
			for i, chapter := range chapters {
				fmt.Printf("Chapter %d type: %T\n", i, chapter)
				if chapterMap, ok := chapter.(map[string]interface{}); ok {
					fmt.Printf("Chapter %d: %+v\n", i, chapterMap)
				}
			}
		} else {
			fmt.Printf("Chapters is not []interface{}, actual type: %T\n", chaptersData)
		}
	} else {
		fmt.Println("ERROR: 'chapters' field not found in result")
		// 打印所有可用的字段
		fmt.Println("Available fields:")
		for key, value := range result {
			fmt.Printf("  %s: %T = %v\n", key, value, value)
		}
	}

	// 将结果转换为 JSON 字符串以便查看
	jsonBytes, _ := json.MarshalIndent(result, "", "  ")
	fmt.Printf("JSON result:\n%s\n", string(jsonBytes))
}