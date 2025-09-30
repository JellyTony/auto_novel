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
  FilmIcon
} from '@heroicons/react/24/outline';
import { 
  VideoScriptAPI, 
  VideoScript as APIVideoScript, 
  VideoScene as APIVideoScene, 
  GenerateVideoScriptRequest,
  OptimizeVideoScriptRequest 
} from '@/lib/api';

interface VideoScene {
  index: number;
  duration: number;
  shotType: string;
  visualDescription: string;
  narration: string;
  subtitle: string;
  soundEffects: string[];
  transition: string;
  keyElements: string[];
}

interface VideoScript {
  id: string;
  title: string;
  platform: string;
  duration: number;
  style: string;
  scenes: VideoScene[];
  hashtags: string[];
  description: string;
  status: string;
  createdAt: string;
}

export default function VideoScriptPage() {
  const [selectedChapter, setSelectedChapter] = useState('chapter-3');
  const [selectedPlatform, setSelectedPlatform] = useState('douyin');
  const [videoDuration, setVideoDuration] = useState(60);
  const [videoStyle, setVideoStyle] = useState('dramatic');
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScript, setSelectedScript] = useState<VideoScript | null>(null);
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 模拟数据
  const chapters = [
    { id: 'chapter-1', title: '第1章：觉醒', wordCount: 3200 },
    { id: 'chapter-2', title: '第2章：初试身手', wordCount: 3800 },
    { id: 'chapter-3', title: '第3章：神秘师父', wordCount: 4200 },
    { id: 'chapter-4', title: '第4章：修炼之路', wordCount: 3600 },
  ];

  const platforms = [
    { id: 'douyin', name: '抖音', aspectRatio: '9:16', maxDuration: 180 },
    { id: 'kuaishou', name: '快手', aspectRatio: '9:16', maxDuration: 300 },
    { id: 'xiaohongshu', name: '小红书', aspectRatio: '4:5', maxDuration: 90 },
    { id: 'bilibili', name: 'B站', aspectRatio: '16:9', maxDuration: 600 },
  ];

  const styles = [
    { id: 'dramatic', name: '戏剧化', description: '强调冲突和转折' },
    { id: 'suspense', name: '悬疑', description: '营造紧张氛围' },
    { id: 'emotional', name: '情感', description: '突出情感共鸣' },
    { id: 'action', name: '动作', description: '快节奏剪辑' },
  ];

  // 加载视频脚本列表
  const loadVideoScripts = async () => {
    try {
      const response = await VideoScriptAPI.listVideoScripts({ projectId: 'project-1' });
      // 转换API响应到本地类型
      const convertedScripts: VideoScript[] = (response.scripts || []).map(apiScript => ({
        id: apiScript.id || '',
        title: apiScript.title || '',
        platform: apiScript.platform || '',
        duration: apiScript.duration || 0,
        style: apiScript.style || '',
        scenes: (apiScript.scenes || []).map(apiScene => ({
          index: apiScene.index || 0,
          duration: apiScene.duration || 0,
          shotType: apiScene.shotType || '',
          visualDescription: apiScene.visualDescription || '',
          narration: apiScene.narration || '',
          subtitle: apiScene.subtitle || '',
          soundEffects: apiScene.soundEffects || [],
          transition: apiScene.transition || '',
          keyElements: apiScene.keyElements || []
        })),
        hashtags: apiScript.hashtags || [],
        description: apiScript.description || '',
        status: apiScript.status || 'completed',
        createdAt: apiScript.createdAt || new Date().toLocaleString()
      }));
      setVideoScripts(convertedScripts);
    } catch (error) {
      console.error('加载脚本列表失败:', error);
      // 使用模拟数据作为后备
      setVideoScripts([
        {
          id: 'script-1',
          title: '第3章：神秘师父 - 抖音版',
          platform: 'douyin',
          duration: 60,
          style: 'dramatic',
          scenes: [
            {
              index: 1,
              duration: 8,
              shotType: '特写',
              visualDescription: '主角林枫紧皱眉头，眼中闪烁着困惑的光芒',
              narration: '就在林枫以为自己要死的时候...',
              subtitle: '危机时刻',
              soundEffects: ['紧张音效', '心跳声'],
              transition: '快切',
              keyElements: ['主角表情', '眼神特写']
            }
          ],
          hashtags: ['#修仙', '#逆袭', '#热血'],
          description: '主角遇到神秘师父，命运发生转折',
          status: 'completed',
          createdAt: '2024-01-15 14:30'
        }
      ]);
    }
  };

  useEffect(() => {
    loadVideoScripts();
  }, []);

  // 生成视频脚本
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const selectedChapterData = chapters.find(c => c.id === selectedChapter);
      if (!selectedChapterData) {
        throw new Error('未找到选中的章节');
      }

      const request: GenerateVideoScriptRequest = {
        projectId: 'project-1',
        chapterId: selectedChapter,
        chapterTitle: selectedChapterData.title,
        chapterContent: `这是${selectedChapterData.title}的内容，共${selectedChapterData.wordCount}字...`,
        platform: selectedPlatform,
        duration: videoDuration,
        style: videoStyle,
        requirements: requirements || undefined
      };

      const response = await VideoScriptAPI.generateVideoScript(request);
      
      if (response.videoScript) {
        // 转换API响应到本地类型
        const newScript: VideoScript = {
          id: response.videoScript.id || `script-${Date.now()}`,
          title: response.videoScript.title || '新生成的脚本',
          platform: selectedPlatform,
          duration: videoDuration,
          style: videoStyle,
          scenes: (response.videoScript.scenes || []).map(scene => ({
            index: scene.index || 0,
            duration: scene.duration || 0,
            shotType: scene.shotType || '',
            visualDescription: scene.visualDescription || '',
            narration: scene.narration || '',
            subtitle: scene.subtitle || '',
            soundEffects: scene.soundEffects || [],
            transition: scene.transition || '',
            keyElements: scene.keyElements || []
          })),
          hashtags: response.videoScript.hashtags || [],
          description: response.videoScript.description || '',
          status: response.videoScript.status || 'completed',
          createdAt: new Date().toLocaleString()
        };

        setVideoScripts(prev => [newScript, ...prev]);
        setSelectedScript(newScript);
      }
    } catch (error) {
      console.error('生成脚本失败:', error);
      setError('生成脚本失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 优化脚本
  const handleOptimize = async (scriptId: string) => {
    try {
      const request: OptimizeVideoScriptRequest = {
        scriptId,
        requirements: '请优化脚本的节奏和视觉效果'
      };

      const response = await VideoScriptAPI.optimizeVideoScript(request);
      
      if (response.videoScript) {
        // 更新脚本列表
        setVideoScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { ...script, ...response.videoScript }
            : script
        ));
      }
    } catch (error) {
      console.error('优化脚本失败:', error);
      setError('优化脚本失败，请稍后重试');
    }
  };

  // 删除脚本
  const handleDelete = async (scriptId: string) => {
    try {
      await VideoScriptAPI.deleteVideoScript(scriptId);
      setVideoScripts(prev => prev.filter(script => script.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    } catch (error) {
      console.error('删除脚本失败:', error);
      setError('删除脚本失败，请稍后重试');
    }
  };

  // 导出脚本
  const handleExport = (script: VideoScript) => {
    const content = JSON.stringify(script, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="短视频脚本生成" description="将小说章节转换为适合短视频平台的分镜脚本" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              关闭
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：生成设置 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 章节选择 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                选择章节
              </h3>
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChapter === chapter.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedChapter(chapter.id)}
                  >
                    <div className="font-medium text-gray-900">{chapter.title}</div>
                    <div className="text-sm text-gray-500">{chapter.wordCount} 字</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 平台设置 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                平台设置
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">目标平台</label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          selectedPlatform === platform.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPlatform(platform.id)}
                      >
                        <div className="font-medium text-sm">{platform.name}</div>
                        <div className="text-xs text-gray-500">{platform.aspectRatio}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">视频时长</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(Number(e.target.value))}
                      min="15"
                      max="300"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">秒</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 视频风格 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FilmIcon className="h-5 w-5 mr-2" />
                视频风格
              </h3>
              <div className="space-y-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      videoStyle === style.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setVideoStyle(style.id)}
                  >
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* 特殊要求 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">特殊要求</h3>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="请输入对脚本的特殊要求..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </Card>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  生成中...
                </div>
              ) : (
                '生成视频脚本'
              )}
            </Button>
          </div>

          {/* 中间：历史脚本 */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">历史脚本</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {videoScripts.map((script) => (
                  <div
                    key={script.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedScript?.id === script.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedScript(script)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{script.title}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScript(script);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptimize(script.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(script);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-600"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(script.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {script.duration}s
                      </span>
                      <span>{script.platform}</span>
                      <span>{script.scenes.length} 镜头</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{script.createdAt}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧：脚本预览 */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">脚本预览</h3>
              {selectedScript ? (
                <div className="space-y-6">
                  {/* 脚本基本信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{selectedScript.title}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">时长：</span>
                        <span className="text-gray-900">{selectedScript.duration}秒</span>
                      </div>
                      <div>
                        <span className="text-gray-500">镜头数：</span>
                        <span className="text-gray-900">{selectedScript.scenes.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">平台：</span>
                        <span className="text-gray-900">{selectedScript.platform}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">风格：</span>
                        <span className="text-gray-900">{selectedScript.style}</span>
                      </div>
                    </div>
                  </div>

                  {/* 脚本描述 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">脚本描述</h5>
                    <p className="text-sm text-gray-600">{selectedScript.description}</p>
                  </div>

                  {/* 推荐标签 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      推荐标签
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedScript.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 分镜详情 */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">分镜详情</h5>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {selectedScript.scenes.map((scene, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">镜头 {scene.index}</span>
                            <span className="text-xs text-gray-500">{scene.duration}s</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-gray-500 flex items-center">
                                <PhotoIcon className="h-3 w-3 mr-1" />
                                画面：
                              </span>
                              <p className="text-gray-900 mt-1">{scene.visualDescription}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500 flex items-center">
                                <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                                旁白：
                              </span>
                              <p className="text-gray-900 mt-1">{scene.narration}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">字幕：</span>
                              <span className="text-gray-900 ml-1">{scene.subtitle}</span>
                            </div>
                            
                            {scene.soundEffects.length > 0 && (
                              <div>
                                <span className="text-gray-500">音效：</span>
                                <span className="text-gray-900 ml-1">{scene.soundEffects.join(', ')}</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between">
                              <div>
                                <span className="text-gray-500">镜头：</span>
                                <span className="text-gray-900 ml-1">{scene.shotType}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">转场：</span>
                                <span className="text-gray-900 ml-1">{scene.transition}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>选择一个脚本查看详情</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}