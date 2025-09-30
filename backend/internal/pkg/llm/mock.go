package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"
)

// MockLLMClient 模拟 LLM 客户端，用于测试和开发
type MockLLMClient struct {
	delay time.Duration
}

// NewMockLLMClient 创建模拟 LLM 客户端
func NewMockLLMClient() LLMClient {
	return &MockLLMClient{
		delay: 100 * time.Millisecond, // 模拟网络延迟
	}
}

// GenerateText 生成文本
func (m *MockLLMClient) GenerateText(ctx context.Context, prompt string, opts *GenerateOptions) (string, error) {
	// 模拟延迟
	time.Sleep(m.delay)
	
	// 根据提示词返回模拟响应
	if contains(prompt, "世界观") || contains(prompt, "world") {
		return "这是一个充满魔法的奇幻世界，古老的魔法学院坐落在云端之上...", nil
	}
	
	if contains(prompt, "人物") || contains(prompt, "character") {
		return "主角是一位年轻的魔法师学徒，拥有罕见的时间魔法天赋...", nil
	}
	
	if contains(prompt, "大纲") || contains(prompt, "outline") {
		return "第一章：初入学院\n第二章：神秘的导师\n第三章：禁忌的魔法...", nil
	}
	
	if contains(prompt, "章节") || contains(prompt, "chapter") {
		return generateMockChapter(), nil
	}
	
	return "这是一个模拟的 LLM 响应。", nil
}

// GenerateWithTemplate 使用模板生成文本
func (m *MockLLMClient) GenerateWithTemplate(ctx context.Context, template string, data map[string]interface{}, opts *GenerateOptions) (string, error) {
	// 模拟延迟
	time.Sleep(m.delay)
	
	// 简单的模板替换
	result := template
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = replaceAll(result, placeholder, fmt.Sprintf("%v", value))
	}
	
	return result, nil
}

// GenerateJSON 生成 JSON 格式响应
func (m *MockLLMClient) GenerateJSON(ctx context.Context, prompt string, opts *GenerateOptions) (map[string]interface{}, error) {
	// 模拟延迟
	time.Sleep(m.delay)
	
	// 根据提示词返回不同的 JSON 响应
	if contains(prompt, "大纲") || contains(prompt, "章") || contains(prompt, "outline") || contains(prompt, "chapter") {
		return map[string]interface{}{
			"title": "魔法学院传说",
			"chapters": []interface{}{
				map[string]interface{}{
					"index":   1,
					"title":   "初入学院",
					"summary": "艾莉亚第一次踏入魔法学院，遇到了各种奇异的魔法现象",
					"goal":    "介绍世界观和主角",
					"twist_hint": "发现自己拥有罕见的时间魔法天赋",
					"important_items": []interface{}{"入学通知书", "时间魔法水晶"},
				},
				map[string]interface{}{
					"index":   2,
					"title":   "神秘的导师",
					"summary": "遇到了神秘的时间魔法导师，开始学习基础魔法理论",
					"goal":    "建立师生关系，揭示主角天赋",
					"twist_hint": "导师似乎隐藏着什么秘密",
					"important_items": []interface{}{"古老的魔法书", "导师的徽章"},
				},
				map[string]interface{}{
					"index":   3,
					"title":   "禁忌的魔法",
					"summary": "意外发现了被禁止的时间魔法书籍，引发了危险的魔法实验",
					"goal":    "推进情节，增加冲突",
					"twist_hint": "时间魔法实验失控，影响了整个学院",
					"important_items": []interface{}{"禁忌魔法书", "时间裂缝"},
				},
				map[string]interface{}{
					"index":   4,
					"title":   "真相大白",
					"summary": "揭开学院隐藏的秘密，发现时间魔法的真正力量和危险",
					"goal":    "高潮部分，揭示核心秘密",
					"twist_hint": "学院的创立者就是时间魔法的始祖",
					"important_items": []interface{}{"创始人的日记", "时间之心"},
				},
				map[string]interface{}{
					"index":   5,
					"title":   "新的开始",
					"summary": "经历考验后，艾莉亚成长为真正的魔法师，准备面对更大的挑战",
					"goal":    "结局，角色成长完成",
					"twist_hint": "新的威胁正在逼近学院",
					"important_items": []interface{}{"毕业证书", "新的使命"},
				},
			},
		}, nil
	}
	
	if contains(prompt, "世界观") || contains(prompt, "world") {
		return map[string]interface{}{
			"title":    "魔法学院传说",
			"synopsis": "一个关于魔法学院的奇幻故事",
			"setting":  "云端之上的古老魔法学院",
			"rules":    []string{"魔法需要咒语", "时间魔法极其罕见", "学院有严格的等级制度"},
			"tone_examples": []string{"神秘", "冒险", "成长"},
			"themes":   []string{"友谊", "勇气", "自我发现"},
		}, nil
	}
	
	if contains(prompt, "人物") || contains(prompt, "character") {
		return map[string]interface{}{
			"characters": []map[string]interface{}{
				{
					"name":        "艾莉亚",
					"role":        "主角",
					"age":         16,
					"appearance":  "银色长发，紫色眼眸",
					"background":  "来自普通家庭的魔法师学徒",
					"motivation":  "掌握时间魔法，保护朋友",
					"flaws":       []string{"过于冲动", "不善表达"},
					"speech_tone": "直率但温暖",
					"secrets":     []string{"拥有罕见的时间魔法天赋"},
					"relationship_map": map[string]string{
						"导师": "师生关系",
						"同窗": "好友",
					},
				},
			},
		}, nil
	}
	
	// 默认响应
	return map[string]interface{}{
		"content": "这是一个模拟的 JSON 响应",
		"status":  "success",
	}, nil
}

// GenerateStream 流式生成文本
func (m *MockLLMClient) GenerateStream(ctx context.Context, prompt string, opts *GenerateOptions, callback func(string)) error {
	// 模拟流式响应
	text := "这是一个模拟的流式响应。"
	words := splitWords(text)
	
	for _, word := range words {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			time.Sleep(50 * time.Millisecond) // 模拟流式延迟
			callback(word + " ")
		}
	}
	
	return nil
}

// ValidateJSON 验证 JSON 格式
func (m *MockLLMClient) ValidateJSON(ctx context.Context, jsonStr string) (bool, error) {
	var result interface{}
	err := json.Unmarshal([]byte(jsonStr), &result)
	return err == nil, err
}

// GetModelInfo 获取模型信息
func (m *MockLLMClient) GetModelInfo() string {
	return "mock-llm-v1"
}

// 辅助函数
func contains(text, substr string) bool {
	return len(text) >= len(substr) && findSubstring(text, substr) != -1
}

func findSubstring(text, substr string) int {
	for i := 0; i <= len(text)-len(substr); i++ {
		if text[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

func replaceAll(text, old, new string) string {
	result := ""
	for i := 0; i < len(text); {
		if i <= len(text)-len(old) && text[i:i+len(old)] == old {
			result += new
			i += len(old)
		} else {
			result += string(text[i])
			i++
		}
	}
	return result
}

func splitWords(text string) []string {
	words := []string{}
	current := ""
	
	for _, char := range text {
		if char == ' ' || char == '\n' || char == '\t' {
			if current != "" {
				words = append(words, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	
	if current != "" {
		words = append(words, current)
	}
	
	return words
}

func generateMockChapter() string {
	chapters := []string{
		"艾莉亚站在魔法学院的大门前，心中既兴奋又紧张。这座云端之上的学院比她想象中更加宏伟...",
		"导师的办公室里弥漫着古老魔法的气息，墙上的时钟发出奇异的滴答声...",
		"在图书馆的深处，艾莉亚发现了一本关于时间魔法的禁书...",
		"月圆之夜，学院里发生了奇怪的事件，时间似乎开始倒流...",
	}
	
	return chapters[rand.Intn(len(chapters))]
}