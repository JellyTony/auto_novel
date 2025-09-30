"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  Package
} from "lucide-react";
import { useState, useEffect } from "react";
import { NovelAPI, Outline, GenerateOutlineRequest, Project } from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";

export default function OutlinePage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
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

  // 大纲生成状态管理
  const generateOutlineApi = useApiMutation<{ outline: Outline }, GenerateOutlineRequest>({
    onSuccess: (data) => {
      console.log('大纲生成成功:', data);
      setShowGenerateForm(false);
      setGenerateRequest({
        project_id: selectedProject,
        chapter_count: 10,
        outline_type: "detailed"
      });
      // 重新加载项目详情以获取最新的大纲
      loadProjectDetail();
    },
    onError: (error) => {
      console.error('大纲生成失败:', error);
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

  // 生成请求表单状态
  const [generateRequest, setGenerateRequest] = useState<GenerateOutlineRequest>({
    project_id: "",
    chapter_count: 10,
    outline_type: "detailed"
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

  // 生成大纲
  const handleGenerateOutline = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...generateRequest,
      project_id: selectedProject
    };

    try {
      await generateOutlineApi.mutate(
        (data: GenerateOutlineRequest) => NovelAPI.generateOutline(data),
        requestData
      );
    } catch (error) {
      console.error('生成大纲失败:', error);
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
      loadProjectDetail();
    }
  }, [selectedProject]);

  // 获取当前项目的大纲
  const currentProject = projectDetailApi.data;
  const outline = currentProject?.outline;

  // 过滤章节
  const filteredChapters = outline?.chapters?.filter(chapter => {
    const matchesSearch = searchTerm === "" || 
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 这里可以根据需要添加状态过滤逻辑
    const matchesStatus = statusFilter === "" || true;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="大纲管理" 
        description="规划和编辑您的小说大纲结构，构建完整的故事框架"
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
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="in-progress">进行中</SelectItem>
                <SelectItem value="planned">已规划</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                disabled={!selectedProject}
              >
                <Plus className="w-4 h-4" />
                生成大纲
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>生成大纲</DialogTitle>
                <DialogDescription>
                  设置大纲生成参数，AI将为您创建详细的章节规划
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter_count">章节数量</Label>
                  <Select 
                    value={generateRequest.chapter_count.toString()} 
                    onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, chapter_count: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择章节数量" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5章</SelectItem>
                      <SelectItem value="10">10章</SelectItem>
                      <SelectItem value="15">15章</SelectItem>
                      <SelectItem value="20">20章</SelectItem>
                      <SelectItem value="30">30章</SelectItem>
                      <SelectItem value="50">50章</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outline_type">大纲类型</Label>
                  <Select 
                    value={generateRequest.outline_type} 
                    onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, outline_type: value as "simple" | "detailed" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择大纲类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">简单大纲</SelectItem>
                      <SelectItem value="detailed">详细大纲</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateForm(false)}
                  disabled={generateOutlineApi.loading}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateOutline}
                  disabled={generateRequest.chapter_count < 1 || generateOutlineApi.loading}
                >
                  {generateOutlineApi.loading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成大纲
                    </>
                  )}
                </Button>
              </div>
              
              {generateOutlineApi.error && (
                <ApiError 
                  error={generateOutlineApi.error} 
                  onRetry={() => handleGenerateOutline()}
                  className="mt-4"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 大纲展示 */}
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
            description="选择一个项目来查看或生成大纲"
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
        ) : !outline || !outline.chapters || outline.chapters.length === 0 ? (
          <EmptyState
            title="还没有大纲"
            description="为这个项目生成大纲，构建完整的故事框架"
            action={
              <Button onClick={() => setShowGenerateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                生成大纲
              </Button>
            }
            icon={<FileText className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <>
            {/* 大纲概览 */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {currentProject?.title} - 大纲
                    </CardTitle>
                    <CardDescription className="mt-1">
                      共 {outline.chapters.length} 章，已规划完整故事结构
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      预览
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* 统计信息 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{outline.chapters.length}</div>
                    <div className="text-sm text-gray-500">总章节数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {outline.chapters.filter(c => c.important_items && c.important_items.length > 0).length}
                    </div>
                    <div className="text-sm text-gray-500">详细章节</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {outline.chapters.filter(c => c.twist_hint).length}
                    </div>
                    <div className="text-sm text-gray-500">转折章节</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">100%</div>
                    <div className="text-sm text-gray-500">规划完成</div>
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
                filteredChapters.map((chapter, index) => (
                  <Card key={chapter.index} className="hover:shadow-lg transition-shadow">
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
                          </div>
                          
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {chapter.summary}
                          </p>
                          
                          {/* 章节目标 */}
                          {chapter.goal && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Target className="w-3 h-3 mr-1" />
                                章节目标
                              </h5>
                              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                {chapter.goal}
                              </p>
                            </div>
                          )}

                          {/* 重要道具 */}
                          {chapter.important_items && chapter.important_items.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Package className="w-3 h-3 mr-1" />
                                重要道具
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {chapter.important_items.map((item, itemIndex) => (
                                  <Badge key={itemIndex} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 转折提示 */}
                          {chapter.twist_hint && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                转折提示
                              </h5>
                              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                                {chapter.twist_hint}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-1 ml-4">
                          <Button variant="ghost" size="sm" title="上移">
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="下移">
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="编辑">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm">
                          编辑详情
                        </Button>
                        <Button size="sm">
                          开始写作
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {/* 添加章节按钮 */}
              <Button variant="outline" className="w-full border-dashed py-8">
                <Plus className="w-4 h-4 mr-2" />
                添加新章节
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}