package outline

import (
	"context"
	"fmt"
	"strconv"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// 请求和响应结构
type GenerateOutlineRequest struct {
	ProjectID   string               `json:"project_id"`
	WorldView   *models.WorldView    `json:"world_view"`
	Characters  []*models.Character  `json:"characters"`
	ChapterCount int                 `json:"chapter_count"`
	Options     *llm.GenerateOptions `json:"options"`
}

type GenerateOutlineResponse struct {
	Outline *models.Outline `json:"outline"`
}

type RefineOutlineRequest struct {
	Outline  *models.Outline      `json:"outline"`
	Feedback string               `json:"feedback"`
	Options  *llm.GenerateOptions `json:"options"`
}

type RefineOutlineResponse struct {
	Outline *models.Outline `json:"outline"`
}

type ValidateOutlineRequest struct {
	Outline    *models.Outline      `json:"outline"`
	WorldView  *models.WorldView    `json:"world_view"`
	Characters []*models.Character  `json:"characters"`
	Options    *llm.GenerateOptions `json:"options"`
}

type ValidateOutlineResponse struct {
	IsValid     bool     `json:"is_valid"`
	Issues      []string `json:"issues"`
	Suggestions []string `json:"suggestions"`
}

// OutlineAgent 章节大纲生成 Agent
type OutlineAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
}

// NewOutlineAgent 创建大纲生成代理
func NewOutlineAgent(llmClient llm.LLMClient) *OutlineAgent {
	return &OutlineAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// GenerateOutline 生成章节大纲
func (a *OutlineAgent) GenerateOutline(ctx context.Context, req *GenerateOutlineRequest) (*GenerateOutlineResponse, error) {
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

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to generate outline: %w", err)
	}

	// 解析章节大纲
	chapters := make([]*models.ChapterOutline, 0)
	if chaptersData, ok := jsonResult["chapters"].([]interface{}); ok {
		for _, chapterData := range chaptersData {
			if chapterMap, ok := chapterData.(map[string]interface{}); ok {
				chapter := &models.ChapterOutline{
					Index:          getIntFromJSON(chapterMap, "index"),
					Title:          getStringFromJSON(chapterMap, "title"),
					Summary:        getStringFromJSON(chapterMap, "summary"),
					Goal:           getStringFromJSON(chapterMap, "goal"),
					TwistHint:      getStringFromJSON(chapterMap, "twist_hint"),
					ImportantItems: getStringArrayFromJSON(chapterMap, "important_items"),
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
func (a *OutlineAgent) RefineOutline(ctx context.Context, req *RefineOutlineRequest) (*RefineOutlineResponse, error) {
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

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to refine outline: %w", err)
	}

	// 解析优化后的大纲
	chapters := make([]*models.ChapterOutline, 0)
	if chaptersData, ok := jsonResult["chapters"].([]interface{}); ok {
		for _, chapterData := range chaptersData {
			if chapterMap, ok := chapterData.(map[string]interface{}); ok {
				chapter := &models.ChapterOutline{
					Index:          getIntFromJSON(chapterMap, "index"),
					Title:          getStringFromJSON(chapterMap, "title"),
					Summary:        getStringFromJSON(chapterMap, "summary"),
					Goal:           getStringFromJSON(chapterMap, "goal"),
					TwistHint:      getStringFromJSON(chapterMap, "twist_hint"),
					ImportantItems: getStringArrayFromJSON(chapterMap, "important_items"),
				}
				chapters = append(chapters, chapter)
			}
		}
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
func (a *OutlineAgent) ValidateOutline(ctx context.Context, req *ValidateOutlineRequest) (*ValidateOutlineResponse, error) {
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

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to validate outline: %w", err)
	}

	return &ValidateOutlineResponse{
		IsValid:     getBoolFromJSON(jsonResult, "is_valid"),
		Issues:      getStringArrayFromJSON(jsonResult, "issues"),
		Suggestions: getStringArrayFromJSON(jsonResult, "suggestions"),
	}, nil
}

// GetCapabilities 返回代理能力描述
func (a *OutlineAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "OutlineAgent",
		"type":        "outline_generation",
		"description": "负责生成、优化和验证小说章节大纲",
		"capabilities": []string{
			"generate_outline",
			"refine_outline",
			"validate_outline",
		},
	}
}

// 辅助函数
func formatWorldView(worldView *models.WorldView) string {
	return fmt.Sprintf("标题：%s\n简介：%s\n设定：%s\n规则：%v\n主题：%v",
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.Themes)
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, str := range strs {
		if i > 0 {
			result += sep
		}
		result += str
	}
	return result
}

func getStringFromJSON(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

func getIntFromJSON(data map[string]interface{}, key string) int {
	if val, ok := data[key].(float64); ok {
		return int(val)
	}
	if val, ok := data[key].(string); ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return 0
}

func getBoolFromJSON(data map[string]interface{}, key string) bool {
	if val, ok := data[key].(bool); ok {
		return val
	}
	return false
}

func getStringArrayFromJSON(data map[string]interface{}, key string) []string {
	if val, ok := data[key].([]interface{}); ok {
		result := make([]string, len(val))
		for i, v := range val {
			if str, ok := v.(string); ok {
				result[i] = str
			}
		}
		return result
	}
	return []string{}
}