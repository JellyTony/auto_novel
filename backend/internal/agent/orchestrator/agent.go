package orchestrator

import (
	"context"
	"fmt"
	"time"

	"backend/internal/agent/character"
	"backend/internal/agent/chapter"
	"backend/internal/agent/consistency"
	"backend/internal/agent/outline"
	"backend/internal/agent/polish"
	"backend/internal/agent/worldbuilding"
	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// 请求和响应结构
type GenerateNovelRequest struct {
	Project *models.NovelProject `json:"project"`
	Options *GenerateOptions     `json:"options"`
}

type GenerateOptions struct {
	MaxChapters      int                  `json:"max_chapters"`       // 最大章节数
	WordsPerChapter  int                  `json:"words_per_chapter"`  // 每章字数
	PolishEnabled    bool                 `json:"polish_enabled"`     // 是否启用润色
	ConsistencyCheck bool                 `json:"consistency_check"`  // 是否检查一致性
	LLMOptions       *llm.GenerateOptions `json:"llm_options"`
}

type GenerateNovelResponse struct {
	Project   *models.NovelProject `json:"project"`
	Status    string               `json:"status"`
	Progress  float64              `json:"progress"`
	Message   string               `json:"message"`
	Chapters  []*models.Chapter    `json:"chapters"`
	Issues    []string             `json:"issues"`
	Completed bool                 `json:"completed"`
}

type WorkflowStatus struct {
	Stage       string  `json:"stage"`        // worldbuilding/character/outline/chapter/polish/consistency
	Progress    float64 `json:"progress"`     // 0.0-1.0
	Message     string  `json:"message"`
	CurrentStep string  `json:"current_step"`
	Error       string  `json:"error,omitempty"`
}

// OrchestratorAgent 主调度 Agent
type OrchestratorAgent struct {
	llmClient         llm.LLMClient
	worldAgent        *worldbuilding.WorldBuildingAgent
	characterAgent    *character.CharacterAgent
	outlineAgent      *outline.OutlineAgent
	chapterAgent      *chapter.ChapterAgent
	polishAgent       *polish.PolishAgent
	consistencyAgent  *consistency.ConsistencyAgent
	statusCallback    func(*WorkflowStatus)
}

// NewOrchestratorAgent 创建主调度代理
func NewOrchestratorAgent(llmClient llm.LLMClient) *OrchestratorAgent {
	return &OrchestratorAgent{
		llmClient:        llmClient,
		worldAgent:       worldbuilding.NewWorldBuildingAgent(llmClient),
		characterAgent:   character.NewCharacterAgent(llmClient),
		outlineAgent:     outline.NewOutlineAgent(llmClient),
		chapterAgent:     chapter.NewChapterAgent(llmClient),
		polishAgent:      polish.NewPolishAgent(llmClient),
		consistencyAgent: consistency.NewConsistencyAgent(llmClient),
	}
}

// SetStatusCallback 设置状态回调函数
func (a *OrchestratorAgent) SetStatusCallback(callback func(*WorkflowStatus)) {
	a.statusCallback = callback
}

// GenerateNovel 生成完整小说
func (a *OrchestratorAgent) GenerateNovel(ctx context.Context, req *GenerateNovelRequest) (*GenerateNovelResponse, error) {
	project := req.Project
	options := req.Options
	
	// 设置默认选项
	if options == nil {
		options = &GenerateOptions{
			MaxChapters:      20,
			WordsPerChapter:  3000,
			PolishEnabled:    true,
			ConsistencyCheck: true,
			LLMOptions:       llm.DefaultOptions(),
		}
	}

	response := &GenerateNovelResponse{
		Project:  project,
		Status:   "generating",
		Progress: 0.0,
		Chapters: []*models.Chapter{},
		Issues:   []string{},
	}

	// 阶段1：生成世界观
	a.updateStatus("worldbuilding", 0.1, "正在生成世界观设定...", "")
	worldView, err := a.generateWorldView(ctx, project, options.LLMOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate world view: %w", err)
	}
	project.WorldView = worldView

	// 阶段2：生成人物卡
	a.updateStatus("character", 0.2, "正在生成人物设定...", "")
	characters, err := a.generateCharacters(ctx, project, options.LLMOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate characters: %w", err)
	}
	project.Characters = characters

	// 阶段3：生成章节大纲
	a.updateStatus("outline", 0.3, "正在生成章节大纲...", "")
	outline, err := a.generateOutline(ctx, project, options.MaxChapters, options.LLMOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate outline: %w", err)
	}
	project.Outline = outline

	// 阶段4：生成章节内容
	a.updateStatus("chapter", 0.4, "正在生成章节内容...", "")
	chapters, err := a.generateChapters(ctx, project, options)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapters: %w", err)
	}
	project.Chapters = chapters
	response.Chapters = chapters

	// 阶段5：润色处理（可选）
	if options.PolishEnabled {
		a.updateStatus("polish", 0.8, "正在润色章节内容...", "")
		polishedChapters, err := a.polishChapters(ctx, chapters, options.LLMOptions)
		if err != nil {
			response.Issues = append(response.Issues, fmt.Sprintf("润色失败: %v", err))
		} else {
			project.Chapters = polishedChapters
			response.Chapters = polishedChapters
		}
	}

	// 阶段6：一致性检查（可选）
	if options.ConsistencyCheck {
		a.updateStatus("consistency", 0.9, "正在检查内容一致性...", "")
		issues, err := a.checkConsistency(ctx, project, options.LLMOptions)
		if err != nil {
			response.Issues = append(response.Issues, fmt.Sprintf("一致性检查失败: %v", err))
		} else {
			response.Issues = append(response.Issues, issues...)
		}
	}

	// 完成
	project.Status = "completed"
	project.UpdatedAt = time.Now()
	response.Status = "completed"
	response.Progress = 1.0
	response.Message = "小说生成完成"
	response.Completed = true

	a.updateStatus("completed", 1.0, "小说生成完成", "")

	return response, nil
}

// generateWorldView 生成世界观
func (a *OrchestratorAgent) generateWorldView(ctx context.Context, project *models.NovelProject, options *llm.GenerateOptions) (*models.WorldView, error) {
	req := &worldbuilding.GenerateWorldViewRequest{
		ProjectID: project.ID,
		Genre:     project.Genre,
		Audience:  project.TargetAudience,
		Tone:      project.Tone,
	}

	worldView, err := a.worldAgent.GenerateWorldView(ctx, req)
	if err != nil {
		return nil, err
	}

	return worldView, nil
}

// generateCharacters 生成人物卡
func (a *OrchestratorAgent) generateCharacters(ctx context.Context, project *models.NovelProject, options *llm.GenerateOptions) ([]*models.Character, error) {
	req := &character.GenerateCharactersRequest{
		ProjectID: project.ID,
		WorldView: project.WorldView,
		Options:   options,
	}

	resp, err := a.characterAgent.GenerateCharacters(ctx, req)
	if err != nil {
		return nil, err
	}

	return resp.Characters, nil
}

// generateOutline 生成章节大纲
func (a *OrchestratorAgent) generateOutline(ctx context.Context, project *models.NovelProject, maxChapters int, options *llm.GenerateOptions) (*models.Outline, error) {
	req := &outline.GenerateOutlineRequest{
		ProjectID:    project.ID,
		WorldView:    project.WorldView,
		Characters:   project.Characters,
		ChapterCount: maxChapters,
		Options:      options,
	}

	resp, err := a.outlineAgent.GenerateOutline(ctx, req)
	if err != nil {
		return nil, err
	}

	return resp.Outline, nil
}

// generateChapters 生成章节内容
func (a *OrchestratorAgent) generateChapters(ctx context.Context, project *models.NovelProject, options *GenerateOptions) ([]*models.Chapter, error) {
	chapters := make([]*models.Chapter, 0, len(project.Outline.Chapters))
	
	for i, chapterOutline := range project.Outline.Chapters {
		// 更新进度
		progress := 0.4 + (0.4 * float64(i) / float64(len(project.Outline.Chapters)))
		a.updateStatus("chapter", progress, fmt.Sprintf("正在生成第%d章：%s", i+1, chapterOutline.Title), "")

		// 构建生成上下文
		context := &models.GenerationContext{
			ProjectID:   project.ID,
			WorldView:   project.WorldView,
			Characters:  project.Characters,
			ChapterGoal: chapterOutline.Goal,
		}

		// 添加前情摘要
		if i > 0 {
			context.PreviousSummary = chapters[i-1].Summary
		}

		req := &chapter.GenerateChapterRequest{
			ProjectID:       project.ID,
			ChapterOutline:  chapterOutline,
			Context:         context,
			TargetWordCount: options.WordsPerChapter,
			Options:         options.LLMOptions,
		}

		resp, err := a.chapterAgent.GenerateChapter(ctx, req)
		if err != nil {
			return nil, fmt.Errorf("failed to generate chapter %d: %w", i+1, err)
		}

		chapters = append(chapters, resp.Chapter)
	}

	return chapters, nil
}

// polishChapters 润色章节
func (a *OrchestratorAgent) polishChapters(ctx context.Context, chapters []*models.Chapter, options *llm.GenerateOptions) ([]*models.Chapter, error) {
	polishedChapters := make([]*models.Chapter, len(chapters))
	
	for i, chapter := range chapters {
		// 更新进度
		progress := 0.8 + (0.1 * float64(i) / float64(len(chapters)))
		a.updateStatus("polish", progress, fmt.Sprintf("正在润色第%d章：%s", i+1, chapter.Title), "")

		req := &polish.PolishChapterRequest{
			Chapter: chapter,
			Style:   "literary",
			Focus:   []string{"grammar", "flow", "dialogue", "description"},
			Options: options,
		}

		resp, err := a.polishAgent.PolishChapter(ctx, req)
		if err != nil {
			return nil, fmt.Errorf("failed to polish chapter %d: %w", i+1, err)
		}

		polishedChapters[i] = resp.Chapter
	}

	return polishedChapters, nil
}

// checkConsistency 检查一致性
func (a *OrchestratorAgent) checkConsistency(ctx context.Context, project *models.NovelProject, options *llm.GenerateOptions) ([]string, error) {
	req := &consistency.CheckConsistencyRequest{
		Project:   project,
		Chapters:  project.Chapters,
		CheckType: "all",
		Options:   options,
	}

	resp, err := a.consistencyAgent.CheckConsistency(ctx, req)
	if err != nil {
		return nil, err
	}

	// 转换问题为字符串列表
	issues := make([]string, len(resp.Issues))
	for i, issue := range resp.Issues {
		issues[i] = fmt.Sprintf("[%s] %s - %s", issue.Severity, issue.Description, issue.Suggestion)
	}

	return issues, nil
}

// updateStatus 更新状态
func (a *OrchestratorAgent) updateStatus(stage string, progress float64, message, errorMsg string) {
	if a.statusCallback != nil {
		status := &WorkflowStatus{
			Stage:       stage,
			Progress:    progress,
			Message:     message,
			CurrentStep: stage,
			Error:       errorMsg,
		}
		a.statusCallback(status)
	}
}

// GetWorkflowStages 获取工作流阶段信息
func (a *OrchestratorAgent) GetWorkflowStages() []string {
	return []string{
		"worldbuilding",  // 世界观生成
		"character",      // 人物生成
		"outline",        // 大纲生成
		"chapter",        // 章节生成
		"polish",         // 润色处理
		"consistency",    // 一致性检查
		"completed",      // 完成
	}
}

// EstimateTime 估算生成时间
func (a *OrchestratorAgent) EstimateTime(maxChapters int, wordsPerChapter int, polishEnabled bool) time.Duration {
	// 基础时间估算（每章约30秒）
	baseTime := time.Duration(maxChapters) * 30 * time.Second
	
	// 世界观和人物生成时间
	setupTime := 2 * time.Minute
	
	// 润色时间（如果启用）
	polishTime := time.Duration(0)
	if polishEnabled {
		polishTime = time.Duration(maxChapters) * 15 * time.Second
	}
	
	return setupTime + baseTime + polishTime
}

// GetCapabilities 返回代理能力描述
func (a *OrchestratorAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "OrchestratorAgent",
		"type":        "workflow_orchestrator",
		"description": "负责协调整个小说生成工作流程",
		"capabilities": []string{
			"generate_novel",
			"coordinate_agents",
			"track_progress",
			"handle_errors",
			"estimate_time",
		},
		"sub_agents": []string{
			"WorldBuildingAgent",
			"CharacterAgent", 
			"OutlineAgent",
			"ChapterAgent",
			"PolishAgent",
			"ConsistencyAgent",
		},
	}
}