"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  BookOpenIcon,
  CalendarIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { NovelAPI, Project, CreateProjectRequest } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState<CreateProjectRequest>({
    title: "",
    description: "",
    genre: "",
    targetAudience: "",
    tone: "",
    themes: []
  });

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await NovelAPI.listProjects({ page: 1, pageSize: 20 });
      setProjects(response.projects || []);
    } catch (error) {
      console.error('加载项目列表失败:', error);
      // 使用模拟数据作为后备
      setProjects([
        {
          id: "1",
          title: "都市修仙传",
          description: "一个现代都市背景下的修仙故事，主角在都市中修炼成仙的传奇经历。",
          genre: "现代都市",
          targetAudience: "青年",
          tone: "快节奏",
          themes: ["修仙", "都市", "成长"],
          status: "进行中",
          createdAt: "2024-08-15",
          updatedAt: "2024-09-29"
        },
        {
          id: "2",
          title: "星际争霸",
          description: "未来世界的星际战争，人类与外星种族的生死较量。",
          genre: "科幻",
          targetAudience: "男性向",
          tone: "冷峻",
          themes: ["科幻", "战争", "太空"],
          status: "进行中",
          createdAt: "2024-09-01",
          updatedAt: "2024-09-28"
        },
        {
          id: "3",
          title: "古代宫廷秘史",
          description: "古代宫廷中的权谋斗争和爱恨情仇。",
          genre: "古代言情",
          targetAudience: "女性向",
          tone: "温情",
          themes: ["宫廷", "权谋", "爱情"],
          status: "已完成",
          createdAt: "2024-07-10",
          updatedAt: "2024-09-20"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 创建新项目
  const handleCreateProject = async () => {
    try {
      if (!newProject.title || !newProject.description || !newProject.genre) {
        alert('请填写必要的项目信息');
        return;
      }

      const response = await NovelAPI.createProject(newProject);
      setProjects(prev => [response.project, ...prev]);
      setShowCreateForm(false);
      setNewProject({
        title: "",
        description: "",
        genre: "",
        targetAudience: "",
        tone: "",
        themes: []
      });
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败，请重试');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // 过滤项目
  const filteredProjects = projects.filter(project => {
    // 确保project存在且不为null/undefined
    if (!project) return false;
    
    return (
      (project.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (project.genre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "进行中": return "bg-blue-100 text-blue-800";
      case "已完成": return "bg-green-100 text-green-800";
      case "已暂停": return "bg-yellow-100 text-yellow-800";
      case "草稿": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (project: Project) => {
    if (!project.chapters || !project.outline) return 0;
    const totalChapters = project.outline.chapters.length;
    const completedChapters = project.chapters.filter(c => c.status === 'completed').length;
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="我的项目" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
            <p className="mt-2 text-gray-600">管理您的小说创作项目</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新建项目
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索项目..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 创建项目表单 */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>创建新项目</CardTitle>
              <CardDescription>填写项目基本信息开始创作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">项目标题</label>
                  <Input
                    value={newProject.title}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入项目标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体裁</label>
                  <select
                    value={newProject.genre}
                    onChange={(e) => setNewProject(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择体裁</option>
                    <option value="现代都市">现代都市</option>
                    <option value="古代言情">古代言情</option>
                    <option value="玄幻">玄幻</option>
                    <option value="科幻">科幻</option>
                    <option value="悬疑">悬疑</option>
                    <option value="历史">历史</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述您的项目内容和特色"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">目标读者</label>
                  <select
                    value={newProject.targetAudience}
                    onChange={(e) => setNewProject(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择目标读者</option>
                    <option value="青年">青年</option>
                    <option value="女性向">女性向</option>
                    <option value="男性向">男性向</option>
                    <option value="泛读者">泛读者</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">调性</label>
                  <select
                    value={newProject.tone}
                    onChange={(e) => setNewProject(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择调性</option>
                    <option value="温情">温情</option>
                    <option value="冷峻">冷峻</option>
                    <option value="快节奏">快节奏</option>
                    <option value="慢热">慢热</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主题标签</label>
                <Input
                  placeholder="输入主题标签，用逗号分隔"
                  onChange={(e) => {
                    const themes = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                    setNewProject(prev => ({ ...prev, themes }));
                  }}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </Button>
                <Button onClick={handleCreateProject}>
                  创建项目
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 项目列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="text-xs text-gray-500">{project.genre}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>进度</span>
                      <span>{getProgressPercentage(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <BookOpenIcon className="h-4 w-4 text-gray-400 mr-1" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {project.chapters?.length || 0}
                      </div>
                      <div className="text-gray-500">章节</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-1" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {project.chapters?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0}
                      </div>
                      <div className="text-gray-500">字数</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      </div>
                      <div className="font-medium text-gray-900">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-gray-500">更新</div>
                    </div>
                  </div>

                  {/* 主题标签 */}
                  {project.themes && project.themes.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        {project.themes.slice(0, 3).map((theme, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                            {theme}
                          </span>
                        ))}
                        {project.themes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                            +{project.themes.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到项目</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '开始创建您的第一个项目'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button onClick={() => setShowCreateForm(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  新建项目
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}