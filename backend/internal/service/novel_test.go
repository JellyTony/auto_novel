package service

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	pb "backend/api/novel/v1"
	"backend/internal/biz"
	"backend/internal/pkg/models"
	"backend/internal/service/mocks"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

func TestNovelService_CreateProject(t *testing.T) {
	tests := []struct {
		name        string
		request     *pb.CreateProjectRequest
		setupMock   func(mockRepo *mocks.MockNovelRepo)
		expected    *pb.CreateProjectResponse
		expectError bool
		errorMsg    string
	}{
		{
			name: "成功创建项目",
			request: &pb.CreateProjectRequest{
				Title:          "测试小说",
				Description:    "这是一个测试小说项目",
				Genre:          "科幻",
				TargetAudience: "青年",
				Tone:           "快节奏",
				Themes:         []string{"科幻", "冒险"},
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
					ID:             "test-id",
					Title:          "测试小说",
					Description:    "这是一个测试小说项目",
					Genre:          "科幻",
					TargetAudience: "青年",
					Tone:           "快节奏",
					Themes:         []string{"科幻", "冒险"},
					Status:         "draft",
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}, nil)
			},
			expected: &pb.CreateProjectResponse{
				ProjectId: "test-id",
				Title:     "测试小说",
				Status:    "draft",
			},
			expectError: false,
		},
		{
			name: "创建项目失败 - 数据库错误",
			request: &pb.CreateProjectRequest{
				Title:       "测试小说",
				Description: "这是一个测试小说项目",
				Genre:       "科幻",
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(nil, errors.New("database error"))
			},
			expectError: true,
			errorMsg:    "database error",
		},
		{
			name: "创建项目失败 - 标题为空",
			request: &pb.CreateProjectRequest{
				Title:       "",
				Description: "这是一个测试小说项目",
				Genre:       "科幻",
			},
			setupMock:   func(mockRepo *mocks.MockNovelRepo) {},
			expectError: true,
			errorMsg:    "title is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 为每个子测试创建独立的 mock
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRepo := mocks.NewMockNovelRepo(ctrl)
			mockExportService := mocks.NewMockExportService(ctrl)
			mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
			mockLogger := log.NewStdLogger(os.Stdout)
			uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
			service := &NovelService{uc: uc}

			tt.setupMock(mockRepo)

			resp, err := service.CreateProject(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				if tt.expected != nil {
					assert.Equal(t, tt.expected.ProjectId, resp.ProjectId)
					assert.Equal(t, tt.expected.Title, resp.Title)
					assert.Equal(t, tt.expected.Status, resp.Status)
				}
			}
		})
	}
}

func TestNovelService_GetProject(t *testing.T) {
	tests := []struct {
		name        string
		request     *pb.GetProjectRequest
		setupMock   func(mockRepo *mocks.MockNovelRepo)
		expectError bool
		errorMsg    string
	}{
		{
			name: "成功获取项目",
			request: &pb.GetProjectRequest{
				ProjectId: "test-id",
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().GetProject(gomock.Any(), "test-id").Return(&models.NovelProject{
					ID:          "test-id",
					Title:       "测试小说",
					Description: "这是一个测试小说项目",
					Genre:       "科幻",
					Status:      "draft",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
				mockRepo.EXPECT().ListChapters(gomock.Any(), "test-id").Return([]*models.Chapter{}, nil)
			},
			expectError: false,
		},
		{
			name: "获取项目失败 - 项目不存在",
			request: &pb.GetProjectRequest{
				ProjectId: "non-existent-id",
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().GetProject(gomock.Any(), "non-existent-id").Return(nil, errors.New("project not found"))
			},
			expectError: true,
			errorMsg:    "project not found",
		},
		{
			name: "获取项目失败 - 项目ID为空",
			request: &pb.GetProjectRequest{
				ProjectId: "",
			},
			setupMock:   func(mockRepo *mocks.MockNovelRepo) {},
			expectError: true,
			errorMsg:    "project_id is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 为每个子测试创建独立的 mock
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRepo := mocks.NewMockNovelRepo(ctrl)
			mockExportService := mocks.NewMockExportService(ctrl)
			mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
			mockLogger := log.NewStdLogger(os.Stdout)
			uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
			service := &NovelService{uc: uc}

			tt.setupMock(mockRepo)

			resp, err := service.GetProject(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.Equal(t, tt.request.ProjectId, resp.Project.Id)
			}
		})
	}
}

func TestNovelService_ListProjects(t *testing.T) {
	tests := []struct {
		name        string
		request     *pb.ListProjectsRequest
		setupMock   func(mockRepo *mocks.MockNovelRepo)
		expectError bool
		errorMsg    string
	}{
		{
			name: "成功获取项目列表",
			request: &pb.ListProjectsRequest{
				Page:     1,
				PageSize: 10,
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().ListProjects(gomock.Any(), int32(1), int32(10)).Return([]*models.NovelProject{
					{
						ID:          "test-id-1",
						Title:       "测试小说1",
						Description: "这是第一个测试小说项目",
						Genre:       "科幻",
						Status:      "draft",
						CreatedAt:   time.Now(),
						UpdatedAt:   time.Now(),
					},
					{
						ID:          "test-id-2",
						Title:       "测试小说2",
						Description: "这是第二个测试小说项目",
						Genre:       "奇幻",
						Status:      "published",
						CreatedAt:   time.Now(),
						UpdatedAt:   time.Now(),
					},
				}, int64(2), nil)
			},
			expectError: false,
		},
		{
			name: "获取项目列表失败 - 数据库错误",
			request: &pb.ListProjectsRequest{
				Page:     1,
				PageSize: 10,
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().ListProjects(gomock.Any(), int32(1), int32(10)).Return(nil, int64(0), errors.New("database error"))
			},
			expectError: true,
			errorMsg:    "database error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 为每个子测试创建独立的 mock
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRepo := mocks.NewMockNovelRepo(ctrl)
			mockExportService := mocks.NewMockExportService(ctrl)
			mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
			mockLogger := log.NewStdLogger(os.Stdout)
			uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
			service := &NovelService{uc: uc}

			tt.setupMock(mockRepo)

			resp, err := service.ListProjects(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}

func BenchmarkNovelService_CreateProject(b *testing.B) {
	ctrl := gomock.NewController(b)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockNovelRepo(ctrl)
	mockExportService := mocks.NewMockExportService(ctrl)
	mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
	service := &NovelService{uc: uc}

	mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
		ID:          "test-id",
		Title:       "测试小说",
		Description: "这是一个测试小说项目",
		Genre:       "科幻",
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil).AnyTimes()

	request := &pb.CreateProjectRequest{
		Title:       "测试小说",
		Description: "这是一个测试小说项目",
		Genre:       "科幻",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = service.CreateProject(context.Background(), request)
	}
}

func TestNovelService_CreateProject_Concurrent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockNovelRepo(ctrl)
	mockExportService := mocks.NewMockExportService(ctrl)
	mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
	service := &NovelService{uc: uc}

	mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
		ID:          "test-id",
		Title:       "测试小说",
		Description: "这是一个测试小说项目",
		Genre:       "科幻",
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}, nil).AnyTimes()

	request := &pb.CreateProjectRequest{
		Title:       "测试小说",
		Description: "这是一个测试小说项目",
		Genre:       "科幻",
	}

	// 并发执行多个请求
	concurrency := 10
	done := make(chan bool, concurrency)

	for i := 0; i < concurrency; i++ {
		go func() {
			defer func() { done <- true }()
			_, err := service.CreateProject(context.Background(), request)
			assert.NoError(t, err)
		}()
	}

	// 等待所有 goroutine 完成
	for i := 0; i < concurrency; i++ {
		<-done
	}
}

func TestNovelService_CreateProject_Timeout(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockNovelRepo(ctrl)
	mockExportService := mocks.NewMockExportService(ctrl)
	mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
	service := &NovelService{uc: uc}

	// 模拟超时场景
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).DoAndReturn(func(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
		// 模拟长时间操作
		time.Sleep(10 * time.Millisecond)
		return nil, ctx.Err()
	})

	request := &pb.CreateProjectRequest{
		Title:       "测试小说",
		Description: "这是一个测试小说项目",
		Genre:       "科幻",
	}

	_, err := service.CreateProject(ctx, request)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context deadline exceeded")
}

// 边界情况测试
func TestNovelService_CreateProject_EdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		request     *pb.CreateProjectRequest
		setupMock   func(mockRepo *mocks.MockNovelRepo)
		expectError bool
		errorMsg    string
	}{
		{
			name: "极长标题",
			request: &pb.CreateProjectRequest{
				Title:       string(make([]byte, 1000)), // 1000字符的标题
				Description: "测试描述",
				Genre:       "科幻",
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
					ID:          "test-id",
					Title:       string(make([]byte, 1000)),
					Description: "测试描述",
					Genre:       "科幻",
					Status:      "draft",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
			},
			expectError: false,
		},
		{
			name: "特殊字符标题",
			request: &pb.CreateProjectRequest{
				Title:       "测试小说!@#$%^&*()_+-={}[]|\\:;\"'<>?,./",
				Description: "包含特殊字符的测试",
				Genre:       "科幻",
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
					ID:          "test-id",
					Title:       "测试小说!@#$%^&*()_+-={}[]|\\:;\"'<>?,./",
					Description: "包含特殊字符的测试",
					Genre:       "科幻",
					Status:      "draft",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
			},
			expectError: false,
		},
		{
			name: "空主题数组",
			request: &pb.CreateProjectRequest{
				Title:       "测试小说",
				Description: "测试描述",
				Genre:       "科幻",
				Themes:      []string{},
			},
			setupMock: func(mockRepo *mocks.MockNovelRepo) {
				mockRepo.EXPECT().CreateProject(gomock.Any(), gomock.Any()).Return(&models.NovelProject{
					ID:          "test-id",
					Title:       "测试小说",
					Description: "测试描述",
					Genre:       "科幻",
					Status:      "draft",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 为每个子测试创建独立的 mock
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRepo := mocks.NewMockNovelRepo(ctrl)
			mockExportService := mocks.NewMockExportService(ctrl)
			mockVideoScriptService := mocks.NewMockVideoScriptService(ctrl)
			mockLogger := log.NewStdLogger(os.Stdout)
			uc := biz.NewNovelUsecase(mockRepo, mockExportService, mockVideoScriptService, mockLogger)
			service := &NovelService{uc: uc}

			tt.setupMock(mockRepo)

			resp, err := service.CreateProject(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}