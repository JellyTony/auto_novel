'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  CheckCircle,
  CheckCircle2,
  Download,
  Trash2,
  AlertTriangle,
  FileDown,
  Loader2,
  Shield,
  TrendingUp,
  Video,
  Sparkles
} from 'lucide-react';
import { NovelAPI, type Project, APIError, type CreateProjectRequest, type UpdateProjectRequest, type ExportNovelRequest, type CheckConsistencyRequest } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    genre: '',
    target_audience: '',
    tone: '',
    themes: [] as string[]
  });
  
  // 导出状态
  const [exportFormat, setExportFormat] = useState<'txt' | 'epub' | 'pdf' | 'docx'>('txt');
  const [exportLoading, setExportLoading] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  
  // 质量检测状态
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityResult, setQualityResult] = useState<any>(null);
  
  // 删除确认状态
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 加载项目详情
  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading project:', projectId);
      
      const response = await NovelAPI.getProject(projectId);
      console.log('Project loaded:', response.project);
      
      setProject(response.project);
      
      // 初始化编辑表单，确保所有字段都有默认值
      const formData = {
        title: response.project.title || '',
        description: response.project.description || '',
        genre: response.project.genre || '',
        target_audience: response.project.target_audience || '',
        tone: response.project.tone || '',
        themes: Array.isArray(response.project.themes) ? response.project.themes : []
      };
      
      console.log('Setting edit form data:', formData);
      console.log('Raw project data fields:', {
        target_audience: response.project.target_audience,
        tone: response.project.tone,
        genre: response.project.genre
      });
      
      setEditForm(formData);
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

  // 保存项目编辑
  const handleSaveEdit = async () => {
    try {
      console.log('Saving edit form data:', editForm);
      
      // 验证必填字段
      if (!editForm.title.trim()) {
        toast.error('项目标题不能为空');
        return;
      }
      
      const updateRequest: UpdateProjectRequest = {
        project_id: projectId,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        genre: editForm.genre,
        target_audience: editForm.target_audience,
        tone: editForm.tone,
        themes: editForm.themes
      };

      console.log('Sending update request:', updateRequest);
      const response = await NovelAPI.updateProject(updateRequest);
      console.log('Update response:', response);
      
      // 更新本地状态
      setProject(response.project);
      
      // 同步更新编辑表单状态
      const updatedFormData = {
        title: response.project.title || '',
        description: response.project.description || '',
        genre: response.project.genre || '',
        target_audience: response.project.target_audience || '',
        tone: response.project.tone || '',
        themes: Array.isArray(response.project.themes) ? response.project.themes : []
      };
      setEditForm(updatedFormData);
      
      toast.success('项目信息已更新');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      if (error instanceof APIError) {
        toast.error(`更新项目失败: ${error.message}`);
      } else {
        toast.error('更新项目失败，请重试');
      }
    }
  };

  // 导出项目
  const handleExport = async () => {
    if (!project) return;
    
    try {
      setExportLoading(true);
      
      const exportRequest: ExportNovelRequest = {
        project_id: projectId,
        format: exportFormat,
        include_metadata: includeMetadata
      };
      
      const response = await NovelAPI.exportNovel(exportRequest);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = response.download_url;
      link.download = response.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`导出成功！文件大小: ${(response.file_size / 1024 / 1024).toFixed(2)}MB`);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export project:', error);
      if (error instanceof APIError) {
        toast.error(`导出失败: ${error.message}`);
      } else {
        toast.error('导出失败，请重试');
      }
    } finally {
      setExportLoading(false);
    }
  };

  // 质量检测
  const handleQualityCheck = async () => {
    if (!project) return;
    
    try {
      setQualityLoading(true);
      
      const request: CheckConsistencyRequest = {
        project_id: projectId
      };
      
      const response = await NovelAPI.checkConsistency(request);
      setQualityResult(response);
      
      toast.success('质量检测完成');
    } catch (error) {
      console.error('Failed to check quality:', error);
      if (error instanceof APIError) {
        toast.error(`质量检测失败: ${error.message}`);
      } else {
        toast.error('质量检测失败，请重试');
      }
    } finally {
      setQualityLoading(false);
    }
  };

  // 删除项目
  const handleDeleteProject = async () => {
    if (!project || deleteConfirmText !== project.title) {
      toast.error('请输入正确的项目名称');
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      await NovelAPI.deleteProject(projectId);
      
      toast.success('项目已删除');
      router.push('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      if (error instanceof APIError) {
        toast.error(`删除失败: ${error.message}`);
      } else {
        toast.error('删除失败，请重试');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // 添加主题标签
  const handleAddTheme = (theme: string) => {
    if (theme && !editForm.themes.includes(theme)) {
      setEditForm({
        ...editForm,
        themes: [...editForm.themes, theme]
      });
    }
  };

  // 移除主题标签
  const handleRemoveTheme = (index: number) => {
    setEditForm({
      ...editForm,
      themes: editForm.themes.filter((_, i) => i !== index)
    });
  };

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
          {/* 导出按钮 */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导出小说</DialogTitle>
                <DialogDescription>
                  选择导出格式和选项
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="export-format">导出格式</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">TXT 文本文件</SelectItem>
                      <SelectItem value="epub">EPUB 电子书</SelectItem>
                      <SelectItem value="pdf">PDF 文档</SelectItem>
                      <SelectItem value="docx">Word 文档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-metadata" 
                    checked={includeMetadata}
                    onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  />
                  <Label htmlFor="include-metadata">包含元数据信息</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleExport} disabled={exportLoading}>
                  {exportLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  导出
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 质量检测按钮 */}
          <Dialog open={qualityDialogOpen} onOpenChange={setQualityDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                质量检测
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>项目质量检测</DialogTitle>
                <DialogDescription>
                  检测项目的整体质量和一致性
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!qualityResult ? (
                  <div className="text-center py-8">
                    <Button onClick={handleQualityCheck} disabled={qualityLoading}>
                      {qualityLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      开始检测
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="font-medium">整体评分: {qualityResult.overall_score}/100</span>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">检测摘要</h4>
                      <p className="text-sm text-muted-foreground">{qualityResult.summary}</p>
                    </div>
                    {qualityResult.consistency_issues && qualityResult.consistency_issues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">发现的问题</h4>
                        <div className="space-y-2">
                          {qualityResult.consistency_issues.slice(0, 5).map((issue: any, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <div className="text-sm">
                                <div className="font-medium">{issue.type}</div>
                                <div className="text-muted-foreground">{issue.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQualityDialogOpen(false)}>
                  关闭
                </Button>
                {qualityResult && (
                  <Button onClick={handleQualityCheck} disabled={qualityLoading}>
                    {qualityLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    重新检测
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 项目设置按钮 */}
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>项目设置</DialogTitle>
                <DialogDescription>
                  管理项目的高级设置
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-red-600 mb-2">危险操作</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    删除项目将永久删除所有相关数据，此操作无法撤销。
                  </p>
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除项目
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">确认删除项目</DialogTitle>
                        <DialogDescription>
                          此操作将永久删除项目 "{project.title}" 及其所有数据，包括章节、角色、世界观等。此操作无法撤销。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="delete-confirm">
                            请输入项目名称 "{project.title}" 以确认删除：
                          </Label>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="输入项目名称"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          取消
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteProject}
                          disabled={deleteLoading || deleteConfirmText !== project.title}
                        >
                          {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          确认删除
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 项目编辑按钮 */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Edit className="h-5 w-5" />
                  编辑项目信息
                </DialogTitle>
                <DialogDescription>
                  修改项目的基本信息和设置，所有更改将立即保存
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">基本信息</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="text-sm font-medium">项目标题 *</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="请输入项目标题"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="text-sm font-medium">项目描述</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="简要描述您的小说项目..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 创作设定 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">创作设定</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-genre" className="text-sm font-medium">小说类型</Label>
                      <Select value={editForm.genre || ''} onValueChange={(value) => setEditForm({ ...editForm, genre: value })}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择小说类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fantasy">🧙‍♂️ 奇幻</SelectItem>
                          <SelectItem value="romance">💕 言情</SelectItem>
                          <SelectItem value="mystery">🔍 悬疑</SelectItem>
                          <SelectItem value="scifi">🚀 科幻</SelectItem>
                          <SelectItem value="historical">📜 历史</SelectItem>
                          <SelectItem value="urban">🏙️ 都市</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-audience" className="text-sm font-medium">目标读者</Label>
                      <Select value={editForm.target_audience || ''} onValueChange={(value) => setEditForm({ ...editForm, target_audience: value })}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择目标读者" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="young_adult">👨‍🎓 青少年</SelectItem>
                          <SelectItem value="adult">👩‍💼 成人</SelectItem>
                          <SelectItem value="general">👥 大众</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tone" className="text-sm font-medium">写作风格</Label>
                    <Select value={editForm.tone || ''} onValueChange={(value) => setEditForm({ ...editForm, tone: value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="选择写作风格" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="serious">🎭 严肃</SelectItem>
                        <SelectItem value="humorous">😄 幽默</SelectItem>
                        <SelectItem value="dramatic">🎪 戏剧性</SelectItem>
                        <SelectItem value="light">☀️ 轻松</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 主题标签 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">主题标签</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/30">
                      {editForm.themes.length > 0 ? (
                        editForm.themes.map((theme, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors px-3 py-1"
                            onClick={() => handleRemoveTheme(index)}
                          >
                            {theme}
                            <span className="ml-1 text-xs">×</span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">暂无标签，请在下方添加</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入主题标签，按回车添加"
                        className="flex-1 h-10"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value.trim();
                            if (value) {
                              handleAddTheme(value);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input');
                          if (input) {
                            const value = input.value.trim();
                            if (value) {
                              handleAddTheme(value);
                              input.value = '';
                            }
                          }
                        }}
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit} className="min-w-[80px]">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <Link href={`/quality?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">质量检测</span>
                  </Button>
                </Link>
                <Link href={`/video-script?project=${projectId}`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Video className="h-6 w-6" />
                    <span className="text-sm">视频脚本</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => setExportDialogOpen(true)}>
                  <FileDown className="h-6 w-6" />
                  <span className="text-sm">导出小说</span>
                </Button>
                <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => setQualityDialogOpen(true)}>
                  <Sparkles className="h-6 w-6" />
                  <span className="text-sm">AI 优化</span>
                </Button>
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