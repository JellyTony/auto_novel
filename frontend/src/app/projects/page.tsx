'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Users, FileText, Calendar, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NovelAPI, type Project, type CreateProjectRequest, APIError } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectRequest>({
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
      setLoading(true);
      const response = await NovelAPI.listProjects({ page: 1, pageSize: 20 });
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      if (error instanceof APIError) {
        toast.error(`加载项目失败: ${error.message}`);
      } else {
        toast.error('加载项目失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入项目标题');
      return;
    }

    try {
      setCreating(true);
      const response = await NovelAPI.createProject(formData);
      toast.success('项目创建成功！');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        genre: '',
        target_audience: '',
        tone: '',
        themes: []
      });
      // 重新加载项目列表
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof APIError) {
        toast.error(`创建项目失败: ${error.message}`);
      } else {
        toast.error('创建项目失败，请重试');
      }
    } finally {
      setCreating(false);
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      return;
    }

    try {
      setDeleting(projectId);
      await NovelAPI.deleteProject(projectId);
      toast.success('项目删除成功');
      // 重新加载项目列表
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (error instanceof APIError) {
        toast.error(`删除项目失败: ${error.message}`);
      } else {
        toast.error('删除项目失败，请重试');
      }
    } finally {
      setDeleting(null);
    }
  };

  // 处理主题输入
  const handleThemesChange = (value: string) => {
    const themes = value.split(',').map(theme => theme.trim()).filter(theme => theme);
    setFormData(prev => ({ ...prev, themes }));
  };

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '草稿', variant: 'secondary' as const },
      generating: { label: '生成中', variant: 'default' as const },
      completed: { label: '已完成', variant: 'default' as const },
      error: { label: '错误', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">项目管理</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">项目管理</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
              <DialogDescription>
                填写项目基本信息，开始您的小说创作之旅。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">项目标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入您的小说标题"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述您的小说内容和创作想法"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="genre">类型</Label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择小说类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fantasy">奇幻</SelectItem>
                      <SelectItem value="romance">言情</SelectItem>
                      <SelectItem value="mystery">悬疑</SelectItem>
                      <SelectItem value="scifi">科幻</SelectItem>
                      <SelectItem value="historical">历史</SelectItem>
                      <SelectItem value="urban">都市</SelectItem>
                      <SelectItem value="martial-arts">武侠</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target_audience">目标读者</Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择目标读者" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="young-adult">青少年</SelectItem>
                      <SelectItem value="adult">成年人</SelectItem>
                      <SelectItem value="middle-aged">中年人</SelectItem>
                      <SelectItem value="general">大众</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tone">写作风格</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择写作风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serious">严肃</SelectItem>
                    <SelectItem value="humorous">幽默</SelectItem>
                    <SelectItem value="romantic">浪漫</SelectItem>
                    <SelectItem value="dark">黑暗</SelectItem>
                    <SelectItem value="light">轻松</SelectItem>
                    <SelectItem value="epic">史诗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="themes">主题标签</Label>
                <Input
                  id="themes"
                  value={formData.themes.join(', ')}
                  onChange={(e) => handleThemesChange(e.target.value)}
                  placeholder="输入主题标签，用逗号分隔，如：爱情, 冒险, 成长"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateProject} disabled={creating}>
                {creating ? '创建中...' : '创建项目'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
          <p className="text-gray-500 mb-4">创建您的第一个小说项目，开始AI辅助创作之旅</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建项目
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>{project.genre || '未分类'}</span>
                  </div>
                  
                  {project.characters && project.characters.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{project.characters.length} 个角色</span>
                    </div>
                  )}
                  
                  {project.chapters && project.chapters.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{project.chapters.length} 个章节</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>创建于 {formatDate(project.created_at)}</span>
                  </div>

                  {project.themes && project.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.themes.slice(0, 3).map((theme, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
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
                
                <div className="flex gap-2 mt-4">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/projects/${project.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    disabled={deleting === project.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleting === project.id ? (
                      '删除中...'
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}