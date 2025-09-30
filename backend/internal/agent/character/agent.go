package character

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
)

// 请求和响应结构
type GenerateCharactersRequest struct {
	ProjectID      string              `json:"project_id"`
	WorldView      *models.WorldView   `json:"world_view"`
	CharacterNames []string            `json:"character_names"`
	Options        *llm.GenerateOptions `json:"options"`
}

type GenerateCharactersResponse struct {
	Characters []*models.Character `json:"characters"`
}

type RefineCharacterRequest struct {
	Character *models.Character    `json:"character"`
	Feedback  string              `json:"feedback"`
	Options   *llm.GenerateOptions `json:"options"`
}

type RefineCharacterResponse struct {
	Character *models.Character `json:"character"`
}

type ValidateCharactersRequest struct {
	Characters []*models.Character  `json:"characters"`
	WorldView  *models.WorldView    `json:"world_view"`
	Options    *llm.GenerateOptions `json:"options"`
}

type ValidateCharactersResponse struct {
	IsValid     bool     `json:"is_valid"`
	Issues      []string `json:"issues"`
	Suggestions []string `json:"suggestions"`
}

type GenerateDialogueRequest struct {
	Character *models.Character    `json:"character"`
	Context   string              `json:"context"`
	Emotion   string              `json:"emotion"`
	Options   *llm.GenerateOptions `json:"options"`
}

type GenerateDialogueResponse struct {
	Dialogue string `json:"dialogue"`
}

// CharacterAgent 人物卡生成 Agent
type CharacterAgent struct {
	llmClient llm.LLMClient
	templates *llm.PromptTemplates
}

// NewCharacterAgent 创建人物生成代理
func NewCharacterAgent(llmClient llm.LLMClient) *CharacterAgent {
	return &CharacterAgent{
		llmClient: llmClient,
		templates: &llm.PromptTemplates{},
	}
}

// GenerateCharacters 生成人物卡
func (a *CharacterAgent) GenerateCharacters(ctx context.Context, req *GenerateCharactersRequest) (*GenerateCharactersResponse, error) {
	// 构建提示词
	prompt := fmt.Sprintf(`
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
`, formatWorldView(req.WorldView), req.CharacterNames)

	// 生成 JSON 响应
	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to generate characters: %w", err)
	}

	// 转换为 Character 模型数组
	characters := make([]*models.Character, 0)

	// 解析 JSON 结构
	if charactersData, ok := jsonResult["characters"].([]interface{}); ok {
		for _, charData := range charactersData {
			if charMap, ok := charData.(map[string]interface{}); ok {
				character := &models.Character{
					ProjectID:       req.ProjectID,
					Name:           getStringFromJSON(charMap, "name"),
					Role:           getStringFromJSON(charMap, "role"),
					Age:            getIntFromJSON(charMap, "age"),
					Appearance:     getStringFromJSON(charMap, "appearance"),
					Background:     getStringFromJSON(charMap, "background"),
					Motivation:     getStringFromJSON(charMap, "motivation"),
					Flaws:          getStringArrayFromJSON(charMap, "flaws"),
					SpeechTone:     getStringFromJSON(charMap, "speech_tone"),
					Secrets:        getStringArrayFromJSON(charMap, "secrets"),
					RelationshipMap: getStringMapFromJSON(charMap, "relationship_map"),
				}
				characters = append(characters, character)
			}
		}
	} else {
		return nil, fmt.Errorf("unexpected JSON structure: missing 'characters' array")
	}

	return &GenerateCharactersResponse{
		Characters: characters,
	}, nil
}

// RefineCharacter 优化人物卡
func (a *CharacterAgent) RefineCharacter(ctx context.Context, req *RefineCharacterRequest) (*RefineCharacterResponse, error) {
	prompt := fmt.Sprintf(`
请根据以下反馈优化人物卡：

当前人物卡：
姓名：%s
角色：%s
年龄：%d
外貌：%s
背景：%s
动机：%s
缺陷：%v
说话风格：%s
秘密：%v
关系网络：%v

反馈意见：%s

请返回优化后的人物卡，保持JSON格式。
`, req.Character.Name, req.Character.Role, req.Character.Age,
		req.Character.Appearance, req.Character.Background, req.Character.Motivation,
		req.Character.Flaws, req.Character.SpeechTone, req.Character.Secrets,
		req.Character.RelationshipMap, req.Feedback)

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to refine character: %w", err)
	}

	// 解析优化后的人物卡
	character := &models.Character{
		ID:              req.Character.ID,
		ProjectID:       req.Character.ProjectID,
		Name:           getStringFromJSON(jsonResult, "name"),
		Role:           getStringFromJSON(jsonResult, "role"),
		Age:            getIntFromJSON(jsonResult, "age"),
		Appearance:     getStringFromJSON(jsonResult, "appearance"),
		Background:     getStringFromJSON(jsonResult, "background"),
		Motivation:     getStringFromJSON(jsonResult, "motivation"),
		Flaws:          getStringArrayFromJSON(jsonResult, "flaws"),
		SpeechTone:     getStringFromJSON(jsonResult, "speech_tone"),
		Secrets:        getStringArrayFromJSON(jsonResult, "secrets"),
		RelationshipMap: getStringMapFromJSON(jsonResult, "relationship_map"),
	}

	return &RefineCharacterResponse{
		Character: character,
	}, nil
}

// ValidateCharacters 验证人物卡的一致性
func (a *CharacterAgent) ValidateCharacters(ctx context.Context, req *ValidateCharactersRequest) (*ValidateCharactersResponse, error) {
	charactersInfo := make([]string, len(req.Characters))
	for i, char := range req.Characters {
		charactersInfo[i] = fmt.Sprintf("姓名：%s，角色：%s，背景：%s", char.Name, char.Role, char.Background)
	}

	prompt := fmt.Sprintf(`
请验证以下人物卡是否与世界观设定一致，以及人物之间的关系是否合理：

世界观：%s

人物列表：
%s

请检查：
1. 人物设定是否符合世界观
2. 人物关系是否合理
3. 是否存在矛盾或不一致的地方

请以JSON格式返回验证结果：
{
  "is_valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}
`, formatWorldView(req.WorldView), strings.Join(charactersInfo, "\n"))

	jsonResult, err := a.llmClient.GenerateJSON(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to validate characters: %w", err)
	}

	return &ValidateCharactersResponse{
		IsValid:     getBoolFromJSON(jsonResult, "is_valid"),
		Issues:      getStringArrayFromJSON(jsonResult, "issues"),
		Suggestions: getStringArrayFromJSON(jsonResult, "suggestions"),
	}, nil
}

// GenerateCharacterDialogue 生成人物对话
func (a *CharacterAgent) GenerateCharacterDialogue(ctx context.Context, req *GenerateDialogueRequest) (*GenerateDialogueResponse, error) {
	prompt := fmt.Sprintf(`
基于以下人物设定，在指定情境下生成符合人物性格的对话：

人物信息：
姓名：%s
角色：%s
说话风格：%s
性格特点：%v

情境：%s
情绪状态：%s

请生成一段符合该人物性格和说话风格的对话，体现其在当前情境和情绪下的表现。
`, req.Character.Name, req.Character.Role, req.Character.SpeechTone,
		req.Character.Flaws, req.Context, req.Emotion)

	dialogue, err := a.llmClient.GenerateText(ctx, prompt, req.Options)
	if err != nil {
		return nil, fmt.Errorf("failed to generate dialogue: %w", err)
	}

	return &GenerateDialogueResponse{
		Dialogue: dialogue,
	}, nil
}

// GetCapabilities 返回代理能力描述
func (a *CharacterAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "CharacterAgent",
		"type":        "character_generation",
		"description": "负责生成、优化和验证小说人物卡",
		"capabilities": []string{
			"generate_characters",
			"refine_character",
			"validate_characters",
			"generate_dialogue",
		},
	}
}

// 辅助函数
func formatWorldView(worldView *models.WorldView) string {
	return fmt.Sprintf("标题：%s\n简介：%s\n设定：%s\n规则：%v\n主题：%v",
		worldView.Title, worldView.Synopsis, worldView.Setting,
		worldView.KeyRules, worldView.Themes)
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

func getStringMapFromJSON(data map[string]interface{}, key string) map[string]string {
	if val, ok := data[key].(map[string]interface{}); ok {
		result := make(map[string]string)
		for k, v := range val {
			if str, ok := v.(string); ok {
				result[k] = str
			}
		}
		return result
	}
	return map[string]string{}
}