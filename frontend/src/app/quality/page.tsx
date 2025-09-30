import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";

// 模拟质量检查数据
const qualityReport = {
  overall: {
    score: 85,
    status: "良好",
    lastCheck: "2024-09-29 16:30",
    totalIssues: 12,
    resolvedIssues: 8,
    pendingIssues: 4
  },
  categories: [
    {
      name: "语言质量",
      score: 88,
      status: "优秀",
      issues: [
        { type: "语法错误", count: 2, severity: "中等", description: "发现2处语法不当" },
        { type: "用词重复", count: 3, severity: "轻微", description: "部分词汇使用频率过高" }
      ]
    },
    {
      name: "情节连贯性",
      score: 82,
      status: "良好",
      issues: [
        { type: "时间线矛盾", count: 1, severity: "严重", description: "第3章与第1章时间设定冲突" },
        { type: "情节跳跃", count: 2, severity: "中等", description: "部分情节转换过于突兀" }
      ]
    },
    {
      name: "角色一致性",
      score: 90,
      status: "优秀",
      issues: [
        { type: "性格矛盾", count: 1, severity: "中等", description: "林逸在第2章的行为与设定不符" }
      ]
    },
    {
      name: "世界观一致性",
      score: 78,
      status: "一般",
      issues: [
        { type: "设定冲突", count: 2, severity: "严重", description: "修仙等级描述前后不一致" },
        { type: "背景矛盾", count: 1, severity: "中等", description: "都市环境描述存在矛盾" }
      ]
    }
  ]
};

const polishSuggestions = [
  {
    id: 1,
    chapter: "第1章：意外的传承",
    type: "语言润色",
    priority: "高",
    suggestion: "建议优化开头段落的描述，增加更多细节来吸引读者",
    original: "林逸是一个普通的程序员，每天都在公司加班。",
    improved: "深夜的办公楼里，只有林逸的工位还亮着微弱的屏幕光。作为一名资深程序员，加班对他来说已经是家常便饭，但今晚似乎有些不同寻常。",
    status: "待处理"
  },
  {
    id: 2,
    chapter: "第2章：初试身手",
    type: "对话优化",
    priority: "中",
    suggestion: "对话过于直白，建议增加更多潜台词和情感层次",
    original: "\"你是谁？\"林逸问道。",
    improved: "\"你...你到底是什么人？\"林逸的声音有些颤抖，下意识地后退了一步。",
    status: "已处理"
  },
  {
    id: 3,
    chapter: "第3章：神秘师父",
    type: "情节优化",
    priority: "高",
    suggestion: "师父出现过于突兀，建议增加铺垫",
    original: "突然，一个老者出现在房间里。",
    improved: "房间里的温度似乎突然下降了几度，林逸感到一股莫名的压迫感。就在这时，空气中泛起了微弱的涟漪，一个白发苍苍的身影缓缓显现。",
    status: "待处理"
  }
];

const severityColors = {
  "严重": "bg-red-100 text-red-800",
  "中等": "bg-yellow-100 text-yellow-800",
  "轻微": "bg-blue-100 text-blue-800"
};

const statusColors = {
  "优秀": "bg-green-100 text-green-800",
  "良好": "bg-blue-100 text-blue-800",
  "一般": "bg-yellow-100 text-yellow-800",
  "较差": "bg-red-100 text-red-800"
};

const priorityColors = {
  "高": "bg-red-100 text-red-800",
  "中": "bg-yellow-100 text-yellow-800",
  "低": "bg-green-100 text-green-800"
};

export default function QualityPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="质量控制" 
        description="AI智能检查和优化小说质量"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* 质量概览 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
                  质量评估报告
                </CardTitle>
                <CardDescription className="mt-1">
                  最后检查时间：{qualityReport.overall.lastCheck}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  详细报告
                </Button>
                <Button>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  重新检查
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{qualityReport.overall.score}</div>
                <div className="text-sm text-gray-500">综合评分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{qualityReport.overall.resolvedIssues}</div>
                <div className="text-sm text-gray-500">已解决问题</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{qualityReport.overall.pendingIssues}</div>
                <div className="text-sm text-gray-500">待解决问题</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{qualityReport.overall.totalIssues}</div>
                <div className="text-sm text-gray-500">总问题数</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold px-3 py-1 rounded-full ${statusColors[qualityReport.overall.status as keyof typeof statusColors]}`}>
                  {qualityReport.overall.status}
                </div>
                <div className="text-sm text-gray-500">整体状态</div>
              </div>
            </div>

            {/* 质量分类详情 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {qualityReport.categories.map((category, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[category.status as keyof typeof statusColors]}`}>
                        {category.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{category.score}</div>
                    <div className="space-y-1">
                      {category.issues.map((issue, issueIndex) => (
                        <div key={issueIndex} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{issue.type}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900">{issue.count}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${severityColors[issue.severity as keyof typeof severityColors]}`}>
                              {issue.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg mb-2">AI智能润色</CardTitle>
              <CardDescription className="mb-4">
                自动优化语言表达和文字质量
              </CardDescription>
              <Button className="w-full">
                开始润色
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle className="text-lg mb-2">矛盾检查</CardTitle>
              <CardDescription className="mb-4">
                检查情节、角色、世界观的一致性
              </CardDescription>
              <Button className="w-full">
                开始检查
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <AdjustmentsHorizontalIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg mb-2">批量处理</CardTitle>
              <CardDescription className="mb-4">
                批量检查和处理多个章节
              </CardDescription>
              <Button className="w-full">
                批量操作
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 润色建议 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
                AI润色建议
              </CardTitle>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">所有类型</option>
                  <option value="语言润色">语言润色</option>
                  <option value="对话优化">对话优化</option>
                  <option value="情节优化">情节优化</option>
                  <option value="描述增强">描述增强</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">所有优先级</option>
                  <option value="高">高优先级</option>
                  <option value="中">中优先级</option>
                  <option value="低">低优先级</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {polishSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{suggestion.chapter}</h4>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {suggestion.type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${priorityColors[suggestion.priority as keyof typeof priorityColors]}`}>
                            {suggestion.priority}优先级
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.suggestion}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {suggestion.status === "已处理" ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className={`text-sm ${suggestion.status === "已处理" ? "text-green-600" : "text-yellow-600"}`}>
                          {suggestion.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">原文</h5>
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-gray-700">
                          {suggestion.original}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">建议修改</h5>
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-700">
                          {suggestion.improved}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        查看上下文
                      </Button>
                      {suggestion.status === "待处理" ? (
                        <>
                          <Button size="sm">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            采纳建议
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            忽略
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline">
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          撤销修改
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 批量操作 */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                显示 1-{polishSuggestions.length} 项建议，共 {polishSuggestions.length} 项
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  全部采纳
                </Button>
                <Button variant="outline" size="sm">
                  批量忽略
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}