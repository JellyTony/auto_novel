"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, BookOpenIcon, UserGroupIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleCreateProject = () => {
    router.push('/projects');
  };

  const handleViewProjects = () => {
    router.push('/projects');
  };

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
    router.push('/projects');
  };
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">都市修仙传</CardTitle>
                <CardDescription>现代都市 · 玄幻</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">进度</span>
                    <span className="text-gray-900">15/30 章</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>更新时间: 2024-09-29</span>
                    <span>45,000 字</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => handleContinueEdit('project1')}>
                  继续编辑
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">星际争霸</CardTitle>
                <CardDescription>科幻 · 太空歌剧</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">进度</span>
                    <span className="text-gray-900">8/25 章</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>更新时间: 2024-09-28</span>
                    <span>28,000 字</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => handleContinueEdit('project2')}>
                  继续编辑
                </Button>
              </CardContent>
            </Card>

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

        {/* 统计信息 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">创作统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总项目数</CardDescription>
                <CardTitle className="text-2xl">12</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>完成项目</CardDescription>
                <CardTitle className="text-2xl">3</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总字数</CardDescription>
                <CardTitle className="text-2xl">156K</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>本月创作</CardDescription>
                <CardTitle className="text-2xl">23K</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
