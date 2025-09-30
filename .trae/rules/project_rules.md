# Auto Novel AI 小说生成平台 - Trae 项目规则文档

## 一、项目概述

Auto Novel 是一个基于 AI 的智能小说生成平台，采用前后端分离架构，支持完整的小说创作工作流程，包括世界观构建、人物设定、大纲生成、章节创作、内容优化和多格式导出等功能。

### 核心功能模块
- **项目管理**：小说项目的创建、管理和配置
- **AI 生成**：世界观、人物卡、章节大纲、章节内容的智能生成
- **内容优化**：章节润色、质量检测、一致性检查
- **短视频脚本**：基于小说内容生成短视频脚本
- **导出功能**：支持多种格式（TXT、EPUB等）的小说导出

## 二、技术架构规范

### 2.1 后端技术栈
- **核心框架**：Go 1.24.0 + Kratos v2.8.0
- **AI 框架**：cloudwego/eino v0.5.3
- **协议支持**：gRPC + HTTP 双协议
- **API 定义**：Protobuf + OpenAPI 3.0
- **依赖注入**：Google Wire
- **支持的 LLM**：DeepSeek、Qwen、Ollama

### 2.2 前端技术栈
- **核心框架**：Next.js 15.5.4 + React 19.1.0
- **开发语言**：TypeScript 5.9.2
- **样式框架**：Tailwind CSS v4
- **UI 组件库**：Radix UI + Headless UI
- **图标库**：Heroicons + Lucide React
- **构建工具**：Turbopack

## 三、项目结构规范

### 3.1 根目录结构
```
auto_novel/
├── backend/          # 后端服务（Go + Kratos）
├── frontend/         # 前端应用（Next.js + React）
├── .trae/           # Trae 配置和文档
└── test_backend_apis.sh  # API 测试脚本
```

### 3.2 后端目录结构（严格遵循 Kratos 规范）
```
backend/
├── api/                    # Protobuf API 定义
│   ├── helloworld/v1/     # 示例服务
│   ├── novel/v1/          # 小说服务 API
│   └── video_script/v1/   # 视频脚本服务 API
├── cmd/backend/           # 服务入口
│   ├── main.go           # 主程序入口
│   ├── wire.go           # 依赖注入配置
│   └── wire_gen.go       # Wire 生成文件
├── configs/              # 配置文件
│   └── config.yaml       # 主配置文件
├── internal/             # 内部代码
│   ├── agent/           # AI Agent 模块
│   │   ├── chapter/     # 章节生成 Agent
│   │   ├── character/   # 人物生成 Agent
│   │   ├── consistency/ # 一致性检查 Agent
│   │   ├── export/      # 导出 Agent
│   │   ├── orchestrator/ # 编排 Agent
│   │   ├── outline/     # 大纲生成 Agent
│   │   ├── polish/      # 润色 Agent
│   │   ├── quality/     # 质量检测 Agent
│   │   ├── video_script/ # 视频脚本 Agent
│   │   └── worldbuilding/ # 世界观构建 Agent
│   ├── biz/             # 业务逻辑层
│   ├── conf/            # 配置结构定义
│   ├── data/            # 数据访问层
│   ├── pkg/             # 内部工具包
│   │   ├── eino/        # Eino AI 框架封装
│   │   ├── llm/         # LLM 客户端封装
│   │   ├── models/      # 数据模型
│   │   └── vector/      # 向量数据库
│   ├── server/          # 服务器配置
│   └── service/         # 服务实现层
├── openapi.yaml         # OpenAPI 规范文档
└── third_party/         # 第三方 Proto 文件
```

### 3.3 前端目录结构
```
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── auth/          # 认证相关页面
│   │   ├── chapters/      # 章节管理页面
│   │   ├── characters/    # 人物管理页面
│   │   ├── outline/       # 大纲管理页面
│   │   ├── projects/      # 项目管理页面
│   │   ├── quality/       # 质量检测页面
│   │   ├── video-script/  # 视频脚本页面
│   │   ├── worldview/     # 世界观页面
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 首页
│   ├── components/        # 可复用组件
│   │   ├── layout/        # 布局组件
│   │   └── ui/            # UI 基础组件
│   └── lib/               # 工具库
│       ├── api.ts         # API 客户端
│       ├── hooks/         # 自定义 Hooks
│       └── utils.ts       # 工具函数
├── public/                # 静态资源
└── 配置文件（package.json, tsconfig.json 等）
```

## 四、开发规范

### 4.1 后端开发规范

#### 4.1.1 项目创建和模块管理
- **必须使用 Kratos 官方命令**：
  ```bash
  kratos new <service_name>          # 创建新服务
  kratos proto add <proto_file>      # 添加 Proto 文件
  kratos proto client <proto_file>   # 生成客户端代码
  kratos proto server <proto_file>   # 生成服务端代码
  ```
- **严禁手动创建目录结构**，必须遵循 Kratos 标准

#### 4.1.2 AI Agent 开发规范
- **统一使用 cloudwego/eino 框架**，禁止自研 AI 相关组件
- **Agent 模块化设计**：每个 Agent 独立在 `internal/agent/` 下实现
- **配置驱动**：所有 Agent 配置通过 `configs/config.yaml` 管理
- **多模型支持**：支持 DeepSeek、Qwen、Ollama 等多种 LLM

#### 4.1.3 API 设计规范
- **必须使用 Protobuf 定义 API**，禁止手写 JSON 协议
- **双协议支持**：同时提供 gRPC 和 HTTP 接口
- **版本管理**：API 路径必须包含版本号（如 `/api/v1/`）
- **文档同步**：自动生成 OpenAPI 文档

#### 4.1.4 代码规范
- **命名规则**：
  - 包名：小写，不使用下划线
  - 变量名：驼峰命名法
  - 常量：大写字母 + 下划线
- **错误处理**：使用 `errors.Is` / `errors.As`
- **日志规范**：使用 `kratos/log`，禁用 `fmt.Println`
- **配置管理**：集中在 `configs/` 目录，禁止硬编码

### 4.2 前端开发规范

#### 4.2.1 组件开发规范
- **函数式组件**：优先使用 React 函数式组件
- **TypeScript 严格模式**：启用严格类型检查
- **组件命名**：使用 PascalCase
- **文件命名**：使用 kebab-case

#### 4.2.2 API 集成规范
- **类型安全**：基于 OpenAPI 规范生成 TypeScript 类型
- **统一错误处理**：使用 APIError 类处理 API 错误
- **请求封装**：通过 `lib/api.ts` 统一管理 API 请求
- **环境配置**：通过环境变量配置 API 基础 URL

#### 4.2.3 样式规范
- **Tailwind CSS**：优先使用 Tailwind 工具类
- **响应式设计**：移动端优先的响应式布局
- **组件库**：使用 Radix UI 作为基础组件库
- **主题一致性**：遵循统一的设计系统

## 五、服务启动和部署

### 5.1 开发环境启动

#### 后端服务启动
```bash
cd backend
kratos run
```
- 服务地址：`http://localhost:8000` (HTTP) / `localhost:9000` (gRPC)
- API 文档：`/backend/openapi.yaml`

#### 前端服务启动
```bash
cd frontend
npm run dev
```
- 服务地址：`http://localhost:3000`
- 开发模式：启用 Turbopack 加速构建

### 5.2 配置管理

#### 后端配置（config.yaml）
```yaml
server:
  http:
    addr: 0.0.0.0:8000
    timeout: 600s
  grpc:
    addr: 0.0.0.0:9000
    timeout: 600s

ai:
  models:
    default:
      provider: "deepseek"
      model_name: "deepseek-chat"
      api_key: "your-api-key"
      base_url: "https://api.deepseek.com/"
      temperature: 0.8
      max_tokens: 4096
```

#### 前端环境变量
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 六、API 设计原则

### 6.1 RESTful API 规范
- **资源路径**：`/api/v1/{resource}/{id}/{sub-resource}`
- **HTTP 方法**：
  - GET：查询资源
  - POST：创建资源
  - PUT：更新资源
  - DELETE：删除资源

### 6.2 核心 API 端点
```
# 项目管理
GET    /api/v1/novel/projects              # 获取项目列表
POST   /api/v1/novel/projects              # 创建项目
GET    /api/v1/novel/projects/{id}         # 获取项目详情

# AI 生成
POST   /api/v1/novel/projects/{id}/worldview    # 生成世界观
POST   /api/v1/novel/projects/{id}/characters   # 生成人物卡
POST   /api/v1/novel/projects/{id}/outline      # 生成大纲
POST   /api/v1/novel/projects/{id}/chapters     # 生成章节

# 内容优化
POST   /api/v1/novel/projects/{id}/chapters/{chapter_id}/polish   # 润色章节
POST   /api/v1/novel/projects/{id}/chapters/{chapter_id}/quality  # 质量检测

# 视频脚本
POST   /api/v1/video-scripts/generate      # 生成视频脚本
GET    /api/v1/video-scripts/{id}          # 获取脚本详情

# 模型管理
GET    /api/v1/novel/models               # 获取可用模型
POST   /api/v1/novel/switch-model         # 切换模型
```

## 七、质量保证

### 7.1 代码质量
- **单元测试**：核心业务逻辑必须有单元测试覆盖
- **集成测试**：使用 `test_backend_apis.sh` 进行 API 集成测试
- **代码审查**：所有代码变更必须经过 Code Review
- **静态分析**：使用 golangci-lint（后端）和 ESLint（前端）

### 7.2 性能要求
- **API 响应时间**：普通接口 < 200ms，AI 生成接口 < 30s
- **并发处理**：支持至少 100 并发请求
- **内存使用**：后端服务内存使用 < 1GB

### 7.3 安全规范
- **API 认证**：实现基于 Token 的认证机制
- **输入验证**：所有用户输入必须进行验证和过滤
- **错误处理**：不暴露敏感的系统信息
- **CORS 配置**：正确配置跨域访问策略

## 八、监控和日志

### 8.1 日志规范
- **结构化日志**：使用 JSON 格式的结构化日志
- **日志级别**：DEBUG、INFO、WARN、ERROR
- **关键操作记录**：AI 生成、用户操作、系统错误

### 8.2 监控指标
- **系统指标**：CPU、内存、磁盘使用率
- **业务指标**：API 调用次数、成功率、响应时间
- **AI 指标**：模型调用次数、Token 消耗、生成质量

## 九、扩展和维护

### 9.1 新功能开发流程
1. **需求分析**：明确功能需求和技术方案
2. **API 设计**：先设计 Protobuf 接口定义
3. **后端实现**：实现业务逻辑和 Agent
4. **前端集成**：基于 API 实现前端功能
5. **测试验证**：单元测试 + 集成测试
6. **文档更新**：更新 API 文档和用户文档

### 9.2 版本管理
- **语义化版本**：遵循 SemVer 规范
- **API 版本控制**：向后兼容的版本升级策略
- **数据库迁移**：使用版本化的数据库迁移脚本

### 9.3 故障处理
- **错误监控**：实时监控系统错误和异常
- **故障恢复**：自动重试和降级机制
- **备份策略**：定期备份重要数据和配置

---

## 附录：常用命令

### 后端开发命令
```bash
# 启动服务
kratos run

# 生成代码
make api
make all

# 依赖管理
go mod tidy
go mod download

# 测试
go test ./...
./test_backend_apis.sh
```

### 前端开发命令
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit
```

---

**文档版本**：v1.0  
**最后更新**：2024年12月  
**维护者**：Auto Novel 开发团队
