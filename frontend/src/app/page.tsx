"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, BookOpenIcon, UserGroupIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NovelAPI, Project, ProjectStats } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    completedProjects: 0,
    totalWords: 0,
    monthlyWords: 0
  });
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 获取最近项目
      const projectsResponse = await NovelAPI.listProjects({ page: 1, pageSize: 5 });
      setRecentProjects(projectsResponse.projects || []);
      
      // 获取统计信息
      try {
        const statsResponse = await NovelAPI.getStats();
        setStats(statsResponse.stats);
      } catch (error) {
        console.error('获取统计信息失败:', error);
        // 使用项目数据计算基本统计
        const projects = projectsResponse.projects || [];
        const completedCount = projects.filter(p => p.status === '已完成').length;
        const totalWords = projects.reduce((sum, p) => {
          // 估算字数：假设每章平均3000字
          const chapterCount = p.chapters?.length || 0;
          return sum + (chapterCount * 3000);
        }, 0);
        
        setStats({
          totalProjects: projects.length,
          completedProjects: completedCount,
          totalWords: totalWords,
          monthlyWords: Math.floor(totalWords * 0.3) // 假设30%是本月创作
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用模拟数据作为后备
      setRecentProjects([
        {
          id: "1",
          title: "都市修仙传",
          description: "一个现代都市背景下的修仙故事",
          genre: "现代都市",
          targetAudience: "青年",
          tone: "快节奏",
          themes: ["修仙", "都市", "成长"],
          status: "进行中",
          createdAt: "2024-08-15",
          updatedAt: "2024-09-29"
        },
        {
          id: "2",
          title: "星际争霸",
          description: "未来世界的星际战争",
          genre: "科幻",
          targetAudience: "男性向",
          tone: "冷峻",
          themes: ["科幻", "战争", "太空"],
          status: "进行中",
          createdAt: "2024-09-01",
          updatedAt: "2024-09-28"
        }
      ]);
      
      setStats({
        totalProjects: 12,
        completedProjects: 3,
        totalWords: 156000,
        monthlyWords: 23000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleViewProjects = () => {
    router.push('/projects');
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleViewCharacters = () => {
    router.push('/characters');
  };

  const handleViewWorldview = () => {
    router.push('/worldview');
  };

  const handleViewChapters = () => {
    router.push('/chapters');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="AI小说创作助手" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  const handleManageCharacters = () => {
    router.push('/characters');
  };

  const handleBrowseTemplates = () => {
    // 暂时跳转到项目页面，后续可以添加模板页面
    router.push('/projects');
  };

  const handleContinueEdit = (projectId?: string) => {
    // 暂时跳转到章节页面，后续可以根据项目ID跳转
    router.push('/chapters');
  };

  const handleStartCreating = () => {
    router.push('/projects/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="AI小说创作助手" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="欢迎使用AI小说生成器" 
        description="开始您的创作之旅，让AI帮助您创作精彩的小说作品"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* 快速操作 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速开始</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <PlusIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">创建新项目</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>开始一个全新的小说创作项目</CardDescription>
                <Button className="w-full mt-3" size="sm" onClick={handleCreateProject}>
                  立即创建
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <BookOpenIcon className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base">继续写作</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>继续您未完成的小说项目</CardDescription>
                <Button variant="outline" className="w-full mt-3" size="sm" onClick={handleViewProjects}>
                  查看项目
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">角色管理</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>创建和管理您的小说角色</CardDescription>
                <Button variant="outline" className="w-full mt-3" size="sm" onClick={handleManageCharacters}>
                  管理角色
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-base">模板库</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>使用预设模板快速开始</CardDescription>
                <Button variant="outline" className="w-full mt-3" size="sm" onClick={handleBrowseTemplates}>
                  浏览模板
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近项目 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近项目</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  <CardDescription>{project.genre} · {project.targetAudience}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">状态</span>
                      <span className="text-gray-900">{project.status}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>更新时间: {project.updatedAt}</span>
                      <span>{project.chapters?.length || 0} 章</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    size="sm" 
                    onClick={() => handleViewProject(project.id)}
                  >
                    查看详情
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed border-2 border-gray-300 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">创建新项目</p>
                <Button variant="outline" size="sm" onClick={handleStartCreating}>
                  开始创作
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* 创作统计 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">创作统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总项目数</CardDescription>
                <CardTitle className="text-2xl">{stats.totalProjects}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>完成项目</CardDescription>
                <CardTitle className="text-2xl">{stats.completedProjects}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总字数</CardDescription>
                <CardTitle className="text-2xl">{Math.floor(stats.totalWords / 1000)}K</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>本月创作</CardDescription>
                <CardTitle className="text-2xl">{Math.floor(stats.monthlyWords / 1000)}K</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
