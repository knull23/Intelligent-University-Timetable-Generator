'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Instructors', href: '/dashboard/instructors', icon: UserGroupIcon },
  { name: 'Rooms', href: '/dashboard/rooms', icon: BuildingOfficeIcon },
  { name: 'Meeting Times', href: '/dashboard/meeting-times', icon: ClockIcon },
  { name: 'Departments', href: '/dashboard/departments', icon: AcademicCapIcon },
  { name: 'Courses', href: '/dashboard/courses', icon: BookOpenIcon },
  { name: 'Sections', href: '/dashboard/sections', icon: UserGroupIcon },
  { name: 'Timetables', href: '/dashboard/timetables', icon: CalendarIcon },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-gray-900" />
            <span className="ml-2 text-xl font-bold text-gray-900">Scheduler</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''} ${
                collapsed ? 'justify-center px-2' : ''
              }`}
              title={collapsed ? item.name : ''}
            >
              <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.first_name?.[0] || user.username[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.first_name || user.username}
              </p>
              <p className="text-xs text-gray-500">
                {user.is_staff ? 'Administrator' : 'User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}