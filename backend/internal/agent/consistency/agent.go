package consistency

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
	"backend/internal/pkg/eino"
	"backend/internal/pkg/vector"
)

// 请求和响应结构
type CheckConsistencyRequest struct {
	Project   *models.NovelProject `json:"project"`
	Chapters  []*models.Chapter    `json:"chapters"`
	CheckType string               `json:"check_type"` // character/plot/world/timeline/all
	Options   *llm.GenerateOptions `json:"options"`
}

type CheckConsistencyResponse struct {
	Issues       []ConsistencyIssue `json:"issues"`
	Suggestions  []string           `json:"suggestions"`
	OverallScore float64            `json:"overall_score"`
}

type ConsistencyIssue struct {
	Type        string `json:"type"`        // character/plot/world/timeline
	Severity    string `json:"severity"`    // high/medium/low
	Description string `json:"description"`
	Location    string `json:"location"`    // 章节位置
	Suggestion  string `json:"suggestion"`
}

type ValidateCharacterRequest struct {
	Character *models.Character `json:"character"`
	Chapters  []*models.Chapter `json:"chapters"`
	Options   *llm.GenerateOptions `json:"options"`
}

type ValidateCharacterResponse struct {
	Issues      []ConsistencyIssue `json:"issues"`
	IsConsistent bool              `json:"is_consistent"`
}

type CheckTimelineRequest struct {
	Events   []models.TimelineEvent `json:"events"`
	Chapters []*models.Chapter      `json:"chapters"`
	Options  *llm.GenerateOptions   `json:"options"`
}

type CheckTimelineResponse struct {
	Issues        []ConsistencyIssue `json:"issues"`
	ConflictCount int                `json:"conflict_count"`
}

// ConsistencyAgent 一致性检查 Agent
type ConsistencyAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
	ragAgent  *RAGConsistencyAgent // 新增RAG一致性检查代理
}

// NewConsistencyAgent 创建一致性检查代理
func NewConsistencyAgent(llmClient llm.LLMClient) *ConsistencyAgent {
	return &ConsistencyAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// NewConsistencyAgentWithRAG 创建带RAG功能的一致性检查代理
func NewConsistencyAgentWithRAG(llmClient llm.LLMClient, einoClient eino.EinoLLMClient, ragService *vector.RAGService) *ConsistencyAgent {
	ragAgent := NewRAGConsistencyAgent(einoClient, ragService)
	return &ConsistencyAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
		ragAgent:  ragAgent,
	}
}

// CheckConsistency 检查整体一致性
func (a *ConsistencyAgent) CheckConsistency(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	// 如果有RAG代理，优先使用RAG进行检查
	if a.ragAgent != nil {
		return a.ragAgent.CheckConsistencyWithRAG(ctx, req)
	}

	// 否则使用传统的LLM检查方式
	return a.checkConsistencyWithLLM(ctx, req)
}

// checkConsistencyWithLLM 使用传统LLM方式检查一致性
func (a *ConsistencyAgent) checkConsistencyWithLLM(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	// 构建章节内容摘要
	chapterSummaries := make([]string, len(req.Chapters))
	for i, chapter := range req.Chapters {
		content := chapter.PolishedContent
		if content == "" {
			content = chapter.RawContent
		}
		chapterSummaries[i] = fmt.Sprintf("第%d章 %s：%s", 
			chapter.Index, chapter.Title, chapter.Summary)
	}

	// 构建世界观信息
	worldInfo := ""
	if req.Project.WorldView != nil {
		worldInfo = fmt.Sprintf(`
世界观设定：
- 标题：%s
- 概要：%s
- 背景设定：%s
- 核心规则：%s
- 主题：%s
`, req.Project.WorldView.Title, req.Project.WorldView.Synopsis,
			req.Project.WorldView.Setting, joinStrings(req.Project.WorldView.KeyRules, "；"),
			joinStrings(req.Project.WorldView.Themes, "；"))
	}

	// 构建人物信息
	characterInfo := ""
	if len(req.Project.Characters) > 0 {
		charList := make([]string, len(req.Project.Characters))
		for i, char := range req.Project.Characters {
			charList[i] = fmt.Sprintf("- %s（%s）：%s", char.Name, char.Role, char.Background)
		}
		characterInfo = fmt.Sprintf("\n人物设定：\n%s", joinStrings(charList, "\n"))
	}

	prompt := fmt.Sprintf(`
请检查以下小说的一致性问题，重点关注：%s

%s%s

章节概要：
%s

请检查以下方面的一致性：
1. 人物性格和行为是否前后一致
2. 世界观设定是否贯穿始终
3. 剧情逻辑是否合理
4. 时间线是否清晰
5. 细节描述是否矛盾

请以JSON格式返回检查结果：
{
  "issues": [
    {
      "type": "问题类型",
      "severity": "严重程度",
      "description": "问题描述",
      "location": "位置信息",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["整体建议1", "整体建议2"],
  "overall_score": 0.85
}
`, req.CheckType, worldInfo, characterInfo, joinStrings(chapterSummaries, "\n"))

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to check consistency: %w", err)
	}

	// 解析结果
	issues := parseConsistencyIssues(jsonResult["issues"])
	suggestions := getStringArrayFromJSON(jsonResult, "suggestions")
	overallScore := getFloatFromJSON(jsonResult, "overall_score")

	return &CheckConsistencyResponse{
		Issues:       issues,
		Suggestions:  suggestions,
		OverallScore: overallScore,
	}, nil
}

// ValidateCharacterConsistency 验证人物一致性
func (a *ConsistencyAgent) ValidateCharacterConsistency(ctx context.Context, req *ValidateCharacterRequest) (*ValidateCharacterResponse, error) {
	// 构建人物信息
	charInfo := fmt.Sprintf(`
人物：%s
角色：%s
背景：%s
说话风格：%s
`, req.Character.Name, req.Character.Role, req.Character.Background,
		req.Character.SpeechTone)

	// 构建章节中的人物表现
	appearances := make([]string, 0)
	for _, chapter := range req.Chapters {
		content := chapter.PolishedContent
		if content == "" {
			content = chapter.RawContent
		}
		if strings.Contains(content, req.Character.Name) {
			appearances = append(appearances, fmt.Sprintf("第%d章：%s", chapter.Index, chapter.Title))
		}
	}

	prompt := fmt.Sprintf(`
请检查人物在各章节中的表现是否一致：

%s

人物出现的章节：
%s

请检查：
1. 人物性格是否前后一致
2. 说话风格是否保持
3. 行为模式是否符合设定
4. 能力和特征是否稳定

请以JSON格式返回：
{
  "issues": [
    {
      "type": "character",
      "severity": "严重程度",
      "description": "问题描述",
      "location": "章节位置",
      "suggestion": "修改建议"
    }
  ],
  "is_consistent": true
}
`, charInfo, joinStrings(appearances, "\n"))

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to validate character consistency: %w", err)
	}

	issues := parseConsistencyIssues(jsonResult["issues"])
	isConsistent := getBoolFromJSON(jsonResult, "is_consistent")

	return &ValidateCharacterResponse{
		Issues:       issues,
		IsConsistent: isConsistent,
	}, nil
}

// CheckTimelineConsistency 检查时间线一致性
func (a *ConsistencyAgent) CheckTimelineConsistency(ctx context.Context, req *CheckTimelineRequest) (*CheckTimelineResponse, error) {
	// 构建时间线信息
	timelineInfo := make([]string, len(req.Events))
	for i, event := range req.Events {
		timelineInfo[i] = fmt.Sprintf("- %s：%s - %s", 
			event.Timestamp, event.Event, event.Description)
	}

	// 构建章节时间信息
	chapterTimes := make([]string, len(req.Chapters))
	for i, chapter := range req.Chapters {
		chapterTimes[i] = fmt.Sprintf("第%d章 %s", chapter.Index, chapter.Title)
	}

	prompt := fmt.Sprintf(`
请检查时间线的一致性：

时间线事件：
%s

章节顺序：
%s

请检查：
1. 时间顺序是否合理
2. 事件发生的先后关系
3. 时间跨度是否合适
4. 是否存在时间矛盾

请以JSON格式返回：
{
  "issues": [
    {
      "type": "timeline",
      "severity": "严重程度", 
      "description": "问题描述",
      "location": "位置信息",
      "suggestion": "修改建议"
    }
  ],
  "conflict_count": 0
}
`, joinStrings(timelineInfo, "\n"), joinStrings(chapterTimes, "\n"))

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to check timeline consistency: %w", err)
	}

	issues := parseConsistencyIssues(jsonResult["issues"])
	conflictCount := getIntFromJSON(jsonResult, "conflict_count")

	return &CheckTimelineResponse{
		Issues:        issues,
		ConflictCount: conflictCount,
	}, nil
}

// AnalyzeWorldConsistency 分析世界观一致性
func (a *ConsistencyAgent) AnalyzeWorldConsistency(ctx context.Context, worldView *models.WorldView, chapters []*models.Chapter) ([]ConsistencyIssue, error) {
	worldInfo := fmt.Sprintf(`
世界观设定：
- 标题：%s
- 概要：%s
- 背景设定：%s
- 核心规则：%s
`, worldView.Title, worldView.Synopsis, worldView.Setting, joinStrings(worldView.KeyRules, "；"))

	chapterContents := make([]string, len(chapters))
	for i, chapter := range chapters {
		content := chapter.PolishedContent
		if content == "" {
			content = chapter.RawContent
		}
		chapterContents[i] = fmt.Sprintf("第%d章：%s", chapter.Index, content[:min(200, len(content))])
	}

	prompt := fmt.Sprintf(`
请分析世界观在各章节中的一致性：

%s

章节内容片段：
%s

请检查：
1. 世界观规则是否被遵守
2. 设定是否前后一致
3. 是否出现违背世界观的内容

请以JSON格式返回问题列表。
`, worldInfo, joinStrings(chapterContents, "\n\n"))

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, llm.DefaultOptions())
	if err != nil {
		return nil, fmt.Errorf("failed to analyze world consistency: %w", err)
	}

	return parseConsistencyIssues(jsonResult["issues"]), nil
}

// GetCapabilities 返回代理能力描述
func (a *ConsistencyAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "ConsistencyAgent",
		"type":        "consistency_check",
		"description": "负责检查小说各方面的一致性",
		"capabilities": []string{
			"check_consistency",
			"validate_character_consistency",
			"check_timeline_consistency",
			"analyze_world_consistency",
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

func getFloatFromJSON(data map[string]interface{}, key string) float64 {
	if val, ok := data[key].(float64); ok {
		return val
	}
	return 0.0
}

func getBoolFromJSON(data map[string]interface{}, key string) bool {
	if val, ok := data[key].(bool); ok {
		return val
	}
	return false
}

func getIntFromJSON(data map[string]interface{}, key string) int {
	if val, ok := data[key].(float64); ok {
		return int(val)
	}
	return 0
}

func parseConsistencyIssues(data interface{}) []ConsistencyIssue {
	if issues, ok := data.([]interface{}); ok {
		result := make([]ConsistencyIssue, len(issues))
		for i, issue := range issues {
			if issueMap, ok := issue.(map[string]interface{}); ok {
				result[i] = ConsistencyIssue{
					Type:        getStringFromMap(issueMap, "type"),
					Severity:    getStringFromMap(issueMap, "severity"),
					Description: getStringFromMap(issueMap, "description"),
					Location:    getStringFromMap(issueMap, "location"),
					Suggestion:  getStringFromMap(issueMap, "suggestion"),
				}
			}
		}
		return result
	}
	return []ConsistencyIssue{}
}

func getStringFromMap(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}