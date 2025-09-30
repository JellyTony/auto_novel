import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DocumentTextIcon,
  SparklesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  Bars3Icon,
  ListBulletIcon
} from "@heroicons/react/24/outline";

// 模拟大纲数据
const outline = {
  id: 1,
  title: "都市修仙传",
  totalChapters: 30,
  currentChapters: 15,
  structure: [
    {
      id: 1,
      type: "arc",
      title: "第一卷：觉醒篇",
      description: "主角林逸意外获得修仙传承，开始修炼之路",
      chapters: [
        {
          id: 1,
          title: "第1章：意外的传承",
          description: "程序员林逸在加班时意外触发古老的修仙传承，获得修仙功法。",
          wordCount: 3000,
          status: "已完成",
          keyEvents: ["获得传承", "初次修炼", "感知灵气"],
          characters: ["林逸"],
          plotPoints: [
            "林逸在公司加班到深夜",
            "触碰到古老的玉佩",
            "传承记忆涌入脑海",
            "学会基础修炼方法"
          ]
        },
        {
          id: 2,
          title: "第2章：初试身手",
          description: "林逸尝试修炼，发现自己的修仙天赋，同时遇到第一个挑战。",
          wordCount: 3200,
          status: "已完成",
          keyEvents: ["初次修炼", "遇到危险", "展现实力"],
          characters: ["林逸", "小混混"],
          plotPoints: [
            "在家中尝试修炼",
            "感受到灵气的存在",
            "下班路上遇到抢劫",
            "无意中使用修仙能力"
          ]
        },
        {
          id: 3,
          title: "第3章：神秘师父",
          description: "张师父出现，指导林逸正确的修炼方法，揭示修仙世界的秘密。",
          wordCount: 0,
          status: "进行中",
          keyEvents: ["遇见师父", "学习正法", "了解修仙界"],
          characters: ["林逸", "张师父"],
          plotPoints: [
            "张师父主动现身",
            "指出林逸修炼的问题",
            "传授正统修炼方法",
            "介绍修仙界的基本情况"
          ]
        }
      ]
    },
    {
      id: 2,
      type: "arc",
      title: "第二卷：成长篇",
      description: "林逸在修仙路上不断成长，面对各种挑战和敌人",
      chapters: [
        {
          id: 4,
          title: "第4章：同门师兄",
          description: "林逸遇到其他修仙者，了解到修仙界的复杂关系。",
          wordCount: 0,
          status: "未开始",
          keyEvents: ["遇见同门", "修仙界关系", "实力对比"],
          characters: ["林逸", "师兄弟"],
          plotPoints: []
        },
        {
          id: 5,
          title: "第5章：第一次危机",
          description: "邪修王强出现，林逸面临第一次真正的生死危机。",
          wordCount: 0,
          status: "未开始",
          keyEvents: ["遇见反派", "生死危机", "突破成长"],
          characters: ["林逸", "王强", "张师父"],
          plotPoints: []
        }
      ]
    }
  ]
};

const statusColors = {
  "已完成": "bg-green-100 text-green-800",
  "进行中": "bg-blue-100 text-blue-800",
  "未开始": "bg-gray-100 text-gray-800",
  "需修改": "bg-yellow-100 text-yellow-800"
};

export default function OutlinePage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="大纲编辑" 
        description="规划和编辑您的小说大纲结构"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* 大纲概览 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                  {outline.title} - 大纲概览
                </CardTitle>
                <CardDescription className="mt-1">
                  总计划 {outline.totalChapters} 章，已完成 {outline.currentChapters} 章
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  预览
                </Button>
                <Button>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  AI优化大纲
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{outline.currentChapters}</div>
                <div className="text-sm text-gray-500">已完成章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{outline.totalChapters - outline.currentChapters}</div>
                <div className="text-sm text-gray-500">待写章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{outline.structure.length}</div>
                <div className="text-sm text-gray-500">故事卷数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round((outline.currentChapters / outline.totalChapters) * 100)}%</div>
                <div className="text-sm text-gray-500">完成进度</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${(outline.currentChapters / outline.totalChapters) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI生成工具 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              AI大纲生成工具
            </CardTitle>
            <CardDescription>
              基于世界观和角色设定，智能生成完整的故事大纲
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故事长度
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="short">短篇 (10-20章)</option>
                  <option value="medium">中篇 (20-50章)</option>
                  <option value="long">长篇 (50-100章)</option>
                  <option value="series">系列 (100+章)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故事节奏
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="fast">快节奏</option>
                  <option value="medium">中等节奏</option>
                  <option value="slow">慢节奏</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  冲突强度
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="high">高强度</option>
                  <option value="medium">中等强度</option>
                  <option value="low">低强度</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                故事主线
              </label>
              <Input 
                placeholder="描述您希望的主要故事线和发展方向..."
                className="w-full"
              />
            </div>
            <div className="flex space-x-3">
              <Button>
                <SparklesIcon className="h-4 w-4 mr-2" />
                生成完整大纲
              </Button>
              <Button variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                生成下一章
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 大纲结构 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">大纲结构</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Bars3Icon className="h-4 w-4 mr-2" />
              树状视图
            </Button>
            <Button variant="outline" size="sm">
              <ListBulletIcon className="h-4 w-4 mr-2" />
              列表视图
            </Button>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              添加卷
            </Button>
          </div>
        </div>

        {/* 大纲内容 */}
        <div className="space-y-6">
          {outline.structure.map((arc, arcIndex) => (
            <Card key={arc.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{arc.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {arc.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon">
                      <ArrowUpIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ArrowDownIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {arc.chapters.map((chapter, chapterIndex) => (
                    <Card key={chapter.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{chapter.title}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[chapter.status as keyof typeof statusColors]}`}>
                                {chapter.status}
                              </span>
                              {chapter.wordCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {chapter.wordCount.toLocaleString()} 字
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{chapter.description}</p>
                            
                            {/* 关键事件 */}
                            <div className="mb-3">
                              <span className="text-xs font-medium text-gray-700">关键事件：</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {chapter.keyEvents.map((event, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
                                    {event}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 涉及角色 */}
                            <div className="mb-3">
                              <span className="text-xs font-medium text-gray-700">涉及角色：</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {chapter.characters.map((character, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-50 text-green-700">
                                    {character}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 剧情节点 */}
                            {chapter.plotPoints.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">剧情节点：</span>
                                <ul className="mt-1 space-y-1">
                                  {chapter.plotPoints.map((point, index) => (
                                    <li key={index} className="flex items-start text-xs text-gray-600">
                                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-1 ml-4">
                            <Button variant="ghost" size="icon">
                              <ArrowUpIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <ArrowDownIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                          <Button variant="outline" size="sm">
                            编辑详情
                          </Button>
                          {chapter.status === "未开始" && (
                            <Button size="sm">
                              开始写作
                            </Button>
                          )}
                          {chapter.status === "进行中" && (
                            <Button size="sm">
                              继续写作
                            </Button>
                          )}
                          {chapter.status === "已完成" && (
                            <Button variant="outline" size="sm">
                              查看内容
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* 添加章节按钮 */}
                  <Button variant="outline" className="w-full border-dashed">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    添加章节到 {arc.title}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}