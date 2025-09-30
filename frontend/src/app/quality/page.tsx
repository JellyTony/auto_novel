'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { 
  NovelAPI, 
  Project, 
  CheckQualityRequest, 
  CheckQualityResponse,
  CheckConsistencyRequest,
  CheckConsistencyResponse,
  BatchCheckQualityRequest,
  BatchCheckQualityResponse,
  QualityIssue
} from '@/lib/api';
import { useApiList, useApiMutation } from '@/lib/hooks/useApi';

// 严重程度颜色映射
const severityColors = {
  "high": "bg-red-100 text-red-800",
  "medium": "bg-yellow-100 text-yellow-800",
  "low": "bg-blue-100 text-blue-800"
};

// 状态颜色映射
const statusColors = {
  "excellent": "bg-green-100 text-green-800",
  "good": "bg-blue-100 text-blue-800",
  "average": "bg-yellow-100 text-yellow-800",
  "poor": "bg-red-100 text-red-800"
};

// 优先级颜色映射
const priorityColors = {
  "high": "bg-red-100 text-red-800",
  "medium": "bg-yellow-100 text-yellow-800",
  "low": "bg-green-100 text-green-800"
};

export default function QualityPage() {
  // 项目列表
  const { 
    data: projects = [], 
    loading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects 
  } = useApiList<Project>(() => NovelAPI.listProjects({ page: 1, pageSize: 100 }), {
    transform: (response) => response.projects || []
  });

  // 状态管理
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [qualityReport, setQualityReport] = useState<CheckQualityResponse | null>(null);
  const [consistencyReport, setConsistencyReport] = useState<CheckConsistencyResponse | null>(null);
  const [batchReport, setBatchReport] = useState<BatchCheckQualityResponse | null>(null);

  // 质量检查
  const { mutate: checkQuality, loading: qualityLoading } = useApiMutation(
    NovelAPI.checkQuality,
    {
      onSuccess: (data: CheckQualityResponse) => {
        setQualityReport(data);
      }
    }
  );

  // 一致性检查
  const { mutate: checkConsistency, loading: consistencyLoading } = useApiMutation(
    NovelAPI.checkConsistency,
    {
      onSuccess: (data: CheckConsistencyResponse) => {
        setConsistencyReport(data);
      }
    }
  );

  // 批量质量检查
  const { mutate: batchCheckQuality, loading: batchLoading } = useApiMutation(
    NovelAPI.batchCheckQuality,
    {
      onSuccess: (data: BatchCheckQualityResponse) => {
        setBatchReport(data);
      }
    }
  );

  // 处理质量检查
  const handleQualityCheck = () => {
    if (!selectedProjectId || !selectedChapterId) {
      alert('请先选择项目和章节');
      return;
    }
    
    const request: CheckQualityRequest = {
      project_id: selectedProjectId,
      chapter_id: selectedChapterId
    };
    
    checkQuality(request);
  };

  // 处理一致性检查
  const handleConsistencyCheck = () => {
    if (!selectedProjectId) {
      alert('请先选择项目');
      return;
    }
    
    const request: CheckConsistencyRequest = {
      project_id: selectedProjectId
    };
    
    checkConsistency(request);
  };

  // 处理批量检查
  const handleBatchCheck = () => {
    if (!selectedProjectId) {
      alert('请先选择项目');
      return;
    }
    
    const request: BatchCheckQualityRequest = {
      project_id: selectedProjectId,
      chapter_ids: [] // 空数组表示检查所有章节
    };
    
    batchCheckQuality(request);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">质量控制</h1>
            <p className="text-gray-600 mt-2">AI智能检查和优化小说质量</p>
          </div>
        </div>

        {/* 项目选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择项目</CardTitle>
            <CardDescription>选择要进行质量检测的小说项目</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">加载项目中...</p>
              </div>
            ) : projectsError ? (
              <div className="text-center py-4">
                <p className="text-red-600">加载项目失败: {projectsError}</p>
                <Button variant="outline" onClick={refetchProjects} className="mt-2">
                  重试
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProjectId === project.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{project.genre}</span>
                        <span>{project.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作 */}
        {selectedProjectId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">章节质量检查</CardTitle>
                <CardDescription className="mb-4">
                  检查单个章节的语言质量和内容问题
                </CardDescription>
                <div className="mb-4">
                  <Input
                    placeholder="输入章节ID"
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleQualityCheck}
                  disabled={qualityLoading || !selectedChapterId}
                >
                  {qualityLoading ? '检查中...' : '开始检查'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">一致性检查</CardTitle>
                <CardDescription className="mb-4">
                  检查情节、角色、世界观的一致性
                </CardDescription>
                <Button 
                  className="w-full" 
                  onClick={handleConsistencyCheck}
                  disabled={consistencyLoading}
                >
                  {consistencyLoading ? '检查中...' : '开始检查'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <AdjustmentsHorizontalIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg mb-2">批量质量检查</CardTitle>
                <CardDescription className="mb-4">
                  批量检查项目中所有章节的质量
                </CardDescription>
                <Button 
                  className="w-full" 
                  onClick={handleBatchCheck}
                  disabled={batchLoading}
                >
                  {batchLoading ? '检查中...' : '批量检查'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 质量检查报告 */}
        {qualityReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
                章节质量检查报告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{qualityReport.overall_score}</div>
                  <div className="text-sm text-gray-500">综合评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{qualityReport.issues?.length || 0}</div>
                  <div className="text-sm text-gray-500">发现问题</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{qualityReport.recommendations?.length || 0}</div>
                  <div className="text-sm text-gray-500">改进建议</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                    {qualityReport.overall_score >= 90 ? '优秀' : 
                     qualityReport.overall_score >= 80 ? '良好' : 
                     qualityReport.overall_score >= 70 ? '一般' : '较差'}
                  </div>
                  <div className="text-sm text-gray-500">质量等级</div>
                </div>
              </div>

              {/* 问题列表 */}
              {qualityReport.issues && qualityReport.issues.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">发现的问题</h4>
                  <div className="space-y-2">
                    {qualityReport.issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{issue.type}</span>
                          <p className="text-sm text-gray-600">{issue.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${severityColors[issue.severity as keyof typeof severityColors]}`}>
                          {issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '中等' : '轻微'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 改进建议 */}
              {qualityReport.recommendations && qualityReport.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">改进建议</h4>
                  <div className="space-y-2">
                    {qualityReport.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 一致性检查报告 */}
        {consistencyReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                一致性检查报告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{consistencyReport.overall_score}</div>
                  <div className="text-sm text-gray-500">一致性评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{consistencyReport.consistency_issues?.length || 0}</div>
                  <div className="text-sm text-gray-500">一致性问题</div>
                </div>
              </div>

              {/* 总结 */}
              {consistencyReport.summary && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">检查总结</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-gray-700">{consistencyReport.summary}</p>
                  </div>
                </div>
              )}

              {/* 一致性问题 */}
              {consistencyReport.consistency_issues && consistencyReport.consistency_issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">一致性问题</h4>
                  <div className="space-y-2">
                    {consistencyReport.consistency_issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{issue.type}</span>
                          <p className="text-sm text-gray-600">{issue.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${severityColors[issue.severity as keyof typeof severityColors]}`}>
                          {issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '中等' : '轻微'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 批量检查报告 */}
        {batchReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-green-600" />
                批量质量检查报告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{batchReport.overall_score}</div>
                  <div className="text-sm text-gray-500">整体评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{batchReport.total_chapters}</div>
                  <div className="text-sm text-gray-500">检查章节数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{batchReport.total_issues}</div>
                  <div className="text-sm text-gray-500">总问题数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{batchReport.recommendations?.length || 0}</div>
                  <div className="text-sm text-gray-500">改进建议</div>
                </div>
              </div>

              {/* 问题分类统计 */}
              {batchReport.issues_by_type && Object.keys(batchReport.issues_by_type).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">问题分类统计</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(batchReport.issues_by_type).map(([type, count]) => (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 改进建议 */}
              {batchReport.recommendations && batchReport.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">整体改进建议</h4>
                  <div className="space-y-2">
                    {batchReport.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 空状态 */}
        {!selectedProjectId && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">开始质量检测</h3>
            <p className="text-gray-600">请先选择一个项目，然后选择相应的检测功能</p>
          </div>
        )}
      </div>
    </div>
  );
}