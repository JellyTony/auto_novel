'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { NovelAPI, type CreateProjectRequest, APIError } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectRequest>({
    title: '',
    description: '',
    genre: '',
    target_audience: '',
    tone: '',
    themes: []
  });
  const [newTheme, setNewTheme] = useState('');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('请输入项目标题');
      return;
    }
    
    if (!formData.genre) {
      toast.error('请选择小说类型');
      return;
    }
    
    if (!formData.target_audience) {
      toast.error('请选择目标读者');
      return;
    }
    
    if (!formData.tone) {
      toast.error('请选择写作风格');
      return;
    }
    
    if (formData.themes.length === 0) {
      toast.error('请至少添加一个主题标签');
      return;
    }

    try {
      setLoading(true);
      const response = await NovelAPI.createProject(formData);
      toast.success('项目创建成功！');
      router.push(`/projects/${response.project_id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof APIError) {
        toast.error(`创建项目失败: ${error.message}`);
      } else {
        toast.error('创建项目失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 添加主题标签
  const addTheme = () => {
    if (newTheme.trim() && !formData.themes.includes(newTheme.trim())) {
      setFormData(prev => ({
        ...prev,
        themes: [...prev.themes, newTheme.trim()]
      }));
      setNewTheme('');
    }
  };

  // 删除主题标签
  const removeTheme = (theme: string) => {
    setFormData(prev => ({
      ...prev,
      themes: prev.themes.filter(t => t !== theme)
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">创建新项目</h1>
          <p className="text-muted-foreground">
            填写项目基本信息，开始您的小说创作之旅
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
            <CardDescription>
              请填写小说项目的基本信息，这些信息将帮助AI更好地理解您的创作需求
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 项目标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">项目标题 *</Label>
                <Input
                  id="title"
                  placeholder="请输入小说标题"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* 项目描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  placeholder="简要描述您的小说内容、背景或创作想法"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* 小说类型 */}
              <div className="space-y-2">
                <Label htmlFor="genre">小说类型 *</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择小说类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="现代都市">现代都市</SelectItem>
                    <SelectItem value="古代言情">古代言情</SelectItem>
                    <SelectItem value="玄幻修仙">玄幻修仙</SelectItem>
                    <SelectItem value="科幻未来">科幻未来</SelectItem>
                    <SelectItem value="悬疑推理">悬疑推理</SelectItem>
                    <SelectItem value="历史军事">历史军事</SelectItem>
                    <SelectItem value="青春校园">青春校园</SelectItem>
                    <SelectItem value="商战职场">商战职场</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 目标读者 */}
              <div className="space-y-2">
                <Label htmlFor="target_audience">目标读者 *</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择目标读者群体" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="青年">青年 (18-30岁)</SelectItem>
                    <SelectItem value="中年">中年 (30-45岁)</SelectItem>
                    <SelectItem value="全年龄">全年龄</SelectItem>
                    <SelectItem value="男性向">男性向</SelectItem>
                    <SelectItem value="女性向">女性向</SelectItem>
                    <SelectItem value="学生">学生群体</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 写作风格 */}
              <div className="space-y-2">
                <Label htmlFor="tone">写作风格 *</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择写作风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="轻松">轻松幽默</SelectItem>
                    <SelectItem value="严肃">严肃深刻</SelectItem>
                    <SelectItem value="浪漫">浪漫温馨</SelectItem>
                    <SelectItem value="紧张">紧张刺激</SelectItem>
                    <SelectItem value="悬疑">悬疑神秘</SelectItem>
                    <SelectItem value="热血">热血激昂</SelectItem>
                    <SelectItem value="治愈">治愈温暖</SelectItem>
                    <SelectItem value="冷峻">冷峻现实</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 主题标签 */}
              <div className="space-y-2">
                <Label>主题标签 *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="输入主题标签"
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTheme();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTheme} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.themes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {theme}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTheme(theme)}
                      />
                    </Badge>
                  ))}
                </div>
                {formData.themes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    请添加至少一个主题标签，如：爱情、友情、成长、冒险等
                  </p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '创建中...' : '创建项目'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}