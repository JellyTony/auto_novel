"use client";

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
import { useState, useEffect } from "react";
import { NovelAPI, Outline, GenerateOutlineRequest, GenerationContext } from "@/lib/api";

// 模拟大纲数据
const mockOutline = {
  id: "1",
  projectId: "1",
  title: "都市修仙传大纲",
  description: "现代都市背景下的修仙故事完整大纲",
  totalChapters: 30,
  chapterOutlines: [
    {
      id: "1",
      chapterNumber: 1,
      title: "意外的传承",
      summary: "程序员林逸在加班时意外触发古老的修仙传承，获得修仙功法。",
      keyEvents: ["获得传承", "初次修炼", "感知灵气"],
      characters: ["林逸"],
      plotPoints: ["传承觉醒", "能力初现"]
    },
    {
      id: "2",
      chapterNumber: 2,
      title: "初试身手",
      summary: "林逸尝试修炼，发现自己的修仙天赋，同时遇到第一个挑战。",
      keyEvents: ["初次修炼", "遇到危险", "展现实力"],
      characters: ["林逸", "小混混"],
      plotPoints: ["实力展现", "声名初起"]
    },
    {
      id: "3",
      chapterNumber: 3,
      title: "神秘师父",
      summary: "张师父出现，指导林逸正确的修炼方法，揭示修仙世界的秘密。",
      keyEvents: ["遇见师父", "学习正法", "了解修仙界"],
      characters: ["林逸", "张师父"],
      plotPoints: ["师父指导", "修仙界揭秘"]
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
  const [outline, setOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("1");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateOutlineRequest>({
    projectId: "1",
    chapterCount: 10,
    generationContext: {} as GenerationContext
  });

  // 加载大纲
  const loadOutline = async (projectId: string) => {
    try {
      setLoading(true);
      // 这里应该调用API获取大纲
      // const response = await NovelAPI.getOutline(projectId);
      // setOutline(response);
      
      // 暂时使用模拟数据
      setOutline(mockOutline);
    } catch (error) {
      console.error('加载大纲失败:', error);
      setOutline(mockOutline); // 使用模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 生成大纲
  const handleGenerateOutline = async () => {
    try {
      if (!generateRequest.projectId) {
        alert('请选择项目');
        return;
      }

      const response = await NovelAPI.generateOutline(generateRequest);
      setOutline(response);
      setShowGenerateForm(false);
    } catch (error) {
      console.error('生成大纲失败:', error);
      alert('生成大纲失败，请重试');
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadOutline(selectedProject);
    }
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title="大纲编辑" 
          description="规划和编辑您的小说大纲结构"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title="大纲编辑" 
          description="规划和编辑您的小说大纲结构"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无大纲数据</p>
            <Button onClick={() => setShowGenerateForm(true)}>
              <SparklesIcon className="h-4 w-4 mr-2" />
              生成大纲
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                  总计划 {outline.totalChapters} 章，已规划 {outline.chapterOutlines.length} 章
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
                <div className="text-2xl font-bold text-blue-600">{outline.chapterOutlines.length}</div>
                <div className="text-sm text-gray-500">已规划章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{outline.totalChapters - outline.chapterOutlines.length}</div>
                <div className="text-sm text-gray-500">待规划章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{outline.chapterOutlines.filter(c => c.keyEvents.length > 0).length}</div>
                <div className="text-sm text-gray-500">详细章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round((outline.chapterOutlines.length / outline.totalChapters) * 100)}%</div>
                <div className="text-sm text-gray-500">规划进度</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${(outline.chapterOutlines.length / outline.totalChapters) * 100}%` }}
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
              <Button onClick={() => setShowGenerateForm(true)}>
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
        <div className="space-y-4">
          {outline.chapterOutlines.map((chapter, index) => (
            <Card key={chapter.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">第{chapter.chapterNumber}章：{chapter.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{chapter.summary}</p>
                    
                    {/* 关键事件 */}
                    {chapter.keyEvents.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-700">关键事件：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chapter.keyEvents.map((event, eventIndex) => (
                            <span key={eventIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 涉及角色 */}
                    {chapter.characters.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-700">涉及角色：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chapter.characters.map((character, characterIndex) => (
                            <span key={characterIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-50 text-green-700">
                              {character}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 剧情节点 */}
                    {chapter.plotPoints.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">剧情节点：</span>
                        <ul className="mt-1 space-y-1">
                          {chapter.plotPoints.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start text-xs text-gray-600">
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
                  <Button size="sm">
                    开始写作
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* 添加章节按钮 */}
          <Button variant="outline" className="w-full border-dashed">
            <PlusIcon className="h-4 w-4 mr-2" />
            添加新章节
          </Button>
        </div>

        {/* 生成大纲表单 */}
        {showGenerateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>生成大纲</CardTitle>
                <CardDescription>设置生成参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    章节数量
                  </label>
                  <Input
                    type="number"
                    value={generateRequest.chapterCount}
                    onChange={(e) => setGenerateRequest(prev => ({
                      ...prev,
                      chapterCount: parseInt(e.target.value) || 10
                    }))}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleGenerateOutline} className="flex-1">
                    生成
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGenerateForm(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}