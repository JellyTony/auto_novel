package worldbuilding

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/models"
	"github.com/cloudwego/eino/components/model"
)

// EinoWorldBuildingAgent 基于 eino 框架的世界观设定 Agent
type EinoWorldBuildingAgent struct {
	client *eino.EinoLLMClient
}

// NewEinoWorldBuildingAgent 创建基于 eino 的世界观设定 Agent
func NewEinoWorldBuildingAgent(client *eino.EinoLLMClient) *EinoWorldBuildingAgent {
	return &EinoWorldBuildingAgent{
		client: client,
	}
}

// GenerateWorldView 生成世界观设定
func (a *EinoWorldBuildingAgent) GenerateWorldView(ctx context.Context, req *GenerateWorldViewRequest) (*models.WorldView, error) {
	// 构建提示词
	prompt := fmt.Sprintf(`你是一个专业的小说世界观设定专家。请根据用户提供的体裁、目标读者和基调，生成一个完整的世界观设定。

体裁：%s
目标读者：%s
基调：%s

请返回 JSON 格式的世界观设定，包含以下字段：
{
  "title": "世界观标题",
  "synopsis": "世界观简介（200-300字）",
  "setting": "详细设定描述（500-800字）",
  "rules": ["世界规则1", "世界规则2", "世界规则3"],
  "tone_examples": ["风格示例1", "风格示例2"],
  "themes": ["主题1", "主题2", "主题3"]
}

请确保世界观设定与体裁和基调相符，适合目标读者群体。`, req.Genre, req.Audience, req.Tone)

	// 生成响应
	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.7))
	if err != nil {
		return nil, fmt.Errorf("failed to generate world view: %w", err)
	}

	// 解析 JSON 响应
	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse world view JSON: %w", err)
	}

	// 转换为 WorldView 模型
	worldView := &models.WorldView{
		ProjectID:    req.ProjectID,
		Title:        getStringFromJSON(jsonResult, "title"),
		Synopsis:     getStringFromJSON(jsonResult, "synopsis"),
		Setting:      getStringFromJSON(jsonResult, "setting"),
		KeyRules:     getStringArrayFromJSON(jsonResult, "rules"),
		ToneExamples: getStringArrayFromJSON(jsonResult, "tone_examples"),
		Themes:       getStringArrayFromJSON(jsonResult, "themes"),
	}

	return worldView, nil
}

// RefineWorldView 优化世界观设定
func (a *EinoWorldBuildingAgent) RefineWorldView(ctx context.Context, worldView *models.WorldView, feedback string) (*models.WorldView, error) {
	prompt := fmt.Sprintf(`你是一个专业的小说世界观设定专家。请根据用户的反馈优化现有的世界观设定。

当前世界观：
标题：%s
简介：%s
设定：%s
规则：%v
风格示例：%v
主题：%v

优化反馈：%s

请返回优化后的 JSON 格式世界观设定：
{
  "title": "世界观标题",
  "synopsis": "世界观简介",
  "setting": "详细设定描述",
  "rules": ["世界规则1", "世界规则2"],
  "tone_examples": ["风格示例1", "风格示例2"],
  "themes": ["主题1", "主题2"]
}

请保持世界观的核心特色，同时根据反馈进行合理的调整和优化。`,
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.ToneExamples, worldView.Themes, feedback)

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.6))
	if err != nil {
		return nil, fmt.Errorf("failed to refine world view: %w", err)
	}

	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse refined world view JSON: %w", err)
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
func (a *EinoWorldBuildingAgent) ValidateWorldView(ctx context.Context, worldView *models.WorldView) (*ValidationResult, error) {
	prompt := fmt.Sprintf(`你是一个专业的小说世界观设定评估专家。请验证世界观设定的完整性和合理性。

标题：%s
简介：%s
设定：%s
规则：%v
风格示例：%v
主题：%v

请从以下维度进行评估：
1. 完整性：是否包含必要的世界观要素
2. 一致性：各部分是否逻辑一致
3. 可操作性：是否为后续创作提供足够指导
4. 创新性：是否有独特的创意元素

请返回 JSON 格式的验证结果：
{
  "is_valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "completeness_score": 85
}

完整性评分范围：0-100分`,
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.ToneExamples, worldView.Themes)

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.3))
	if err != nil {
		return nil, fmt.Errorf("failed to validate world view: %w", err)
	}

	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse validation result JSON: %w", err)
	}

	result := &ValidationResult{
		IsValid:           getBoolFromJSON(jsonResult, "is_valid"),
		Issues:            getStringArrayFromJSON(jsonResult, "issues"),
		Suggestions:       getStringArrayFromJSON(jsonResult, "suggestions"),
		CompletenessScore: getIntFromJSON(jsonResult, "completeness_score"),
	}

	return result, nil
}

// GetCapabilities 获取 Agent 能力描述
func (a *EinoWorldBuildingAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "EinoWorldBuildingAgent",
		"description": "基于 eino 框架的世界观设定 Agent",
		"capabilities": []string{
			"generate_world_view",
			"refine_world_view",
			"validate_world_view",
		},
		"supported_genres": []string{
			"fantasy", "sci-fi", "romance", "mystery", "historical", "contemporary",
		},
	}
}