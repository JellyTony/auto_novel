'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Calendar, 
  Edit, 
  Settings, 
  ArrowLeft,
  Globe,
  Target,
  Palette,
  Tag,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { NovelAPI, type Project, APIError } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载项目详情
  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await NovelAPI.getProject(projectId);
      setProject(response.project);
    } catch (error) {
      console.error('Failed to load project:', error);
      if (error instanceof APIError) {
        if (error.status === 404) {
          setError('项目不存在或已被删除');
        } else {
          setError(`加载项目失败: ${error.message}`);
        }
        toast.error(`加载项目失败: ${error.message}`);
      } else {
        setError('加载项目失败，请检查网络连接');
        toast.error('加载项目失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '草稿', variant: 'secondary' as const, icon: Edit },
      generating: { label: '生成中', variant: 'default' as const, icon: Clock },
      completed: { label: '已完成', variant: 'default' as const, icon: CheckCircle },
      error: { label: '错误', variant: 'destructive' as const, icon: Edit }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: Edit 
    };
    
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // 计算项目统计信息
  const getProjectStats = () => {
    if (!project) return { chapters: 0, characters: 0, words: 0 };
    
    return {
      chapters: project.chapters?.length || 0,
      characters: project.characters?.length || 0,
      words: project.chapters?.reduce((total, chapter) => total + (chapter.word_count || 0), 0) || 0
    };
  };

  // 加载状态
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
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
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">项目加载失败</CardTitle>
            <CardDescription>{error || '未知错误'}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={loadProject} variant="outline">
              重试
            </Button>
            <Button onClick={() => router.push('/projects')} variant="default">
              返回项目列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(project.status)}
              <span className="text-sm text-muted-foreground">
                创建于 {formatDate(project.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 项目信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                项目信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <h4 className="font-medium mb-2">项目描述</h4>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">类型：</span>
                    {project.genre || '未设置'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">目标读者：</span>
                    {project.target_audience || '未设置'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">风格：</span>
                    {project.tone || '未设置'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">更新：</span>
                    {formatDate(project.updated_at)}
                  </span>
                </div>
              </div>

              {project.themes && project.themes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    主题标签
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.themes.map((theme, index) => (
                      <Badge key={index} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>
                快速访问项目的各个功能模块
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href={`/worldview?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Globe className="h-6 w-6" />
                    <span className="text-sm">世界观</span>
                  </Button>
                </Link>
                <Link href={`/characters?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">角色管理</span>
                  </Button>
                </Link>
                <Link href={`/outline?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">大纲</span>
                  </Button>
                </Link>
                <Link href={`/chapters?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">章节</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 项目统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                项目统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">章节数</span>
                <span className="font-medium">{stats.chapters}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">角色数</span>
                <span className="font-medium">{stats.characters}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">总字数</span>
                <span className="font-medium">{stats.words.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* 世界观预览 */}
          {project.world_view && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  世界观
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">{project.world_view.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {project.world_view.synopsis}
                    </p>
                  </div>
                  <Link href={`/worldview?project=${projectId}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      查看详情
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 最近活动 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                最近活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">
                    项目更新于 {formatDate(project.updated_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">
                    项目创建于 {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}