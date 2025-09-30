package consistency

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/vector"
)

// RAGConsistencyAgent 基于RAG的一致性检查代理
type RAGConsistencyAgent struct {
	einoClient eino.EinoLLMClient
	ragService *vector.RAGService
}

// NewRAGConsistencyAgent 创建RAG一致性检查代理
func NewRAGConsistencyAgent(einoClient eino.EinoLLMClient, ragService *vector.RAGService) *RAGConsistencyAgent {
	return &RAGConsistencyAgent{
		einoClient: einoClient,
		ragService: ragService,
	}
}

// CheckConsistencyWithRAG 使用RAG进行一致性检查
func (a *RAGConsistencyAgent) CheckConsistencyWithRAG(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	switch req.CheckType {
	case "character":
		return a.checkCharacterConsistencyWithRAG(ctx, req)
	case "world":
		return a.checkWorldConsistencyWithRAG(ctx, req)
	case "timeline":
		return a.checkTimelineConsistencyWithRAG(ctx, req)
	default:
		return a.checkOverallConsistencyWithRAG(ctx, req)
	}
}

// checkCharacterConsistencyWithRAG 检查人物一致性
func (a *RAGConsistencyAgent) checkCharacterConsistencyWithRAG(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	var allIssues []ConsistencyIssue
	var allSuggestions []string

	for _, character := range req.Project.Characters {
		// 搜索相关章节内容
		chapterResults, err := a.ragService.SearchRelevantContext(ctx, fmt.Sprintf("人物：%s", character.Name), req.Project.ID, "chapter", 5)
		if err != nil {
			return nil, fmt.Errorf("failed to search chapter context: %w", err)
		}

		// 构建上下文
		var contextBuilder strings.Builder
		contextBuilder.WriteString(fmt.Sprintf("人物：%s\n", character.Name))
		contextBuilder.WriteString(fmt.Sprintf("角色：%s\n", character.Role))
		contextBuilder.WriteString(fmt.Sprintf("背景：%s\n", character.Background))
		contextBuilder.WriteString(fmt.Sprintf("动机：%s\n", character.Motivation))
		contextBuilder.WriteString(fmt.Sprintf("缺点：%s\n", strings.Join(character.Flaws, "；")))
		contextBuilder.WriteString(fmt.Sprintf("说话风格：%s\n", character.SpeechTone))
		contextBuilder.WriteString(fmt.Sprintf("秘密：%s\n", strings.Join(character.Secrets, "；")))
		
		contextBuilder.WriteString("\n相关章节内容：\n")
		for _, result := range chapterResults {
			contextBuilder.WriteString(fmt.Sprintf("- %s\n", result.Document.Content))
		}

		// 构建检查提示词
		prompt := fmt.Sprintf(`
请检查以下人物在章节中的一致性：

%s

请分析：
1. 人物性格是否前后一致
2. 说话风格是否符合设定
3. 行为动机是否合理
4. 人物关系是否保持一致

请以JSON格式返回检查结果：
{
  "issues": [
    {
      "type": "character",
      "severity": "high/medium/low",
      "description": "问题描述",
      "location": "章节位置",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["建议1", "建议2"],
  "overall_score": 0.85
}
`, contextBuilder.String())

		var result CheckConsistencyResponse
		err = a.einoClient.GenerateJSON(ctx, prompt, &result)
		if err != nil {
			return nil, fmt.Errorf("failed to check character consistency: %w", err)
		}

		allIssues = append(allIssues, result.Issues...)
		allSuggestions = append(allSuggestions, result.Suggestions...)
	}

	// 计算总体评分
	overallScore := 1.0
	if len(allIssues) > 0 {
		highCount := 0
		mediumCount := 0
		for _, issue := range allIssues {
			switch issue.Severity {
			case "high":
				highCount++
			case "medium":
				mediumCount++
			}
		}
		overallScore = max(0.0, 1.0-float64(highCount)*0.3-float64(mediumCount)*0.1)
	}

	return &CheckConsistencyResponse{
		Issues:       allIssues,
		Suggestions:  allSuggestions,
		OverallScore: overallScore,
	}, nil
}

// checkWorldConsistencyWithRAG 检查世界观一致性
func (a *RAGConsistencyAgent) checkWorldConsistencyWithRAG(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	// 搜索世界观相关内容
	worldResults, err := a.ragService.SearchRelevantContext(ctx, "世界观 设定 规则", req.Project.ID, "worldview", 10)
	if err != nil {
		return nil, fmt.Errorf("failed to search world context: %w", err)
	}

	// 搜索章节中的世界观描述
	chapterResults, err := a.ragService.SearchRelevantContext(ctx, "世界 环境 背景 设定", req.Project.ID, "chapter", 10)
	if err != nil {
		return nil, fmt.Errorf("failed to search chapter context: %w", err)
	}

	// 构建上下文
	var contextBuilder strings.Builder
	contextBuilder.WriteString("世界观设定：\n")
	for _, result := range worldResults {
		contextBuilder.WriteString(fmt.Sprintf("- %s\n", result.Document.Content))
	}
	
	contextBuilder.WriteString("\n章节中的世界观描述：\n")
	for _, result := range chapterResults {
		contextBuilder.WriteString(fmt.Sprintf("- %s\n", result.Document.Content))
	}

	prompt := fmt.Sprintf(`
请检查以下内容中世界观的一致性：

%s

请分析：
1. 世界观设定是否前后一致
2. 章节描述是否符合世界观
3. 是否存在逻辑矛盾
4. 世界观细节是否完整

请以JSON格式返回检查结果：
{
  "issues": [
    {
      "type": "world",
      "severity": "high/medium/low",
      "description": "问题描述",
      "location": "章节位置",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["建议1", "建议2"],
  "overall_score": 0.85
}
`, contextBuilder.String())

	var result CheckConsistencyResponse
	err = a.einoClient.GenerateJSON(ctx, prompt, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to check world consistency: %w", err)
	}

	return &result, nil
}

// checkTimelineConsistencyWithRAG 检查时间线一致性
func (a *RAGConsistencyAgent) checkTimelineConsistencyWithRAG(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	// 搜索章节内容，按时间顺序
	chapterResults, err := a.ragService.SearchRelevantContext(ctx, "时间 日期 顺序 事件", req.Project.ID, "chapter", 15)
	if err != nil {
		return nil, fmt.Errorf("failed to search chapter context: %w", err)
	}

	// 构建时间线上下文
	var contextBuilder strings.Builder
	contextBuilder.WriteString("章节时间线：\n")
	for _, result := range chapterResults {
		if chapterNum, ok := result.Document.Metadata["chapter_number"]; ok {
			contextBuilder.WriteString(fmt.Sprintf("第%v章: %s\n", chapterNum, result.Document.Content))
		} else {
			contextBuilder.WriteString(fmt.Sprintf("- %s\n", result.Document.Content))
		}
	}

	prompt := fmt.Sprintf(`
请检查以下章节的时间线一致性：

%s

请分析：
1. 时间顺序是否合理
2. 事件发生的先后关系是否正确
3. 是否存在时间矛盾
4. 人物年龄变化是否合理

请以JSON格式返回检查结果：
{
  "issues": [
    {
      "type": "timeline",
      "severity": "high/medium/low",
      "description": "问题描述",
      "location": "章节位置",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["建议1", "建议2"],
  "overall_score": 0.85
}
`, contextBuilder.String())

	var result CheckConsistencyResponse
	err = a.einoClient.GenerateJSON(ctx, prompt, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to check timeline consistency: %w", err)
	}

	return &result, nil
}

// checkOverallConsistencyWithRAG 检查整体一致性
func (a *RAGConsistencyAgent) checkOverallConsistencyWithRAG(ctx context.Context, req *CheckConsistencyRequest) (*CheckConsistencyResponse, error) {
	// 分别检查各个方面
	charResult, err := a.checkCharacterConsistencyWithRAG(ctx, req)
	if err != nil {
		return nil, err
	}

	worldResult, err := a.checkWorldConsistencyWithRAG(ctx, req)
	if err != nil {
		return nil, err
	}

	timelineResult, err := a.checkTimelineConsistencyWithRAG(ctx, req)
	if err != nil {
		return nil, err
	}

	// 合并结果
	var allIssues []ConsistencyIssue
	var allSuggestions []string

	allIssues = append(allIssues, charResult.Issues...)
	allIssues = append(allIssues, worldResult.Issues...)
	allIssues = append(allIssues, timelineResult.Issues...)

	allSuggestions = append(allSuggestions, charResult.Suggestions...)
	allSuggestions = append(allSuggestions, worldResult.Suggestions...)
	allSuggestions = append(allSuggestions, timelineResult.Suggestions...)

	// 计算综合评分
	overallScore := (charResult.OverallScore + worldResult.OverallScore + timelineResult.OverallScore) / 3.0

	return &CheckConsistencyResponse{
		Issues:       allIssues,
		Suggestions:  allSuggestions,
		OverallScore: overallScore,
	}, nil
}

// GetCapabilities 获取代理能力
func (a *RAGConsistencyAgent) GetCapabilities() []string {
	return []string{
		"character_consistency_check_with_rag",
		"world_consistency_check_with_rag",
		"timeline_consistency_check_with_rag",
		"overall_consistency_check_with_rag",
	}
}

// max 返回两个float64中的较大值
func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}