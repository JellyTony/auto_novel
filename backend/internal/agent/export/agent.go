package export

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/pkg/models"
)

// ExportAgent 导出代理
type ExportAgent struct {
	// 可以添加配置项，如导出文件存储路径等
	outputDir string
}

// NewExportAgent 创建导出代理
func NewExportAgent(outputDir string) *ExportAgent {
	return &ExportAgent{
		outputDir: outputDir,
	}
}

// ExportNovel 导出小说
func (a *ExportAgent) ExportNovel(ctx context.Context, project *models.NovelProject, format string, options *models.ExportOptions) (*models.ExportResult, error) {
	switch strings.ToLower(format) {
	case "txt":
		return a.exportToTXT(ctx, project, options)
	case "epub":
		return a.exportToEPUB(ctx, project, options)
	default:
		return nil, fmt.Errorf("unsupported export format: %s", format)
	}
}

// exportToTXT 导出为TXT格式
func (a *ExportAgent) exportToTXT(ctx context.Context, project *models.NovelProject, options *models.ExportOptions) (*models.ExportResult, error) {
	exporter := NewTXTExporter(a.outputDir)
	return exporter.Export(project, options)
}

// exportToEPUB 导出为EPUB格式
func (a *ExportAgent) exportToEPUB(ctx context.Context, project *models.NovelProject, options *models.ExportOptions) (*models.ExportResult, error) {
	// 生成文件名和路径
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("%s_%s.epub", project.Title, timestamp)
	filePath := filepath.Join(a.outputDir, fileName)
	
	// 创建EPUB结构
	epub := &EPUBBuilder{
		Title:       project.Title,
		Description: project.Description,
		Language:    "zh-CN",
		Chapters:    project.Chapters,
		Options:     options,
	}
	
	fileSize, err := epub.Build(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to build EPUB: %w", err)
	}
	
	return &models.ExportResult{
		DownloadURL: fmt.Sprintf("/downloads/%s", fileName),
		FileName:    fileName,
		FileSize:    fileSize,
	}, nil
}

// GetCapabilities 返回代理能力描述
func (a *ExportAgent) GetCapabilities() map[string]interface{} {
	return map[string]interface{}{
		"name":        "ExportAgent",
		"type":        "export",
		"description": "负责将小说导出为不同格式（TXT、EPUB）",
		"capabilities": []string{
			"export_txt",
			"export_epub",
			"include_metadata",
			"include_outline",
		},
		"supported_formats": []string{"txt", "epub"},
	}
}