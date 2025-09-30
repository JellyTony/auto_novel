'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  FolderIcon,
  GlobeAltIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '项目管理', href: '/projects', icon: FolderIcon },
  { name: '世界观设定', href: '/worldview', icon: GlobeAltIcon },
  { name: '角色管理', href: '/characters', icon: UserGroupIcon },
  { name: '大纲编辑', href: '/outline', icon: DocumentTextIcon },
  { name: '章节生成', href: '/chapters', icon: PencilIcon },
  { name: '质量控制', href: '/quality', icon: CheckCircleIcon },
  { name: '导出管理', href: '/export', icon: ArrowDownTrayIcon },
  { name: '用户中心', href: '/profile', icon: UserIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">AI小说生成器</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">U</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">用户</p>
            <p className="text-xs text-gray-500">普通用户</p>
          </div>
        </div>
      </div>
    </div>
  )
}