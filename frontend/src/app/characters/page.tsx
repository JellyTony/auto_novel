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
import { 
  Plus,
  Search,
  User,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Users,
  Target,
  Heart,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { NovelAPI, Character, GenerateCharactersRequest, Project } from "@/lib/api";
import { useApiList, useApiMutation } from "@/lib/hooks/useApi";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { ApiError, EmptyState } from "@/components/ui/error-boundary";

export default function CharactersPage() {
  const [searchTerm, setSearchTerm] = useState("");
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

  // 角色生成状态管理
  const generateCharactersApi = useApiMutation<{ characters: Character[] }, GenerateCharactersRequest>({
    onSuccess: (data) => {
      console.log('角色生成成功:', data);
      setShowGenerateForm(false);
      setGenerateRequest({
        project_id: selectedProject,
        character_names: [],
        character_count: 3,
        character_types: []
      });
      // 重新加载项目详情以获取最新的角色
      loadProjectDetail();
    },
    onError: (error) => {
      console.error('角色生成失败:', error);
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
  const [generateRequest, setGenerateRequest] = useState<GenerateCharactersRequest>({
    project_id: "",
    character_names: [],
    character_count: 3,
    character_types: []
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

  // 生成角色
  const handleGenerateCharacters = async () => {
    if (!selectedProject) return;

    const requestData = {
      ...generateRequest,
      project_id: selectedProject
    };

    try {
      await generateCharactersApi.mutate(
        (data: GenerateCharactersRequest) => NovelAPI.generateCharacters(data),
        requestData
      );
    } catch (error) {
      console.error('生成角色失败:', error);
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

  // 获取当前项目的角色
  const currentProject = projectDetailApi.data;
  const characters = currentProject?.characters || [];

  // 过滤角色
  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.personality.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "主角": return "bg-red-100 text-red-800";
      case "女主角": return "bg-pink-100 text-pink-800";
      case "配角": return "bg-blue-100 text-blue-800";
      case "反派": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 处理角色名称输入
  const handleCharacterNamesChange = (value: string) => {
    const names = value.split(',').map(name => name.trim()).filter(name => name);
    setGenerateRequest(prev => ({ ...prev, character_names: names }));
  };

  // 处理角色类型选择
  const handleCharacterTypeChange = (type: string, checked: boolean) => {
    setGenerateRequest(prev => ({
      ...prev,
      character_types: checked 
        ? [...prev.character_types, type]
        : prev.character_types.filter(t => t !== type)
    }));
  };

  // 角色类型选项
  const characterTypeOptions = [
    '主角', '女主角', '配角', '反派', '导师', '朋友', '敌人', '路人'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="角色管理" 
        description="创建和管理小说中的角色设定，包括性格、背景和关系"
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
                placeholder="搜索角色..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                disabled={!selectedProject}
              >
                <Plus className="w-4 h-4" />
                生成角色
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>生成角色</DialogTitle>
                <DialogDescription>
                  设置角色生成参数，AI将为您创建详细的角色设定
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="character_count">角色数量</Label>
                    <Select 
                      value={generateRequest.character_count.toString()} 
                      onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, character_count: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择数量" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1个角色</SelectItem>
                        <SelectItem value="2">2个角色</SelectItem>
                        <SelectItem value="3">3个角色</SelectItem>
                        <SelectItem value="4">4个角色</SelectItem>
                        <SelectItem value="5">5个角色</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="character_names">角色名称（可选）</Label>
                  <Textarea
                    id="character_names"
                    placeholder="输入角色名称，用逗号分隔，如：李明轩, 苏雨萱, 王大强"
                    value={generateRequest.character_names.join(', ')}
                    onChange={(e) => handleCharacterNamesChange(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label>角色类型</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {characterTypeOptions.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={type}
                          checked={generateRequest.character_types.includes(type)}
                          onChange={(e) => handleCharacterTypeChange(type, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={type} className="text-sm font-normal">
                          {type}
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
                  disabled={generateCharactersApi.loading}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleGenerateCharacters}
                  disabled={generateRequest.character_count < 1 || generateCharactersApi.loading}
                >
                  {generateCharactersApi.loading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成角色
                    </>
                  )}
                </Button>
              </div>
              
              {generateCharactersApi.error && (
                <ApiError 
                  error={generateCharactersApi.error} 
                  onRetry={() => handleGenerateCharacters()}
                  className="mt-4"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 角色展示 */}
        {projectsApi.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            description="选择一个项目来查看或生成角色设定"
            icon={<User className="w-12 h-12 text-gray-400" />}
          />
        ) : projectDetailApi.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : filteredCharacters.length === 0 ? (
          <EmptyState
            title={searchTerm ? "没有找到匹配的角色" : "还没有角色设定"}
            description={searchTerm ? "尝试调整搜索条件" : "为这个项目生成角色设定，建立小说的人物体系"}
            action={
              !searchTerm ? (
                <Button onClick={() => setShowGenerateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  生成角色
                </Button>
              ) : undefined
            }
            icon={<Users className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => (
              <Card key={character.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {character.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getRoleColor(character.role)}>
                          {character.role}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {character.age}岁 · {character.gender}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 职业 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      职业
                    </h4>
                    <p className="text-sm text-gray-600">{character.occupation}</p>
                  </div>

                  {/* 性格特点 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      性格特点
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {character.personality.slice(0, 3).map((trait, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {character.personality.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{character.personality.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 背景描述 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">背景</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {character.background}
                    </p>
                  </div>

                  {/* 能力 */}
                  {character.abilities && character.abilities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        能力
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {character.abilities.slice(0, 3).map((ability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {ability}
                          </Badge>
                        ))}
                        {character.abilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{character.abilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 目标 */}
                  {character.goals && character.goals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">目标</h4>
                      <ul className="space-y-1">
                        {character.goals.slice(0, 2).map((goal, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span className="leading-relaxed">{goal}</span>
                          </li>
                        ))}
                        {character.goals.length > 2 && (
                          <li className="text-xs text-gray-500">
                            还有 {character.goals.length - 2} 个目标...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 关系 */}
                  {character.relationship_map && Object.keys(character.relationship_map).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        人物关系
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(character.relationship_map).slice(0, 2).map(([characterId, relationship], index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{relationship}</span>
                            <span className="ml-1 text-gray-500">- {characterId}</span>
                          </div>
                        ))}
                        {Object.keys(character.relationship_map).length > 2 && (
                          <div className="text-xs text-gray-500">
                            还有 {Object.keys(character.relationship_map).length - 2} 个关系...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}