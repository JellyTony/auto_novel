import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UserGroupIcon,
  SparklesIcon,
  UserIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

// 模拟角色数据
const characters = [
  {
    id: 1,
    name: "林逸",
    role: "主角",
    age: 25,
    gender: "男",
    occupation: "程序员/修仙者",
    personality: ["聪明", "坚韧", "低调", "正义"],
    background: "普通的程序员，意外获得修仙传承，开始在都市中修炼。性格内敛但有正义感，善于利用现代科技辅助修炼。",
    relationships: [
      { target: "苏雨", type: "恋人", description: "青梅竹马，互相支持" },
      { target: "张师父", type: "师父", description: "修仙路上的引路人" }
    ],
    abilities: ["编程天赋", "修仙资质", "灵气感知"],
    avatar: "👨‍💻",
    status: "活跃",
    importance: "核心",
    createdAt: "2024-09-15"
  },
  {
    id: 2,
    name: "苏雨",
    role: "女主角",
    age: 23,
    gender: "女",
    occupation: "医生",
    personality: ["温柔", "聪慧", "坚强", "善良"],
    background: "医学院毕业的年轻医生，林逸的青梅竹马。虽然不是修仙者，但凭借医学知识在修仙世界中发挥重要作用。",
    relationships: [
      { target: "林逸", type: "恋人", description: "青梅竹马，互相支持" },
      { target: "苏父", type: "父女", description: "关系融洽的父女" }
    ],
    abilities: ["医学知识", "治疗技能", "洞察力"],
    avatar: "👩‍⚕️",
    status: "活跃",
    importance: "核心",
    createdAt: "2024-09-15"
  },
  {
    id: 3,
    name: "张师父",
    role: "配角",
    age: 60,
    gender: "男",
    occupation: "隐世修仙者",
    personality: ["睿智", "神秘", "严厉", "慈祥"],
    background: "隐居在都市中的老修仙者，发现了林逸的修仙天赋，成为他的引路人。拥有深厚的修仙知识和丰富的人生阅历。",
    relationships: [
      { target: "林逸", type: "师徒", description: "修仙路上的引路人" }
    ],
    abilities: ["高深修为", "炼丹术", "阵法精通"],
    avatar: "🧙‍♂️",
    status: "活跃",
    importance: "重要",
    createdAt: "2024-09-16"
  },
  {
    id: 4,
    name: "王强",
    role: "反派",
    age: 30,
    gender: "男",
    occupation: "商人/邪修",
    personality: ["狡诈", "贪婪", "残忍", "野心勃勃"],
    background: "表面上是成功商人，暗地里是邪修。为了获得更强的力量不择手段，与主角产生冲突。",
    relationships: [
      { target: "林逸", type: "敌对", description: "修仙路上的对手" }
    ],
    abilities: ["邪修功法", "商业头脑", "心理操控"],
    avatar: "👤",
    status: "活跃",
    importance: "重要",
    createdAt: "2024-09-18"
  }
];

const roleColors = {
  "主角": "bg-blue-100 text-blue-800",
  "女主角": "bg-pink-100 text-pink-800",
  "配角": "bg-green-100 text-green-800",
  "反派": "bg-red-100 text-red-800",
  "路人": "bg-gray-100 text-gray-800"
};

const importanceColors = {
  "核心": "bg-purple-100 text-purple-800",
  "重要": "bg-orange-100 text-orange-800",
  "次要": "bg-yellow-100 text-yellow-800",
  "背景": "bg-gray-100 text-gray-800"
};

export default function CharactersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="角色管理" 
        description="创建和管理您小说中的角色"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* AI生成区域 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              AI智能生成角色
            </CardTitle>
            <CardDescription>
              基于世界观和剧情需要，智能生成符合设定的角色
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色类型
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">选择类型</option>
                  <option value="主角">主角</option>
                  <option value="女主角">女主角</option>
                  <option value="配角">重要配角</option>
                  <option value="反派">反派角色</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性别
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">不限</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年龄段
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">不限</option>
                  <option value="少年">少年(12-17)</option>
                  <option value="青年">青年(18-35)</option>
                  <option value="中年">中年(36-55)</option>
                  <option value="老年">老年(55+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职业背景
                </label>
                <Input placeholder="如：医生、商人、学生..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特殊要求
              </label>
              <Input 
                placeholder="描述角色的特殊设定、性格特点或在剧情中的作用..."
                className="w-full"
              />
            </div>
            <Button>
              <SparklesIcon className="h-4 w-4 mr-2" />
              生成角色
            </Button>
          </CardContent>
        </Card>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="搜索角色..." 
                className="pl-10 w-80"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">所有角色</option>
              <option value="主角">主角</option>
              <option value="女主角">女主角</option>
              <option value="配角">配角</option>
              <option value="反派">反派</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">所有重要性</option>
              <option value="核心">核心</option>
              <option value="重要">重要</option>
              <option value="次要">次要</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <HeartIcon className="h-4 w-4 mr-2" />
              关系图谱
            </Button>
            <Button variant="outline">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              一致性检查
            </Button>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              手动创建
            </Button>
          </div>
        </div>

        {/* 角色网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card key={character.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{character.avatar}</div>
                    <div>
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[character.role as keyof typeof roleColors]}`}>
                          {character.role}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${importanceColors[character.importance as keyof typeof importanceColors]}`}>
                          {character.importance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">年龄：</span>
                    <span className="text-gray-900">{character.age}岁</span>
                  </div>
                  <div>
                    <span className="text-gray-500">性别：</span>
                    <span className="text-gray-900">{character.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">状态：</span>
                    <span className="text-green-600">{character.status}</span>
                  </div>
                </div>

                {/* 职业 */}
                <div>
                  <span className="text-sm font-medium text-gray-700">职业：</span>
                  <span className="text-sm text-gray-600">{character.occupation}</span>
                </div>

                {/* 性格特点 */}
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">性格特点</span>
                  <div className="flex flex-wrap gap-1">
                    {character.personality.map((trait, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 背景描述 */}
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">背景</span>
                  <CardDescription className="text-sm line-clamp-3">
                    {character.background}
                  </CardDescription>
                </div>

                {/* 人际关系 */}
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">主要关系</span>
                  <div className="space-y-1">
                    {character.relationships.slice(0, 2).map((rel, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="text-gray-600">{rel.target}</span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-blue-600">{rel.type}</span>
                      </div>
                    ))}
                    {character.relationships.length > 2 && (
                      <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                        查看全部 {character.relationships.length} 个关系...
                      </div>
                    )}
                  </div>
                </div>

                {/* 特殊能力 */}
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-1">特殊能力</span>
                  <div className="flex flex-wrap gap-1">
                    {character.abilities.map((ability, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-50 text-green-700">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserIcon className="h-4 w-4 mr-1" />
                    详情
                  </Button>
                  <Button size="sm" className="flex-1">
                    编辑
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 创建新角色卡片 */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-lg text-gray-600 mb-2">创建新角色</CardTitle>
              <CardDescription className="mb-4">
                添加一个新的角色到您的故事中
              </CardDescription>
              <Button>
                立即创建
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}