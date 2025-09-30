import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DocumentTextIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

// 模拟章节数据
const currentChapter = {
  id: 3,
  title: "第3章：神秘师父",
  description: "张师父出现，指导林逸正确的修炼方法，揭示修仙世界的秘密。",
  status: "生成中",
  progress: 65,
  wordCount: 1950,
  targetWordCount: 3000,
  estimatedTime: "2分钟",
  content: `林逸回到家中，心情久久不能平静。刚才在路上发生的事情，让他意识到自己获得的力量远比想象中更加神奇。

他坐在电脑前，试图专心工作，但脑海中不断浮现出那个玉佩发出的光芒，以及体内那股奇异的暖流。

"这到底是什么？"林逸喃喃自语，下意识地摸了摸胸前的玉佩。

就在这时，一个苍老的声音突然在他身后响起："年轻人，你终于觉醒了。"

林逸猛地转身，只见一个白发苍苍的老者不知何时出现在他的房间里。老者身穿朴素的灰色长袍，面容慈祥，但眼中却闪烁着深邃的光芒。

"你...你是谁？怎么进来的？"林逸警惕地问道。

老者微微一笑："我叫张无忌，是这枚玉佩的前任主人。准确地说，我是留在玉佩中的一缕神识。"

"神识？"林逸一头雾水。

"看来你对修仙一无所知。"张师父摇了摇头，"也难怪，现在这个时代，修仙者已经极其稀少了。"

张师父缓缓走到林逸面前，仔细打量着他："不错，你的根骨很好，而且已经初步引气入体。不过，你的修炼方法完全错误，如果继续下去，不仅无法进步，还可能走火入魔。"

"修炼？走火入魔？"林逸感觉自己像是在听天书。

"坐下，我来告诉你什么是修仙。"张师父指了指椅子。

林逸半信半疑地坐下，张师父开始娓娓道来：

"修仙，就是通过特殊的方法，吸收天地间的灵气，强化自身，最终达到超凡脱俗的境界。修仙者可以延年益寿，拥有常人难以想象的力量。"

"但是，"张师父话锋一转，"修仙并非易事。首先，需要有修仙的资质，也就是能够感知和吸收灵气的能力。其次，需要正确的修炼方法，否则轻则修为停滞，重则走火入魔，性命不保。"

林逸听得入神，忍不住问道："那我现在是什么境界？"

"你现在刚刚踏入修仙的门槛，按照修仙界的划分，属于练气期初期。"张师父解释道，"修仙境界从低到高分为：练气、筑基、金丹、元婴、化神等。每个大境界又分为初期、中期、后期和大圆满四个小境界。"

"练气期主要是感知灵气，将灵气引入体内，强化身体。筑基期则是在体内建立灵气循环系统，为后续修炼打下基础。"

林逸点点头，又问："那我应该怎么修炼？"

张师父伸出手，一道柔和的光芒从他手中发出，笼罩了林逸的全身。林逸感到一股温暖的力量在体内流淌，原本混乱的灵气开始变得有序。

"这是正确的灵气运行路线。"张师父说道，"你要记住，修炼时要心静如水，按照这个路线引导灵气在体内循环。切记不可急躁，欲速则不达。"

林逸闭上眼睛，仔细感受着体内灵气的流动。在张师父的指导下，他很快掌握了正确的修炼方法。

"很好，你的悟性不错。"张师父满意地点头，"不过，现在的世界已经不是我那个时代了。灵气稀薄，修仙者稀少，你在修炼的同时，也要学会隐藏自己的实力，不要在普通人面前暴露修仙者的身份。"

"为什么？"林逸不解。

"因为普通人无法理解修仙者的存在，如果被发现，可能会引来不必要的麻烦。而且，现在的修仙界鱼龙混杂，有正道修士，也有邪修。你实力尚弱，过早暴露只会给自己招来危险。"

张师父的话让林逸意识到，自己踏上的这条路并不平坦。

"师父，那我以后应该怎么办？"林逸恭敬地问道。

"首先，你要坚持修炼，提升实力。其次，要学会在现代社会中生存，保持普通人的身份。最后，如果遇到其他修仙者，要谨慎判断对方的善恶，不可轻信。"

张师父说完，身影开始变得模糊："我的神识力量有限，不能长时间显现。记住我教你的修炼方法，有什么问题可以通过玉佩联系我。"

"师父！"林逸急忙叫道，但张师父已经消失不见。

房间里重新恢复了安静，仿佛刚才的一切都是幻觉。但林逸知道，这不是梦，他真的踏上了修仙之路。

他深吸一口气，按照张师父教的方法开始修炼。这一次，灵气的流动变得顺畅许多，体内的暖流也更加温和。

修炼了一个小时后，林逸睁开眼睛，感觉精神饱满，身体也比之前更加轻盈。

"看来师父说得对，正确的修炼方法确实很重要。"林逸心中暗想。

从今天开始，他的人生将彻底改变。白天，他还是那个普通的程序员；但到了夜晚，他就是一个修仙者，在这条神秘而危险的道路上不断前行。

林逸看了看时间，已经是深夜了。他关掉电脑，准备休息。明天还要上班，他必须保持普通人的生活节奏。

但在睡前，他再次摸了摸胸前的玉佩，心中充满了对未来的期待和忐忑。

修仙之路，从此开始...`
};

const generationSettings = {
  style: "现代都市",
  tone: "轻松幽默",
  perspective: "第三人称",
  wordCount: 3000,
  pacing: "中等",
  conflict: "中等",
  description: "详细",
  dialogue: "适中"
};

export default function ChaptersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="章节生成" 
        description="AI智能生成小说章节内容"
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧控制面板 */}
        <div className="w-80 border-r border-gray-200 p-4 overflow-auto">
          {/* 当前章节信息 */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">当前章节</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{currentChapter.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{currentChapter.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">生成进度</span>
                  <span className="text-gray-900">{currentChapter.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${currentChapter.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">当前字数</span>
                  <div className="font-medium">{currentChapter.wordCount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">目标字数</span>
                  <div className="font-medium">{currentChapter.targetWordCount.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">预计剩余 {currentChapter.estimatedTime}</span>
              </div>

              <div className="flex space-x-2">
                {currentChapter.status === "生成中" ? (
                  <Button size="sm" className="flex-1">
                    <PauseIcon className="h-4 w-4 mr-1" />
                    暂停
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1">
                    <PlayIcon className="h-4 w-4 mr-1" />
                    继续
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 生成设置 */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                生成设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  写作风格
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="现代都市">现代都市</option>
                  <option value="古代言情">古代言情</option>
                  <option value="科幻未来">科幻未来</option>
                  <option value="奇幻冒险">奇幻冒险</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  语调风格
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="轻松幽默">轻松幽默</option>
                  <option value="严肃正经">严肃正经</option>
                  <option value="悬疑紧张">悬疑紧张</option>
                  <option value="浪漫温馨">浪漫温馨</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  叙述视角
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="第三人称">第三人称</option>
                  <option value="第一人称">第一人称</option>
                  <option value="全知视角">全知视角</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  目标字数
                </label>
                <Input 
                  type="number" 
                  value={generationSettings.wordCount}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  节奏控制
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="快节奏">快节奏</option>
                  <option value="中等">中等</option>
                  <option value="慢节奏">慢节奏</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  冲突强度
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="高强度">高强度</option>
                  <option value="中等">中等</option>
                  <option value="低强度">低强度</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  描述详细度
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="详细">详细</option>
                  <option value="适中">适中</option>
                  <option value="简洁">简洁</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  对话比例
                </label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value="较多">较多</option>
                  <option value="适中">适中</option>
                  <option value="较少">较少</option>
                </select>
              </div>

              <Button size="sm" className="w-full">
                <SparklesIcon className="h-4 w-4 mr-2" />
                应用设置并重新生成
              </Button>
            </CardContent>
          </Card>

          {/* 章节导航 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">章节导航</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    第1章：意外的传承
                  </span>
                  <span className="text-green-600">3.0k</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    第2章：初试身手
                  </span>
                  <span className="text-green-600">3.2k</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm border-2 border-blue-200">
                  <span className="flex items-center">
                    <SparklesIcon className="h-4 w-4 text-blue-600 mr-2" />
                    第3章：神秘师父
                  </span>
                  <span className="text-blue-600">1.9k</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    第4章：同门师兄
                  </span>
                  <span className="text-gray-400">待生成</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    第5章：第一次危机
                  </span>
                  <span className="text-gray-400">待生成</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* 工具栏 */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">{currentChapter.title}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentChapter.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  预览模式
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  导出章节
                </Button>
                <Button size="sm">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  确认完成
                </Button>
              </div>
            </div>
          </div>

          {/* 内容编辑区 */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="prose prose-lg max-w-none">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentChapter.title}</h1>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {currentChapter.content}
                  </div>
                  
                  {/* 生成中的提示 */}
                  {currentChapter.status === "生成中" && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <SparklesIcon className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                        <span className="text-blue-800 font-medium">AI正在生成内容...</span>
                      </div>
                      <div className="mt-2 text-sm text-blue-600">
                        已生成 {currentChapter.wordCount} 字，目标 {currentChapter.targetWordCount} 字
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 底部状态栏 */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>字数：{currentChapter.wordCount.toLocaleString()}</span>
                <span>段落：23</span>
                <span>预计阅读时间：8分钟</span>
              </div>
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                <span>建议增加更多对话内容</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}