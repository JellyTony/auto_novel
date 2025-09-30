"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  SparklesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { NovelAPI, Character, GenerateCharactersRequest, WorldView } from "@/lib/api";

// 简化的Badge组件
const Badge = ({ children, className, variant = "default" }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: "default" | "secondary" | "outline" 
}) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800", 
    outline: "border border-gray-300 text-gray-700"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className || ""}`}>
      {children}
    </span>
  );
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [characterNames, setCharacterNames] = useState<string[]>([]);

  // 加载角色列表
  const loadCharacters = async (projectId?: string) => {
    try {
      setLoading(true);
      if (projectId) {
        // 这里应该调用获取特定项目角色的API
        // 暂时使用模拟数据
        setCharacters([
          {
            id: "1",
            projectId: projectId || "1",
            name: "李明轩",
            role: "主角",
            age: 25,
            gender: "男",
            occupation: "程序员",
            personality: ["聪明", "勇敢", "正义"],
            background: "出身普通家庭，大学毕业后在一家科技公司工作。偶然获得修仙传承，开始了修仙之路。",
            abilities: ["编程", "修仙功法", "商业谈判"],
            goals: ["成为修仙界的强者", "保护身边的人", "建立自己的商业帝国"],
            conflicts: ["与邪恶势力的斗争", "现代生活与修仙的平衡"],
            relationshipMap: { "2": "恋人" }
          },
          {
            id: "2", 
            projectId: projectId || "1",
            name: "苏雨萱",
            role: "女主角",
            age: 23,
            gender: "女",
            occupation: "医生",
            personality: ["温柔", "聪慧", "坚强"],
            background: "富家千金，从小接受良好教育。在大学与李明轩相识相恋。",
            abilities: ["钢琴", "绘画", "商业管理"],
            goals: ["支持李明轩的事业", "在艺术领域有所成就"],
            conflicts: ["家族期望与个人选择"],
            relationshipMap: { "1": "恋人" }
          }
        ]);
      } else {
        setCharacters([]);
      }
    } catch (error) {
      console.error('加载角色列表失败:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  // 生成角色
  const handleGenerateCharacters = async () => {
    try {
      if (!selectedProject) {
        alert('请选择项目');
        return;
      }

      const generateRequest: GenerateCharactersRequest = {
        projectId: selectedProject,
        characterNames: characterNames,
        worldView: {} as WorldView // 这里应该从项目中获取世界观
      };

      const response = await NovelAPI.generateCharacters(generateRequest);
      setCharacters(prev => [...prev, ...response.characters]);
      setShowGenerateForm(false);
      setCharacterNames([]);
    } catch (error) {
      console.error('生成角色失败:', error);
      alert('生成角色失败，请重试');
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadCharacters(selectedProject);
    }
  }, [selectedProject]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="角色管理" description="管理您小说中的角色设定" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">角色管理</h1>
            <p className="mt-2 text-gray-600">管理您小说中的角色设定</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowGenerateForm(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              AI生成角色
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              手动添加角色
            </Button>
          </div>
        </div>

        {/* 项目选择和搜索 */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择项目</option>
              <option value="1">都市修仙传</option>
              <option value="2">星际争霸</option>
              <option value="3">古代宫廷秘史</option>
            </select>
          </div>
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索角色..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* AI生成角色表单 */}
        {showGenerateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI生成角色</CardTitle>
              <CardDescription>使用AI为您的小说生成角色设定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择项目</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择项目</option>
                    <option value="1">都市修仙传</option>
                    <option value="2">星际争霸</option>
                    <option value="3">古代宫廷秘史</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色名称</label>
                  <Input
                    type="text"
                    placeholder="输入角色名称，用逗号分隔"
                    value={characterNames.join(", ")}
                    onChange={(e) => setCharacterNames(e.target.value.split(",").map(name => name.trim()).filter(name => name))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateForm(false)}
                >
                  取消
                </Button>
                <Button onClick={handleGenerateCharacters}>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  生成角色
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 角色列表 */}
        {!selectedProject ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">请选择项目</h3>
            <p className="mt-1 text-sm text-gray-500">选择一个项目来查看和管理角色</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
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
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 职业 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">职业</h4>
                    <p className="text-sm text-gray-600">{character.occupation}</p>
                  </div>

                  {/* 性格特点 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">性格特点</h4>
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
                      <h4 className="text-sm font-medium text-gray-700 mb-2">能力</h4>
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

                  {/* 关系 */}
                  {character.relationshipMap && Object.keys(character.relationshipMap).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">人物关系</h4>
                      <div className="space-y-1">
                        {Object.entries(character.relationshipMap).slice(0, 2).map(([characterId, relationship], index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{relationship}</span>
                            <span className="ml-1">- 角色ID: {characterId}</span>
                          </div>
                        ))}
                        {Object.keys(character.relationshipMap).length > 2 && (
                          <div className="text-xs text-gray-500">
                            还有 {Object.keys(character.relationshipMap).length - 2} 个关系...
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

        {/* 空状态 */}
        {selectedProject && !loading && filteredCharacters.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到角色</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '开始为您的项目创建角色'}
            </p>
            {!searchTerm && (
              <div className="mt-6 flex justify-center space-x-3">
                <Button onClick={() => setShowGenerateForm(true)} variant="outline">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  AI生成角色
                </Button>
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  手动添加角色
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}