package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"backend/internal/pkg/llm"
)

func main() {
	client := llm.NewMockLLMClient()
	
	prompt := `基于以下世界观和人物设定，生成 5 章的小说大纲：

世界观：魔法学院

主要人物：
姓名：艾莉亚，角色：学生，动机：成为强大的魔法师

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
}`
	
	result, err := client.GenerateJSON(context.Background(), prompt, nil)
	if err != nil {
		log.Fatal(err)
	}
	
	// 打印原始结果
	fmt.Println("Raw result:")
	jsonBytes, _ := json.MarshalIndent(result, "", "  ")
	fmt.Println(string(jsonBytes))
	
	// 检查chapters字段
	fmt.Println("\nChecking 'chapters' field:")
	if chaptersData, ok := result["chapters"]; ok {
		fmt.Printf("chapters field exists, type: %T\n", chaptersData)
		if chaptersArray, ok := chaptersData.([]interface{}); ok {
			fmt.Printf("chapters is []interface{} with %d elements\n", len(chaptersArray))
			for i, chapter := range chaptersArray {
				fmt.Printf("Chapter %d type: %T\n", i, chapter)
			}
		} else {
			fmt.Printf("chapters is NOT []interface{}, actual type: %T\n", chaptersData)
		}
	} else {
		fmt.Println("chapters field does NOT exist")
		fmt.Println("Available keys:")
		for key := range result {
			fmt.Printf("  - %s\n", key)
		}
	}
}