package chapter

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/models"
)

// EinoChapterAgent 基于 eino 框架的章节生成 Agent
type EinoChapterAgent struct {
	client eino.EinoLLMClient
}

// NewEinoChapterAgent 创建基于 eino 的章节生成代理
func NewEinoChapterAgent(client eino.EinoLLMClient) *EinoChapterAgent {
	return &EinoChapterAgent{
		client: client,
	}
}

// GenerateChapter 生成章节内容
func (a *EinoChapterAgent) GenerateChapter(ctx context.Context, req *GenerateChapterRequest) (*GenerateChapterResponse, error) {
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

要求：
1. 字数控制在 %d 字左右
2. 保持人物性格一致
3. 遵循世界观设定
4. 情节紧凑有趣
5. 对话自然流畅
6. 场景描写生动

请直接返回章节内容，不要包含任何格式标记。
`,
		req.ChapterOutline.Index,
		formatWorldView(req.Context.WorldView),
		joinStrings(charactersInfo, "\n"),
		req.Context.PreviousSummary,
		req.ChapterOutline.Title,
		req.ChapterOutline.Summary,
		req.ChapterOutline.Goal,
		req.ChapterOutline.TwistHint,
		req.ChapterOutline.ImportantItems,
		joinStrings(timelineInfo, "\n"),
		joinStrings(propsInfo, "\n"),
		req.TargetWordCount,
	)

	content, err := a.client.GenerateText(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter: %w", err)
	}

	// 创建章节对象
	chapter := &models.Chapter{
		ProjectID:       req.ProjectID,
		Index:           req.ChapterOutline.Index,
		Title:           req.ChapterOutline.Title,
		RawContent:      content,
		PolishedContent: "",
		Summary:         req.ChapterOutline.Summary,
		WordCount:       len([]rune(strings.ReplaceAll(content, " ", ""))),
		Status:          "draft",
	}

	return &GenerateChapterResponse{
		Chapter: chapter,
	}, nil
}

// RefineChapter 优化章节内容
func (a *EinoChapterAgent) RefineChapter(ctx context.Context, req *RefineChapterRequest) (*RefineChapterResponse, error) {
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

	refinedContent, err := a.client.GenerateText(ctx, prompt)
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
func (a *EinoChapterAgent) ExpandChapter(ctx context.Context, req *ExpandChapterRequest) (*ExpandChapterResponse, error) {
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

	expandedContent, err := a.client.GenerateText(ctx, prompt)
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
func (a *EinoChapterAgent) GenerateChapterSummary(ctx context.Context, chapter *models.Chapter) (string, error) {
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

	summary, err := a.client.GenerateText(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("failed to generate chapter summary: %w", err)
	}

	return summary, nil
}

// GetCapabilities 返回代理能力描述
func (a *EinoChapterAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "EinoChapterAgent",
		"type":        "chapter_generation",
		"description": "基于 eino 框架的章节生成代理，负责生成、优化和扩展小说章节内容",
		"capabilities": []string{
			"generate_chapter",
			"refine_chapter",
			"expand_chapter",
			"generate_summary",
		},
	}
}