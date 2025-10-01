"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus,
  Search,
  FileText,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Target,
  Lightbulb,
  Package,
  Save,
  X,
  PenTool,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  NovelAPI, 
  Outline, 
  GenerateOutlineRequest, 
  Project, 
  ChapterOutline,
  UpdateChapterOutlineRequest,
  UpdateChapterOutlineResponse,
  DeleteChapterOutlineRequest,
  DeleteChapterOutlineResponse,
  ReorderChapterOutlineRequest,
  ReorderChapterOutlineResponse,
  AddChapterOutlineRequest,
  AddChapterOutlineResponse,
  Chapter,
  GenerateChapterRequest
} from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";

interface EditingChapter {
  index: number;
  title: string;
  summary: string;
  goal: string;
  twist_hint: string;
  important_items: string[];
}

export default function OutlinePage() {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<ChapterOutline[]>([]);
  const [editingChapter, setEditingChapter] = useState<EditingChapter | null>(null);
  const [newChapter, setNewChapter] = useState<Omit<ChapterOutline, 'index'>>({
    title: "",
    summary: "",
    goal: "",
    twist_hint: "",
    important_items: []
  });
  const [newItemInput, setNewItemInput] = useState("");
  const [editItemInput, setEditItemInput] = useState("");
  const [generateRequest, setGenerateRequest] = useState({
    chapter_count: 10
  });
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null);

  // 项目列表状态管理
  const projectsApi = useApiList<Project>({
    onSuccess: (data) => {
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    },
    onError: (error) => {
      console.error('项目列表加载失败:', error);
      toast.error('项目列表加载失败');
    }
  });

  // 大纲生成状态管理
  const generateOutlineApi = useApiMutation<{ outline: Outline }, GenerateOutlineRequest>({
    onSuccess: (data) => {
      console.log('大纲生成成功:', data);
      setChapters(data.outline.chapters || []);
      setShowGenerateForm(false);
      toast.success('大纲生成成功！');
    },
    onError: (error) => {
      console.error('大纲生成失败:', error);
      toast.error('大纲生成失败，请重试');
    }
  });

  // 章节更新状态管理
  const updateChapterApi = useApiMutation<UpdateChapterOutlineResponse, UpdateChapterOutlineRequest>({
    onSuccess: (data) => {
      if (data.outline?.chapters) {
        setChapters(data.outline.chapters);
      }
      setShowEditDialog(false);
      setEditingChapter(null);
      toast.success('章节更新成功');
    },
    onError: (error) => {
      console.error('章节更新失败:', error);
      toast.error('章节更新失败，请重试');
    }
  });

  // 章节删除状态管理
  const deleteChapterApi = useApiMutation<DeleteChapterOutlineResponse, DeleteChapterOutlineRequest>({
    onSuccess: (data) => {
      if (data.outline?.chapters) {
        setChapters(data.outline.chapters);
      }
      toast.success('章节删除成功');
    },
    onError: (error) => {
      console.error('章节删除失败:', error);
      toast.error('章节删除失败，请重试');
    }
  });

  // 章节重排序状态管理
  const reorderChapterApi = useApiMutation<ReorderChapterOutlineResponse, ReorderChapterOutlineRequest>({
    onSuccess: (data) => {
      if (data.outline?.chapters) {
        setChapters(data.outline.chapters);
      }
      toast.success('章节顺序调整成功');
    },
    onError: (error) => {
      console.error('章节顺序调整失败:', error);
      toast.error('章节顺序调整失败，请重试');
    }
  });

  // 添加章节状态管理
  const addChapterApi = useApiMutation<AddChapterOutlineResponse, AddChapterOutlineRequest>({
    onSuccess: (data) => {
      if (data.outline?.chapters) {
        setChapters(data.outline.chapters);
      }
      setNewChapter({
        title: "",
        summary: "",
        goal: "",
        twist_hint: "",
        important_items: []
      });
      setNewItemInput('');
      setShowAddDialog(false);
      toast.success('章节添加成功');
    },
    onError: (error) => {
      console.error('章节添加失败:', error);
      toast.error('章节添加失败，请重试');
    }
  });

  // 章节生成状态管理（在当前页面直接生成）
  const generateChapterApi = useApiMutation<{ chapter: Chapter }, GenerateChapterRequest>({
    onSuccess: () => {
      toast.success('章节生成成功！');
      setGeneratingChapter(null);
    },
    onError: (error) => {
      console.error('章节生成失败:', error);
      toast.error('章节生成失败，请重试');
      setGeneratingChapter(null);
    }
  });

  // 加载项目列表
  const loadProjects = useCallback(() => {
    projectsApi.execute(() => NovelAPI.listProjects().then(res => res.projects));
  }, []);

  // 加载项目详情
  const loadProjectDetail = useCallback(async () => {
    if (!selectedProject) return;
    
    try {
      const response = await NovelAPI.getProject(selectedProject);
      setCurrentProject(response.project);
      
      if (response.project.outline?.chapters) {
        setChapters(response.project.outline.chapters);
      } else {
        setChapters([]);
      }
    } catch (error) {
      console.error('项目详情加载失败:', error);
      toast.error('项目详情加载失败');
    }
  }, [selectedProject]);

  // 初始化加载
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 项目变化时加载详情
  useEffect(() => {
    if (selectedProject) {
      loadProjectDetail();
    }
  }, [selectedProject, loadProjectDetail]);

  // 过滤项目
  const filteredProjects = (projectsApi.data || []).filter((project: Project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 生成大纲
  const handleGenerateOutline = async () => {
    if (!selectedProject || !currentProject?.world_view || !currentProject?.characters) {
      toast.error('请先完成世界观和人物设定');
      return;
    }

    const request: GenerateOutlineRequest = {
      project_id: selectedProject,
      chapter_count: generateRequest.chapter_count,
      world_view: currentProject.world_view,
      characters: currentProject.characters
    };

    generateOutlineApi.mutate(
      () => NovelAPI.generateOutline(request),
      request
    );
  };

  // 编辑章节
  const handleEditChapter = (chapter: ChapterOutline) => {
    setEditingChapter({
      index: chapter.index,
      title: chapter.title,
      summary: chapter.summary,
      goal: chapter.goal,
      twist_hint: chapter.twist_hint,
      important_items: [...chapter.important_items]
    });
    setShowEditDialog(true);
  };

  // 保存章节编辑
  const handleSaveChapter = () => {
    if (!editingChapter || !selectedProject) return;

    const request: UpdateChapterOutlineRequest = {
      project_id: selectedProject,
      chapter_index: editingChapter.index,
      title: editingChapter.title,
      summary: editingChapter.summary,
      goal: editingChapter.goal,
      twist_hint: editingChapter.twist_hint,
      important_items: editingChapter.important_items
    };

    updateChapterApi.mutate(
      () => NovelAPI.updateChapterOutline(request),
      request
    );
  };

  // 删除章节
  const handleDeleteChapter = (chapterIndex: number) => {
    if (!selectedProject) return;

    const request: DeleteChapterOutlineRequest = {
      project_id: selectedProject,
      chapter_index: chapterIndex
    };

    deleteChapterApi.mutate(
      () => NovelAPI.deleteChapterOutline(request),
      request
    );
  };

  // 移动章节
  const handleMoveChapter = (fromIndex: number, toIndex: number) => {
    if (!selectedProject) return;

    const request: ReorderChapterOutlineRequest = {
      project_id: selectedProject,
      from_index: fromIndex,
      to_index: toIndex
    };

    reorderChapterApi.mutate(
      () => NovelAPI.reorderChapterOutline(request),
      request
    );
  };

  // 添加章节
  const handleAddChapter = () => {
    if (!selectedProject) return;

    const request: AddChapterOutlineRequest = {
      project_id: selectedProject,
      chapter: newChapter
    };

    addChapterApi.mutate(
      () => NovelAPI.addChapterOutline(request),
      request
    );
  };

  // 添加重要物品到编辑中的章节
  const addEditItemToChapter = () => {
    if (!editItemInput.trim() || !editingChapter) return;
    
    setEditingChapter({
      ...editingChapter,
      important_items: [...editingChapter.important_items, editItemInput.trim()]
    });
    setEditItemInput("");
  };

  // 从编辑中的章节移除重要物品
  const removeEditItemFromChapter = (index: number) => {
    if (!editingChapter) return;
    
    setEditingChapter({
      ...editingChapter,
      important_items: editingChapter.important_items.filter((_, i) => i !== index)
    });
  };

  // 添加重要物品到新章节
  const addItemToNewChapter = () => {
    if (!newItemInput.trim()) return;
    
    setNewChapter({
      ...newChapter,
      important_items: [...newChapter.important_items, newItemInput.trim()]
    });
    setNewItemInput("");
  };

  // 从新章节移除重要物品
  const removeItemFromNewChapter = (index: number) => {
    setNewChapter({
      ...newChapter,
      important_items: newChapter.important_items.filter((_, i) => i !== index)
    });
  };

  // 在当前页面直接生成章节内容
  const handleStartWriting = (chapterIndex: number) => {
    if (!selectedProject) {
      toast.error('请先选择项目');
      return;
    }
    const chapterOutline = chapters.find(c => c.index === chapterIndex);
    if (!chapterOutline) {
      toast.error('未找到对应的章节大纲');
      return;
    }

    // 验证章节大纲的必要字段
    if (!chapterOutline.title || !chapterOutline.summary) {
      toast.error('章节大纲信息不完整，请先完善章节标题和摘要');
      return;
    }

    setGeneratingChapter(chapterIndex);
    const request: GenerateChapterRequest = {
      project_id: selectedProject,
      chapter_outline: chapterOutline
    };
    generateChapterApi.mutate(
      () => NovelAPI.generateChapter(request),
      request
    );
  };

  if (projectsApi.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header title="大纲管理" />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (projectsApi.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header title="大纲管理" />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <ApiError 
            error={projectsApi.error} 
            onRetry={loadProjects}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header title="大纲管理" />
      
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">大纲管理</h1>
          <p className="text-sm sm:text-base text-gray-600">创建和管理小说章节大纲，为写作做好准备</p>
        </div>

        {/* 项目选择和搜索 */}
        <div className="mb-6 space-y-4">
          {/* 项目选择区域 */}
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end">
            <div className="flex-1 min-w-0 space-y-2">
              <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                选择项目
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="请选择一个项目" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="cursor-pointer">
                      <div className="flex items-center gap-2 w-full max-w-sm">
                        <span className="truncate flex-1">{project.title}</span>
                        <Badge 
                          variant={project.status === 'completed' ? 'default' : 'secondary'} 
                          className="shrink-0 text-xs px-2 py-0.5"
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto xl:min-w-96">
              <div className="relative min-w-0 flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                <Input
                  placeholder="搜索项目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 h-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="generating">生成中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        {!selectedProject ? (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-gray-400" />}
            title="请选择一个项目"
            description="选择一个项目来查看和管理其大纲"
          />
        ) : !currentProject ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 项目信息卡片 */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 shrink-0" />
                      <span className="truncate">{currentProject.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">{currentProject.description}</CardDescription>
                  </div>
                  <Badge variant={currentProject.status === 'completed' ? 'default' : 'secondary'} className="shrink-0">
                    {currentProject.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between sm:block">
                    <span className="text-gray-500">类型：</span>
                    <span className="font-medium">{currentProject.genre}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-gray-500">目标读者：</span>
                    <span className="font-medium">{currentProject.target_audience}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-gray-500">风格：</span>
                    <span className="font-medium">{currentProject.tone}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-gray-500">章节数：</span>
                    <span className="font-medium">{chapters.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 大纲操作区域 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="flex flex-wrap gap-3">
                <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
                  <DialogTrigger asChild>
                    <Button size="default" className="flex items-center gap-2 h-10 px-4">
                      <Sparkles className="h-4 w-4" />
                      生成大纲
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>生成章节大纲</DialogTitle>
                      <DialogDescription>
                        基于项目的世界观和人物设定生成章节大纲
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="chapter-count" className="text-sm font-medium">章节数量</Label>
                        <Input
                          id="chapter-count"
                          type="number"
                          min="1"
                          max="100"
                          value={generateRequest.chapter_count}
                          onChange={(e) => setGenerateRequest({
                            ...generateRequest,
                            chapter_count: parseInt(e.target.value) || 10
                          })}
                          className="h-10"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowGenerateForm(false)}
                          className="h-10 px-4"
                        >
                          取消
                        </Button>
                        <Button 
                          onClick={handleGenerateOutline}
                          disabled={generateOutlineApi.loading}
                          className="h-10 px-4"
                        >
                          {generateOutlineApi.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          生成大纲
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="default" className="flex items-center gap-2 h-10 px-4">
                      <Plus className="h-4 w-4" />
                      添加章节
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>添加新章节</DialogTitle>
                      <DialogDescription>
                        手动添加一个新的章节到大纲中
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-title" className="text-sm font-medium">章节标题</Label>
                        <Input
                          id="new-title"
                          value={newChapter.title}
                          onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                          placeholder="输入章节标题"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-summary" className="text-sm font-medium">章节概要</Label>
                        <Textarea
                          id="new-summary"
                          value={newChapter.summary}
                          onChange={(e) => setNewChapter({...newChapter, summary: e.target.value})}
                          placeholder="描述本章节的主要内容"
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-goal" className="text-sm font-medium">章节目标</Label>
                        <Textarea
                          id="new-goal"
                          value={newChapter.goal}
                          onChange={(e) => setNewChapter({...newChapter, goal: e.target.value})}
                          placeholder="本章节要达成的目标"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-twist" className="text-sm font-medium">转折提示</Label>
                        <Textarea
                          id="new-twist"
                          value={newChapter.twist_hint}
                          onChange={(e) => setNewChapter({...newChapter, twist_hint: e.target.value})}
                          placeholder="本章节的转折或悬念"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">重要物品</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newItemInput}
                            onChange={(e) => setNewItemInput(e.target.value)}
                            placeholder="添加重要物品"
                            onKeyPress={(e) => e.key === 'Enter' && addItemToNewChapter()}
                            className="h-10"
                          />
                          <Button 
                            type="button" 
                            onClick={addItemToNewChapter} 
                            size="default"
                            className="h-10 px-3"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newChapter.important_items.map((item: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                              {item}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                onClick={() => removeItemFromNewChapter(index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddDialog(false)}
                          className="h-10 px-4"
                        >
                          取消
                        </Button>
                        <Button 
                          onClick={handleAddChapter}
                          disabled={addChapterApi.loading || !newChapter.title.trim()}
                          className="h-10 px-4"
                        >
                          {addChapterApi.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          添加章节
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {chapters.length > 0 && (
                <div className="text-sm text-gray-500 shrink-0">
                  共 {chapters.length} 个章节
                </div>
              )}
            </div>

            {/* 章节列表 */}
            {chapters.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12 text-gray-400" />}
                title="暂无章节大纲"
                description="点击生成大纲按钮来创建章节大纲，或手动添加章节"
              />
            ) : (
              <div className="space-y-4">
                {/* 章节网格容器 */}
                <div className="grid gap-4 lg:gap-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {chapters.slice(0, 20).map((chapter: ChapterOutline, index: number) => (
                    <Card key={chapter.index} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg flex items-center gap-2 mb-1">
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                                第 {chapter.index} 章
                              </span>
                              <span className="truncate font-semibold text-gray-800">{chapter.title}</span>
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveChapter(chapter.index, chapter.index - 1)}
                              disabled={index === 0 || reorderChapterApi.loading}
                              title="上移"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveChapter(chapter.index, chapter.index + 1)}
                              disabled={index === chapters.length - 1 || reorderChapterApi.loading}
                              title="下移"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditChapter(chapter)}
                              title="编辑"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="删除"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    确认删除
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    确定要删除第 {chapter.index} 章"{chapter.title}"吗？此操作无法撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2 sm:gap-3">
                                  <AlertDialogCancel className="h-10 px-4 hover:bg-gray-50">取消</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteChapter(chapter.index)}
                                    className="bg-red-600 hover:bg-red-700 h-10 px-4 shadow-sm"
                                  >
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">概要</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{chapter.summary}</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">目标</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{chapter.goal}</p>
                        </div>

                        {chapter.twist_hint && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">转折提示</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{chapter.twist_hint}</p>
                          </div>
                        )}

                        {chapter.important_items && chapter.important_items.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">重要物品</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {chapter.important_items.slice(0, 5).map((item: string, itemIndex: number) => (
                                <Badge key={itemIndex} variant="outline" className="text-xs bg-white border-purple-200 text-purple-700 hover:bg-purple-50">
                                  {item}
                                </Badge>
                              ))}
                              {chapter.important_items.length > 5 && (
                                <Badge variant="outline" className="text-xs text-gray-500 bg-gray-100 border-gray-200">
                                  +{chapter.important_items.length - 5} 更多
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <Button 
                            onClick={() => handleStartWriting(chapter.index)}
                            disabled={generatingChapter === chapter.index || !selectedProject}
                            className="flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            size="sm"
                          >
                            {generatingChapter === chapter.index ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <PenTool className="h-4 w-4" />
                                开始写作
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 加载更多提示 */}
                {chapters.length > 20 && (
                  <div className="mt-6">
                    <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                      <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                            <FileText className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-gray-700 font-medium mb-1">还有 {chapters.length - 20} 个章节未显示</p>
                            <p className="text-sm text-gray-500">为了页面性能，仅显示前20个章节</p>
                          </div>
                          <Badge variant="outline" className="bg-white border-blue-200 text-blue-600 px-3 py-1">
                            性能优化
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 编辑章节对话框 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑章节</DialogTitle>
              <DialogDescription>
                修改章节的详细信息
              </DialogDescription>
            </DialogHeader>
            {editingChapter && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-sm font-medium">章节标题</Label>
                  <Input
                    id="edit-title"
                    value={editingChapter.title}
                    onChange={(e) => setEditingChapter({...editingChapter, title: e.target.value})}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-summary" className="text-sm font-medium">章节概要</Label>
                  <Textarea
                    id="edit-summary"
                    value={editingChapter.summary}
                    onChange={(e) => setEditingChapter({...editingChapter, summary: e.target.value})}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-goal" className="text-sm font-medium">章节目标</Label>
                  <Textarea
                    id="edit-goal"
                    value={editingChapter.goal}
                    onChange={(e) => setEditingChapter({...editingChapter, goal: e.target.value})}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-twist" className="text-sm font-medium">转折提示</Label>
                  <Textarea
                    id="edit-twist"
                    value={editingChapter.twist_hint}
                    onChange={(e) => setEditingChapter({...editingChapter, twist_hint: e.target.value})}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">重要物品</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={editItemInput}
                      onChange={(e) => setEditItemInput(e.target.value)}
                      placeholder="添加重要物品"
                      onKeyPress={(e) => e.key === 'Enter' && addEditItemToChapter()}
                      className="h-10"
                    />
                    <Button 
                      type="button" 
                      onClick={addEditItemToChapter} 
                      size="default"
                      className="h-10 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingChapter.important_items.map((item: string, index: number) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {item}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeEditItemFromChapter(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                    className="h-10 px-4"
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleSaveChapter}
                    disabled={updateChapterApi.loading || !editingChapter.title.trim()}
                    className="h-10 px-4"
                  >
                    {updateChapterApi.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    保存修改
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}