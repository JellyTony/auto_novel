package service

import (
	"context"
	"testing"
	"time"

	"backend/internal/pkg/models"
	"github.com/stretchr/testify/assert"
)

// TestHelper 提供测试辅助功能
type TestHelper struct {
	t *testing.T
}

// NewTestHelper 创建测试辅助器
func NewTestHelper(t *testing.T) *TestHelper {
	return &TestHelper{t: t}
}

// AssertNoError 断言没有错误
func (h *TestHelper) AssertNoError(err error) {
	assert.NoError(h.t, err)
}

// AssertError 断言有错误
func (h *TestHelper) AssertError(err error) {
	assert.Error(h.t, err)
}

// AssertEqual 断言相等
func (h *TestHelper) AssertEqual(expected, actual interface{}) {
	assert.Equal(h.t, expected, actual)
}

// AssertNotNil 断言不为空
func (h *TestHelper) AssertNotNil(obj interface{}) {
	assert.NotNil(h.t, obj)
}

// AssertNil 断言为空
func (h *TestHelper) AssertNil(obj interface{}) {
	assert.Nil(h.t, obj)
}

// CreateTestContext 创建测试上下文
func CreateTestContext() context.Context {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	_ = cancel // 在实际测试中应该调用 cancel
	return ctx
}

// CreateTestProject 创建测试项目
func CreateTestProject() *models.NovelProject {
	return &models.NovelProject{
		ID:             "test-project-1",
		Title:          "测试小说",
		Description:    "这是一个测试小说项目",
		Genre:          "现代都市",
		TargetAudience: "青年",
		Tone:           "温情",
		Themes:         []string{"友情", "成长"},
		Status:         "draft",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

// CreateTestChapter 创建测试章节
func CreateTestChapter() *models.Chapter {
	return &models.Chapter{
		ID:              "test-chapter-1",
		ProjectID:       "test-project-1",
		Index:           1,
		Title:           "第一章：开始",
		RawContent:      "这是第一章的原始内容...",
		PolishedContent: "这是第一章的润色内容...",
		Summary:         "第一章摘要",
		WordCount:       1000,
		Status:          "completed",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
}

// CreateTestVideoScript 创建测试视频脚本
func CreateTestVideoScript() *models.VideoScript {
	return &models.VideoScript{
		ID:        "test-script-1",
		ProjectID: "test-project-1",
		ChapterID: "test-chapter-1",
		Title:     "第一章视频脚本",
		Platform:  "tiktok",
		Duration:  60,
		Style:     "悬疑",
		Scenes: []*models.VideoScriptScene{
			{
				Index:             1,
				Duration:          10,
				ShotType:          "close-up",
				VisualDescription: "主角特写镜头",
				Narration:         "故事开始了...",
				Subtitle:          "你好，世界！",
				SoundEffects:      []string{"背景音乐"},
				Transition:        "淡入",
				KeyElements:       []string{"主角", "城市背景"},
			},
		},
		Hashtags:    []string{"#小说", "#短视频"},
		Description: "第一章视频脚本描述",
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// BenchmarkHelper 性能测试辅助器
type BenchmarkHelper struct {
	b *testing.B
}

// NewBenchmarkHelper 创建性能测试辅助器
func NewBenchmarkHelper(b *testing.B) *BenchmarkHelper {
	return &BenchmarkHelper{b: b}
}

// ResetTimer 重置计时器
func (h *BenchmarkHelper) ResetTimer() {
	h.b.ResetTimer()
}

// StartTimer 开始计时
func (h *BenchmarkHelper) StartTimer() {
	h.b.StartTimer()
}

// StopTimer 停止计时
func (h *BenchmarkHelper) StopTimer() {
	h.b.StopTimer()
}

// AssertResponseTime 断言响应时间在合理范围内
func AssertResponseTime(t *testing.T, start time.Time, maxDuration time.Duration) {
	elapsed := time.Since(start)
	assert.True(t, elapsed <= maxDuration, 
		"Response time %v exceeds maximum allowed duration %v", elapsed, maxDuration)
}

// TableTestCase 表驱动测试用例结构
type TableTestCase struct {
	Name        string
	Input       interface{}
	Expected    interface{}
	ExpectedErr bool
	Setup       func()
	Cleanup     func()
}

// RunTableTests 运行表驱动测试
func RunTableTests(t *testing.T, testCases []TableTestCase, testFunc func(tc TableTestCase)) {
	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup()
			}
			
			testFunc(tc)
			
			if tc.Cleanup != nil {
				tc.Cleanup()
			}
		})
	}
}