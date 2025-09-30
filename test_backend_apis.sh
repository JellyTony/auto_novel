#!/bin/bash

# 后端API接口测试脚本
# 服务器地址配置
BASE_URL="http://localhost:8000"
API_BASE="${BASE_URL}/api"

# 颜色输出配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=${5:-200}
    
    ((TOTAL_TESTS++))
    
    log_info "测试: $description"
    log_info "请求: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$endpoint" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "$data")
    fi
    
    # 分离响应体和状态码
    body=$(echo "$response" | sed '$d')
    status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        log_success "状态码: $status_code (期望: $expected_status)"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "响应体: $body" | head -c 200
            echo "..."
        fi
    else
        log_error "状态码: $status_code (期望: $expected_status)"
        echo "响应体: $body"
    fi
    
    echo "----------------------------------------"
}

# 检查服务器是否运行
check_server() {
    log_info "检查后端服务器状态..."
    
    if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null; then
        log_success "后端服务器运行正常 ($BASE_URL)"
    else
        log_error "无法连接到后端服务器 ($BASE_URL)"
        log_warning "请确保后端服务正在运行在端口8000"
        exit 1
    fi
}

# 1. 测试Greeter服务 (Hello World)
test_greeter_service() {
    log_info "========== 测试 Greeter 服务 =========="
    
    # SayHello接口
    test_api "GET" "${BASE_URL}/helloworld/world" "" "Greeter - SayHello接口"
    test_api "GET" "${BASE_URL}/helloworld/测试用户" "" "Greeter - SayHello接口(中文名称)"
}

# 2. 测试Novel服务
test_novel_service() {
    log_info "========== 测试 Novel 服务 =========="
    
    # 创建项目
    create_project_data='{
        "title": "测试小说项目",
        "description": "这是一个用于API测试的小说项目",
        "genre": "现代都市",
        "target_audience": "青年",
        "tone": "温情",
        "themes": ["成长", "友情"]
    }'
    
    # 创建项目并获取项目ID
    log_info "测试: Novel - 创建项目"
    log_info "请求: POST ${API_BASE}/v1/novel/projects"
    
    create_response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/v1/novel/projects" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$create_project_data")
    
    create_body=$(echo "$create_response" | sed '$d')
    create_status=$(echo "$create_response" | tail -n 1)
    
    if [ "$create_status" -eq "200" ]; then
        log_success "状态码: $create_status (期望: 200)"
        # 提取项目ID
        PROJECT_ID=$(echo "$create_body" | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
        log_info "创建的项目ID: $PROJECT_ID"
    else
        log_error "状态码: $create_status (期望: 200)"
        echo "响应体: $create_body"
        PROJECT_ID="test-project-fallback"
    fi
    echo "----------------------------------------"
    
    # 获取项目列表
    test_api "GET" "${API_BASE}/v1/novel/projects" "" "Novel - 获取项目列表"
    
    # 获取项目详情 (使用真实项目ID)
    test_api "GET" "${API_BASE}/v1/novel/projects/${PROJECT_ID}" "" "Novel - 获取项目详情"
    
    # 生成世界观
    worldview_data='{
        "requirements": "创建一个现代都市背景的世界观",
        "style": "realistic"
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/worldview" "$worldview_data" "Novel - 生成世界观"
    
    # 生成人物卡
    characters_data='{
        "character_names": ["主角张三", "女主李四"],
        "requirements": "创建现代都市背景的人物"
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/characters" "$characters_data" "Novel - 生成人物卡"
    
    # 生成章节大纲
    outline_data='{
        "chapter_count": 10,
        "requirements": "创建10章的小说大纲"
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/outline" "$outline_data" "Novel - 生成章节大纲"
    
    # 生成章节内容
    chapter_data='{
        "chapter_number": 1,
        "chapter_title": "第一章：开始",
        "outline": "主角的日常生活",
        "word_count": 2000
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/chapters" "$chapter_data" "Novel - 生成章节内容"
    
    # 润色章节
    polish_data='{
        "requirements": "提升文笔，增加细节描述"
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/chapters/1/polish" "$polish_data" "Novel - 润色章节"
    
    # 质量检测
    quality_data='{
        "check_types": ["grammar", "logic", "consistency"]
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/chapters/1/quality" "$quality_data" "Novel - 质量检测"
    
    # 批量质量检测
    batch_quality_data='{
        "chapter_ids": ["1", "2"],
        "check_types": ["grammar", "consistency"]
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/quality/batch" "$batch_quality_data" "Novel - 批量质量检测"
    
    # 一致性检查
    consistency_data='{
        "check_scope": "全书",
        "check_types": ["character", "plot", "worldview"]
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/consistency" "$consistency_data" "Novel - 一致性检查"
    
    # 导出小说
    export_data='{
        "format": "txt",
        "include_metadata": true,
        "chapter_range": {
            "start": 1,
            "end": 10
        }
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/export" "$export_data" "Novel - 导出小说"
    
    # 生成短视频脚本
    video_script_data='{
        "chapter_id": "1",
        "chapter_title": "第一章：开始",
        "chapter_content": "这是第一章的内容...",
        "platform": "douyin",
        "duration": 60,
        "style": "dramatic",
        "requirements": "突出戏剧冲突"
    }'
    test_api "POST" "${API_BASE}/v1/novel/projects/${PROJECT_ID}/video-script" "$video_script_data" "Novel - 生成短视频脚本"
}

# 3. 测试VideoScript服务
test_video_script_service() {
    log_info "========== 测试 VideoScript 服务 =========="
    
    # 生成视频脚本
    generate_script_data='{
        "project_id": "test-project-1",
        "chapter_id": "chapter-1",
        "chapter_title": "第一章：开始",
        "chapter_content": "这是一个测试章节的内容，用于生成短视频脚本...",
        "platform": "douyin",
        "duration": 60,
        "style": "dramatic",
        "requirements": "突出戏剧性，适合短视频传播"
    }'
    test_api "POST" "${API_BASE}/v1/video-scripts/generate" "$generate_script_data" "VideoScript - 生成视频脚本"
    
    # 优化视频脚本
    optimize_script_data='{
        "requirements": "增强视觉冲击力，优化节奏"
    }'
    test_api "PUT" "${API_BASE}/v1/video-scripts/test-script-1/optimize" "$optimize_script_data" "VideoScript - 优化视频脚本"
    
    # 生成平台变体
    variants_data='{
        "target_platforms": ["kuaishou", "bilibili", "xiaohongshu"]
    }'
    test_api "POST" "${API_BASE}/v1/video-scripts/test-script-1/variants" "$variants_data" "VideoScript - 生成平台变体"
    
    # 获取视频脚本列表
    test_api "GET" "${API_BASE}/v1/projects/test-project-1/video-scripts" "" "VideoScript - 获取视频脚本列表"
    
    # 获取视频脚本详情
    test_api "GET" "${API_BASE}/v1/video-scripts/test-script-1" "" "VideoScript - 获取视频脚本详情" 404
    
    # 删除视频脚本
    test_api "DELETE" "${API_BASE}/v1/video-scripts/test-script-1" "" "VideoScript - 删除视频脚本" 404
}

# 4. 测试前端代理配置
test_frontend_proxy() {
    log_info "========== 测试前端代理配置 =========="
    
    # 测试前端API代理路径
    test_api "GET" "${BASE_URL}/api/v1/novel/projects" "" "前端代理 - Novel项目列表"
    test_api "GET" "${BASE_URL}/api/v1/video-scripts/generate" "" "前端代理 - VideoScript生成接口" 405
}

# 生成测试报告
generate_report() {
    echo ""
    log_info "========== 测试报告 =========="
    echo "总测试数: $TOTAL_TESTS"
    echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "所有测试通过！"
    else
        log_warning "有 $FAILED_TESTS 个测试失败，请检查后端服务实现"
    fi
    
    # 成功率计算
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
        echo "成功率: ${success_rate}%"
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "       后端API接口测试脚本"
    echo "=========================================="
    echo ""
    
    # 检查服务器状态
    check_server
    
    # 执行测试
    test_greeter_service
    test_novel_service
    test_video_script_service
    test_frontend_proxy
    
    # 生成报告
    generate_report
}

# 运行主函数
main "$@"