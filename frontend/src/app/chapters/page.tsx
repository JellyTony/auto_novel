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
  Share
} from "lucide-react";
import { useState, useEffect } from "react";
import { NovelAPI, Chapter, GenerateChapterRequest, PolishChapterRequest, Project, QualityCheckRequest } from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";

export default function ChaptersPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showPolishForm, setShowPolishForm] = useState(false);
  const [showQualityForm, setShowQualityForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);

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
    }
  });

  // 项目详情状态管理
  const projectDetailApi = useApiList<Project>({
    onSuccess: (data) => {
      console.log('项目详情加载成功:', data);
    },
    onError: (error) => {
      console.error('项目详情加载失败:', error);
    }
  });

  // 章节生成状态管理
  const generateChapterApi = useApiMutation<{ chapter: Chapter }, GenerateChapterRequest>({
    onSuccess: (data) => {
      console.log('章节生成成功:', data);
      setShowGenerateForm(false);
      setGenerateRequest({
        project_id: selectedProject,
        chapter_index: selectedChapter,
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
    },
    onError: (error) => {
      console.error('章节生成失败:', error);
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
        requirements: "语言表达优化、情节连贯性、人物刻画深度"
      });
      // 重新加载项目详情以获取最新的章节
      loadProjectDetail();
    },
    onError: (error) => {
      console.error('章节润色失败:', error);
    }
  });

  // 质量检测状态管理
  const qualityCheckApi = useApiMutation<any, QualityCheckRequest>({
    onSuccess: (data) => {
      console.log('质量检测成功:', data);
      setShowQualityForm(false);
    },
    onError: (error) => {
      console.error('质量检测失败:', error);
    }
  });

  // 生成请求表单状态
  const [generateRequest, setGenerateRequest] = useState<GenerateChapterRequest>({
    project_id: "",
    chapter_index: 1,
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
    requirements: "语言表达优化、情节连贯性、人物刻画深度"
  });

  // 质量检测请求表单状态
  const [qualityRequest, setQualityRequest] = useState<QualityCheckRequest>({
    project_id: "",
    chapter_ids: []
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

  // 生成章节
  const handleGenerateChapter = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...generateRequest,
      project_id: selectedProject,
      chapter_index: selectedChapter
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
      (chapter.summary && chapter.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "" || chapter.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'reviewing': return '审核中';
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
                <SelectItem value="">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
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
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {chapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={chapter.id}
                            checked={qualityRequest.chapter_ids.includes(chapter.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setQualityRequest(prev => ({
                                  ...prev,
                                  chapter_ids: [...prev.chapter_ids, chapter.id]
                                }));
                              } else {
                                setQualityRequest(prev => ({
                                  ...prev,
                                  chapter_ids: prev.chapter_ids.filter(id => id !== chapter.id)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={chapter.id} className="text-sm">
                            {chapter.title}
                          </Label>
                        </div>
                      ))}
                    </div>
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
                    disabled={qualityRequest.chapter_ids.length === 0 || qualityCheckApi.loading}
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

            <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2"
                  disabled={!selectedProject}
                >
                  <Plus className="w-4 h-4" />
                  生成章节
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
              <Button onClick={() => setShowGenerateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                生成章节
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
                      共 {chapters.length} 章，总字数 {chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0)} 字
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                    <Button variant="outline" size="sm">
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
                      {chapters.filter(ch => ch.status === 'published').length}
                    </div>
                    <div className="text-sm text-gray-500">已发布</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {chapters.filter(ch => ch.status === 'draft').length}
                    </div>
                    <div className="text-sm text-gray-500">草稿</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0)}
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
                filteredChapters.map((chapter) => (
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
                          <Button variant="ghost" size="sm" title="预览">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="编辑">
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
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          阅读全文
                        </Button>
                        <Button size="sm">
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
      </div>
    </div>
  );
}