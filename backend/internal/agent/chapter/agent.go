package chapter

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// 请求和响应结构
type GenerateChapterRequest struct {
	ProjectID       string                    `json:"project_id"`
	ChapterOutline  *models.ChapterOutline    `json:"chapter_outline"`
	Context         *models.GenerationContext `json:"context"`
	TargetWordCount int                       `json:"target_word_count"`
	Options         *llm.GenerateOptions      `json:"options"`
}

type GenerateChapterResponse struct {
	Chapter *models.Chapter `json:"chapter"`
}

type RefineChapterRequest struct {
	Chapter  *models.Chapter      `json:"chapter"`
	Feedback string               `json:"feedback"`
	Options  *llm.GenerateOptions `json:"options"`
}

type RefineChapterResponse struct {
	Chapter *models.Chapter `json:"chapter"`
}

type ExpandChapterRequest struct {
	Chapter         *models.Chapter      `json:"chapter"`
	TargetWordCount int                  `json:"target_word_count"`
	Options         *llm.GenerateOptions `json:"options"`
}

type ExpandChapterResponse struct {
	Chapter *models.Chapter `json:"chapter"`
}

// ChapterAgent 章节生成 Agent
type ChapterAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
}

// NewChapterAgent 创建章节生成代理
func NewChapterAgent(llmClient llm.LLMClient) *ChapterAgent {
	return &ChapterAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// GenerateChapter 生成章节内容
func (a *ChapterAgent) GenerateChapter(ctx context.Context, req *GenerateChapterRequest) (*GenerateChapterResponse, error) {
	// 构建人物信息
	charactersInfo := make([]string, len(req.Context.Characters))
	for i, char := range req.Context.Characters {
		charactersInfo[i] = fmt.Sprintf("姓名：%s，角色：%s，性格：%v，说话风格：%s",
			char.Name, char.Role, char.Flaws, char.SpeechTone)
	}

	// 构建时间线信息
	timelineInfo := make([]string, len(req.Context.Timeline))
	for i, event := range req.Context.Timeline {
		timelineInfo[i] = fmt.Sprintf("%s：%s", event.Timestamp, event.Event)
	}

	// 构建道具信息
	propsInfo := make([]string, len(req.Context.Props))
	for i, prop := range req.Context.Props {
		propsInfo[i] = fmt.Sprintf("%s：%s", prop.Name, prop.Description)
	}

	prompt := fmt.Sprintf(`
基于以下信息生成第 %d 章的小说内容：

世界观：%s

主要人物：
%s

前情摘要：%s

本章大纲：
标题：%s
概要：%s
目标：%s
转折点：%s
关键道具：%v

时间线：
%s

可用道具：
%s

风格示例：
%s

要求：
1. 字数控制在 %d 字左右
2. 符合人物性格和说话风格
3. 推进剧情，实现本章目标
4. 包含适当的对话和描写
5. 体现转折点或冲突
6. 保持与前文的连贯性
7. 风格与示例保持一致

请直接生成章节内容，不要包含任何格式标记。
`, req.ChapterOutline.Index, formatWorldView(req.Context.WorldView),
		joinStrings(charactersInfo, "\n"), req.Context.PreviousSummary,
		req.ChapterOutline.Title, req.ChapterOutline.Summary,
		req.ChapterOutline.Goal, req.ChapterOutline.TwistHint,
		req.ChapterOutline.ImportantItems,
		joinStrings(timelineInfo, "\n"), joinStrings(propsInfo, "\n"),
		joinStrings(req.Context.StyleExamples, "\n\n"), req.TargetWordCount)

	content, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter: %w", err)
	}

	// 计算字数
	wordCount := len([]rune(strings.ReplaceAll(content, " ", "")))

	chapter := &models.Chapter{
		ProjectID:   req.ProjectID,
		Index:       req.ChapterOutline.Index,
		Title:       req.ChapterOutline.Title,
		RawContent:  content,
		Summary:     req.ChapterOutline.Summary,
		WordCount:   wordCount,
		Status:      "draft",
	}

	return &GenerateChapterResponse{
		Chapter: chapter,
	}, nil
}

// RefineChapter 优化章节内容
func (a *ChapterAgent) RefineChapter(ctx context.Context, req *RefineChapterRequest) (*RefineChapterResponse, error) {
	prompt := fmt.Sprintf(`
请根据以下反馈优化章节内容：

原始章节：
标题：%s
内容：
%s

反馈意见：%s

要求：
1. 保持章节的核心剧情不变
2. 根据反馈进行针对性优化
3. 保持原有的字数规模
4. 确保文字流畅自然
5. 保持人物性格一致

请返回优化后的章节内容，不要包含任何格式标记。
`, req.Chapter.Title, req.Chapter.RawContent, req.Feedback)

	refinedContent, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to refine chapter: %w", err)
	}

	// 更新章节
	chapter := &models.Chapter{
		ID:              req.Chapter.ID,
		ProjectID:       req.Chapter.ProjectID,
		Index:           req.Chapter.Index,
		Title:           req.Chapter.Title,
		RawContent:      refinedContent,
		PolishedContent: req.Chapter.PolishedContent,
		Summary:         req.Chapter.Summary,
		WordCount:       len([]rune(strings.ReplaceAll(refinedContent, " ", ""))),
		Status:          req.Chapter.Status,
	}

	return &RefineChapterResponse{
		Chapter: chapter,
	}, nil
}

// ExpandChapter 扩展章节内容
func (a *ChapterAgent) ExpandChapter(ctx context.Context, req *ExpandChapterRequest) (*ExpandChapterResponse, error) {
	currentWordCount := len([]rune(strings.ReplaceAll(req.Chapter.RawContent, " ", "")))
	additionalWords := req.TargetWordCount - currentWordCount

	if additionalWords <= 0 {
		return &ExpandChapterResponse{Chapter: req.Chapter}, nil
	}

	prompt := fmt.Sprintf(`
请扩展以下章节内容，增加约 %d 字：

当前章节：
标题：%s
内容：
%s

扩展要求：
1. 在现有内容基础上增加细节描写
2. 丰富人物对话和心理活动
3. 增强场景描述和氛围营造
4. 保持剧情连贯性
5. 不改变核心情节

请返回扩展后的完整章节内容。
`, additionalWords, req.Chapter.Title, req.Chapter.RawContent)

	expandedContent, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to expand chapter: %w", err)
	}

	// 更新章节
	chapter := &models.Chapter{
		ID:              req.Chapter.ID,
		ProjectID:       req.Chapter.ProjectID,
		Index:           req.Chapter.Index,
		Title:           req.Chapter.Title,
		RawContent:      expandedContent,
		PolishedContent: req.Chapter.PolishedContent,
		Summary:         req.Chapter.Summary,
		WordCount:       len([]rune(strings.ReplaceAll(expandedContent, " ", ""))),
		Status:          req.Chapter.Status,
	}

	return &ExpandChapterResponse{
		Chapter: chapter,
	}, nil
}

// GenerateChapterSummary 生成章节摘要
func (a *ChapterAgent) GenerateChapterSummary(ctx context.Context, chapter *models.Chapter) (string, error) {
	prompt := fmt.Sprintf(`
请为以下章节生成简洁的摘要（100字以内）：

章节标题：%s
章节内容：
%s

要求：
1. 概括主要情节
2. 突出关键转折点
3. 简洁明了
4. 便于后续章节参考

请直接返回摘要内容。
`, chapter.Title, chapter.RawContent)

	summary, err := a.llmClient.GenerateText(ctx, prompt, llm.PreciseOptions())
	if err != nil {
		return "", fmt.Errorf("failed to generate chapter summary: %w", err)
	}

	return summary, nil
}

// GetCapabilities 返回代理能力描述
func (a *ChapterAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "ChapterAgent",
		"type":        "chapter_generation",
		"description": "负责生成、优化和扩展小说章节内容",
		"capabilities": []string{
			"generate_chapter",
			"refine_chapter",
			"expand_chapter",
			"generate_summary",
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