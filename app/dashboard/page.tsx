'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import StatsCard from '@/components/StatsCard'
import { 
  UserGroupIcon, 
  HomeIcon, 
  BookOpenIcon,
  BuildingOfficeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  instructors: number
  rooms: number
  courses: number
  departments: number
  sections: number
  timetables: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    instructors: 0,
    rooms: 0,
    courses: 0,
    departments: 0,
    sections: 0,
    timetables: 0
  })
  const [recentTimetables, setRecentTimetables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const safeFetch = async (endpoint: string) => {
    try {
      const res = await api.get(endpoint)
      return res.data
    } catch (err) {
      console.warn(`⚠️ Failed to fetch ${endpoint}:`, err)
      return []
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [
        instructorsData,
        roomsData,
        coursesData,
        departmentsData,
        sectionsData,
        timetablesData
      ] = await Promise.all([
        safeFetch('/instructors/'),
        safeFetch('/rooms/'),
        safeFetch('/courses/'),
        safeFetch('/departments/'),
        safeFetch('/sections/'),
        safeFetch('/timetables/')
      ])

      setStats({
        instructors: instructorsData.count || instructorsData.length || 0,
        rooms: roomsData.count || roomsData.length || 0,
        courses: coursesData.count || coursesData.length || 0,
        departments: departmentsData.count || departmentsData.length || 0,
        sections: sectionsData.count || sectionsData.length || 0,
        timetables: timetablesData.count || timetablesData.length || 0
      })

      const recent = timetablesData.results || timetablesData || []
      setRecentTimetables(recent.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your timetable scheduling system</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Instructors" value={stats.instructors} icon={UserGroupIcon} color="blue" />
        <StatsCard title="Rooms" value={stats.rooms} icon={HomeIcon} color="green" />
        <StatsCard title="Courses" value={stats.courses} icon={BookOpenIcon} color="purple" />
        <StatsCard title="Departments" value={stats.departments} icon={BuildingOfficeIcon} color="yellow" />
        <StatsCard title="Sections" value={stats.sections} icon={UserGroupIcon} color="indigo" />
        <StatsCard title="Timetables" value={stats.timetables} icon={CalendarIcon} color="red" />
      </div>

      {/* Recent Timetables + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Timetables */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Timetables</h3>
          {recentTimetables.length > 0 ? (
            <div className="space-y-3">
              {recentTimetables.map((timetable: any) => (
                <div key={timetable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{timetable.name || `Timetable #${timetable.id}`}</p>
                    {timetable.fitness && (
                      <p className="text-sm text-gray-500">Fitness: {timetable.fitness.toFixed(1)}%</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    timetable.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {timetable.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No timetables created yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/dashboard/timetables/generate" className="btn-primary w-full text-center block">
              Generate New Timetable
            </a>
            <a href="/dashboard/instructors" className="btn-secondary w-full text-center block">
              Manage Instructors
            </a>
            <a href="/dashboard/courses" className="btn-secondary w-full text-center block">
              Manage Courses
            </a>
            <a href="/dashboard/timetables" className="btn-secondary w-full text-center block">
              View All Timetables
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
