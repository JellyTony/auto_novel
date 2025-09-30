package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/internal/pkg/eino"
)

// LLMClient LLM客户端接口
type LLMClient interface {
	// GenerateText 生成文本
	GenerateText(ctx context.Context, prompt string, opts *GenerateOptions) (string, error)
	// GenerateJSON 生成JSON格式响应
	GenerateJSON(ctx context.Context, prompt string, opts *GenerateOptions) (map[string]interface{}, error)
	// GenerateWithTemplate 使用模板生成
	GenerateWithTemplate(ctx context.Context, template string, data map[string]interface{}, opts *GenerateOptions) (string, error)
}

// GenerateOptions 生成选项
type GenerateOptions struct {
	Temperature      float64 `json:"temperature"`       // 创造性 0.2-0.9
	TopP             float64 `json:"top_p"`             // 0.8-0.95
	MaxTokens        int     `json:"max_tokens"`        // 最大token数
	FrequencyPenalty float64 `json:"frequency_penalty"` // 频率惩罚 0-0.2
	PresencePenalty  float64 `json:"presence_penalty"`  // 存在惩罚 0-0.1
	RetryCount       int     `json:"retry_count"`       // 重试次数
}

// DefaultOptions 默认选项
func DefaultOptions() *GenerateOptions {
	return &GenerateOptions{
		Temperature:      0.35,
		TopP:             0.9,
		MaxTokens:        2000,
		FrequencyPenalty: 0.1,
		PresencePenalty:  0.05,
		RetryCount:       2,
	}
}

// CreativeOptions 创意写作选项
func CreativeOptions() *GenerateOptions {
	return &GenerateOptions{
		Temperature:      0.7,
		TopP:             0.9,
		MaxTokens:        3000,
		FrequencyPenalty: 0.2,
		PresencePenalty:  0.1,
		RetryCount:       2,
	}
}

// PreciseOptions 精确任务选项
func PreciseOptions() *GenerateOptions {
	return &GenerateOptions{
		Temperature:      0.2,
		TopP:             0.8,
		MaxTokens:        1500,
		FrequencyPenalty: 0.05,
		PresencePenalty:  0.02,
		RetryCount:       1,
	}
}

// EinoLLMClient 基于 Eino 的 LLM 客户端实现
type EinoLLMClient struct {
	model interface{} // 暂时使用 interface{} 避免编译错误
}

// NewRealLLMClient 创建真实的 LLM 客户端，使用 Eino 框架
func NewRealLLMClient(einoClient *eino.EinoLLMClient) LLMClient {
	return &EinoLLMClient{
		model: einoClient,
	}
}

// GenerateText 生成文本
func (c *EinoLLMClient) GenerateText(ctx context.Context, prompt string, opts *GenerateOptions) (string, error) {
	if opts == nil {
		opts = DefaultOptions()
	}

	// 检查模型是否已初始化
	if c.model == nil {
		return "", fmt.Errorf("LLM model not initialized")
	}

	// 将模型转换为真实的Eino客户端
	if einoClient, ok := c.model.(*eino.EinoLLMClient); ok {
		// 调用eino客户端的GenerateText方法，不传递额外参数
		return einoClient.GenerateText(ctx, prompt)
	}

	// 默认返回错误
	return "", fmt.Errorf("unsupported model type: %T", c.model)
}

// GenerateJSON 生成JSON格式响应
func (c *EinoLLMClient) GenerateJSON(ctx context.Context, prompt string, opts *GenerateOptions) (map[string]interface{}, error) {
	// 在prompt中明确要求JSON格式
	jsonPrompt := prompt + "\n\n请以有效的JSON格式返回结果，不要包含任何其他文本。"

	text, err := c.GenerateText(ctx, jsonPrompt, opts)
	if err != nil {
		return nil, err
	}

	// 尝试解析JSON
	text = strings.TrimSpace(text)
	// 移除可能的markdown代码块标记
	if strings.HasPrefix(text, "```json") {
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimSuffix(text, "```")
		text = strings.TrimSpace(text)
	} else if strings.HasPrefix(text, "```") {
		text = strings.TrimPrefix(text, "```")
		text = strings.TrimSuffix(text, "```")
		text = strings.TrimSpace(text)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %w, raw text: %s", err, text)
	}

	return result, nil
}

// GenerateWithTemplate 使用模板生成
func (c *EinoLLMClient) GenerateWithTemplate(ctx context.Context, template string, data map[string]interface{}, opts *GenerateOptions) (string, error) {
	// 简单的模板替换实现
	prompt := template
	for key, value := range data {
		placeholder := fmt.Sprintf("{%s}", key)
		prompt = strings.ReplaceAll(prompt, placeholder, fmt.Sprintf("%v", value))
	}

	return c.GenerateText(ctx, prompt, opts)
}

// PromptTemplates 提示词模板
type PromptTemplates struct{}

// WorldBuildingPrompt 世界观设定提示词
func (pt *PromptTemplates) WorldBuildingPrompt() string {
	return `你是资深小说设定师。请用不超过 300 字写出本书的世界观 JSON：
{"title":"","synopsis":"","setting":"","rules":[],"tone_examples":["",""],"themes":[""]}

体裁：{genre}
目标读者：{audience}
基调：{tone}

请确保返回有效的JSON格式，不要包含其他解释文字。`
}

// CharacterPrompt 人物卡生成提示词
func (pt *PromptTemplates) CharacterPrompt() string {
	return `请根据世界观为书中主要人物生成 JSON 人物卡数组：
[{"name":"","role":"","age":0,"appearance":"","background":"","motivation":"","flaws":[],"speech_tone":"","secrets":[],"relationship_map":{}}]

世界观：{world_view}
主要人物清单：{character_names}

每个人物需要8-12个详细要点，确保人物性格鲜明、有缺陷、有成长空间。
请返回有效的JSON数组格式。`
}

// OutlinePrompt 章节大纲提示词
func (pt *PromptTemplates) OutlinePrompt() string {
	return `你是资深小说编剧，请基于以下世界观与人物卡，给出整本书的章节大纲（共 {chapter_count} 章），每章 1-3 句的概要，明确本章的"剧情目标""小冲突/反转点""关键道具/线索（如果有）"。

输出 JSON 数组：
[{"index":1,"title":"","summary":"","goal":"","twist_hint":"","important_items":[]}]

世界观摘要：{world_view}
主要人物卡：{characters}
风格说明：{style_examples}

请确保章节之间有逻辑连贯性，情节起伏有致，返回有效的JSON数组。`
}

// ChapterPrompt 章节生成提示词
func (pt *PromptTemplates) ChapterPrompt() string {
	return `你是专业小说作者。请写"第 {chapter_index} 章"，要求如下：

1) 前情摘要（上文）：{prev_summary}
2) 本章目标：{chapter_goal}
3) 角色限定与说话风格：{characters}
4) 结构要求：
   - 字数目标：{min_words}-{max_words} 字
   - 开头（第一段）要用一句引人注意的钩子（不超过20字）
   - 中段需包含 1 个对话冲突和 2 个心理描写镜头
   - 结尾留一个小反转或悬念
5) 描写约束：
   - 以镜头化写作（动作、视觉、听觉、嗅觉）
   - 尽量用具体的动词和细节（避免"他很伤心"）
6) 风格示例：{style_examples}
7) 禁止：不要泄露重大伏笔（除非明确需要），不要突然引入未设定的超自然规则
8) 输出格式：只返回正文（不要返回备注或 JSON）

现在开始写作：`
}

// PolishPrompt 润色提示词
func (pt *PromptTemplates) PolishPrompt() string {
	return `你是资深中文编辑。请对以下章节进行润色：使语句更通顺、修复重复表达、加强意象、保持角色口吻一致；不要改变主要情节或人物决定。

原文：
{chapter_text}

润色要求：
1. 提升语言表达，使其更有文学性
2. 消除重复词汇和句式
3. 加强场景描写和人物心理刻画
4. 保持人物说话风格的一致性
5. 确保情节逻辑清晰

请直接输出润色后的完整文本，不要添加任何解释。`
}

// CritiquePrompt 质量审查提示词
func (pt *PromptTemplates) CritiquePrompt() string {
	return `作为资深小说编辑，请审查下文并输出 JSON 格式的分析结果：
{"logical_issues":[],"character_issues":[],"pacing_issues":[],"improvements":[],"fixed_example":"","overall_score":0}

审查内容：
{chapter_text}

请分析：
1) 逻辑矛盾（按优先级排序）
2) 人物性格冲突/不一致的地方
3) 节奏与情绪问题
4) 具体改进建议
5) 提供一个50-150字的修订示例
6) 给出1-10分的总体评分

请返回有效的JSON格式。`
}

// CompressPrompt 摘要压缩提示词
func (pt *PromptTemplates) CompressPrompt() string {
	return `请把下面的第1到第{chapter_count}章原文压缩成不超过 {max_length} 字的剧情总结，输出 JSON：
{"summary":"","character_states":[],"key_items":[],"timeline_events":[]}

原文内容：
{chapters_text}

压缩要求：
1. 保留主线冲突和关键转折点
2. 记录每个主要角色的现状和关系变化
3. 列出已知的关键线索/道具
4. 标注重要的时间节点

请返回有效的JSON格式。`
}

// ConsistencyCheckPrompt 一致性检查提示词
func (pt *PromptTemplates) ConsistencyCheckPrompt() string {
	return `请检查以下内容的一致性，输出 JSON 格式的检查结果：
{"timeline_conflicts":[],"character_conflicts":[],"prop_conflicts":[],"secret_conflicts":[],"suggestions":[]}

检查内容：
当前章节：{current_chapter}
时间线：{timeline}
人物状态：{characters}
道具状态：{props}
秘密信息：{secrets}

请检查：
1. 时间线是否有冲突
2. 人物行为是否符合设定
3. 道具状态是否一致
4. 秘密信息是否被意外泄露
5. 提供修复建议

请返回有效的JSON格式。`
}
