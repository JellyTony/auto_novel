"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GlobeAltIcon,
  SparklesIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { NovelAPI, WorldView, GenerateWorldViewRequest, Project } from "@/lib/api";

export default function WorldviewPage() {
  const [worldViews, setWorldViews] = useState<WorldView[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("1");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateWorldViewRequest>({
    projectId: "1",
    genre: "现代都市",
    setting: "现代都市背景",
    keyRules: [],
    tone: "轻松幽默",
    targetAudience: "青年读者",
    themes: []
  });

  // 模拟世界观数据作为后备
  const mockWorldViews: WorldView[] = [
    {
      id: "1",
      projectId: "1",
      genre: "现代都市",
      setting: "现代都市背景下，隐藏着修仙者的世界",
      keyRules: [
        "修仙者必须隐藏身份，不能在普通人面前暴露超自然能力",
        "灵气主要集中在城市的特定区域，如古建筑、公园等",
        "修仙等级分为：练气、筑基、金丹、元婴、化神",
        "现代科技对修仙有一定影响，需要平衡传统修仙与现代生活"
      ],
      tone: "轻松幽默",
      targetAudience: "青年读者",
      themes: ["修仙", "都市", "成长"],
      description: "在现代都市背景下，隐藏着修仙者的世界。高楼大厦之间存在着灵气节点，修仙者需要在现代社会中隐藏身份，同时追求修仙之道。",
      createdAt: "2024-09-15T10:30:00Z"
    },
    {
      id: "2",
      projectId: "2",
      genre: "科幻",
      setting: "公元2387年，星际联邦宇宙",
      keyRules: [
        "星际联邦由人类主导，包含12个主要外星种族",
        "超光速旅行通过虫洞网络实现",
        "每个种族都有独特的生理特征和文化背景",
        "存在古老的先驱者文明遗迹，蕴含强大科技"
      ],
      tone: "严肃正经",
      targetAudience: "成年读者",
      themes: ["科幻", "太空", "冒险"],
      description: "公元2387年，人类已经建立了跨越银河系的星际联邦。各种外星种族共存，科技高度发达，但也面临着来自未知星域的威胁。",
      createdAt: "2024-09-01T10:30:00Z"
    }
  ];

  // 加载世界观列表
  const loadWorldViews = async () => {
    try {
      setLoading(true);
      // 这里应该调用API获取世界观列表
      // const response = await NovelAPI.listWorldViews(selectedProject);
      // setWorldViews(response.worldViews);
      
      // 暂时使用模拟数据
      setWorldViews(mockWorldViews);
    } catch (error) {
      console.error('加载世界观失败:', error);
      setWorldViews(mockWorldViews); // 使用模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 生成世界观
  const handleGenerateWorldView = async () => {
    try {
      setGenerating(true);
      const response = await NovelAPI.generateWorldView(generateRequest);
      setWorldViews([...worldViews, response.worldView]);
      setShowGenerateForm(false);
    } catch (error) {
      console.error('生成世界观失败:', error);
      alert('生成世界观失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadWorldViews();
  }, [selectedProject]);

  const genreOptions = [
    { value: "现代都市", label: "现代都市", subGenres: ["都市生活", "玄幻", "异能", "重生"] },
    { value: "古代言情", label: "古代言情", subGenres: ["宫廷", "江湖", "穿越", "重生"] },
    { value: "科幻", label: "科幻", subGenres: ["太空歌剧", "赛博朋克", "末世", "机甲"] },
    { value: "悬疑推理", label: "悬疑推理", subGenres: ["刑侦", "心理", "灵异", "密室"] },
    { value: "奇幻", label: "奇幻", subGenres: ["西方奇幻", "东方玄幻", "魔法", "异世界"] }
  ];

  return (
    <div className="container mx-auto p-6">
      <Header 
        title="世界观设定" 
        description="创建和管理小说的世界观设定，包括背景、规则和氛围"
      />
      
      <div className="space-y-6">
        {/* 操作栏 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">项目1 - 都市修仙</option>
              <option value="2">项目2 - 星际冒险</option>
            </select>
          </div>
          
          <Button 
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>生成世界观</span>
          </Button>
        </div>

        {/* 生成表单 */}
        {showGenerateForm && (
          <Card>
            <CardHeader>
              <CardTitle>生成世界观</CardTitle>
              <CardDescription>设置世界观的基本参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">类型</label>
                  <select
                    value={generateRequest.genre}
                    onChange={(e) => setGenerateRequest({...generateRequest, genre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {genreOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">基调</label>
                  <select
                    value={generateRequest.tone}
                    onChange={(e) => setGenerateRequest({...generateRequest, tone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="轻松幽默">轻松幽默</option>
                    <option value="严肃正经">严肃正经</option>
                    <option value="悬疑紧张">悬疑紧张</option>
                    <option value="浪漫温馨">浪漫温馨</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">背景设定</label>
                <Input
                  value={generateRequest.setting}
                  onChange={(e) => setGenerateRequest({...generateRequest, setting: e.target.value})}
                  placeholder="描述世界观的基本背景设定..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">目标读者</label>
                <select
                  value={generateRequest.targetAudience}
                  onChange={(e) => setGenerateRequest({...generateRequest, targetAudience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="青年读者">青年读者</option>
                  <option value="成年读者">成年读者</option>
                  <option value="全年龄">全年龄</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateForm(false)}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateWorldView}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成世界观'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 世界观列表 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {worldViews.map((worldView) => (
              <Card key={worldView.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                        <span>{worldView.genre} 世界观</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {worldView.description}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        背景设定
                      </h4>
                      <p className="text-sm text-gray-600">{worldView.setting}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        基调与受众
                      </h4>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">基调: {worldView.tone}</p>
                        <p className="text-sm text-gray-600">受众: {worldView.targetAudience}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 核心规则 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      核心规则
                    </h4>
                    <ul className="space-y-1">
                      {worldView.keyRules.map((rule, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 主题标签 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">主题标签</h4>
                    <div className="flex flex-wrap gap-2">
                      {worldView.themes.map((theme, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* 创建时间 */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    创建时间: {worldView.createdAt ? new Date(worldView.createdAt).toLocaleString('zh-CN') : '未知'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}