"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UserIcon,
  CogIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

// 模拟用户数据
const userData = {
  id: "user_123",
  username: "创作者小明",
  email: "xiaoming@example.com",
  phone: "+86 138****8888",
  avatar: "/api/placeholder/100/100",
  joinDate: "2024-01-15",
  lastLogin: "2024-09-29 16:30",
  subscription: {
    plan: "专业版",
    status: "active",
    expiryDate: "2024-12-31",
    features: ["无限项目", "高级AI模型", "优先客服", "导出功能"]
  },
  stats: {
    totalProjects: 12,
    totalWords: 156780,
    totalChapters: 89,
    publishedNovels: 3
  },
  preferences: {
    language: "zh-CN",
    theme: "light",
    notifications: {
      email: true,
      push: false,
      marketing: true
    },
    privacy: {
      profilePublic: false,
      showStats: true,
      allowIndexing: false
    }
  }
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: userData.username,
    email: userData.email,
    phone: userData.phone
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // 保存用户信息
    console.log("Saving user data:", formData);
    setIsEditing(false);
  };

  const tabs = [
    { id: "profile", name: "个人信息", icon: UserIcon },
    { id: "subscription", name: "订阅管理", icon: CreditCardIcon },
    { id: "security", name: "安全设置", icon: ShieldCheckIcon },
    { id: "notifications", name: "通知设置", icon: BellIcon },
    { id: "privacy", name: "隐私设置", icon: CogIcon }
  ];

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="个人中心" 
        description="管理您的账户信息和偏好设置"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  {/* 用户头像和基本信息 */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <img
                        src={userData.avatar}
                        alt="用户头像"
                        className="w-20 h-20 rounded-full mx-auto mb-4"
                      />
                      <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700">
                        <PencilIcon className="h-3 w-3" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg">{userData.username}</h3>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                    <div className="flex items-center justify-center mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        userData.subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <StarIcon className="h-3 w-3 mr-1" />
                        {userData.subscription.plan}
                      </span>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">创作项目</span>
                      <span className="font-medium">{userData.stats.totalProjects}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">总字数</span>
                      <span className="font-medium">{userData.stats.totalWords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">章节数</span>
                      <span className="font-medium">{userData.stats.totalChapters}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">已发布</span>
                      <span className="font-medium">{userData.stats.publishedNovels}</span>
                    </div>
                  </div>

                  {/* 导航标签 */}
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {tab.name}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* 主内容区 */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>个人信息</CardTitle>
                        <CardDescription>管理您的基本账户信息</CardDescription>
                      </div>
                      <Button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        variant={isEditing ? "default" : "outline"}
                      >
                        {isEditing ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            保存
                          </>
                        ) : (
                          <>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            编辑
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">用户名</label>
                        <Input
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">邮箱地址</label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">手机号码</label>
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">注册时间</label>
                        <Input
                          value={userData.joinDate}
                          disabled
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button onClick={handleSave}>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          保存更改
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          取消
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "subscription" && (
                <Card>
                  <CardHeader>
                    <CardTitle>订阅管理</CardTitle>
                    <CardDescription>管理您的订阅计划和付费功能</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 当前订阅状态 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">
                            {userData.subscription.plan}
                          </h3>
                          <p className="text-blue-700">
                            有效期至：{userData.subscription.expiryDate}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          userData.subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.subscription.status === 'active' ? '已激活' : '已过期'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {userData.subscription.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-blue-700">
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex space-x-3">
                        <Button>续费订阅</Button>
                        <Button variant="outline">升级计划</Button>
                        <Button variant="outline">查看发票</Button>
                      </div>
                    </div>

                    {/* 订阅历史 */}
                    <div>
                      <h4 className="font-medium mb-3">订阅历史</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">专业版 - 年付</p>
                            <p className="text-sm text-gray-500">2024-01-15 至 2024-12-31</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">¥299.00</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              已支付
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle>安全设置</CardTitle>
                    <CardDescription>管理您的账户安全和登录方式</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 密码设置 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <KeyIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-medium">登录密码</h4>
                          <p className="text-sm text-gray-500">上次修改：2024-08-15</p>
                        </div>
                      </div>
                      <Button variant="outline">修改密码</Button>
                    </div>

                    {/* 两步验证 */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-medium">两步验证</h4>
                          <p className="text-sm text-gray-500">为您的账户添加额外安全保护</p>
                        </div>
                      </div>
                      <Button variant="outline">启用</Button>
                    </div>

                    {/* 登录设备 */}
                    <div>
                      <h4 className="font-medium mb-3">活跃设备</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">MacBook Pro</p>
                            <p className="text-sm text-gray-500">
                              <ClockIcon className="h-3 w-3 inline mr-1" />
                              当前设备 - 最后活跃：刚刚
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            当前
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">iPhone 15</p>
                            <p className="text-sm text-gray-500">
                              <ClockIcon className="h-3 w-3 inline mr-1" />
                              最后活跃：2024-09-28 14:30
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            移除
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 危险操作 */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-red-600 mb-3">危险操作</h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-red-800">删除账户</h5>
                            <p className="text-sm text-red-600">
                              永久删除您的账户和所有数据，此操作不可恢复
                            </p>
                          </div>
                          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                            <TrashIcon className="h-4 w-4 mr-2" />
                            删除账户
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>通知设置</CardTitle>
                    <CardDescription>管理您接收通知的方式和类型</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 邮件通知 */}
                    <div>
                      <h4 className="font-medium mb-4">邮件通知</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">系统通知</p>
                            <p className="text-sm text-gray-500">账户安全、订阅状态等重要通知</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.notifications.email}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">创作提醒</p>
                            <p className="text-sm text-gray-500">章节生成完成、质量检查结果等</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">营销邮件</p>
                            <p className="text-sm text-gray-500">产品更新、创作技巧、优惠活动等</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.notifications.marketing}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 推送通知 */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">推送通知</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">浏览器推送</p>
                            <p className="text-sm text-gray-500">在浏览器中接收实时通知</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.notifications.push}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle>隐私设置</CardTitle>
                    <CardDescription>控制您的个人信息和数据使用方式</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 个人资料可见性 */}
                    <div>
                      <h4 className="font-medium mb-4">个人资料</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">公开个人资料</p>
                            <p className="text-sm text-gray-500">允许其他用户查看您的基本信息</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.privacy.profilePublic}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">显示创作统计</p>
                            <p className="text-sm text-gray-500">在个人资料中显示创作数据</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.privacy.showStats}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 数据使用 */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">数据使用</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">搜索引擎索引</p>
                            <p className="text-sm text-gray-500">允许搜索引擎索引您的公开内容</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={userData.preferences.privacy.allowIndexing}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 数据导出和删除 */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">数据管理</h4>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          下载我的数据
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50">
                          删除我的数据
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}