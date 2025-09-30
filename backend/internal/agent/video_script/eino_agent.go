package video_script

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/internal/pkg/eino"
	"backend/internal/pkg/models"
	"github.com/cloudwego/eino/components/model"
)

// EinoVideoScriptAgent 基于 eino 框架的短视频脚本生成 Agent
type EinoVideoScriptAgent struct {
	client *eino.EinoLLMClient
}

// NewEinoVideoScriptAgent 创建基于 eino 的短视频脚本生成 Agent
func NewEinoVideoScriptAgent(client *eino.EinoLLMClient) *EinoVideoScriptAgent {
	return &EinoVideoScriptAgent{
		client: client,
	}
}

// GenerateVideoScript 生成短视频脚本
func (a *EinoVideoScriptAgent) GenerateVideoScript(ctx context.Context, req *GenerateVideoScriptRequest) (*GenerateVideoScriptResponse, error) {
	// 构建提示词
	prompt := fmt.Sprintf(`你是一个专业的短视频脚本编剧。请根据以下小说章节内容，生成适合短视频平台的分镜脚本。

章节标题：%s
章节内容：
%s

目标平台：%s
视频时长：%d秒
风格要求：%s

请生成包含以下元素的短视频脚本：
1. 分镜设计（每个镜头3-8秒）
2. 画面描述（具体的视觉元素）
3. 文案内容（旁白/字幕）
4. 音效建议
5. 转场效果
6. 关键情节点

请以JSON格式返回，结构如下：
{
  "title": "视频标题",
  "duration": %d,
  "platform": "%s",
  "style": "%s",
  "scenes": [
    {
      "index": 1,
      "duration": 5,
      "shot_type": "特写/中景/全景/航拍等",
      "visual_description": "画面描述",
      "narration": "旁白内容",
      "subtitle": "字幕内容",
      "sound_effects": ["音效1", "音效2"],
      "transition": "转场效果",
      "key_elements": ["关键元素1", "关键元素2"]
    }
  ],
  "hooks": {
    "opening": "开头吸引点",
    "climax": "高潮点",
    "ending": "结尾钩子"
  },
  "hashtags": ["#标签1", "#标签2", "#标签3"],
  "description": "视频描述文案"
}

注意事项：
1. 开头3秒内必须有强烈的视觉冲击或悬念
2. 每个镜头要有明确的视觉焦点
3. 文案要简洁有力，适合快节奏观看
4. 考虑平台特性（抖音/快手/B站等）
5. 保持原著的核心情节和人物特色
6. 添加适合的音效和转场效果`, 
		req.ChapterTitle, 
		req.ChapterContent, 
		req.Platform, 
		req.Duration, 
		req.Style,
		req.Duration,
		req.Platform,
		req.Style)

	// 生成响应
	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.8))
	if err != nil {
		return nil, fmt.Errorf("failed to generate video script: %w", err)
	}

	// 解析 JSON 响应
	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse video script JSON: %w", err)
	}

	// 解析场景数据
	scenes := make([]*models.VideoScriptScene, 0)
	if scenesData, ok := jsonResult["scenes"].([]interface{}); ok {
		for _, sceneData := range scenesData {
			if sceneMap, ok := sceneData.(map[string]interface{}); ok {
				scene := &models.VideoScriptScene{
					Index:             eino.GetIntFromJSON(sceneMap, "index"),
					Duration:          eino.GetIntFromJSON(sceneMap, "duration"),
					ShotType:          eino.GetStringFromJSON(sceneMap, "shot_type"),
					VisualDescription: eino.GetStringFromJSON(sceneMap, "visual_description"),
					Narration:         eino.GetStringFromJSON(sceneMap, "narration"),
					Subtitle:          eino.GetStringFromJSON(sceneMap, "subtitle"),
					SoundEffects:      eino.GetStringArrayFromJSON(sceneMap, "sound_effects"),
					Transition:        eino.GetStringFromJSON(sceneMap, "transition"),
					KeyElements:       eino.GetStringArrayFromJSON(sceneMap, "key_elements"),
				}
				scenes = append(scenes, scene)
			}
		}
	}

	// 解析钩子点
	hooks := &models.VideoHooks{}
	if hooksData, ok := jsonResult["hooks"].(map[string]interface{}); ok {
		hooks.Opening = eino.GetStringFromJSON(hooksData, "opening")
		hooks.Climax = eino.GetStringFromJSON(hooksData, "climax")
		hooks.Ending = eino.GetStringFromJSON(hooksData, "ending")
	}

	// 创建视频脚本对象
	videoScript := &models.VideoScript{
		ProjectID:    req.ProjectID,
		ChapterID:    req.ChapterID,
		Title:        eino.GetStringFromJSON(jsonResult, "title"),
		Duration:     eino.GetIntFromJSON(jsonResult, "duration"),
		Platform:     eino.GetStringFromJSON(jsonResult, "platform"),
		Style:        eino.GetStringFromJSON(jsonResult, "style"),
		Scenes:       scenes,
		Hooks:        hooks,
		Hashtags:     eino.GetStringArrayFromJSON(jsonResult, "hashtags"),
		Description:  eino.GetStringFromJSON(jsonResult, "description"),
		Status:       "draft",
	}

	return &GenerateVideoScriptResponse{
		VideoScript: videoScript,
	}, nil
}

// OptimizeVideoScript 优化短视频脚本
func (a *EinoVideoScriptAgent) OptimizeVideoScript(ctx context.Context, req *OptimizeVideoScriptRequest) (*OptimizeVideoScriptResponse, error) {
	// 构建当前脚本信息
	scenesInfo := make([]string, len(req.VideoScript.Scenes))
	for i, scene := range req.VideoScript.Scenes {
		scenesInfo[i] = fmt.Sprintf("镜头%d（%ds）：%s - %s", 
			scene.Index, scene.Duration, scene.ShotType, scene.VisualDescription)
	}

	prompt := fmt.Sprintf(`请根据以下反馈优化短视频脚本：

当前脚本信息：
标题：%s
平台：%s
时长：%d秒
风格：%s

当前分镜：
%s

优化要求：%s

请重点关注：
1. 提升视觉冲击力
2. 优化节奏控制
3. 增强情感共鸣
4. 提高完播率
5. 符合平台算法偏好

请以相同的JSON格式返回优化后的脚本。`,
		req.VideoScript.Title,
		req.VideoScript.Platform,
		req.VideoScript.Duration,
		req.VideoScript.Style,
		strings.Join(scenesInfo, "\n"),
		req.OptimizationRequirements)

	response, err := a.client.GenerateText(ctx, prompt, model.WithTemperature(0.7))
	if err != nil {
		return nil, fmt.Errorf("failed to optimize video script: %w", err)
	}

	// 解析优化后的脚本（与生成脚本相同的解析逻辑）
	var jsonResult map[string]interface{}
	if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
		return nil, fmt.Errorf("failed to parse optimized video script JSON: %w", err)
	}

	// 解析场景数据
		scenes := make([]*models.VideoScriptScene, 0)
		if scenesData, ok := jsonResult["scenes"].([]interface{}); ok {
			for _, sceneData := range scenesData {
				if sceneMap, ok := sceneData.(map[string]interface{}); ok {
					scene := &models.VideoScriptScene{
					Index:             eino.GetIntFromJSON(sceneMap, "index"),
					Duration:          eino.GetIntFromJSON(sceneMap, "duration"),
					ShotType:          eino.GetStringFromJSON(sceneMap, "shot_type"),
					VisualDescription: eino.GetStringFromJSON(sceneMap, "visual_description"),
					Narration:         eino.GetStringFromJSON(sceneMap, "narration"),
					Subtitle:          eino.GetStringFromJSON(sceneMap, "subtitle"),
					SoundEffects:      eino.GetStringArrayFromJSON(sceneMap, "sound_effects"),
					Transition:        eino.GetStringFromJSON(sceneMap, "transition"),
					KeyElements:       eino.GetStringArrayFromJSON(sceneMap, "key_elements"),
				}
				scenes = append(scenes, scene)
			}
		}
	}

	// 解析钩子点
	hooks := &models.VideoHooks{}
	if hooksData, ok := jsonResult["hooks"].(map[string]interface{}); ok {
		hooks.Opening = eino.GetStringFromJSON(hooksData, "opening")
		hooks.Climax = eino.GetStringFromJSON(hooksData, "climax")
		hooks.Ending = eino.GetStringFromJSON(hooksData, "ending")
	}

	// 更新视频脚本对象
	optimizedScript := &models.VideoScript{
		ID:           req.VideoScript.ID,
		ProjectID:    req.VideoScript.ProjectID,
		ChapterID:    req.VideoScript.ChapterID,
		Title:        eino.GetStringFromJSON(jsonResult, "title"),
		Duration:     eino.GetIntFromJSON(jsonResult, "duration"),
		Platform:     eino.GetStringFromJSON(jsonResult, "platform"),
		Style:        eino.GetStringFromJSON(jsonResult, "style"),
		Scenes:       scenes,
		Hooks:        hooks,
		Hashtags:     eino.GetStringArrayFromJSON(jsonResult, "hashtags"),
		Description:  eino.GetStringFromJSON(jsonResult, "description"),
		Status:       "optimized",
	}

	return &OptimizeVideoScriptResponse{
		VideoScript: optimizedScript,
	}, nil
}

// GeneratePlatformVariants 生成不同平台的脚本变体
func (a *EinoVideoScriptAgent) GeneratePlatformVariants(ctx context.Context, req *GeneratePlatformVariantsRequest) (*GeneratePlatformVariantsResponse, error) {
	variants := make([]*models.VideoScript, 0)

	for _, platform := range req.TargetPlatforms {
		// 根据平台特性调整脚本
		platformPrompt := fmt.Sprintf(`请将以下短视频脚本适配到%s平台：

原脚本信息：
标题：%s
时长：%d秒
场景数：%d

平台特性要求：
%s

请根据%s平台的特点进行适配：
1. 调整视频时长和节奏
2. 优化标题和标签
3. 适配平台用户偏好
4. 调整视觉风格
5. 优化互动元素

请以JSON格式返回适配后的脚本。`,
			platform,
			req.BaseScript.Title,
			req.BaseScript.Duration,
			len(req.BaseScript.Scenes),
			getPlatformRequirements(platform),
			platform)

		response, err := a.client.GenerateText(ctx, platformPrompt, model.WithTemperature(0.6))
		if err != nil {
			return nil, fmt.Errorf("failed to generate variant for platform %s: %w", platform, err)
		}

		// 解析平台变体脚本
		var jsonResult map[string]interface{}
		if err := json.Unmarshal([]byte(response), &jsonResult); err != nil {
			continue // 跳过解析失败的变体
		}

		// 解析场景数据
		scenes := make([]*models.VideoScriptScene, 0)
		if scenesData, ok := jsonResult["scenes"].([]interface{}); ok {
			for _, sceneData := range scenesData {
				if sceneMap, ok := sceneData.(map[string]interface{}); ok {
					scene := &models.VideoScriptScene{
						Index:             eino.GetIntFromJSON(sceneMap, "index"),
						Duration:          eino.GetIntFromJSON(sceneMap, "duration"),
						ShotType:          eino.GetStringFromJSON(sceneMap, "shot_type"),
						VisualDescription: eino.GetStringFromJSON(sceneMap, "visual_description"),
						Narration:         eino.GetStringFromJSON(sceneMap, "narration"),
						Subtitle:          eino.GetStringFromJSON(sceneMap, "subtitle"),
						SoundEffects:      eino.GetStringArrayFromJSON(sceneMap, "sound_effects"),
						Transition:        eino.GetStringFromJSON(sceneMap, "transition"),
						KeyElements:       eino.GetStringArrayFromJSON(sceneMap, "key_elements"),
					}
					scenes = append(scenes, scene)
				}
			}
		}

		// 解析钩子点
		hooks := &models.VideoHooks{}
		if hooksData, ok := jsonResult["hooks"].(map[string]interface{}); ok {
			hooks.Opening = eino.GetStringFromJSON(hooksData, "opening")
			hooks.Climax = eino.GetStringFromJSON(hooksData, "climax")
			hooks.Ending = eino.GetStringFromJSON(hooksData, "ending")
		}

		variant := &models.VideoScript{
			ProjectID:    req.BaseScript.ProjectID,
			ChapterID:    req.BaseScript.ChapterID,
			Title:        eino.GetStringFromJSON(jsonResult, "title"),
			Duration:     eino.GetIntFromJSON(jsonResult, "duration"),
			Platform:     platform,
			Style:        eino.GetStringFromJSON(jsonResult, "style"),
			Scenes:       scenes,
			Hooks:        hooks,
			Hashtags:     eino.GetStringArrayFromJSON(jsonResult, "hashtags"),
			Description:  eino.GetStringFromJSON(jsonResult, "description"),
			Status:       "variant",
		}

		variants = append(variants, variant)
	}

	return &GeneratePlatformVariantsResponse{
		Variants: variants,
	}, nil
}

// GetCapabilities 获取 Agent 能力描述
func (a *EinoVideoScriptAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "EinoVideoScriptAgent",
		"description": "基于 eino 框架的短视频脚本生成 Agent",
		"capabilities": []string{
			"generate_video_script",
			"optimize_video_script",
			"generate_platform_variants",
		},
		"supported_platforms": []string{
			"douyin", "kuaishou", "bilibili", "xiaohongshu", "weibo",
		},
		"supported_styles": []string{
			"dramatic", "humorous", "suspenseful", "romantic", "action",
		},
	}
}

// 辅助函数：获取平台特性要求
func getPlatformRequirements(platform string) string {
	requirements := map[string]string{
		"douyin": "15-60秒，竖屏9:16，快节奏，强视觉冲击，年轻化表达",
		"kuaishou": "15-57秒，竖屏，接地气，真实感，情感共鸣",
		"bilibili": "1-3分钟，横屏16:9，深度内容，弹幕互动，二次元文化",
		"xiaohongshu": "15-60秒，竖屏，精美画面，生活化，种草属性",
		"weibo": "15-140秒，方形1:1或竖屏，热点话题，社交传播",
	}
	
	if req, ok := requirements[platform]; ok {
		return req
	}
	return "通用短视频平台要求"
}