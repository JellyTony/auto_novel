package worldbuilding

import (
	"context"
	"fmt"
	"log"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// WorldBuildingAgent 世界观设定 Agent
type WorldBuildingAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
}

// NewWorldBuildingAgent 创建世界观设定 Agent
func NewWorldBuildingAgent(llmClient llm.LLMClient) *WorldBuildingAgent {
	return &WorldBuildingAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// GenerateWorldView 生成世界观设定
func (a *WorldBuildingAgent) GenerateWorldView(ctx context.Context, req *GenerateWorldViewRequest) (*models.WorldView, error) {
	log.Printf("Starting world view generation for project: %s", req.ProjectID)
	
	// 构建提示词数据
	data := map[string]interface{}{
		"genre":     req.Genre,
		"setting":   req.Setting,
		"key_rules": req.KeyRules,
		"audience":  req.Audience,
		"tone":      req.Tone,
		"themes":    req.Themes,
	}

	log.Printf("Template data: %+v", data)

	// 使用模板生成提示词
	prompt := a.templates.WorldBuildingPrompt()
	log.Printf("Template prompt: %s", prompt)
	
	// 使用模板生成 JSON 响应
	finalPrompt, err := a.llmClient.GenerateWithTemplate(ctx, prompt, data, llm.PreciseOptions())
	if err != nil {
		log.Printf("Failed to generate prompt: %v", err)
		return nil, fmt.Errorf("failed to generate prompt: %w", err)
	}

	log.Printf("Final prompt: %s", finalPrompt)

	// 生成 JSON 响应
	jsonResult, err := a.llmClient.GenerateJSON(ctx, finalPrompt, llm.PreciseOptions())
	if err != nil {
		log.Printf("Failed to generate JSON: %v", err)
		return nil, fmt.Errorf("failed to generate world view JSON: %w", err)
	}

	log.Printf("JSON result: %+v", jsonResult)

	// 转换为 WorldView 模型
	worldView := &models.WorldView{
		ProjectID: req.ProjectID,
		Title:     getStringFromJSON(jsonResult, "title"),
		Synopsis:  getStringFromJSON(jsonResult, "synopsis"),
		Setting:   getStringFromJSON(jsonResult, "setting"),
		KeyRules:  getStringArrayFromJSON(jsonResult, "rules"),
		ToneExamples: getStringArrayFromJSON(jsonResult, "tone_examples"),
		Themes:    getStringArrayFromJSON(jsonResult, "themes"),
	}

	log.Printf("Generated world view: %+v", worldView)

	return worldView, nil
}

// RefineWorldView 优化世界观设定
func (a *WorldBuildingAgent) RefineWorldView(ctx context.Context, worldView *models.WorldView, feedback string) (*models.WorldView, error) {
	prompt := fmt.Sprintf(`请根据以下反馈优化世界观设定：

当前世界观：
标题：%s
简介：%s
设定：%s
规则：%v
风格示例：%v
主题：%v

优化反馈：%s

请返回优化后的世界观 JSON 格式：
{"title":"","synopsis":"","setting":"","rules":[],"tone_examples":["",""],"themes":[""]}`,
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.ToneExamples, worldView.Themes, feedback)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, llm.PreciseOptions())
	if err != nil {
		return nil, fmt.Errorf("failed to refine world view: %w", err)
	}

	// 更新世界观
	worldView.Title = getStringFromJSON(jsonResult, "title")
	worldView.Synopsis = getStringFromJSON(jsonResult, "synopsis")
	worldView.Setting = getStringFromJSON(jsonResult, "setting")
	worldView.KeyRules = getStringArrayFromJSON(jsonResult, "rules")
	worldView.ToneExamples = getStringArrayFromJSON(jsonResult, "tone_examples")
	worldView.Themes = getStringArrayFromJSON(jsonResult, "themes")

	return worldView, nil
}

// ValidateWorldView 验证世界观设定的完整性
func (a *WorldBuildingAgent) ValidateWorldView(ctx context.Context, worldView *models.WorldView) (*ValidationResult, error) {
	prompt := fmt.Sprintf(`请验证以下世界观设定的完整性和合理性：

标题：%s
简介：%s
设定：%s
规则：%v
风格示例：%v
主题：%v

请返回验证结果 JSON：
{"is_valid":true,"issues":[],"suggestions":[],"completeness_score":0}

评估标准：
1. 世界观是否完整且逻辑自洽
2. 规则设定是否清晰可执行
3. 风格示例是否符合主题调性
4. 是否有明显的矛盾或缺失
5. 给出1-10分的完整性评分`,
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.ToneExamples, worldView.Themes)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, llm.PreciseOptions())
	if err != nil {
		return nil, fmt.Errorf("failed to validate world view: %w", err)
	}

	result := &ValidationResult{
		IsValid:           getBoolFromJSON(jsonResult, "is_valid"),
		Issues:           getStringArrayFromJSON(jsonResult, "issues"),
		Suggestions:      getStringArrayFromJSON(jsonResult, "suggestions"),
		CompletenessScore: getIntFromJSON(jsonResult, "completeness_score"),
	}

	return result, nil
}

// GenerateWorldViewRequest 生成世界观请求
type GenerateWorldViewRequest struct {
	ProjectID string   `json:"project_id"`
	Genre     string   `json:"genre"`     // 体裁
	Setting   string   `json:"setting"`   // 时代与地点
	KeyRules  []string `json:"key_rules"` // 基本规则/设定
	Tone      string   `json:"tone"`      // 基调
	Audience  string   `json:"audience"`  // 目标读者
	Themes    []string `json:"themes"`    // 主题
}

// ValidationResult 验证结果
type ValidationResult struct {
	IsValid           bool     `json:"is_valid"`
	Issues           []string `json:"issues"`
	Suggestions      []string `json:"suggestions"`
	CompletenessScore int      `json:"completeness_score"`
}

// 辅助函数：从 JSON 中获取字符串
func getStringFromJSON(data map[string]interface{}, key string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// 辅助函数：从 JSON 中获取字符串数组
func getStringArrayFromJSON(data map[string]interface{}, key string) []string {
	if val, ok := data[key]; ok {
		if arr, ok := val.([]interface{}); ok {
			result := make([]string, 0, len(arr))
			for _, item := range arr {
				if str, ok := item.(string); ok {
					result = append(result, str)
				}
			}
			return result
		}
	}
	return []string{}
}

// 辅助函数：从 JSON 中获取布尔值
func getBoolFromJSON(data map[string]interface{}, key string) bool {
	if val, ok := data[key]; ok {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}

// 辅助函数：从 JSON 中获取整数
func getIntFromJSON(data map[string]interface{}, key string) int {
	if val, ok := data[key]; ok {
		if f, ok := val.(float64); ok {
			return int(f)
		}
		if i, ok := val.(int); ok {
			return i
		}
	}
	return 0
}

// GetCapabilities 获取 Agent 能力描述
func (a *WorldBuildingAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name": "WorldBuildingAgent",
		"type": "agent",
		"description": "负责生成和优化小说世界观设定",
		"capabilities": []string{
			"generate_world_view",
			"refine_world_view", 
			"validate_world_view",
		},
	}
}