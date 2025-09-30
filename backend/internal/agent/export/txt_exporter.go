package export

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/pkg/models"
)

// TXTExporter TXT格式导出器
type TXTExporter struct {
	outputDir string
}

// NewTXTExporter 创建TXT导出器
func NewTXTExporter(outputDir string) *TXTExporter {
	return &TXTExporter{
		outputDir: outputDir,
	}
}

// Export 导出为TXT格式
func (t *TXTExporter) Export(project *models.NovelProject, options *models.ExportOptions) (*models.ExportResult, error) {
	// 确保输出目录存在
	if err := os.MkdirAll(t.outputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %w", err)
	}

	// 构建文件内容
	content := t.buildContent(project, options)

	// 生成文件名
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("%s_%s.txt", t.sanitizeFileName(project.Title), timestamp)
	filePath := filepath.Join(t.outputDir, fileName)

	// 写入文件
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return nil, fmt.Errorf("failed to write TXT file: %w", err)
	}

	// 获取文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	return &models.ExportResult{
		DownloadURL: fmt.Sprintf("/downloads/%s", fileName),
		FileName:    fileName,
		FileSize:    fileInfo.Size(),
	}, nil
}

// buildContent 构建文件内容
func (t *TXTExporter) buildContent(project *models.NovelProject, options *models.ExportOptions) string {
	var content strings.Builder

	// 添加标题和元数据
	if options.IncludeMetadata {
		t.addMetadata(&content, project)
	}

	// 添加大纲（如果需要）
	if options.IncludeOutline && project.Outline != nil {
		t.addOutline(&content, project.Outline)
	}

	// 添加章节内容
	t.addChapters(&content, project.Chapters)

	return content.String()
}

// addMetadata 添加元数据
func (t *TXTExporter) addMetadata(content *strings.Builder, project *models.NovelProject) {
	content.WriteString("=" + strings.Repeat("=", 60) + "=\n")
	content.WriteString(fmt.Sprintf("                    %s\n", project.Title))
	content.WriteString("=" + strings.Repeat("=", 60) + "=\n\n")

	content.WriteString("【作品信息】\n")
	content.WriteString(fmt.Sprintf("书名：%s\n", project.Title))
	content.WriteString(fmt.Sprintf("简介：%s\n", project.Description))
	
	if project.Genre != "" {
		content.WriteString(fmt.Sprintf("体裁：%s\n", project.Genre))
	}
	
	if project.TargetAudience != "" {
		content.WriteString(fmt.Sprintf("目标读者：%s\n", project.TargetAudience))
	}
	
	if project.Tone != "" {
		content.WriteString(fmt.Sprintf("调性：%s\n", project.Tone))
	}
	
	if len(project.Themes) > 0 {
		content.WriteString(fmt.Sprintf("主题：%s\n", strings.Join(project.Themes, "、")))
	}
	
	content.WriteString(fmt.Sprintf("创建时间：%s\n", project.CreatedAt.Format("2006年01月02日 15:04:05")))
	content.WriteString(fmt.Sprintf("状态：%s\n", t.getStatusText(project.Status)))
	
	// 统计信息
	totalWords := 0
	for _, chapter := range project.Chapters {
		totalWords += chapter.WordCount
	}
	content.WriteString(fmt.Sprintf("总章节数：%d\n", len(project.Chapters)))
	content.WriteString(fmt.Sprintf("总字数：%d\n", totalWords))
	
	content.WriteString("\n" + strings.Repeat("=", 62) + "\n\n")
}

// addOutline 添加大纲
func (t *TXTExporter) addOutline(content *strings.Builder, outline *models.Outline) {
	content.WriteString("【作品大纲】\n\n")
	
	for i, chapter := range outline.Chapters {
		content.WriteString(fmt.Sprintf("第%d章：%s\n", i+1, chapter.Title))
		content.WriteString(fmt.Sprintf("  概要：%s\n", chapter.Summary))
		
		if chapter.Goal != "" {
			content.WriteString(fmt.Sprintf("  目标：%s\n", chapter.Goal))
		}
		
		if chapter.TwistHint != "" {
			content.WriteString(fmt.Sprintf("  转折：%s\n", chapter.TwistHint))
		}
		
		if len(chapter.ImportantItems) > 0 {
			content.WriteString(fmt.Sprintf("  关键要素：%s\n", strings.Join(chapter.ImportantItems, "、")))
		}
		
		content.WriteString("\n")
	}
	
	content.WriteString(strings.Repeat("=", 62) + "\n\n")
}

// addChapters 添加章节内容
func (t *TXTExporter) addChapters(content *strings.Builder, chapters []*models.Chapter) {
	content.WriteString("【正文内容】\n\n")
	
	for i, chapter := range chapters {
		// 章节标题
		content.WriteString(fmt.Sprintf("第%d章  %s\n", i+1, chapter.Title))
		content.WriteString(strings.Repeat("-", 50) + "\n\n")
		
		// 章节内容
		chapterContent := t.getChapterContent(chapter)
		
		// 格式化段落
		paragraphs := strings.Split(chapterContent, "\n")
		for _, paragraph := range paragraphs {
			paragraph = strings.TrimSpace(paragraph)
			if paragraph != "" {
				// 添加段落缩进
				content.WriteString("    " + paragraph + "\n")
			} else {
				content.WriteString("\n")
			}
		}
		
		// 章节结尾
		content.WriteString("\n")
		if chapter.WordCount > 0 {
			content.WriteString(fmt.Sprintf("（本章字数：%d）\n", chapter.WordCount))
		}
		content.WriteString("\n" + strings.Repeat("=", 62) + "\n\n")
	}
}

// getChapterContent 获取章节内容
func (t *TXTExporter) getChapterContent(chapter *models.Chapter) string {
	// 优先使用润色后的内容，如果没有则使用原始内容
	if chapter.PolishedContent != "" {
		return chapter.PolishedContent
	}
	return chapter.RawContent
}

// getStatusText 获取状态文本
func (t *TXTExporter) getStatusText(status string) string {
	switch status {
	case "draft":
		return "草稿"
	case "generating":
		return "生成中"
	case "completed":
		return "已完成"
	default:
		return status
	}
}

// sanitizeFileName 清理文件名，移除不合法字符
func (t *TXTExporter) sanitizeFileName(fileName string) string {
	// 替换不合法的文件名字符
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)
	
	cleaned := replacer.Replace(fileName)
	
	// 限制文件名长度
	if len(cleaned) > 50 {
		cleaned = cleaned[:50]
	}
	
	return cleaned
}