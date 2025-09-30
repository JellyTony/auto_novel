"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlayIcon, 
  PauseIcon, 
  DocumentTextIcon, 
  VideoCameraIcon,
  ShareIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  TagIcon,
  SpeakerWaveIcon,
  PhotoIcon,
  FilmIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  VideoScriptAPI, 
  VideoScript, 
  VideoScene, 
  GenerateVideoScriptRequest,
  OptimizeVideoScriptRequest,
  Project
} from '@/lib/api';

export default function VideoScriptPage() {
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("1");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateVideoScriptRequest>({
    projectId: "1",
    chapterId: "1",
    chapterTitle: "第一章",
    chapterContent: "章节内容",
    platform: "抖音",
    duration: 60,
    style: "剧情类"
  });

  // 模拟视频脚本数据作为后备
  const mockVideoScripts: VideoScript[] = [
    {
      id: "1",
      projectId: "1",
      chapterId: "1",
      title: "都市修仙第一集：觉醒",
      platform: "抖音",
      duration: 60,
      style: "剧情类",
      description: "主角遇到神秘师父，命运发生转折",
      status: "completed",
      scenes: [
        {
          index: 1,
          duration: 15,
          shotType: "特写",
          visualDescription: "主角李明在办公室加班，疲惫不堪",
          narration: "又是一个加班到深夜的日子",
          subtitle: "现代社畜的日常",
          soundEffects: ["键盘敲击声", "空调嗡嗡声"],
          transition: "淡入",
          keyElements: ["办公室", "电脑", "疲惫表情"]
        },
        {
          index: 2,
          duration: 20,
          shotType: "中景",
          visualDescription: "李明走在回家路上，突然感到一阵眩晕",
          narration: "就在这时，一股神秘力量涌入体内",
          subtitle: "命运的转折点",
          soundEffects: ["脚步声", "风声", "神秘音效"],
          transition: "快切",
          keyElements: ["街道", "路灯", "神秘光芒"]
        },
        {
          index: 3,
          duration: 25,
          shotType: "全景",
          visualDescription: "李明发现自己能够感知到周围的灵气",
          narration: "这就是传说中的修仙之路吗？",
          subtitle: "新世界的大门打开",
          soundEffects: ["心跳声", "能量流动声"],
          transition: "溶解",
          keyElements: ["灵气可视化", "震惊表情", "城市夜景"]
        }
      ],
      hooks: {
        opening: "现代社畜的平凡生活",
        climax: "神秘力量的觉醒",
        ending: "修仙之路的开始"
      },
      hashtags: ["#修仙", "#逆袭", "#热血"],
      createdAt: "2024-09-15T10:30:00Z"
    }
  ];

  // 加载视频脚本列表
  const loadVideoScripts = async () => {
    try {
      setLoading(true);
      const response = await VideoScriptAPI.listVideoScripts({ projectId: selectedProject });
      setVideoScripts(response.scripts);
    } catch (error) {
      console.error('加载视频脚本失败:', error);
      setVideoScripts(mockVideoScripts); // 使用模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 生成视频脚本
  const handleGenerateVideoScript = async () => {
    try {
      setGenerating(true);
      const response = await VideoScriptAPI.generateVideoScript(generateRequest);
      setVideoScripts([...videoScripts, response.videoScript]);
      setShowGenerateForm(false);
    } catch (error) {
      console.error('生成视频脚本失败:', error);
      alert('生成视频脚本失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadVideoScripts();
  }, [selectedProject]);

  const platformOptions = [
    { value: "抖音", label: "抖音" },
    { value: "快手", label: "快手" },
    { value: "小红书", label: "小红书" },
    { value: "B站", label: "B站" },
    { value: "微信视频号", label: "微信视频号" }
  ];

  const styleOptions = [
    { value: "剧情类", label: "剧情类" },
    { value: "解说类", label: "解说类" },
    { value: "访谈类", label: "访谈类" },
    { value: "教程类", label: "教程类" }
  ];

  return (
    <div className="container mx-auto p-6">
      <Header 
        title="视频脚本" 
        description="将小说章节转换为短视频脚本，支持多平台优化"
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
            <span>生成视频脚本</span>
          </Button>
        </div>

        {/* 生成表单 */}
        {showGenerateForm && (
          <Card>
            <CardHeader>
              <CardTitle>生成视频脚本</CardTitle>
              <CardDescription>选择章节并设置视频参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">章节标题</label>
                  <Input
                    value={generateRequest.chapterTitle}
                    onChange={(e) => setGenerateRequest({...generateRequest, chapterTitle: e.target.value})}
                    placeholder="第一章：觉醒"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">平台</label>
                  <select
                    value={generateRequest.platform}
                    onChange={(e) => setGenerateRequest({...generateRequest, platform: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platformOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">时长（秒）</label>
                  <Input
                    type="number"
                    value={generateRequest.duration}
                    onChange={(e) => setGenerateRequest({...generateRequest, duration: parseInt(e.target.value)})}
                    placeholder="60"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">风格</label>
                  <select
                    value={generateRequest.style}
                    onChange={(e) => setGenerateRequest({...generateRequest, style: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {styleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">特殊要求</label>
                <textarea
                  value={generateRequest.requirements || ''}
                  onChange={(e) => setGenerateRequest({...generateRequest, requirements: e.target.value})}
                  placeholder="请输入对脚本的特殊要求..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateForm(false)}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateVideoScript}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成脚本'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 视频脚本列表 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {videoScripts.map((script) => (
              <Card key={script.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <VideoCameraIcon className="h-5 w-5 text-purple-600" />
                        <span>{script.title}</span>
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center space-x-4">
                        <span className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-1" />
                          {script.platform}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {script.duration}秒
                        </span>
                        <span className="flex items-center">
                          <FilmIcon className="h-4 w-4 mr-1" />
                          {script.style}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ShareIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 脚本钩子 */}
                  {script.hooks && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">脚本钩子</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">开头：</span>
                          <p className="text-gray-600">{script.hooks.opening}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">高潮：</span>
                          <p className="text-gray-600">{script.hooks.climax}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">结尾：</span>
                          <p className="text-gray-600">{script.hooks.ending}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 场景列表 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">场景分镜</h4>
                    <div className="space-y-3">
                      {script.scenes.slice(0, 3).map((scene) => (
                        <div key={scene.index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">场景 {scene.index}</span>
                            <span className="text-xs text-gray-500">{scene.duration}秒 · {scene.shotType}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{scene.visualDescription}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span className="flex items-center">
                              <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                              {scene.narration}
                            </span>
                          </div>
                          {scene.keyElements && scene.keyElements.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {scene.keyElements.map((element, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {element}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {script.scenes.length > 3 && (
                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            查看全部 {script.scenes.length} 个场景
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 推荐标签 */}
                  {script.hashtags && script.hashtags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">推荐标签</h4>
                      <div className="flex flex-wrap gap-2">
                        {script.hashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      导出
                    </Button>
                    <Button size="sm">
                      <PlayIcon className="h-4 w-4 mr-1" />
                      生成视频
                    </Button>
                  </div>
                  
                  {/* 创建时间 */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    创建时间: {script.createdAt ? new Date(script.createdAt).toLocaleString('zh-CN') : '未知'}
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