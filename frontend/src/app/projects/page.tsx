'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Clock, Users, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { NovelAPI, Project, CreateProjectRequest, CreateProjectResponse } from '@/lib/api';
import { useApiList, useApiMutation } from '@/lib/hooks/useApi';
import { Loading, CardSkeleton } from '@/components/ui/loading';
import { ApiError, EmptyState } from '@/components/ui/error-boundary';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 项目列表状态管理
  const projectsApi = useApiList<Project>({
    onSuccess: (data) => {
      console.log('项目列表加载成功:', data);
    },
    onError: (error) => {
      console.error('项目列表加载失败:', error);
    }
  });

  // 创建项目状态管理
  const createProjectApi = useApiMutation<CreateProjectResponse, CreateProjectRequest>({
    onSuccess: (data) => {
      console.log('项目创建成功:', data);
      setIsCreateDialogOpen(false);
      setNewProject({
        title: '',
        description: '',
        genre: '',
        target_audience: '',
        tone: '',
        themes: []
      });
      // 重新加载项目列表
      loadProjects();
    },
    onError: (error) => {
      console.error('项目创建失败:', error);
    }
  });

  // 新项目表单状态
  const [newProject, setNewProject] = useState<CreateProjectRequest>({
    title: '',
    description: '',
    genre: '',
    target_audience: '',
    tone: '',
    themes: []
  });

  // 加载项目列表
  const loadProjects = async () => {
    try {
      await projectsApi.execute(() => NovelAPI.listProjects().then(res => res.projects));
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  // 创建新项目
  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      return;
    }

    try {
      await createProjectApi.mutate(
        (data: CreateProjectRequest) => NovelAPI.createProject(data),
        newProject
      );
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  // 页面加载时获取项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  // 过滤项目
  const filteredProjects = (projectsApi.data || []).filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesGenre = genreFilter === 'all' || project.genre === genreFilter;
    
    return matchesSearch && matchesStatus && matchesGenre;
  });

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'generating': return '生成中';
      case 'draft': return '草稿';
      case 'error': return '错误';
      default: return status;
    }
  };

  // 计算项目进度
  const calculateProgress = (project: Project) => {
    const totalSteps = 4; // 世界观、角色、大纲、章节
    let completedSteps = 0;
    
    if (project.world_view) completedSteps++;
    if (project.characters && project.characters.length > 0) completedSteps++;
    if (project.outline) completedSteps++;
    if (project.chapters && project.chapters.length > 0) completedSteps++;
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // 主题选项
  const themeOptions = [
    '爱情', '友情', '成长', '冒险', '悬疑', '科幻', '奇幻', 
    '历史', '都市', '校园', '职场', '家庭', '战争', '武侠'
  ];

  // 处理主题选择
  const handleThemeChange = (theme: string, checked: boolean) => {
    setNewProject(prev => ({
      ...prev,
      themes: checked 
        ? [...prev.themes, theme]
        : prev.themes.filter(t => t !== theme)
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
          <p className="text-gray-600 mt-2">管理您的小说创作项目</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
              <DialogDescription>
                填写项目基本信息，开始您的创作之旅
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                 <Label htmlFor="title">项目标题 *</Label>
                 <Input
                   id="title"
                   placeholder="输入您的小说标题"
                   value={newProject.title}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="description">项目描述</Label>
                 <Textarea
                   id="description"
                   placeholder="简要描述您的小说内容和创作想法"
                   value={newProject.description}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                   rows={3}
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="genre">体裁类型</Label>
                   <Select value={newProject.genre} onValueChange={(value: string) => setNewProject(prev => ({ ...prev, genre: value }))}>
                     <SelectTrigger>
                       <SelectValue placeholder="选择体裁" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="novel">长篇小说</SelectItem>
                       <SelectItem value="short_story">短篇小说</SelectItem>
                       <SelectItem value="novella">中篇小说</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="target_audience">目标读者</Label>
                   <Select value={newProject.target_audience} onValueChange={(value: string) => setNewProject(prev => ({ ...prev, target_audience: value }))}>
                     <SelectTrigger>
                       <SelectValue placeholder="选择目标读者" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="general">大众读者</SelectItem>
                       <SelectItem value="young_adult">青少年</SelectItem>
                       <SelectItem value="adult">成人读者</SelectItem>
                       <SelectItem value="children">儿童读者</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="tone">写作风格</Label>
                 <Select value={newProject.tone} onValueChange={(value: string) => setNewProject(prev => ({ ...prev, tone: value }))}>
                   <SelectTrigger>
                     <SelectValue placeholder="选择写作风格" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="formal">正式严肃</SelectItem>
                     <SelectItem value="casual">轻松随意</SelectItem>
                     <SelectItem value="humorous">幽默风趣</SelectItem>
                     <SelectItem value="dramatic">戏剧化</SelectItem>
                     <SelectItem value="poetic">诗意优美</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-3">
                 <Label>主题标签</Label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {themeOptions.map((theme) => (
                     <div key={theme} className="flex items-center space-x-2">
                       <Checkbox
                         id={theme}
                         checked={newProject.themes.includes(theme)}
                         onCheckedChange={(checked: boolean) => handleThemeChange(theme, checked)}
                       />
                       <Label htmlFor={theme} className="text-sm font-normal">
                         {theme}
                       </Label>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createProjectApi.loading}
              >
                取消
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={!newProject.title.trim() || createProjectApi.loading}
              >
                {createProjectApi.loading ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    创建中...
                  </>
                ) : (
                  '创建项目'
                )}
              </Button>
            </div>
            
            {createProjectApi.error && (
              <ApiError 
                error={createProjectApi.error} 
                onRetry={() => handleCreateProject()}
                className="mt-4"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="generating">生成中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="error">错误</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部体裁</SelectItem>
              <SelectItem value="novel">长篇小说</SelectItem>
              <SelectItem value="short_story">短篇小说</SelectItem>
              <SelectItem value="novella">中篇小说</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 项目列表 */}
      {projectsApi.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : projectsApi.error ? (
        <ApiError 
          error={projectsApi.error} 
          onRetry={loadProjects}
          className="mb-6"
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== 'all' || genreFilter !== 'all' ? "没有找到匹配的项目" : "还没有项目"}
          description={searchTerm || statusFilter !== 'all' || genreFilter !== 'all' ? "尝试调整搜索条件或筛选器" : "创建您的第一个小说项目，开始创作之旅"}
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              创建项目
            </Button>
          }
          icon={<BookOpen className="w-12 h-12 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>体裁: {project.genre}</span>
                    <span>进度: {calculateProgress(project)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(project)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {project.chapters?.length || 0} 章节
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.characters?.length || 0} 角色
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {project.themes && project.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.themes.slice(0, 3).map((theme) => (
                        <Badge
                          key={theme}
                          variant="secondary"
                          className="text-xs"
                        >
                          {theme}
                        </Badge>
                      ))}
                      {project.themes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.themes.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}