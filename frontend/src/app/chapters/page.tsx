"use client";

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
import { useState, useEffect } from "react";
import { NovelAPI, Chapter, GenerateChapterRequest, PolishChapterRequest, Project } from "@/lib/api";

export default function ChaptersPage() {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("1");
  const [chapterIndex, setChapterIndex] = useState<number>(3);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showPolishForm, setShowPolishForm] = useState(false);

  // 模拟章节数据作为后备
  const mockChapter: Chapter = {
    id: "3",
    projectId: "1",
    index: 3,
    title: "第3章：神秘师父",
    summary: "张师父出现，指导林逸正确的修炼方法，揭示修仙世界的秘密。",
    rawContent: `林逸回到家中，心情久久不能平静。刚才在路上发生的事情，让他意识到自己获得的力量远比想象中更加神奇。

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

修仙之路，从此开始...`,
    wordCount: 1950,
    status: "draft",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T14:20:00Z"
  };

  // 加载章节
  const loadChapter = async (projectId: string, chapterIndex: number) => {
    try {
      setLoading(true);
      // 这里应该调用API获取章节
      // const response = await NovelAPI.getChapter(projectId, chapterIndex);
      // setChapter(response);
      
      // 暂时使用模拟数据
      setChapter(mockChapter);
    } catch (error) {
      console.error('加载章节失败:', error);
      setChapter(mockChapter); // 使用模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 生成章节
  const handleGenerateChapter = async () => {
    try {
      setGenerating(true);
      const request: GenerateChapterRequest = {
        projectId: selectedProject,
        chapterIndex: chapterIndex,
        chapterOutline: {
          index: chapterIndex,
          title: `第${chapterIndex}章`,
          summary: "章节摘要",
          goal: "章节目标",
          twistHint: "转折提示",
          importantItems: []
        },
        generationContext: {
          previousSummary: "前文摘要",
          characters: [],
          timeline: [],
          props: [],
          styleExamples: []
        }
      };

      const response = await NovelAPI.generateChapter(request);
      setChapter(response.chapter);
      setShowGenerateForm(false);
    } catch (error) {
      console.error('生成章节失败:', error);
      alert('生成章节失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 润色章节
  const handlePolishChapter = async () => {
    if (!chapter) return;

    try {
      setPolishing(true);
      const request: PolishChapterRequest = {
        projectId: selectedProject,
        chapterId: chapter.id,
        requirements: "语言表达优化、情节连贯性、人物刻画深度"
      };

      const response = await NovelAPI.polishChapter(request);
      setChapter(response.chapter);
      setShowPolishForm(false);
    } catch (error) {
      console.error('润色章节失败:', error);
      alert('润色章节失败，请重试');
    } finally {
      setPolishing(false);
    }
  };

  useEffect(() => {
    loadChapter(selectedProject, chapterIndex);
  }, [selectedProject, chapterIndex]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title="章节写作" 
          description="AI辅助章节生成与编辑"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col h-full">
        <Header 
          title="章节写作" 
          description="AI辅助章节生成与编辑"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无章节数据</p>
            <Button onClick={() => setShowGenerateForm(true)}>
              <SparklesIcon className="h-4 w-4 mr-2" />
              生成章节
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="章节写作" 
        description="AI辅助章节生成与编辑"
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 章节信息栏 */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{chapter.title}</h1>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 mr-1" />
                      {chapter.wordCount} 字
                    </span>
                    <span className="flex items-center">
                       <ClockIcon className="h-4 w-4 mr-1" />
                       {chapter.updatedAt ? new Date(chapter.updatedAt).toLocaleDateString() : '未知'}
                     </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      chapter.status === 'published' ? 'bg-green-100 text-green-800' :
                      chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {chapter.status === 'published' ? '已发布' : 
                       chapter.status === 'draft' ? '草稿' : '未知'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    预览
                  </Button>
                  <Button onClick={() => setShowPolishForm(true)} size="sm">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    AI润色
                  </Button>
                </div>
              </div>
            </div>

            {/* 章节内容 */}
            <div className="flex-1 overflow-auto p-6">
              <Card>
                <CardContent className="p-6">
                   <div className="prose max-w-none">
                     <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                       {chapter.rawContent}
                     </div>
                   </div>
                 </CardContent>
              </Card>
            </div>
          </div>

          {/* 右侧工具栏 */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-auto">
            <div className="p-4 space-y-4">
              {/* 生成设置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">生成设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      章节序号
                    </label>
                    <Input
                      type="number"
                      value={chapterIndex}
                      onChange={(e) => setChapterIndex(parseInt(e.target.value) || 1)}
                      min="1"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      写作风格
                    </label>
                    <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                      <option value="现代都市">现代都市</option>
                      <option value="古代仙侠">古代仙侠</option>
                      <option value="科幻未来">科幻未来</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      目标字数
                    </label>
                    <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                      <option value="2000">2000字</option>
                      <option value="3000">3000字</option>
                      <option value="4000">4000字</option>
                      <option value="5000">5000字</option>
                    </select>
                  </div>
                  <Button 
                    onClick={() => setShowGenerateForm(true)} 
                    className="w-full" 
                    size="sm"
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        重新生成
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 润色工具 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">润色工具</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      语言优化
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      情节完善
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      人物刻画
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      对话润色
                    </Button>
                  </div>
                  <Button 
                    onClick={handlePolishChapter} 
                    className="w-full" 
                    size="sm"
                    disabled={polishing}
                  >
                    {polishing ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        润色中...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        全面润色
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 章节统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">章节统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">总字数</span>
                    <span className="font-medium">{chapter.wordCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-gray-600">段落数</span>
                     <span className="font-medium">{chapter.rawContent.split('\n\n').length}</span>
                   </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">预计阅读</span>
                    <span className="font-medium">{Math.ceil(chapter.wordCount / 300)}分钟</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 生成章节表单 */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>生成章节</CardTitle>
              <CardDescription>设置生成参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  章节序号
                </label>
                <Input
                  type="number"
                  value={chapterIndex}
                  onChange={(e) => setChapterIndex(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleGenerateChapter} className="flex-1" disabled={generating}>
                  {generating ? '生成中...' : '生成'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerateForm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 润色章节表单 */}
      {showPolishForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>润色章节</CardTitle>
              <CardDescription>选择润色重点</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  语言表达优化
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  情节连贯性
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  人物刻画深度
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  对话自然度
                </label>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handlePolishChapter} className="flex-1" disabled={polishing}>
                  {polishing ? '润色中...' : '开始润色'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPolishForm(false)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}