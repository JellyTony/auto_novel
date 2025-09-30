"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { NovelAPI, Outline, GenerateOutlineRequest, WorldView, Character, GenerationContext } from "@/lib/api";

export default function OutlinePage() {
  const [outline, setOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("1");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateOutlineRequest>({
    projectId: "1",
    chapterCount: 10,
    worldView: {} as WorldView,
    characters: [] as Character[]
  });

  // 模拟大纲数据
  const mockOutline: Outline = {
    id: "1",
    projectId: "1",
    chapters: [
      {
        index: 1,
        title: "意外的传承",
        summary: "程序员林逸在加班时意外触发古老的修仙传承，获得修仙功法。",
        goal: "建立主角的修仙起点",
        twistHint: "玉佩的真正来历",
        importantItems: ["神秘玉佩", "修仙功法"]
      },
      {
        index: 2,
        title: "初试身手",
        summary: "林逸尝试修炼，发现自己的修仙天赋，同时遇到第一个挑战。",
        goal: "展现主角的天赋和初步实力",
        twistHint: "修仙界的关注",
        importantItems: ["修炼心得", "第一次战斗"]
      },
      {
        index: 3,
        title: "神秘师父",
        summary: "张师父出现，指导林逸正确的修炼方法，揭示修仙世界的秘密。",
        goal: "引入师父角色，扩展世界观",
        twistHint: "师父的真实身份",
        importantItems: ["师父传授", "修仙界秘密"]
      }
    ]
  };

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
      setOutline(response.outline);
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
      
      <div className="flex-1 overflow-auto p-6">
        {/* 大纲概览 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  都市修仙传大纲
                </CardTitle>
                <CardDescription className="mt-1">
                  总计划 30 章，已规划 {outline.chapters.length} 章
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  预览
                </Button>
                <Button variant="outline" size="sm">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  编辑
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{outline.chapters.length}</div>
                <div className="text-sm text-gray-500">已规划章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{30 - outline.chapters.length}</div>
                <div className="text-sm text-gray-500">待规划章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{outline.chapters.filter(c => c.importantItems.length > 0).length}</div>
                <div className="text-sm text-gray-500">详细章节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round((outline.chapters.length / 30) * 100)}%</div>
                <div className="text-sm text-gray-500">规划进度</div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${(outline.chapters.length / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工具栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="搜索章节..."
                    className="pl-10 w-64"
                  />
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">全部状态</option>
                  <option value="completed">已完成</option>
                  <option value="in-progress">进行中</option>
                  <option value="planned">已规划</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setShowGenerateForm(true)}>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  生成完整大纲
                </Button>
                <Button variant="outline">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  手动添加章节
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 章节视图切换 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">
              列表视图
            </Button>
            <Button variant="outline" size="sm">
              卡片视图
            </Button>
            <Button variant="outline" size="sm">
              时间线视图
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>共 {outline.chapters.length} 个章节</span>
          </div>
        </div>

        {/* 大纲内容 */}
        <div className="space-y-4">
          {outline.chapters.map((chapter, index) => (
            <Card key={chapter.index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">第{chapter.index}章：{chapter.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{chapter.summary}</p>
                    
                    {/* 章节目标 */}
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-700">章节目标：</span>
                      <p className="text-xs text-gray-600 mt-1">{chapter.goal}</p>
                    </div>

                    {/* 重要道具 */}
                    {chapter.importantItems.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-700">重要道具：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chapter.importantItems.map((item, itemIndex) => (
                            <span key={itemIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-50 text-green-700">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 转折提示 */}
                    {chapter.twistHint && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">转折提示：</span>
                        <p className="text-xs text-gray-600 mt-1">{chapter.twistHint}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-4">
                    <Button variant="ghost" size="sm">
                      <ArrowUpIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ArrowDownIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <TrashIcon className="h-4 w-4" />
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