'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  VideoCameraIcon, 
  PlusIcon, 
  TagIcon, 
  ClockIcon, 
  FilmIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  SpeakerWaveIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { VideoScriptAPI, VideoScript, GenerateVideoScriptRequest, Project, NovelAPI } from '@/lib/api';
import { useApiList, useApiMutation } from '@/lib/hooks/useApi';

// 平台选项
const platformOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'bilibili', label: 'B站' },
  { value: 'kuaishou', label: '快手' },
  { value: 'weibo', label: '微博' },
];

// 风格选项
const styleOptions = [
  { value: 'suspense', label: '悬疑紧张' },
  { value: 'romantic', label: '浪漫温馨' },
  { value: 'action', label: '动作刺激' },
  { value: 'comedy', label: '轻松幽默' },
  { value: 'dramatic', label: '戏剧冲突' },
  { value: 'documentary', label: '纪实风格' },
];

export default function VideoScriptPage() {
  // 项目列表
  const { 
    data: projects = [], 
    loading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects 
  } = useApiList<Project>(() => NovelAPI.listProjects({ page: 1, pageSize: 100 }), {
    transform: (response) => response.projects || []
  });

  // 视频脚本列表
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { 
    data: videoScripts = [], 
    loading: scriptsLoading, 
    error: scriptsError,
    refetch: refetchScripts 
  } = useApiList<VideoScript>(
    () => selectedProjectId ? VideoScriptAPI.listVideoScripts(selectedProjectId) : Promise.resolve({ scripts: [] }),
    {
      transform: (response) => response.scripts || [],
      dependencies: [selectedProjectId]
    }
  );

  // 生成视频脚本
  const { mutate: generateScript, loading: generating } = useApiMutation(
    VideoScriptAPI.generateVideoScript,
    {
      onSuccess: () => {
        setShowGenerateForm(false);
        refetchScripts();
        setGenerateRequest({
          project_id: selectedProjectId,
          chapter_ids: [],
          platform: 'douyin',
          duration: 60,
          style: 'suspense',
          requirements: ''
        });
      }
    }
  );

  // 表单状态
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateVideoScriptRequest>({
    project_id: '',
    chapter_ids: [],
    platform: 'douyin',
    duration: 60,
    style: 'suspense',
    requirements: ''
  });

  // 当选择项目时，更新生成请求中的项目ID
  useEffect(() => {
    if (selectedProjectId) {
      setGenerateRequest(prev => ({
        ...prev,
        project_id: selectedProjectId
      }));
    }
  }, [selectedProjectId]);

  const handleGenerateVideoScript = () => {
    if (!generateRequest.project_id) {
      alert('请先选择项目');
      return;
    }
    generateScript(generateRequest);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">视频脚本</h1>
            <p className="text-gray-600 mt-2">基于小说内容生成短视频脚本</p>
          </div>
          <Button 
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>生成视频脚本</span>
          </Button>
        </div>

        {/* 项目选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择项目</CardTitle>
            <CardDescription>选择要生成视频脚本的小说项目</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">加载项目中...</p>
              </div>
            ) : projectsError ? (
              <div className="text-center py-4">
                <p className="text-red-600">加载项目失败: {projectsError}</p>
                <Button variant="outline" onClick={refetchProjects} className="mt-2">
                  重试
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProjectId === project.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{project.genre}</span>
                        <span>{project.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 生成表单 */}
        {showGenerateForm && (
          <Card>
            <CardHeader>
              <CardTitle>生成视频脚本</CardTitle>
              <CardDescription>设置脚本参数并生成短视频脚本</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Textarea
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
        {selectedProjectId && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">视频脚本列表</h2>
            {scriptsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : scriptsError ? (
              <div className="text-center py-8">
                <p className="text-red-600">加载失败: {scriptsError}</p>
                <Button variant="outline" onClick={refetchScripts} className="mt-2">
                  重试
                </Button>
              </div>
            ) : videoScripts.length === 0 ? (
              <div className="text-center py-8">
                <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">暂无视频脚本</p>
                <p className="text-sm text-gray-500 mt-1">点击"生成视频脚本"开始创建</p>
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
        )}
      </div>
    </div>
  );
}