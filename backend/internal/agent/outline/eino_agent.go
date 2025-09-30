package outline

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/models"
)

// EinoOutlineAgent 基于 eino 框架的大纲生成 Agent
type EinoOutlineAgent struct {
	client eino.EinoLLMClient
}

// NewEinoOutlineAgent 创建基于 eino 的大纲生成代理
func NewEinoOutlineAgent(client eino.EinoLLMClient) *EinoOutlineAgent {
	return &EinoOutlineAgent{
		client: client,
	}
}

// GenerateOutline 生成章节大纲
func (a *EinoOutlineAgent) GenerateOutline(ctx context.Context, req *GenerateOutlineRequest) (*GenerateOutlineResponse, error) {
	// 构建人物信息
	charactersInfo := make([]string, len(req.Characters))
	for i, char := range req.Characters {
		charactersInfo[i] = fmt.Sprintf("姓名：%s，角色：%s，动机：%s", char.Name, char.Role, char.Motivation)
	}

	prompt := fmt.Sprintf(`
基于以下世界观和人物设定，生成 %d 章的小说大纲：

世界观：%s

主要人物：
%s

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
`, req.ChapterCount, formatWorldView(req.WorldView), joinStrings(charactersInfo, "\n"))

	content, err := a.client.GenerateText(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate outline: %w", err)
	}

	// 解析 JSON 响应
	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(content), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// 解析章节大纲
	chapters := make([]*models.ChapterOutline, 0)
	if chaptersData, ok := jsonResult["chapters"].([]interface{}); ok {
		for _, chapterData := range chaptersData {
			if chapterMap, ok := chapterData.(map[string]interface{}); ok {
				chapter := &models.ChapterOutline{
					Index:          eino.GetIntFromJSON(chapterMap, "index"),
					Title:          eino.GetStringFromJSON(chapterMap, "title"),
					Summary:        eino.GetStringFromJSON(chapterMap, "summary"),
					Goal:           eino.GetStringFromJSON(chapterMap, "goal"),
					TwistHint:      eino.GetStringFromJSON(chapterMap, "twist_hint"),
					ImportantItems: eino.GetStringArrayFromJSON(chapterMap, "important_items"),
				}
				chapters = append(chapters, chapter)
			}
		}
	} else {
		return nil, fmt.Errorf("unexpected JSON structure: missing 'chapters' array")
	}

	outline := &models.Outline{
		ProjectID: req.ProjectID,
		Chapters:  chapters,
	}

	return &GenerateOutlineResponse{
		Outline: outline,
	}, nil
}

// RefineOutline 优化章节大纲
func (a *EinoOutlineAgent) RefineOutline(ctx context.Context, req *RefineOutlineRequest) (*RefineOutlineResponse, error) {
	// 构建当前大纲信息
	outlineInfo := make([]string, len(req.Outline.Chapters))
	for i, chapter := range req.Outline.Chapters {
		outlineInfo[i] = fmt.Sprintf("第%d章：%s - %s（目标：%s）",
			chapter.Index, chapter.Title, chapter.Summary, chapter.Goal)
	}

	prompt := fmt.Sprintf(`
请根据以下反馈优化章节大纲：

当前大纲：
%s

反馈意见：%s

要求：
1. 保持章节数量不变
2. 优化章节间的逻辑连贯性
3. 加强冲突和转折点
4. 确保每章都有明确目标

请以JSON格式返回优化后的大纲，格式与原始格式相同。
`, joinStrings(outlineInfo, "\n"), req.Feedback)

	content, err := a.client.GenerateText(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to refine outline: %w", err)
	}

	// 解析 JSON 响应
	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(content), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// 解析优化后的大纲
	chapters := make([]*models.ChapterOutline, 0)
	if chaptersData, ok := jsonResult["chapters"].([]interface{}); ok {
		for _, chapterData := range chaptersData {
			if chapterMap, ok := chapterData.(map[string]interface{}); ok {
				chapter := &models.ChapterOutline{
					Index:          eino.GetIntFromJSON(chapterMap, "index"),
					Title:          eino.GetStringFromJSON(chapterMap, "title"),
					Summary:        eino.GetStringFromJSON(chapterMap, "summary"),
					Goal:           eino.GetStringFromJSON(chapterMap, "goal"),
					TwistHint:      eino.GetStringFromJSON(chapterMap, "twist_hint"),
					ImportantItems: eino.GetStringArrayFromJSON(chapterMap, "important_items"),
				}
				chapters = append(chapters, chapter)
			}
		}
	} else {
		return nil, fmt.Errorf("unexpected JSON structure: missing 'chapters' array")
	}

	outline := &models.Outline{
		ID:        req.Outline.ID,
		ProjectID: req.Outline.ProjectID,
		Chapters:  chapters,
	}

	return &RefineOutlineResponse{
		Outline: outline,
	}, nil
}

// ValidateOutline 验证大纲的合理性
func (a *EinoOutlineAgent) ValidateOutline(ctx context.Context, req *ValidateOutlineRequest) (*ValidateOutlineResponse, error) {
	// 构建大纲信息
	outlineInfo := make([]string, len(req.Outline.Chapters))
	for i, chapter := range req.Outline.Chapters {
		outlineInfo[i] = fmt.Sprintf("第%d章：%s - %s", chapter.Index, chapter.Title, chapter.Summary)
	}

	// 构建人物信息
	charactersInfo := make([]string, len(req.Characters))
	for i, char := range req.Characters {
		charactersInfo[i] = fmt.Sprintf("%s（%s）", char.Name, char.Role)
	}

	prompt := fmt.Sprintf(`
请验证以下章节大纲是否合理：

世界观：%s

主要人物：%s

章节大纲：
%s

请检查：
1. 章节逻辑是否连贯
2. 人物发展是否合理
3. 冲突设置是否恰当
4. 节奏把控是否得当
5. 是否符合世界观设定

请以JSON格式返回验证结果：
{
  "is_valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}
`, formatWorldView(req.WorldView), joinStrings(charactersInfo, "、"), joinStrings(outlineInfo, "\n"))

	content, err := a.client.GenerateText(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to validate outline: %w", err)
	}

	// 解析 JSON 响应
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	return &ValidateOutlineResponse{
		IsValid:     eino.GetBoolFromJSON(result, "is_valid"),
		Issues:      eino.GetStringArrayFromJSON(result, "issues"),
		Suggestions: eino.GetStringArrayFromJSON(result, "suggestions"),
	}, nil
}

// GetCapabilities 返回代理能力描述
func (a *EinoOutlineAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "EinoOutlineAgent",
		"type":        "outline_generation",
		"description": "基于 eino 框架的大纲生成代理，负责生成、优化和验证小说章节大纲",
		"capabilities": []string{
			"generate_outline",
			"refine_outline",
			"validate_outline",
		},
	}
}