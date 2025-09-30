package quality

import (
	"context"
	"fmt"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
	"backend/internal/agent/polish"
	"backend/internal/agent/consistency"
)

// 请求和响应结构
type QualityCheckRequest struct {
	Chapter   *models.Chapter      `json:"chapter"`
	Project   *models.NovelProject `json:"project"`
	CheckType string               `json:"check_type"` // polish/proofread/critique/all
	Options   *llm.GenerateOptions `json:"options"`
}

type QualityCheckResponse struct {
	PolishedChapter    *models.Chapter      `json:"polished_chapter,omitempty"`
	ProofreadResult    *ProofreadResult     `json:"proofread_result,omitempty"`
	CritiqueResult     *models.CritiqueResult `json:"critique_result,omitempty"`
	ConsistencyIssues  []consistency.ConsistencyIssue `json:"consistency_issues,omitempty"`
	OverallScore       float64              `json:"overall_score"`
	Recommendations    []string             `json:"recommendations"`
}

type ProofreadResult struct {
	CorrectedContent string   `json:"corrected_content"`
	Issues           []Issue  `json:"issues"`
	Suggestions      []string `json:"suggestions"`
}

type Issue struct {
	Type        string `json:"type"`        // grammar/punctuation/spelling/style
	Severity    string `json:"severity"`    // high/medium/low
	Description string `json:"description"`
	Position    string `json:"position"`    // 位置描述
	Original    string `json:"original"`    // 原文
	Corrected   string `json:"corrected"`   // 修正后
}

type BatchQualityCheckRequest struct {
	Chapters  []*models.Chapter    `json:"chapters"`
	Project   *models.NovelProject `json:"project"`
	CheckType string               `json:"check_type"`
	Options   *llm.GenerateOptions `json:"options"`
}

type BatchQualityCheckResponse struct {
	Results      []*QualityCheckResponse `json:"results"`
	Summary      *QualitySummary         `json:"summary"`
	OverallScore float64                 `json:"overall_score"`
}

type QualitySummary struct {
	TotalIssues       int                `json:"total_issues"`
	IssuesByType      map[string]int     `json:"issues_by_type"`
	IssuesBySeverity  map[string]int     `json:"issues_by_severity"`
	Recommendations   []string           `json:"recommendations"`
	QualityTrends     []float64          `json:"quality_trends"`
}

// QualityAgent 质量检测代理
type QualityAgent struct {
	llmClient        llm.LLMClient
	polishAgent      *polish.PolishAgent
	consistencyAgent *consistency.ConsistencyAgent
	templates        *llm.PromptTemplates
}

// NewQualityAgent 创建质量检测代理
func NewQualityAgent(llmClient llm.LLMClient, polishAgent *polish.PolishAgent, consistencyAgent *consistency.ConsistencyAgent) *QualityAgent {
	return &QualityAgent{
		llmClient:        llmClient,
		polishAgent:      polishAgent,
		consistencyAgent: consistencyAgent,
		templates:        &llm.PromptTemplates{},
	}
}

// CheckQuality 检查章节质量
func (a *QualityAgent) CheckQuality(ctx context.Context, req *QualityCheckRequest) (*QualityCheckResponse, error) {
	response := &QualityCheckResponse{
		Recommendations: make([]string, 0),
	}

	switch req.CheckType {
	case "polish":
		result, err := a.polishChapter(ctx, req)
		if err != nil {
			return nil, err
		}
		response.PolishedChapter = result
		response.OverallScore = a.calculatePolishScore(req.Chapter, result)

	case "proofread":
		result, err := a.proofreadChapter(ctx, req)
		if err != nil {
			return nil, err
		}
		response.ProofreadResult = result
		response.OverallScore = a.calculateProofreadScore(result)

	case "critique":
		result, err := a.critiqueChapter(ctx, req)
		if err != nil {
			return nil, err
		}
		response.CritiqueResult = result
		response.OverallScore = float64(result.OverallScore) / 10.0

	case "consistency":
		result, err := a.checkConsistency(ctx, req)
		if err != nil {
			return nil, err
		}
		response.ConsistencyIssues = result
		response.OverallScore = a.calculateConsistencyScore(result)

	case "all":
		return a.comprehensiveQualityCheck(ctx, req)

	default:
		return nil, fmt.Errorf("unsupported check type: %s", req.CheckType)
	}

	// 生成建议
	response.Recommendations = a.generateRecommendations(response)

	return response, nil
}

// BatchCheckQuality 批量检查质量
func (a *QualityAgent) BatchCheckQuality(ctx context.Context, req *BatchQualityCheckRequest) (*BatchQualityCheckResponse, error) {
	results := make([]*QualityCheckResponse, len(req.Chapters))
	totalScore := 0.0

	for i, chapter := range req.Chapters {
		checkReq := &QualityCheckRequest{
			Chapter:   chapter,
			Project:   req.Project,
			CheckType: req.CheckType,
			Options:   req.Options,
		}

		result, err := a.CheckQuality(ctx, checkReq)
		if err != nil {
			return nil, fmt.Errorf("failed to check quality for chapter %d: %w", i+1, err)
		}

		results[i] = result
		totalScore += result.OverallScore
	}

	// 计算总体评分
	overallScore := totalScore / float64(len(req.Chapters))

	// 生成摘要
	summary := a.generateQualitySummary(results)

	return &BatchQualityCheckResponse{
		Results:      results,
		Summary:      summary,
		OverallScore: overallScore,
	}, nil
}

// polishChapter 润色章节
func (a *QualityAgent) polishChapter(ctx context.Context, req *QualityCheckRequest) (*models.Chapter, error) {
	polishReq := &polish.PolishChapterRequest{
		Chapter: req.Chapter,
		Style:   "literary",
		Focus:   []string{"grammar", "flow", "dialogue", "description"},
		Options: req.Options,
	}

	resp, err := a.polishAgent.PolishChapter(ctx, polishReq)
	if err != nil {
		return nil, fmt.Errorf("failed to polish chapter: %w", err)
	}

	return resp.Chapter, nil
}

// proofreadChapter 校对章节
func (a *QualityAgent) proofreadChapter(ctx context.Context, req *QualityCheckRequest) (*ProofreadResult, error) {
	content := req.Chapter.PolishedContent
	if content == "" {
		content = req.Chapter.RawContent
	}

	prompt := fmt.Sprintf(`
请仔细校对以下章节内容，找出并分析所有问题：

章节标题：%s
内容：
%s

请检查以下方面：
1. 语法错误（主谓不一致、时态错误等）
2. 标点符号使用错误
3. 错别字和用词不当
4. 语句表达不清晰或冗余
5. 逻辑连贯性问题
6. 文体风格不统一

请以JSON格式返回详细的校对结果：
{
  "corrected_content": "修正后的完整内容",
  "issues": [
    {
      "type": "问题类型",
      "severity": "严重程度",
      "description": "问题描述",
      "position": "位置描述",
      "original": "原文片段",
      "corrected": "修正后片段"
    }
  ],
  "suggestions": ["改进建议1", "改进建议2"]
}
`, req.Chapter.Title, content)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to proofread chapter: %w", err)
	}

	// 解析结果
	issues := make([]Issue, 0)
	if issuesData, ok := jsonResult["issues"].([]interface{}); ok {
		for _, issueData := range issuesData {
			if issueMap, ok := issueData.(map[string]interface{}); ok {
				issue := Issue{
					Type:        getStringFromMap(issueMap, "type"),
					Severity:    getStringFromMap(issueMap, "severity"),
					Description: getStringFromMap(issueMap, "description"),
					Position:    getStringFromMap(issueMap, "position"),
					Original:    getStringFromMap(issueMap, "original"),
					Corrected:   getStringFromMap(issueMap, "corrected"),
				}
				issues = append(issues, issue)
			}
		}
	}

	return &ProofreadResult{
		CorrectedContent: getStringFromMap(jsonResult, "corrected_content"),
		Issues:           issues,
		Suggestions:      getStringArrayFromMap(jsonResult, "suggestions"),
	}, nil
}

// critiqueChapter 质量审查章节
func (a *QualityAgent) critiqueChapter(ctx context.Context, req *QualityCheckRequest) (*models.CritiqueResult, error) {
	content := req.Chapter.PolishedContent
	if content == "" {
		content = req.Chapter.RawContent
	}

	prompt := fmt.Sprintf(`
作为资深小说编辑，请对以下章节进行全面的质量审查：

章节标题：%s
内容：
%s

请从以下维度进行深度分析：
1. 逻辑矛盾和情节漏洞
2. 人物性格一致性和发展合理性
3. 节奏控制和情绪渲染
4. 语言表达和文学性
5. 读者体验和吸引力

请以JSON格式返回详细的审查结果：
{
  "logical_issues": ["逻辑问题1", "逻辑问题2"],
  "character_issues": ["人物问题1", "人物问题2"],
  "pacing_issues": ["节奏问题1", "节奏问题2"],
  "improvements": ["改进建议1", "改进建议2"],
  "fixed_example": "修订示例（50-150字）",
  "overall_score": 8
}

评分标准（1-10分）：
- 9-10分：优秀，几乎无需修改
- 7-8分：良好，有少量改进空间
- 5-6分：一般，需要明显改进
- 3-4分：较差，需要大幅修改
- 1-2分：很差，需要重写
`, req.Chapter.Title, content)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to critique chapter: %w", err)
	}

	return &models.CritiqueResult{
		LogicalIssues:   getStringArrayFromMap(jsonResult, "logical_issues"),
		CharacterIssues: getStringArrayFromMap(jsonResult, "character_issues"),
		PacingIssues:    getStringArrayFromMap(jsonResult, "pacing_issues"),
		Improvements:    getStringArrayFromMap(jsonResult, "improvements"),
		FixedExample:    getStringFromMap(jsonResult, "fixed_example"),
		OverallScore:    getIntFromMap(jsonResult, "overall_score"),
	}, nil
}

// checkConsistency 检查一致性
func (a *QualityAgent) checkConsistency(ctx context.Context, req *QualityCheckRequest) ([]consistency.ConsistencyIssue, error) {
	consistencyReq := &consistency.CheckConsistencyRequest{
		Project:   req.Project,
		Chapters:  []*models.Chapter{req.Chapter},
		CheckType: "all",
		Options:   req.Options,
	}

	resp, err := a.consistencyAgent.CheckConsistency(ctx, consistencyReq)
	if err != nil {
		return nil, fmt.Errorf("failed to check consistency: %w", err)
	}

	return resp.Issues, nil
}

// comprehensiveQualityCheck 综合质量检查
func (a *QualityAgent) comprehensiveQualityCheck(ctx context.Context, req *QualityCheckRequest) (*QualityCheckResponse, error) {
	response := &QualityCheckResponse{
		Recommendations: make([]string, 0),
	}

	// 1. 润色
	polishedChapter, err := a.polishChapter(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("polish failed: %w", err)
	}
	response.PolishedChapter = polishedChapter

	// 2. 校对润色后的内容
	proofreadReq := &QualityCheckRequest{
		Chapter: polishedChapter,
		Project: req.Project,
		Options: req.Options,
	}
	proofreadResult, err := a.proofreadChapter(ctx, proofreadReq)
	if err != nil {
		return nil, fmt.Errorf("proofread failed: %w", err)
	}
	response.ProofreadResult = proofreadResult

	// 3. 质量审查
	critiqueResult, err := a.critiqueChapter(ctx, proofreadReq)
	if err != nil {
		return nil, fmt.Errorf("critique failed: %w", err)
	}
	response.CritiqueResult = critiqueResult

	// 4. 一致性检查
	consistencyIssues, err := a.checkConsistency(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("consistency check failed: %w", err)
	}
	response.ConsistencyIssues = consistencyIssues

	// 计算综合评分
	response.OverallScore = a.calculateOverallScore(response)

	// 生成综合建议
	response.Recommendations = a.generateComprehensiveRecommendations(response)

	return response, nil
}

// 计算评分的辅助方法
func (a *QualityAgent) calculatePolishScore(original, polished *models.Chapter) float64 {
	// 基于内容改进程度计算评分
	originalLen := len(original.RawContent)
	polishedLen := len(polished.PolishedContent)
	
	if originalLen == 0 {
		return 0.5
	}
	
	// 简单的改进度评估
	improvementRatio := float64(polishedLen) / float64(originalLen)
	if improvementRatio > 0.8 && improvementRatio < 1.2 {
		return 0.8 // 适度改进
	} else if improvementRatio > 1.2 {
		return 0.9 // 显著改进
	}
	return 0.6 // 改进有限
}

func (a *QualityAgent) calculateProofreadScore(result *ProofreadResult) float64 {
	if len(result.Issues) == 0 {
		return 1.0
	}
	
	// 根据问题数量和严重程度计算评分
	highSeverityCount := 0
	mediumSeverityCount := 0
	lowSeverityCount := 0
	
	for _, issue := range result.Issues {
		switch issue.Severity {
		case "high":
			highSeverityCount++
		case "medium":
			mediumSeverityCount++
		case "low":
			lowSeverityCount++
		}
	}
	
	// 权重计算
	totalWeight := highSeverityCount*3 + mediumSeverityCount*2 + lowSeverityCount*1
	maxScore := 1.0
	penalty := float64(totalWeight) * 0.05
	
	score := maxScore - penalty
	if score < 0 {
		score = 0
	}
	
	return score
}

func (a *QualityAgent) calculateConsistencyScore(issues []consistency.ConsistencyIssue) float64 {
	if len(issues) == 0 {
		return 1.0
	}
	
	// 根据一致性问题计算评分
	highSeverityCount := 0
	mediumSeverityCount := 0
	lowSeverityCount := 0
	
	for _, issue := range issues {
		switch issue.Severity {
		case "high":
			highSeverityCount++
		case "medium":
			mediumSeverityCount++
		case "low":
			lowSeverityCount++
		}
	}
	
	totalWeight := highSeverityCount*4 + mediumSeverityCount*2 + lowSeverityCount*1
	penalty := float64(totalWeight) * 0.08
	
	score := 1.0 - penalty
	if score < 0 {
		score = 0
	}
	
	return score
}

func (a *QualityAgent) calculateOverallScore(response *QualityCheckResponse) float64 {
	scores := make([]float64, 0)
	
	if response.PolishedChapter != nil {
		scores = append(scores, 0.8) // 润色基础分
	}
	
	if response.ProofreadResult != nil {
		scores = append(scores, a.calculateProofreadScore(response.ProofreadResult))
	}
	
	if response.CritiqueResult != nil {
		scores = append(scores, float64(response.CritiqueResult.OverallScore)/10.0)
	}
	
	if response.ConsistencyIssues != nil {
		scores = append(scores, a.calculateConsistencyScore(response.ConsistencyIssues))
	}
	
	if len(scores) == 0 {
		return 0.5
	}
	
	// 计算加权平均
	total := 0.0
	for _, score := range scores {
		total += score
	}
	
	return total / float64(len(scores))
}

// 生成建议的辅助方法
func (a *QualityAgent) generateRecommendations(response *QualityCheckResponse) []string {
	recommendations := make([]string, 0)
	
	if response.ProofreadResult != nil && len(response.ProofreadResult.Issues) > 0 {
		recommendations = append(recommendations, fmt.Sprintf("发现%d个校对问题，建议重点关注语法和标点", len(response.ProofreadResult.Issues)))
	}
	
	if response.CritiqueResult != nil && response.CritiqueResult.OverallScore < 7 {
		recommendations = append(recommendations, "章节质量有待提升，建议参考改进建议进行修改")
	}
	
	if response.ConsistencyIssues != nil && len(response.ConsistencyIssues) > 0 {
		recommendations = append(recommendations, fmt.Sprintf("发现%d个一致性问题，建议检查人物设定和情节逻辑", len(response.ConsistencyIssues)))
	}
	
	if response.OverallScore < 0.6 {
		recommendations = append(recommendations, "整体质量偏低，建议进行全面修改")
	} else if response.OverallScore > 0.8 {
		recommendations = append(recommendations, "质量良好，可以考虑发布")
	}
	
	return recommendations
}

func (a *QualityAgent) generateComprehensiveRecommendations(response *QualityCheckResponse) []string {
	recommendations := a.generateRecommendations(response)
	
	// 添加综合性建议
	if response.CritiqueResult != nil {
		recommendations = append(recommendations, response.CritiqueResult.Improvements...)
	}
	
	if response.ProofreadResult != nil {
		recommendations = append(recommendations, response.ProofreadResult.Suggestions...)
	}
	
	return recommendations
}

func (a *QualityAgent) generateQualitySummary(results []*QualityCheckResponse) *QualitySummary {
	summary := &QualitySummary{
		IssuesByType:     make(map[string]int),
		IssuesBySeverity: make(map[string]int),
		QualityTrends:    make([]float64, len(results)),
		Recommendations:  make([]string, 0),
	}
	
	totalIssues := 0
	
	for i, result := range results {
		summary.QualityTrends[i] = result.OverallScore
		
		// 统计校对问题
		if result.ProofreadResult != nil {
			for _, issue := range result.ProofreadResult.Issues {
				summary.IssuesByType[issue.Type]++
				summary.IssuesBySeverity[issue.Severity]++
				totalIssues++
			}
		}
		
		// 统计一致性问题
		if result.ConsistencyIssues != nil {
			for _, issue := range result.ConsistencyIssues {
				summary.IssuesByType[issue.Type]++
				summary.IssuesBySeverity[issue.Severity]++
				totalIssues++
			}
		}
		
		// 收集建议
		summary.Recommendations = append(summary.Recommendations, result.Recommendations...)
	}
	
	summary.TotalIssues = totalIssues
	
	// 生成总体建议
	if totalIssues > len(results)*3 {
		summary.Recommendations = append(summary.Recommendations, "整体问题较多，建议加强质量控制")
	}
	
	return summary
}

// 辅助函数
func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

func getIntFromMap(m map[string]interface{}, key string) int {
	if val, ok := m[key].(float64); ok {
		return int(val)
	}
	return 0
}

func getStringArrayFromMap(m map[string]interface{}, key string) []string {
	if arr, ok := m[key].([]interface{}); ok {
		result := make([]string, len(arr))
		for i, v := range arr {
			if str, ok := v.(string); ok {
				result[i] = str
			}
		}
		return result
	}
	return []string{}
}

// GetCapabilities 返回代理能力描述
func (a *QualityAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "QualityAgent",
		"type":        "quality_control",
		"description": "负责小说内容的质量检测、润色、校对和评估",
		"capabilities": []string{
			"polish_chapter",
			"proofread_content",
			"critique_quality",
			"check_consistency",
			"comprehensive_quality_check",
			"batch_quality_check",
		},
		"check_types": []string{
			"polish", "proofread", "critique", "consistency", "all",
		},
	}
}