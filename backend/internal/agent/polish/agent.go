package polish

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// 请求和响应结构
type PolishChapterRequest struct {
	Chapter *models.Chapter      `json:"chapter"`
	Style   string               `json:"style"`   // 润色风格：formal/casual/literary
	Focus   []string             `json:"focus"`   // 重点关注：grammar/flow/dialogue/description
	Options *llm.GenerateOptions `json:"options"`
}

type PolishChapterResponse struct {
	Chapter *models.Chapter `json:"chapter"`
}

type ProofreadRequest struct {
	Content string               `json:"content"`
	Options *llm.GenerateOptions `json:"options"`
}

type ProofreadResponse struct {
	CorrectedContent string   `json:"corrected_content"`
	Issues           []string `json:"issues"`
	Suggestions      []string `json:"suggestions"`
}

type StyleAdjustRequest struct {
	Content     string               `json:"content"`
	TargetStyle string               `json:"target_style"`
	Examples    []string             `json:"examples"`
	Options     *llm.GenerateOptions `json:"options"`
}

type StyleAdjustResponse struct {
	AdjustedContent string `json:"adjusted_content"`
}

// PolishAgent 润色校对 Agent
type PolishAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
}

// NewPolishAgent 创建润色代理
func NewPolishAgent(llmClient llm.LLMClient) *PolishAgent {
	return &PolishAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// PolishChapter 润色章节内容
func (a *PolishAgent) PolishChapter(ctx context.Context, req *PolishChapterRequest) (*PolishChapterResponse, error) {
	focusAreas := joinStrings(req.Focus, "、")
	if focusAreas == "" {
		focusAreas = "语法、流畅度、对话、描写"
	}

	prompt := fmt.Sprintf(`
请对以下章节进行润色，重点关注：%s

章节标题：%s
原始内容：
%s

润色要求：
1. 风格：%s
2. 保持原意不变
3. 提升文字表达质量
4. 确保语法正确
5. 增强可读性
6. 保持人物性格一致
7. 优化对话的自然度
8. 丰富场景描写

请返回润色后的完整章节内容，不要包含任何格式标记或说明。
`, focusAreas, req.Chapter.Title, req.Chapter.RawContent, req.Style)

	polishedContent, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to polish chapter: %w", err)
	}

	// 更新章节
	chapter := &models.Chapter{
		ID:              req.Chapter.ID,
		ProjectID:       req.Chapter.ProjectID,
		Index:           req.Chapter.Index,
		Title:           req.Chapter.Title,
		RawContent:      req.Chapter.RawContent,
		PolishedContent: polishedContent,
		Summary:         req.Chapter.Summary,
		WordCount:       len([]rune(strings.ReplaceAll(polishedContent, " ", ""))),
		Status:          "polished",
	}

	return &PolishChapterResponse{
		Chapter: chapter,
	}, nil
}

// ProofreadContent 校对内容
func (a *PolishAgent) ProofreadContent(ctx context.Context, req *ProofreadRequest) (*ProofreadResponse, error) {
	prompt := fmt.Sprintf(`
请校对以下内容，找出并修正错误：

内容：
%s

请检查：
1. 语法错误
2. 标点符号
3. 错别字
4. 语句通顺度
5. 逻辑连贯性

请以JSON格式返回结果：
{
  "corrected_content": "修正后的内容",
  "issues": ["发现的问题1", "发现的问题2"],
  "suggestions": ["改进建议1", "改进建议2"]
}
`, req.Content)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to proofread content: %w", err)
	}

	return &ProofreadResponse{
		CorrectedContent: getStringFromJSON(jsonResult, "corrected_content"),
		Issues:           getStringArrayFromJSON(jsonResult, "issues"),
		Suggestions:      getStringArrayFromJSON(jsonResult, "suggestions"),
	}, nil
}

// AdjustStyle 调整文本风格
func (a *PolishAgent) AdjustStyle(ctx context.Context, req *StyleAdjustRequest) (*StyleAdjustResponse, error) {
	examplesText := ""
	if len(req.Examples) > 0 {
		examplesText = fmt.Sprintf("\n\n风格参考示例：\n%s", joinStrings(req.Examples, "\n\n"))
	}

	prompt := fmt.Sprintf(`
请将以下内容调整为 %s 风格：

原始内容：
%s%s

要求：
1. 保持原意不变
2. 调整语言风格和表达方式
3. 确保风格统一
4. 保持内容的完整性

请返回调整后的内容。
`, req.TargetStyle, req.Content, examplesText)

	adjustedContent, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to adjust style: %w", err)
	}

	return &StyleAdjustResponse{
		AdjustedContent: adjustedContent,
	}, nil
}

// OptimizeDialogue 优化对话
func (a *PolishAgent) OptimizeDialogue(ctx context.Context, content string, characters []*models.Character) (string, error) {
	// 构建人物信息
	charactersInfo := make([]string, len(characters))
	for i, char := range characters {
		charactersInfo[i] = fmt.Sprintf("%s：%s（说话风格：%s）",
			char.Name, char.Role, char.SpeechTone)
	}

	prompt := fmt.Sprintf(`
请优化以下内容中的对话部分，确保符合人物性格：

人物设定：
%s

内容：
%s

优化要求：
1. 对话要符合人物性格和说话风格
2. 对话要自然流畅
3. 避免重复和冗余
4. 增强对话的表现力
5. 保持剧情推进作用

请返回优化后的完整内容。
`, joinStrings(charactersInfo, "\n"), content)

	optimizedContent, err := a.llmClient.GenerateText(ctx, prompt, llm.CreativeOptions())
	if err != nil {
		return "", fmt.Errorf("failed to optimize dialogue: %w", err)
	}

	return optimizedContent, nil
}

// EnhanceDescription 增强描写
func (a *PolishAgent) EnhanceDescription(ctx context.Context, content string, focus string) (string, error) {
	prompt := fmt.Sprintf(`
请增强以下内容的描写部分，重点关注：%s

内容：
%s

增强要求：
1. 丰富感官描写
2. 增强画面感
3. 营造氛围
4. 保持适度，不过度渲染
5. 与剧情节奏协调

请返回增强后的内容。
`, focus, content)

	enhancedContent, err := a.llmClient.GenerateText(ctx, prompt, llm.CreativeOptions())
	if err != nil {
		return "", fmt.Errorf("failed to enhance description: %w", err)
	}

	return enhancedContent, nil
}

// GetCapabilities 返回代理能力描述
func (a *PolishAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "PolishAgent",
		"type":        "content_polish",
		"description": "负责润色、校对和优化小说内容",
		"capabilities": []string{
			"polish_chapter",
			"proofread_content",
			"adjust_style",
			"optimize_dialogue",
			"enhance_description",
		},
	}
}

// 辅助函数
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