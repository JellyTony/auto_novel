package service

import (
	"context"
	"fmt"

	"backend/internal/agent/export"
	"backend/internal/biz"
	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
)

// ExportService 导出服务实现
type ExportService struct {
	exportAgent *export.ExportAgent
	log         *log.Helper
}

// NewExportService 创建导出服务
func NewExportService(logger log.Logger) biz.ExportService {
	// 创建导出目录，这里使用默认路径
	outputDir := "./exports"
	
	exportAgent := export.NewExportAgent(outputDir)

	return &ExportService{
		exportAgent: exportAgent,
		log:         log.NewHelper(logger),
	}
}

// ExportNovel 导出小说
func (s *ExportService) ExportNovel(ctx context.Context, project *models.NovelProject, format string, options *models.ExportOptions) (*models.ExportResult, error) {
	s.log.WithContext(ctx).Infof("Exporting novel %s in format %s", project.ID, format)

	// 验证格式
	if format != "txt" && format != "epub" {
		return nil, fmt.Errorf("unsupported export format: %s", format)
	}

	// 调用导出代理
	result, err := s.exportAgent.ExportNovel(ctx, project, format, options)
	if err != nil {
		s.log.WithContext(ctx).Errorf("Failed to export novel: %v", err)
		return nil, fmt.Errorf("export failed: %w", err)
	}

	s.log.WithContext(ctx).Infof("Successfully exported novel %s, file: %s, size: %d bytes", 
		project.ID, result.FileName, result.FileSize)

	return result, nil
}