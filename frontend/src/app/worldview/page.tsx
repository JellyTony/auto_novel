"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Globe,
  Sparkles,
  BookOpen,
  Settings,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { NovelAPI, WorldView, GenerateWorldViewRequest, Project } from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";

export default function WorldviewPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
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

  // 世界观生成状态管理
  const generateWorldViewApi = useApiMutation<{ world_view: WorldView }, GenerateWorldViewRequest>({
    onSuccess: (data) => {
      console.log('世界观生成成功:', data);
      setShowGenerateForm(false);
      setGenerateRequest({
        project_id: selectedProject,
        genre: '',
        setting: '',
        key_rules: [],
        tone: '',
        target_audience: '',
        themes: []
      });
      // 重新加载项目详情以获取最新的世界观
      loadProjectDetail();
    },
    onError: (error) => {
      console.error('世界观生成失败:', error);
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
  const [generateRequest, setGenerateRequest] = useState<GenerateWorldViewRequest>({
    project_id: "",
    genre: "",
    setting: "",
    key_rules: [],
    tone: "",
    target_audience: "",
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

  // 加载项目详情
  const loadProjectDetail = async () => {
    if (!selectedProject) return;
    
    try {
      await projectDetailApi.execute(() => NovelAPI.getProject(selectedProject).then(res => res.project));
    } catch (error) {
      console.error('加载项目详情失败:', error);
    }
  };

  // 生成世界观
  const handleGenerateWorldView = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...generateRequest,
      project_id: selectedProject
    };

    try {
      await generateWorldViewApi.mutate(
        (data: GenerateWorldViewRequest) => NovelAPI.generateWorldView(data),
        requestData
      );
    } catch (error) {
      console.error('生成世界观失败:', error);
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

  // 获取当前项目的世界观
  const currentProject = projectDetailApi.data;
  const worldView = currentProject?.world_view;

  // 主题选项
  const themeOptions = [
    '爱情', '友情', '成长', '冒险', '悬疑', '科幻', '奇幻', 
    '历史', '都市', '校园', '职场', '家庭', '战争', '武侠'
  ];

  // 处理主题选择
  const handleThemeChange = (theme: string, checked: boolean) => {
    setGenerateRequest(prev => ({
      ...prev,
      themes: checked 
        ? [...prev.themes, theme]
        : prev.themes.filter(t => t !== theme)
    }));
  };

  // 处理核心规则输入
  const handleKeyRuleChange = (index: number, value: string) => {
    setGenerateRequest(prev => ({
      ...prev,
      key_rules: prev.key_rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const addKeyRule = () => {
    setGenerateRequest(prev => ({
      ...prev,
      key_rules: [...prev.key_rules, '']
    }));
  };

  const removeKeyRule = (index: number) => {
    setGenerateRequest(prev => ({
      ...prev,
      key_rules: prev.key_rules.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="世界观设定" 
        description="创建和管理小说的世界观设定，包括背景、规则和氛围"
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
          </div>
          
          <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                disabled={!selectedProject}
              >
                <Plus className="w-4 h-4" />
                生成世界观
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>生成世界观</DialogTitle>
                <DialogDescription>
                  设置世界观的基本参数，AI将为您生成详细的世界观设定
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">体裁类型</Label>
                    <Select value={generateRequest.genre} onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, genre: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择体裁" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="现代都市">现代都市</SelectItem>
                        <SelectItem value="古代言情">古代言情</SelectItem>
                        <SelectItem value="科幻">科幻</SelectItem>
                        <SelectItem value="悬疑推理">悬疑推理</SelectItem>
                        <SelectItem value="奇幻">奇幻</SelectItem>
                        <SelectItem value="武侠">武侠</SelectItem>
                        <SelectItem value="历史">历史</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tone">基调风格</Label>
                    <Select value={generateRequest.tone} onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择基调" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="轻松幽默">轻松幽默</SelectItem>
                        <SelectItem value="严肃正经">严肃正经</SelectItem>
                        <SelectItem value="悬疑紧张">悬疑紧张</SelectItem>
                        <SelectItem value="浪漫温馨">浪漫温馨</SelectItem>
                        <SelectItem value="热血激昂">热血激昂</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setting">背景设定</Label>
                  <Textarea
                    id="setting"
                    placeholder="描述世界观的基本背景设定，如时代背景、地理环境、社会结构等..."
                    value={generateRequest.setting}
                    onChange={(e) => setGenerateRequest(prev => ({ ...prev, setting: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target_audience">目标读者</Label>
                  <Select value={generateRequest.target_audience} onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, target_audience: value }))}>
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

                <div className="space-y-3">
                  <Label>核心规则</Label>
                  <div className="space-y-2">
                    {generateRequest.key_rules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`核心规则 ${index + 1}`}
                          value={rule}
                          onChange={(e) => handleKeyRuleChange(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeKeyRule(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyRule}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加规则
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>主题标签</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {themeOptions.map((theme) => (
                      <div key={theme} className="flex items-center space-x-2">
                        <Checkbox
                          id={theme}
                          checked={generateRequest.themes.includes(theme)}
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
                  onClick={() => setShowGenerateForm(false)}
                  disabled={generateWorldViewApi.loading}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateWorldView}
                  disabled={!generateRequest.genre || !generateRequest.setting || generateWorldViewApi.loading}
                >
                  {generateWorldViewApi.loading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      生成中...
                    </>
                  ) : (
                    '生成世界观'
                  )}
                </Button>
              </div>
              
              {generateWorldViewApi.error && (
                <ApiError 
                  error={generateWorldViewApi.error} 
                  onRetry={() => handleGenerateWorldView()}
                  className="mt-4"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 世界观展示 */}
        {projectsApi.loading ? (
          <div className="grid gap-6">
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
            description="选择一个项目来查看或生成世界观设定"
            icon={<Globe className="w-12 h-12 text-gray-400" />}
          />
        ) : projectDetailApi.loading ? (
          <CardSkeleton />
        ) : projectDetailApi.error ? (
          <ApiError 
            error={projectDetailApi.error} 
            onRetry={loadProjectDetail}
            className="mb-6"
          />
        ) : !worldView ? (
          <EmptyState
            title="还没有世界观设定"
            description="为这个项目生成世界观设定，建立小说的基础世界框架"
            action={
              <Button onClick={() => setShowGenerateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                生成世界观
              </Button>
            }
            icon={<Globe className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span>{worldView.title || '世界观设定'}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {worldView.synopsis}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowGenerateForm(true)}
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    背景设定
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{worldView.setting}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    基调与受众
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">基调</Badge>
                      <span className="text-sm text-gray-600">{worldView.tone_examples?.[0] || '未设定'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 核心规则 */}
              {worldView.key_rules && worldView.key_rules.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    核心规则
                  </h4>
                  <ul className="space-y-2">
                    {worldView.key_rules.map((rule, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 主题标签 */}
              {worldView.themes && worldView.themes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">主题标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {worldView.themes.map((theme, index) => (
                      <Badge key={index} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 基调示例 */}
              {worldView.tone_examples && worldView.tone_examples.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    基调示例
                  </h4>
                  <div className="space-y-2">
                    {worldView.tone_examples.map((example, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 italic">"{example}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}