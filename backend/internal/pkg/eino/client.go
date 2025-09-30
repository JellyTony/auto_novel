package eino

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
	"github.com/cloudwego/eino-ext/components/model/deepseek"
	"github.com/cloudwego/eino-ext/components/model/qwen"
	"github.com/cloudwego/eino-ext/components/model/ollama"
)

// EinoLLMClient 基于 cloudwego/eino 框架的 LLM 客户端
type EinoLLMClient struct {
	model  model.BaseChatModel
	config *Config
}

// Config eino 客户端配置
type Config struct {
	Provider      string        `json:"provider"`       // deepseek, openai, azure, etc.
	ModelName     string        `json:"model_name"`
	Temperature   float32       `json:"temperature"`
	MaxTokens     int           `json:"max_tokens"`
	TopP          float32       `json:"top_p"`
	APIKey        string        `json:"api_key"`
	BaseURL       string        `json:"base_url"`
	Timeout       time.Duration `json:"timeout"`
	EnableTrace   bool          `json:"enable_trace"`
	EnableMetrics bool          `json:"enable_metrics"`
}

// NewEinoLLMClient 创建新的 eino LLM 客户端
func NewEinoLLMClient(ctx context.Context, config *Config) (*EinoLLMClient, error) {
	var chatModel model.BaseChatModel
	var err error

	// 根据配置的提供商创建相应的模型实例
	switch config.Provider {
	case "deepseek":
		chatModel, err = deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
			APIKey:      config.APIKey,
			Model:       config.ModelName,
			MaxTokens:   config.MaxTokens,
			Temperature: config.Temperature,
			TopP:        config.TopP,
			BaseURL:     config.BaseURL,
			Timeout:     config.Timeout,
		})
	case "qwen":
		chatModel, err = qwen.NewChatModel(ctx, &qwen.ChatModelConfig{
			APIKey:      config.APIKey,
			Model:       config.ModelName,
			MaxTokens:   config.MaxTokens,
			Temperature: config.Temperature,
			TopP:        config.TopP,
			BaseURL:     config.BaseURL,
			Timeout:     config.Timeout,
		})
	case "ollama":
		chatModel, err = ollama.NewChatModel(ctx, &ollama.ChatModelConfig{
			Model:       config.ModelName,
			MaxTokens:   config.MaxTokens,
			Temperature: config.Temperature,
			TopP:        config.TopP,
			BaseURL:     config.BaseURL,
			Timeout:     config.Timeout,
		})
	default:
		return nil, fmt.Errorf("unsupported model provider: %s", config.Provider)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create chat model: %w", err)
	}

	return &EinoLLMClient{
		model:  chatModel,
		config: config,
	}, nil
}

// GenerateText 生成文本
func (c *EinoLLMClient) GenerateText(ctx context.Context, prompt string, options ...interface{}) (string, error) {
	// 构建消息
	messages := []*schema.Message{
		schema.UserMessage(prompt),
	}

	// 构建调用选项
	callOptions := c.buildCallOptions(options...)

	// 调用模型生成
	response, err := c.model.Generate(ctx, messages, callOptions...)
	if err != nil {
		return "", fmt.Errorf("failed to generate text: %w", err)
	}

	// 提取生成的文本内容
	return response.Content, nil
}

// GenerateJSON 生成 JSON 格式的响应
func (c *EinoLLMClient) GenerateJSON(ctx context.Context, prompt string, target interface{}, options ...interface{}) error {
	text, err := c.GenerateText(ctx, prompt, options...)
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(text), target); err != nil {
		return fmt.Errorf("failed to unmarshal JSON response: %w", err)
	}

	return nil
}

// GenerateWithTemplate 使用模板生成内容
func (c *EinoLLMClient) GenerateWithTemplate(ctx context.Context, template string, variables map[string]interface{}, options ...interface{}) (string, error) {
	// 创建聊天模板
	chatTemplate := prompt.FromMessages(schema.FString,
		schema.SystemMessage("You are a helpful assistant."),
		&schema.Message{
			Role:    schema.User,
			Content: template,
		},
	)

	// 创建链式组合
	chain, err := compose.NewChain[map[string]any, *schema.Message]().
		AppendChatTemplate(chatTemplate).
		AppendChatModel(c.model).
		Compile(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to compile chain: %w", err)
	}

	// 执行链
	result, err := chain.Invoke(ctx, variables)
	if err != nil {
		return "", fmt.Errorf("failed to invoke chain: %w", err)
	}

	return result.Content, nil
}

// buildCallOptions 构建调用选项
func (c *EinoLLMClient) buildCallOptions(options ...interface{}) []model.Option {
	var callOptions []model.Option

	// 添加基础配置
	if c.config.Temperature > 0 {
		callOptions = append(callOptions, model.WithTemperature(float32(c.config.Temperature)))
	}
	if c.config.MaxTokens > 0 {
		callOptions = append(callOptions, model.WithMaxTokens(c.config.MaxTokens))
	}
	if c.config.TopP > 0 {
		callOptions = append(callOptions, model.WithTopP(float32(c.config.TopP)))
	}

	// 添加回调（暂时注释掉，需要正确的回调实现）
	// if c.config.EnableTrace {
	//     callOptions = append(callOptions, callbacks.NewLogCallback())
	// }

	return callOptions
}

// EinoAgentClient 基于 eino 的 Agent 客户端
type EinoAgentClient struct {
	client *EinoLLMClient
}

// NewEinoAgentClient 创建新的 Agent 客户端
func NewEinoAgentClient(client *EinoLLMClient) *EinoAgentClient {
	return &EinoAgentClient{
		client: client,
	}
}

// ExecuteAgent 执行 Agent 任务
func (c *EinoAgentClient) ExecuteAgent(ctx context.Context, agentType string, input map[string]interface{}) (map[string]interface{}, error) {
	// 根据 agentType 选择不同的 Agent 实现
	switch agentType {
	case "worldbuilding":
		return c.executeWorldBuildingAgent(ctx, input)
	case "character":
		return c.executeCharacterAgent(ctx, input)
	case "outline":
		return c.executeOutlineAgent(ctx, input)
	case "chapter":
		return c.executeChapterAgent(ctx, input)
	default:
		return nil, fmt.Errorf("unsupported agent type: %s", agentType)
	}
}

// executeWorldBuildingAgent 执行世界观构建 Agent
func (c *EinoAgentClient) executeWorldBuildingAgent(ctx context.Context, input map[string]interface{}) (map[string]interface{}, error) {
	template := `基于以下信息生成详细的世界观设定：
题材：{{.genre}}
背景：{{.background}}
风格：{{.style}}

请生成包含以下内容的世界观：
1. 世界背景和历史
2. 地理环境
3. 社会制度
4. 文化特色
5. 魔法/科技体系（如适用）

请以 JSON 格式返回结果。`

	result, err := c.client.GenerateWithTemplate(ctx, template, input)
	if err != nil {
		return nil, err
	}

	var worldView map[string]interface{}
	if err := json.Unmarshal([]byte(result), &worldView); err != nil {
		return nil, fmt.Errorf("failed to parse world view result: %w", err)
	}

	return worldView, nil
}

// executeCharacterAgent 执行角色生成 Agent
func (c *EinoAgentClient) executeCharacterAgent(ctx context.Context, input map[string]interface{}) (map[string]interface{}, error) {
	template := `基于以下世界观和要求生成角色：
世界观：{{.worldView}}
角色要求：{{.requirements}}

请生成包含以下信息的角色：
1. 基本信息（姓名、年龄、性别等）
2. 外貌描述
3. 性格特点
4. 背景故事
5. 能力和技能
6. 人际关系

请以 JSON 格式返回结果。`

	result, err := c.client.GenerateWithTemplate(ctx, template, input)
	if err != nil {
		return nil, err
	}

	var characters map[string]interface{}
	if err := json.Unmarshal([]byte(result), &characters); err != nil {
		return nil, fmt.Errorf("failed to parse characters result: %w", err)
	}

	return characters, nil
}

// executeOutlineAgent 执行大纲生成 Agent
func (c *EinoAgentClient) executeOutlineAgent(ctx context.Context, input map[string]interface{}) (map[string]interface{}, error) {
	template := `基于以下信息生成小说大纲：
世界观：{{.worldView}}
主要角色：{{.characters}}
故事主题：{{.theme}}
预期章节数：{{.chapterCount}}

请生成包含以下内容的大纲：
1. 故事概要
2. 主线剧情
3. 各章节标题和概要
4. 关键转折点
5. 结局设定

请以 JSON 格式返回结果。`

	result, err := c.client.GenerateWithTemplate(ctx, template, input)
	if err != nil {
		return nil, err
	}

	var outline map[string]interface{}
	if err := json.Unmarshal([]byte(result), &outline); err != nil {
		return nil, fmt.Errorf("failed to parse outline result: %w", err)
	}

	return outline, nil
}

// executeChapterAgent 执行章节生成 Agent
func (c *EinoAgentClient) executeChapterAgent(ctx context.Context, input map[string]interface{}) (map[string]interface{}, error) {
	template := `基于以下信息生成章节内容：
章节大纲：{{.chapterOutline}}
上下文：{{.context}}
角色信息：{{.characters}}
写作风格：{{.style}}

请生成完整的章节内容，包括：
1. 场景描述
2. 人物对话
3. 情节发展
4. 心理描写

请以 JSON 格式返回结果，包含 title 和 content 字段。`

	result, err := c.client.GenerateWithTemplate(ctx, template, input)
	if err != nil {
		return nil, err
	}

	var chapter map[string]interface{}
	if err := json.Unmarshal([]byte(result), &chapter); err != nil {
		return nil, fmt.Errorf("failed to parse chapter result: %w", err)
	}

	return chapter, nil
}

// buildAgentPrompt 根据 Agent 类型构建提示词
func buildAgentPrompt(agentType string, input map[string]interface{}) string {
	switch agentType {
	case "worldbuilding":
		return buildWorldBuildingPrompt(input)
	case "character":
		return buildCharacterPrompt(input)
	case "outline":
		return buildOutlinePrompt(input)
	case "chapter":
		return buildChapterPrompt(input)
	case "polish":
		return buildPolishPrompt(input)
	case "consistency":
		return buildConsistencyPrompt(input)
	default:
		return fmt.Sprintf("请根据以下输入执行 %s 任务：%v", agentType, input)
	}
}

// buildWorldBuildingPrompt 构建世界观生成提示词
func buildWorldBuildingPrompt(input map[string]interface{}) string {
	genre := getStringFromMap(input, "genre")
	audience := getStringFromMap(input, "audience")
	tone := getStringFromMap(input, "tone")

	return fmt.Sprintf(`
作为专业的世界观设计师，请为以下小说创建详细的世界观设定：

体裁：%s
目标读者：%s
基调：%s

请生成包含以下要素的世界观设定：
1. 世界标题和核心概念
2. 详细的背景设定（时代、地理、社会结构等）
3. 世界运行的核心规则（物理法则、魔法体系、科技水平等）
4. 基调示例（语言风格、氛围描述）
5. 核心主题

请以JSON格式返回，格式为：
{
  "title": "世界标题",
  "synopsis": "世界概要",
  "setting": "详细背景设定",
  "rules": ["核心规则1", "核心规则2"],
  "tone_examples": ["基调示例1", "基调示例2"],
  "themes": ["主题1", "主题2"]
}
`, genre, audience, tone)
}

// buildCharacterPrompt 构建角色生成提示词
func buildCharacterPrompt(input map[string]interface{}) string {
	worldView := getStringFromMap(input, "world_view")
	characterNames := getStringArrayFromMap(input, "character_names")

	return fmt.Sprintf(`
基于以下世界观设定，为指定的人物名称生成详细的人物卡：

世界观：%s

人物名称：%v

要求：
1. 每个人物都要有独特的性格和背景
2. 人物之间要有合理的关系网络
3. 符合世界观设定
4. 包含人物的缺陷和秘密

请以JSON格式返回，格式为：
{
  "characters": [
    {
      "name": "姓名",
      "role": "角色定位",
      "age": 年龄,
      "appearance": "外貌描述",
      "background": "背景故事",
      "motivation": "动机目标",
      "flaws": ["性格缺陷1", "性格缺陷2"],
      "speech_tone": "说话风格",
      "secrets": ["秘密1", "秘密2"],
      "relationship_map": {"人物名": "关系描述"}
    }
  ]
}
`, worldView, characterNames)
}

// buildOutlinePrompt 构建大纲生成提示词
func buildOutlinePrompt(input map[string]interface{}) string {
	worldView := getStringFromMap(input, "world_view")
	characters := getStringFromMap(input, "characters")
	chapterCount := getIntFromMap(input, "chapter_count")

	return fmt.Sprintf(`
基于以下世界观和人物设定，生成 %d 章的小说大纲：

世界观：%s

主要人物：%s

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
`, chapterCount, worldView, characters)
}

// buildChapterPrompt 构建章节生成提示词
func buildChapterPrompt(input map[string]interface{}) string {
	outline := getStringFromMap(input, "outline")
	context := getStringFromMap(input, "context")
	wordCount := getIntFromMap(input, "word_count")

	return fmt.Sprintf(`
基于以下信息生成章节内容：

章节大纲：%s

生成上下文：%s

要求：
1. 字数控制在 %d 字左右
2. 符合人物性格和说话风格
3. 推进剧情，实现本章目标
4. 包含适当的对话和描写
5. 体现转折点或冲突
6. 保持与前文的连贯性

请直接生成章节内容，不要包含任何格式标记。
`, outline, context, wordCount)
}

// buildPolishPrompt 构建润色提示词
func buildPolishPrompt(input map[string]interface{}) string {
	content := getStringFromMap(input, "content")
	style := getStringFromMap(input, "style")
	focus := getStringArrayFromMap(input, "focus")

	return fmt.Sprintf(`
请对以下章节内容进行润色：

原始内容：%s

润色风格：%s
重点关注：%v

要求：
1. 保持原有剧情和人物设定不变
2. 提升语言表达的流畅性和文学性
3. 优化对话的自然度
4. 增强场景描写的生动性
5. 保持原文的字数规模

请返回润色后的完整内容。
`, content, style, focus)
}

// buildConsistencyPrompt 构建一致性检查提示词
func buildConsistencyPrompt(input map[string]interface{}) string {
	project := getStringFromMap(input, "project")
	chapters := getStringFromMap(input, "chapters")
	checkType := getStringFromMap(input, "check_type")

	return fmt.Sprintf(`
请检查以下小说的一致性问题，重点关注：%s

项目信息：%s

章节内容：%s

请检查以下方面的一致性：
1. 人物性格和行为是否前后一致
2. 世界观设定是否有矛盾
3. 剧情逻辑是否合理
4. 时间线是否连贯
5. 道具和线索是否前后呼应

请以JSON格式返回检查结果：
{
  "issues": [
    {
      "type": "问题类型",
      "severity": "严重程度",
      "description": "问题描述",
      "location": "问题位置",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["整体建议1", "整体建议2"],
  "overall_score": 0.85
}
`, checkType, project, chapters)
}

// 辅助函数
func getStringFromMap(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getIntFromMap(m map[string]interface{}, key string) int {
	if v, ok := m[key]; ok {
		if i, ok := v.(int); ok {
			return i
		}
		if f, ok := v.(float64); ok {
			return int(f)
		}
	}
	return 0
}

func getStringArrayFromMap(m map[string]interface{}, key string) []string {
	if v, ok := m[key]; ok {
		if arr, ok := v.([]interface{}); ok {
			result := make([]string, len(arr))
			for i, item := range arr {
				if s, ok := item.(string); ok {
					result[i] = s
				}
			}
			return result
		}
		if arr, ok := v.([]string); ok {
			return arr
		}
	}
	return []string{}
}