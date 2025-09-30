import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  BookOpenIcon,
  CalendarIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

// 模拟项目数据
const projects = [
  {
    id: 1,
    title: "都市修仙传",
    description: "一个现代都市背景下的修仙故事，主角在都市中修炼成仙的传奇经历。",
    genre: "现代都市",
    subGenre: "玄幻",
    status: "进行中",
    progress: 50,
    chapters: 15,
    totalChapters: 30,
    wordCount: 45000,
    updatedAt: "2024-09-29",
    createdAt: "2024-08-15"
  },
  {
    id: 2,
    title: "星际争霸",
    description: "未来世界的星际战争，人类与外星种族的生死较量。",
    genre: "科幻",
    subGenre: "太空歌剧",
    status: "进行中",
    progress: 32,
    chapters: 8,
    totalChapters: 25,
    wordCount: 28000,
    updatedAt: "2024-09-28",
    createdAt: "2024-09-01"
  },
  {
    id: 3,
    title: "古代宫廷秘史",
    description: "古代宫廷中的权谋斗争和爱恨情仇。",
    genre: "古代言情",
    subGenre: "宫廷",
    status: "已完成",
    progress: 100,
    chapters: 50,
    totalChapters: 50,
    wordCount: 120000,
    updatedAt: "2024-09-20",
    createdAt: "2024-07-01"
  },
  {
    id: 4,
    title: "悬疑推理案",
    description: "一系列离奇案件背后隐藏的真相。",
    genre: "悬疑推理",
    subGenre: "刑侦",
    status: "暂停",
    progress: 20,
    chapters: 5,
    totalChapters: 25,
    wordCount: 15000,
    updatedAt: "2024-09-15",
    createdAt: "2024-09-10"
  }
];

const statusColors = {
  "进行中": "bg-blue-100 text-blue-800",
  "已完成": "bg-green-100 text-green-800",
  "暂停": "bg-yellow-100 text-yellow-800",
  "草稿": "bg-gray-100 text-gray-800"
};

export default function ProjectsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="项目管理" 
        description="管理您的所有小说创作项目"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="搜索项目..." 
                className="pl-10 w-80"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">所有状态</option>
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="暂停">暂停</option>
              <option value="草稿">草稿</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">所有体裁</option>
              <option value="现代都市">现代都市</option>
              <option value="古代言情">古代言情</option>
              <option value="科幻">科幻</option>
              <option value="悬疑推理">悬疑推理</option>
            </select>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            创建新项目
          </Button>
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-500">{project.genre}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{project.subGenre}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                      {project.status}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm line-clamp-2">
                  {project.description}
                </CardDescription>
                
                {/* 进度条 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">进度</span>
                    <span className="text-gray-900">{project.chapters}/{project.totalChapters} 章</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.progress}% 完成
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.wordCount.toLocaleString()} 字</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.updatedAt}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                  <Button size="sm" className="flex-1">
                    继续编辑
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 创建新项目卡片 */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <PlusIcon className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-lg text-gray-600 mb-2">创建新项目</CardTitle>
              <CardDescription className="mb-4">
                开始一个全新的小说创作项目
              </CardDescription>
              <Button>
                立即创建
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-500">
            显示 1-{projects.length} 项，共 {projects.length} 项
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              上一页
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}