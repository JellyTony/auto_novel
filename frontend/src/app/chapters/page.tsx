"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ChapterGenerationDialog } from "@/components/chapter-generation-dialog";
import { 
  FileText,
  Sparkles,
  Play,
  Pause,
  Eye,
  Settings,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Share,
  X,
  Copy,
  ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  NovelAPI, 
  Chapter, 
  GenerateChapterRequest, 
  PolishChapterRequest, 
  Project, 
  QualityCheckRequest,
  GetChapterRequest,
  UpdateChapterRequest,
  DeleteChapterRequest,
  ExportNovelRequest
} from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";
import { toast } from "sonner";

export default function ChaptersPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showStreamingDialog, setShowStreamingDialog] = useState(false);
  const [showPolishForm, setShowPolishForm] = useState(false);
  const [showQualityForm, setShowQualityForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);

  // 新增状态管理
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [selectedChapterForAction, setSelectedChapterForAction] = useState<Chapter | null>(null);
  const [editingChapter, setEditingChapter] = useState<{
    title: string;
    content: string;
    status: string;
  }>({
    title: "",
    content: "",
    status: "draft"
  });

  // 项目列表状态管理
  const projectsApi = useApiList<Project>({
    onSuccess: (data) => {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    },
    onError: (error) => {
      console.error('项目列表加载失败:', error);
      toast.error('项目列表加载失败');
    }
  });

  // 项目详情状态管理
  const projectDetailApi = useApiList<Project>({
    onSuccess: (data) => {
      console.log('项目详情加载成功:', data);
    },
    onError: (error) => {
      console.error('项目详情加载失败:', error);
      toast.error('项目详情加载失败');
    }
  });

  // 章节详情获取
  const chapterDetailApi = useApiMutation<{ chapter: Chapter }, GetChapterRequest>({
    onSuccess: (data) => {
      setSelectedChapterForAction(data.chapter);
    },
    onError: (error) => {
      console.error('章节详情加载失败:', error);
      toast.error('章节详情加载失败');
    }
  });

  // 章节更新
  const updateChapterApi = useApiMutation<{ chapter: Chapter }, UpdateChapterRequest>({
    onSuccess: (data) => {
      toast.success('章节更新成功');
      setShowEditDialog(false);
      loadProjectDetail(); // 重新加载项目详情
    },
    onError: (error) => {
      console.error('章节更新失败:', error);
      toast.error('章节更新失败');
    }
  });

  // 章节删除
  const deleteChapterApi = useApiMutation<{ success: boolean }, DeleteChapterRequest>({
    onSuccess: () => {
      toast.success('章节删除成功');
      setShowDeleteDialog(false);
      setSelectedChapterForAction(null);
      loadProjectDetail(); // 重新加载项目详情
    },
    onError: (error) => {
      console.error('章节删除失败:', error);
      toast.error('章节删除失败');
    }
  });

  // 导出功能
  const exportApi = useApiMutation<{ download_url: string; file_name: string }, ExportNovelRequest>({
    onSuccess: (data) => {
      toast.success('导出成功，开始下载');
      // 创建下载链接
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportDialog(false);
    },
    onError: (error) => {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  });

  // 章节生成状态管理
  const generateChapterApi = useApiMutation<{ chapter: Chapter }, GenerateChapterRequest>({
    onSuccess: (data) => {
      console.log('章节生成成功:', data);
      setShowGenerateForm(false);
      setGenerateRequest({
        project_id: selectedProject,
        chapter_outline: {
          index: selectedChapter,
          title: `第${selectedChapter}章`,
          summary: "",
          goal: "",
          twist_hint: "",
          important_items: []
        }
      });
      // 重新加载项目详情以获取最新的章节
      loadProjectDetail();
      toast.success('章节生成成功');
    },
    onError: (error) => {
      console.error('章节生成失败:', error);
      toast.error('章节生成失败');
    }
  });

  // 章节润色状态管理
  const polishChapterApi = useApiMutation<{ chapter: Chapter }, PolishChapterRequest>({
    onSuccess: (data) => {
      console.log('章节润色成功:', data);
      setShowPolishForm(false);
      setPolishRequest({
        project_id: selectedProject,
        chapter_id: "",
        style: "优雅流畅",
        focus: ["语言表达优化", "情节连贯性", "人物刻画深度"]
      });
      // 重新加载项目详情以获取最新的章节
      loadProjectDetail();
      toast.success('章节润色成功');
    },
    onError: (error) => {
      console.error('章节润色失败:', error);
      toast.error('章节润色失败');
    }
  });

  // 质量检测状态管理
  const qualityCheckApi = useApiMutation<any, QualityCheckRequest>({
    onSuccess: (data) => {
      console.log('质量检测成功:', data);
      setShowQualityForm(false);
      toast.success('质量检测完成');
    },
    onError: (error) => {
      console.error('质量检测失败:', error);
      toast.error('质量检测失败');
    }
  });

  // 生成请求表单状态
  const [generateRequest, setGenerateRequest] = useState<GenerateChapterRequest>({
    project_id: "",
    chapter_outline: {
      index: 1,
      title: "第1章",
      summary: "",
      goal: "",
      twist_hint: "",
      important_items: []
    }
  });

  // 润色请求表单状态
  const [polishRequest, setPolishRequest] = useState<PolishChapterRequest>({
    project_id: "",
    chapter_id: "",
    style: "优雅流畅",
    focus: ["语言表达优化", "情节连贯性", "人物刻画深度"]
  });

  // 质量检测请求表单状态
  const [qualityRequest, setQualityRequest] = useState<QualityCheckRequest>({
    project_id: "",
    chapter_id: "",
    check_type: "all"
  });

  // 导出表单状态
  const [exportRequest, setExportRequest] = useState<ExportNovelRequest>({
    project_id: "",
    format: "txt",
    include_metadata: true
  });

  // 加载项目列表
  const loadProjects = async () => {
    try {
      await projectsApi.execute(() => NovelAPI.listProjects().then(res => res.projects));
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  // 加载项目详情
  const loadProjectDetail = async () => {
    if (!selectedProject) return;
    
    try {
      await projectDetailApi.execute(() => NovelAPI.getProject(selectedProject).then(res => res.project));
    } catch (error) {
      console.error('加载项目详情失败:', error);
    }
  };

  // 预览章节
  const handlePreviewChapter = async (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setShowPreviewDialog(true);
  };

  // 编辑章节
  const handleEditChapter = async (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setEditingChapter({
      title: chapter.title,
      content: chapter.content,
      status: chapter.status
    });
    setShowEditDialog(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedChapterForAction) return;

    const requestData: UpdateChapterRequest = {
      project_id: selectedProject,
      chapter_id: selectedChapterForAction.id,
      title: editingChapter.title,
      content: editingChapter.content,
      status: editingChapter.status as any
    };

    try {
      await updateChapterApi.mutate(
        (data: UpdateChapterRequest) => NovelAPI.updateChapter(data),
        requestData
      );
    } catch (error) {
      console.error('保存编辑失败:', error);
    }
  };

  // 删除章节
  const handleDeleteChapter = async (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setShowDeleteDialog(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedChapterForAction) return;

    const requestData: DeleteChapterRequest = {
      project_id: selectedProject,
      chapter_id: selectedChapterForAction.id
    };

    try {
      await deleteChapterApi.mutate(
        (data: DeleteChapterRequest) => NovelAPI.deleteChapter(data),
        requestData
      );
    } catch (error) {
      console.error('删除章节失败:', error);
    }
  };

  // 导出章节
  const handleExportChapter = () => {
    setExportRequest(prev => ({ ...prev, project_id: selectedProject }));
    setShowExportDialog(true);
  };

  // 执行导出
  const handleConfirmExport = async () => {
    try {
      await exportApi.mutate(
        (data: ExportNovelRequest) => NovelAPI.exportNovel(data),
        exportRequest
      );
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  // 分享章节
  const handleShareChapter = (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setShowShareDialog(true);
  };

  // 复制分享链接
  const handleCopyShareLink = () => {
    if (!selectedChapterForAction) return;
    
    const shareUrl = `${window.location.origin}/chapters/${selectedChapterForAction.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('分享链接已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  // 阅读全文
  const handleReadFullChapter = (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setShowReadDialog(true);
  };

  // 生成章节
  const handleGenerateChapter = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...generateRequest,
      project_id: selectedProject
    };

    try {
      await generateChapterApi.mutate(
        (data: GenerateChapterRequest) => NovelAPI.generateChapter(data),
        requestData
      );
    } catch (error) {
      console.error('生成章节失败:', error);
    }
  };

  // 润色章节
  const handlePolishChapter = async (chapterId: string) => {
    if (!selectedProject || !chapterId) return;

    const requestData = {
      ...polishRequest,
      project_id: selectedProject,
      chapter_id: chapterId
    };

    try {
      await polishChapterApi.mutate(
        (data: PolishChapterRequest) => NovelAPI.polishChapter(data),
        requestData
      );
    } catch (error) {
      console.error('润色章节失败:', error);
    }
  };

  // 质量检测
  const handleQualityCheck = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...qualityRequest,
      project_id: selectedProject
    };

    try {
      await qualityCheckApi.mutate(
        (data: QualityCheckRequest) => NovelAPI.checkQuality(data),
        requestData
      );
    } catch (error) {
      console.error('质量检测失败:', error);
    }
  };

  // 页面加载时获取项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  // 当选中项目变化时，加载项目详情
  useEffect(() => {
    if (selectedProject) {
      setGenerateRequest(prev => ({ ...prev, project_id: selectedProject }));
      setPolishRequest(prev => ({ ...prev, project_id: selectedProject }));
      setQualityRequest(prev => ({ ...prev, project_id: selectedProject }));
      setExportRequest(prev => ({ ...prev, project_id: selectedProject }));
      loadProjectDetail();
    }
  }, [selectedProject]);

  // 获取当前项目的章节
  const currentProject = projectDetailApi.data;
  const chapters = currentProject?.chapters || [];

  // 过滤章节
  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = searchTerm === "" || 
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chapter.content && chapter.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "" || statusFilter === "all" || chapter.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'polished': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'draft': return '草稿';
      case 'generating': return '生成中';
      case 'polished': return '已润色';
      default: return '未知';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="章节管理" 
        description="AI辅助章节生成、编辑、润色和质量检测"
      />
      
      <div className="space-y-6">
        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索章节..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="generating">生成中</SelectItem>
                <SelectItem value="polished">已润色</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={showQualityForm} onOpenChange={setShowQualityForm}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  disabled={!selectedProject || chapters.length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  质量检测
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>质量检测</DialogTitle>
                  <DialogDescription>
                    检测章节的质量问题和一致性
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>选择检测章节</Label>
                    <Select 
                      value={qualityRequest.chapter_id} 
                      onValueChange={(value) => setQualityRequest(prev => ({ ...prev, chapter_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择章节" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>检测类型</Label>
                    <Select 
                      value={qualityRequest.check_type} 
                      onValueChange={(value) => setQualityRequest((prev) => ({ ...prev, check_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全面检测</SelectItem>
                        <SelectItem value="polish">润色建议</SelectItem>
                        <SelectItem value="proofread">校对检查</SelectItem>
                        <SelectItem value="critique">文学评价</SelectItem>
                        <SelectItem value="consistency">一致性检查</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQualityForm(false)}
                    disabled={qualityCheckApi.loading}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleQualityCheck}
                    disabled={!qualityRequest.chapter_id || qualityCheckApi.loading}
                  >
                    {qualityCheckApi.loading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        检测中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        开始检测
                      </>
                    )}
                  </Button>
                </div>
                
                {qualityCheckApi.error && (
                  <ApiError 
                    error={qualityCheckApi.error} 
                    onRetry={() => handleQualityCheck()}
                    className="mt-4"
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* 新的流式生成对话框 */}
            <Button 
              className="flex items-center gap-2"
              disabled={!selectedProject}
              onClick={() => setShowStreamingDialog(true)}
            >
              <Sparkles className="w-4 h-4" />
              开始写作
            </Button>

            <ChapterGenerationDialog
              open={showStreamingDialog}
              onOpenChange={setShowStreamingDialog}
              projectId={selectedProject}
              chapterIndex={selectedChapter}
              initialTitle={generateRequest.chapter_outline.title}
              initialSummary={generateRequest.chapter_outline.summary}
              onSuccess={(chapter) => {
                console.log('章节生成成功:', chapter);
                loadProjectDetail(); // 重新加载项目详情
              }}
            />

            {/* 保留原有的生成对话框作为备用 */}
            <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={!selectedProject}
                >
                  <Plus className="w-4 h-4" />
                  传统生成
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>生成章节</DialogTitle>
                  <DialogDescription>
                    设置章节生成参数，AI将为您创建精彩的章节内容
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter_index">章节序号</Label>
                    <Input
                      id="chapter_index"
                      type="number"
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(parseInt(e.target.value) || 1)}
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chapter_title">章节标题</Label>
                    <Input
                      id="chapter_title"
                      value={generateRequest.chapter_outline.title}
                      onChange={(e) => setGenerateRequest(prev => ({
                        ...prev,
                        chapter_outline: {
                          ...prev.chapter_outline,
                          title: e.target.value
                        }
                      }))}
                      placeholder="第1章：开始的故事"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chapter_summary">章节摘要</Label>
                    <Input
                      id="chapter_summary"
                      value={generateRequest.chapter_outline.summary}
                      onChange={(e) => setGenerateRequest(prev => ({
                        ...prev,
                        chapter_outline: {
                          ...prev.chapter_outline,
                          summary: e.target.value
                        }
                      }))}
                      placeholder="简要描述本章节的主要内容"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGenerateForm(false)}
                    disabled={generateChapterApi.loading}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleGenerateChapter}
                    disabled={!generateRequest.chapter_outline.title || generateChapterApi.loading}
                  >
                    {generateChapterApi.loading ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成章节
                      </>
                    )}
                  </Button>
                </div>
                
                {generateChapterApi.error && (
                  <ApiError 
                    error={generateChapterApi.error} 
                    onRetry={() => handleGenerateChapter()}
                    className="mt-4"
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 章节展示 */}
        {projectsApi.loading ? (
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : projectsApi.error ? (
          <ApiError 
            error={projectsApi.error} 
            onRetry={loadProjects}
            className="mb-6"
          />
        ) : !selectedProject ? (
          <EmptyState
            title="请选择项目"
            description="选择一个项目来查看或生成章节"
            icon={<FileText className="w-12 h-12 text-gray-400" />}
          />
        ) : projectDetailApi.loading ? (
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : projectDetailApi.error ? (
          <ApiError 
            error={projectDetailApi.error} 
            onRetry={loadProjectDetail}
            className="mb-6"
          />
        ) : chapters.length === 0 ? (
          <EmptyState
            title="还没有章节"
            description="为这个项目生成第一个章节，开始您的创作之旅"
            action={
              <Button onClick={() => setShowStreamingDialog(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                开始写作
              </Button>
            }
            icon={<FileText className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <>
            {/* 章节统计 */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {currentProject?.title} - 章节管理
                    </CardTitle>
                    <CardDescription className="mt-1">
                      共 {chapters.length} 章，总字数 {chapters.reduce((sum: number, ch: Chapter) => sum + (ch.word_count || 0), 0)} 字
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExportChapter}>
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                      <Share className="w-4 h-4 mr-2" />
                      分享
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{chapters.length}</div>
                    <div className="text-sm text-gray-500">总章节数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {chapters.filter((ch: Chapter) => ch.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-500">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {chapters.filter((ch: Chapter) => ch.status === 'draft').length}
                    </div>
                    <div className="text-sm text-gray-500">草稿</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {chapters.reduce((sum: number, ch: Chapter) => sum + (ch.word_count || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-500">总字数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 章节列表 */}
            <div className="space-y-4">
              {filteredChapters.length === 0 ? (
                <EmptyState
                  title="没有找到匹配的章节"
                  description="尝试调整搜索条件或筛选器"
                  icon={<Search className="w-12 h-12 text-gray-400" />}
                />
              ) : (
                filteredChapters.map((chapter: Chapter) => (
                  <Card key={chapter.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge variant="outline" className="text-xs">
                              第{chapter.index}章
                            </Badge>
                            <h4 className="font-semibold text-lg text-gray-900">
                              {chapter.title}
                            </h4>
                            <Badge className={`text-xs ${getStatusColor(chapter.status)}`}>
                              {getStatusText(chapter.status)}
                            </Badge>
                          </div>
                          
                          {chapter.summary && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {chapter.summary}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {chapter.word_count || 0} 字
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {chapter.updated_at ? new Date(chapter.updated_at).toLocaleDateString() : '未知'}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              预计阅读 {Math.ceil((chapter.word_count || 0) / 300)} 分钟
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="预览"
                            onClick={() => handlePreviewChapter(chapter)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="编辑"
                            onClick={() => handleEditChapter(chapter)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="润色"
                            onClick={() => handlePolishChapter(chapter.id)}
                            disabled={polishChapterApi.loading}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700" 
                            title="删除"
                            onClick={() => handleDeleteChapter(chapter)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReadFullChapter(chapter)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          阅读全文
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleEditChapter(chapter)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          编辑章节
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* 预览对话框 */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                章节预览 - {selectedChapterForAction?.title}
              </DialogTitle>
              <DialogDescription>
                预览章节内容，字数：{selectedChapterForAction?.word_count || 0} 字
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] p-4 bg-gray-50 rounded-lg">
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4">{selectedChapterForAction?.title}</h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedChapterForAction?.content || '暂无内容'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                关闭
              </Button>
              <Button onClick={() => {
                if (selectedChapterForAction) {
                  handleEditChapter(selectedChapterForAction);
                  setShowPreviewDialog(false);
                }
              }}>
                <Edit className="w-4 h-4 mr-2" />
                编辑
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 编辑对话框 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                编辑章节 - {selectedChapterForAction?.title}
              </DialogTitle>
              <DialogDescription>
                编辑章节标题和内容
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="edit_title">章节标题</Label>
                <Input
                  id="edit_title"
                  value={editingChapter.title}
                  onChange={(e) => setEditingChapter(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入章节标题"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_status">章节状态</Label>
                <Select 
                  value={editingChapter.status} 
                  onValueChange={(value) => setEditingChapter(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="polished">已润色</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_content">章节内容</Label>
                <Textarea
                  id="edit_content"
                  value={editingChapter.content}
                  onChange={(e) => setEditingChapter(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="输入章节内容"
                  className="min-h-[300px] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={updateChapterApi.loading}
              >
                取消
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editingChapter.title || updateChapterApi.loading}
              >
                {updateChapterApi.loading ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                确认删除
              </DialogTitle>
              <DialogDescription>
                您确定要删除章节 "{selectedChapterForAction?.title}" 吗？此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteChapterApi.loading}
              >
                取消
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteChapterApi.loading}
              >
                {deleteChapterApi.loading ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    确认删除
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 导出对话框 */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                导出小说
              </DialogTitle>
              <DialogDescription>
                选择导出格式和设置
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>导出格式</Label>
                <Select 
                  value={exportRequest.format} 
                  onValueChange={(value) => setExportRequest(prev => ({ ...prev, format: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">TXT 文本</SelectItem>
                    <SelectItem value="epub">EPUB 电子书</SelectItem>
                    <SelectItem value="pdf">PDF 文档</SelectItem>
                    <SelectItem value="docx">Word 文档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include_metadata"
                  checked={exportRequest.include_metadata}
                  onCheckedChange={(checked) => setExportRequest(prev => ({ ...prev, include_metadata: !!checked }))}
                />
                <Label htmlFor="include_metadata">包含元数据</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(false)}
                disabled={exportApi.loading}
              >
                取消
              </Button>
              <Button 
                onClick={handleConfirmExport}
                disabled={exportApi.loading}
              >
                {exportApi.loading ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    开始导出
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 分享对话框 */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share className="w-5 h-5" />
                分享章节
              </DialogTitle>
              <DialogDescription>
                生成分享链接，让其他人可以阅读您的章节
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>分享链接</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={selectedChapterForAction ? `${window.location.origin}/chapters/${selectedChapterForAction.id}` : ''}
                    readOnly
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleCopyShareLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                任何拥有此链接的人都可以阅读该章节内容
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                关闭
              </Button>
              <Button onClick={handleCopyShareLink}>
                <Copy className="w-4 h-4 mr-2" />
                复制链接
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 阅读全文对话框 */}
        <Dialog open={showReadDialog} onOpenChange={setShowReadDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedChapterForAction?.title}
              </DialogTitle>
              <DialogDescription>
                全屏阅读模式 - 字数：{selectedChapterForAction?.word_count || 0} 字
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[75vh] p-6 bg-white">
              <div className="prose prose-lg max-w-none">
                <h1 className="text-3xl font-bold mb-6 text-center">{selectedChapterForAction?.title}</h1>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                  {selectedChapterForAction?.content || '暂无内容'}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                预计阅读时间：{Math.ceil((selectedChapterForAction?.word_count || 0) / 300)} 分钟
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReadDialog(false)}>
                  关闭
                </Button>
                <Button onClick={() => {
                  if (selectedChapterForAction) {
                    handleEditChapter(selectedChapterForAction);
                    setShowReadDialog(false);
                  }
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}