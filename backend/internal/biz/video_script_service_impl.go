package biz

import (
	"context"
	"fmt"
	"backend/internal/pkg/models"
	"github.com/go-kratos/kratos/v2/log"
)

// VideoScriptServiceImpl 视频脚本服务实现
type VideoScriptServiceImpl struct {
	logger *log.Helper
}

// NewVideoScriptServiceImpl 创建视频脚本服务实现
func NewVideoScriptServiceImpl(logger log.Logger) VideoScriptService {
	return &VideoScriptServiceImpl{
		logger: log.NewHelper(logger),
	}
}

// GenerateVideoScript 生成视频脚本
func (s *VideoScriptServiceImpl) GenerateVideoScript(ctx context.Context, chapters []*models.Chapter, options *models.VideoScriptOptions) ([]*models.VideoScene, error) {
	s.logger.WithContext(ctx).Infof("Generating video script for %d chapters", len(chapters))
	
	scenes := make([]*models.VideoScene, 0)
	
	// 为每个章节生成场景
	for i, chapter := range chapters {
		// 根据选项生成场景数量
		scenesPerChapter := options.ScenesPerChapter
		if scenesPerChapter <= 0 {
			scenesPerChapter = 3 // 默认每章节3个场景
		}
		
		for j := 0; j < scenesPerChapter; j++ {
			scene := &models.VideoScene{
				ScreenIndex:       i*scenesPerChapter + j + 1,
				Text:              generateSceneText(chapter, j, scenesPerChapter),
				SuggestedBGMTag:   generateBGMTag(chapter, options),
				SuggestedImageTag: generateImageTag(chapter, j),
				TTSVoice:          options.VoiceType,
				Notes:             fmt.Sprintf("Generated from chapter: %s", chapter.Title),
			}
			scenes = append(scenes, scene)
		}
	}
	
	return scenes, nil
}

// generateSceneText 生成场景文本
func generateSceneText(chapter *models.Chapter, sceneIndex, totalScenes int) string {
	// 简单的文本分割逻辑
	content := chapter.RawContent
	if len(content) == 0 {
		content = chapter.PolishedContent
	}
	if len(content) == 0 {
		return "暂无内容"
	}
	
	// 将章节内容分割成多个场景
	contentLength := len(content)
	sceneLength := contentLength / totalScenes
	
	start := sceneIndex * sceneLength
	end := start + sceneLength
	
	if sceneIndex == totalScenes-1 {
		// 最后一个场景包含剩余所有内容
		end = contentLength
	}
	
	if start >= contentLength {
		return "内容片段"
	}
	
	if end > contentLength {
		end = contentLength
	}
	
	sceneText := content[start:end]
	
	// 确保场景文本不会太长（适合短视频）
	if len(sceneText) > 200 {
		sceneText = sceneText[:200] + "..."
	}
	
	return sceneText
}

// generateBGMTag 生成背景音乐标签
func generateBGMTag(chapter *models.Chapter, options *models.VideoScriptOptions) string {
	// 根据章节内容和平台生成合适的BGM标签
	platform := options.Platform
	
	// 根据平台返回不同的BGM风格
	switch platform {
	case "douyin", "kuaishou":
		return "热门流行"
	case "bilibili":
		return "二次元配乐"
	case "xiaohongshu":
		return "清新文艺"
	default:
		return "轻音乐"
	}
}

// generateImageTag 生成图片标签
func generateImageTag(chapter *models.Chapter, sceneIndex int) string {
	// 根据章节内容和场景索引生成图片标签
	tags := []string{
		"小说插画",
		"人物特写",
		"场景描述",
		"情节高潮",
		"环境渲染",
	}
	
	if sceneIndex < len(tags) {
		return tags[sceneIndex]
	}
	
	return "通用插画"
}