package character

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/models"
	"github.com/cloudwego/eino/components/model"
)

// EinoCharacterAgent 基于 eino 框架的角色生成 Agent
type EinoCharacterAgent struct {
	client *eino.EinoLLMClient
}

// NewEinoCharacterAgent 创建基于 eino 的角色生成 Agent
func NewEinoCharacterAgent(client *eino.EinoLLMClient) *EinoCharacterAgent {
	return &EinoCharacterAgent{
		client: client,
	}
}

// GenerateCharacters 生成人物卡
func (a *EinoCharacterAgent) GenerateCharacters(ctx context.Context, req *GenerateCharactersRequest) (*GenerateCharactersResponse, error) {
	// 构建提示词
	prompt := fmt.Sprintf(`你是一个专业的小说人物设定专家。请基于以下世界观设定，为指定的人物名称生成详细的人物卡。

世界观信息：
标题：%s
设定：%s
规则：%v
主题：%v

人物名称：%v

请为每个人物生成详细的人物卡，返回 JSON 数组格式：
[
  {
    "name": "人物姓名",
    "age": 25,
    "gender": "性别",
    "appearance": "外貌描述（200-300字）",
    "personality": "性格特点（200-300字）",
    "background": "背景故事（300-500字）",
    "skills": ["技能1", "技能2", "技能3"],
    "relationships": {"关系类型": "关系描述"},
    "goals": "人物目标和动机（200字）",
    "flaws": "人物缺陷和弱点（100字）",
    "dialogue_style": "对话风格描述（100字）"
  }
]

请确保人物设定与世界观一致，每个人物都有独特的个性和背景。`,
		req.WorldView.Title, req.WorldView.Setting, req.WorldView.KeyRules, req.WorldView.Themes, req.CharacterNames)

	// 生成响应
	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.8))
	if err != nil {
		return nil, fmt.Errorf("failed to generate characters: %w", err)
	}

	// 解析 JSON 响应
	var charactersData []map[string]interface{}
	if err := json.Unmarshal([]byte(response), &charactersData); err != nil {
		return nil, fmt.Errorf("failed to parse characters JSON: %w", err)
	}

	// 转换为 Character 模型
	var characters []*models.Character
	for _, charData := range charactersData {
		character := &models.Character{
			ProjectID:       req.ProjectID,
			Name:            eino.GetStringFromJSON(charData, "name"),
			Role:            eino.GetStringFromJSON(charData, "role"),
			Age:             eino.GetIntFromJSON(charData, "age"),
			Appearance:      eino.GetStringFromJSON(charData, "appearance"),
			Background:      eino.GetStringFromJSON(charData, "background"),
			Motivation:      eino.GetStringFromJSON(charData, "motivation"),
			Flaws:           eino.GetStringArrayFromJSON(charData, "flaws"),
			SpeechTone:      eino.GetStringFromJSON(charData, "speech_tone"),
			Secrets:         eino.GetStringArrayFromJSON(charData, "secrets"),
			RelationshipMap: eino.GetStringMapFromJSON(charData, "relationship_map"),
		}
		characters = append(characters, character)
	}

	return &GenerateCharactersResponse{
		Characters: characters,
	}, nil
}

// RefineCharacter 优化人物卡
func (a *EinoCharacterAgent) RefineCharacter(ctx context.Context, req *RefineCharacterRequest) (*RefineCharacterResponse, error) {
	prompt := fmt.Sprintf(`你是一个专业的小说人物设定专家。请根据用户反馈优化以下人物卡。

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
关系：%v

优化反馈：%s

请返回优化后的人物卡 JSON 格式：
{
  "name": "人物姓名",
  "role": "角色定位",
  "age": 25,
  "appearance": "外貌描述",
  "background": "背景故事",
  "motivation": "动机目标",
  "flaws": ["缺陷1", "缺陷2"],
  "speech_tone": "说话风格",
  "secrets": ["秘密1", "秘密2"],
  "relationship_map": {"人物名": "关系描述"}
}

请保持人物的核心特色，同时根据反馈进行合理的调整和优化。`,
		req.Character.Name, req.Character.Role, req.Character.Age,
		req.Character.Appearance, req.Character.Background, req.Character.Motivation,
		req.Character.Flaws, req.Character.SpeechTone, req.Character.Secrets,
		req.Character.RelationshipMap, req.Feedback)

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.7))
	if err != nil {
		return nil, fmt.Errorf("failed to refine character: %w", err)
	}

	var charData map[string]interface{}
	if err := json.Unmarshal([]byte(response), &charData); err != nil {
		return nil, fmt.Errorf("failed to parse refined character JSON: %w", err)
	}

	// 更新人物卡
	req.Character.Name = eino.GetStringFromJSON(charData, "name")
	req.Character.Role = eino.GetStringFromJSON(charData, "role")
	req.Character.Age = eino.GetIntFromJSON(charData, "age")
	req.Character.Appearance = eino.GetStringFromJSON(charData, "appearance")
	req.Character.Background = eino.GetStringFromJSON(charData, "background")
	req.Character.Motivation = eino.GetStringFromJSON(charData, "motivation")
	req.Character.Flaws = eino.GetStringArrayFromJSON(charData, "flaws")
	req.Character.SpeechTone = eino.GetStringFromJSON(charData, "speech_tone")
	req.Character.Secrets = eino.GetStringArrayFromJSON(charData, "secrets")
	req.Character.RelationshipMap = eino.GetStringMapFromJSON(charData, "relationship_map")

	return &RefineCharacterResponse{
		Character: req.Character,
	}, nil
}

// ValidateCharacters 验证人物卡的一致性
func (a *EinoCharacterAgent) ValidateCharacters(ctx context.Context, req *ValidateCharactersRequest) (*ValidateCharactersResponse, error) {
	// 构建人物信息
	var charactersInfo []string
	for _, char := range req.Characters {
		info := fmt.Sprintf("姓名：%s，年龄：%d，角色：%s，背景：%s",
			char.Name, char.Age, char.Role, char.Background)
		charactersInfo = append(charactersInfo, info)
	}

	prompt := fmt.Sprintf(`你是一个专业的小说人物设定评估专家。请验证以下人物卡与世界观的一致性和合理性。

世界观：
标题：%s
设定：%s
规则：%v

人物卡：
%s

请从以下维度进行评估：
1. 世界观一致性：人物设定是否符合世界观规则
2. 人物合理性：性格、背景、技能是否合理
3. 人物独特性：每个人物是否有独特的特色
4. 关系合理性：人物间关系是否合理

请返回 JSON 格式的验证结果：
{
  "is_valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`,
		req.WorldView.Title, req.WorldView.Setting, req.WorldView.KeyRules,
		fmt.Sprintf("%v", charactersInfo))

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.3))
	if err != nil {
		return nil, fmt.Errorf("failed to validate characters: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("failed to parse validation result JSON: %w", err)
	}

	return &ValidateCharactersResponse{
		IsValid:     eino.GetBoolFromJSON(result, "is_valid"),
		Issues:      eino.GetStringArrayFromJSON(result, "issues"),
		Suggestions: eino.GetStringArrayFromJSON(result, "suggestions"),
	}, nil
}

// GenerateCharacterDialogue 生成人物对话
func (a *EinoCharacterAgent) GenerateCharacterDialogue(ctx context.Context, req *GenerateDialogueRequest) (*GenerateDialogueResponse, error) {
	prompt := fmt.Sprintf(`你是一个专业的小说对话生成专家。请根据人物设定和情境生成符合人物特色的对话。

人物信息：
姓名：%s
角色：%s
背景：%s
说话风格：%s

情境：%s
情绪：%s

请生成一段符合该人物特色的对话（100-200字），要体现人物的性格特点和对话风格。
直接返回对话内容，不需要JSON格式。`,
		req.Character.Name, req.Character.Role, req.Character.Background,
		req.Character.SpeechTone, req.Context, req.Emotion)

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.9))
	if err != nil {
		return nil, fmt.Errorf("failed to generate dialogue: %w", err)
	}

	return &GenerateDialogueResponse{
		Dialogue: response,
	}, nil
}

// GetCapabilities 获取 Agent 能力描述
func (a *EinoCharacterAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "EinoCharacterAgent",
		"description": "基于 eino 框架的角色生成 Agent",
		"capabilities": []string{
			"generate_characters",
			"refine_character",
			"validate_characters",
			"generate_dialogue",
		},
		"supported_features": []string{
			"multi_character_generation",
			"character_validation",
			"dialogue_generation",
			"character_refinement",
		},
	}
}