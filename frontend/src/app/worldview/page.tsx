import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GlobeAltIcon,
  SparklesIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

// 模拟世界观数据
const worldviews = [
  {
    id: 1,
    title: "现代都市修仙世界",
    genre: "现代都市",
    subGenre: "玄幻",
    description: "在现代都市背景下，隐藏着修仙者的世界。高楼大厦之间存在着灵气节点，修仙者需要在现代社会中隐藏身份，同时追求修仙之道。",
    rules: [
      "修仙者必须隐藏身份，不能在普通人面前暴露超自然能力",
      "灵气主要集中在城市的特定区域，如古建筑、公园等",
      "修仙等级分为：练气、筑基、金丹、元婴、化神",
      "现代科技对修仙有一定影响，需要平衡传统修仙与现代生活"
    ],
    settings: {
      powerSystem: "修仙体系",
      worldScale: "现代都市",
      timeBackground: "现代",
      magicLevel: "高魔"
    },
    createdAt: "2024-09-15",
    updatedAt: "2024-09-28"
  },
  {
    id: 2,
    title: "星际联邦宇宙",
    genre: "科幻",
    subGenre: "太空歌剧",
    description: "公元2387年，人类已经建立了跨越银河系的星际联邦。各种外星种族共存，科技高度发达，但也面临着来自未知星域的威胁。",
    rules: [
      "星际联邦由人类主导，包含12个主要外星种族",
      "超光速旅行通过虫洞网络实现",
      "每个种族都有独特的生理特征和文化背景",
      "存在古老的先驱者文明遗迹，蕴含强大科技"
    ],
    settings: {
      powerSystem: "科技体系",
      worldScale: "银河系",
      timeBackground: "未来",
      magicLevel: "科技魔法"
    },
    createdAt: "2024-09-01",
    updatedAt: "2024-09-25"
  }
];

const genreOptions = [
  { value: "现代都市", label: "现代都市", subGenres: ["都市生活", "玄幻", "异能", "重生"] },
  { value: "古代言情", label: "古代言情", subGenres: ["宫廷", "江湖", "穿越", "重生"] },
  { value: "科幻", label: "科幻", subGenres: ["太空歌剧", "赛博朋克", "末世", "机甲"] },
  { value: "悬疑推理", label: "悬疑推理", subGenres: ["刑侦", "心理", "灵异", "密室"] },
  { value: "奇幻", label: "奇幻", subGenres: ["西方奇幻", "东方玄幻", "魔法", "异世界"] }
];

export default function WorldviewPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="世界观设定" 
        description="构建您小说的世界观和背景设定"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* 快速创建区域 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              AI智能生成世界观
            </CardTitle>
            <CardDescription>
              选择体裁和风格，让AI为您生成完整的世界观设定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主体裁
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">选择主体裁</option>
                  {genreOptions.map(genre => (
                    <option key={genre.value} value={genre.value}>
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  子体裁
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">选择子体裁</option>
                  <option value="玄幻">玄幻</option>
                  <option value="都市生活">都市生活</option>
                  <option value="异能">异能</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  世界规模
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">选择规模</option>
                  <option value="单一城市">单一城市</option>
                  <option value="国家">国家</option>
                  <option value="大陆">大陆</option>
                  <option value="星球">星球</option>
                  <option value="星系">星系</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                特殊要求（可选）
              </label>
              <Input 
                placeholder="例如：包含修仙体系、现代背景、多种族共存等..."
                className="w-full"
              />
            </div>
            <div className="flex space-x-3">
              <Button>
                <SparklesIcon className="h-4 w-4 mr-2" />
                生成世界观
              </Button>
              <Button variant="outline">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                高级设置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 现有世界观列表 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">已创建的世界观</h2>
          <Button variant="outline">
            <PlusIcon className="h-4 w-4 mr-2" />
            手动创建
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {worldviews.map((worldview) => (
            <Card key={worldview.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center mb-2">
                      <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-600" />
                      {worldview.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {worldview.genre}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {worldview.subGenre}
                      </span>
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
                <CardDescription className="text-sm">
                  {worldview.description}
                </CardDescription>

                {/* 世界观设定 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">力量体系：</span>
                    <span className="text-gray-600">{worldview.settings.powerSystem}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">世界规模：</span>
                    <span className="text-gray-600">{worldview.settings.worldScale}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">时代背景：</span>
                    <span className="text-gray-600">{worldview.settings.timeBackground}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">魔法程度：</span>
                    <span className="text-gray-600">{worldview.settings.magicLevel}</span>
                  </div>
                </div>

                {/* 世界规则 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">核心规则</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {worldview.rules.slice(0, 2).map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rule}
                      </li>
                    ))}
                    {worldview.rules.length > 2 && (
                      <li className="text-blue-600 cursor-pointer hover:underline">
                        查看全部 {worldview.rules.length} 条规则...
                      </li>
                    )}
                  </ul>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    查看详情
                  </Button>
                  <Button size="sm" className="flex-1">
                    应用到项目
                  </Button>
                </div>

                {/* 时间信息 */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  创建于 {worldview.createdAt} · 更新于 {worldview.updatedAt}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 创建新世界观卡片 */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-lg text-gray-600 mb-2">创建新世界观</CardTitle>
              <CardDescription className="mb-4">
                构建一个全新的故事世界
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