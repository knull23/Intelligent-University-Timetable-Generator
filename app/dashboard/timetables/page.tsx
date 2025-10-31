'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { 
  PlusIcon, 
  EyeIcon, 
  TrashIcon, 
  CheckCircleIcon,
  DocumentArrowDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface Timetable {
  id: number
  name: string
  department_name: string
  year: number
  semester: number
  fitness: number
  is_active: boolean
  created_by_username: string
  created_at: string
}

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimetables()
  }, [])

  const fetchTimetables = async () => {
    try {
      const response = await api.get('/timetables/')
      setTimetables(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to fetch timetables')
    } finally {
      setLoading(false)
    }
  }

  const deleteTimetable = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return

    try {
      await api.delete(`/timetables/${id}/`)
      toast.success('Timetable deleted successfully')
      fetchTimetables()
    } catch (error) {
      toast.error('Failed to delete timetable')
    }
  }

  const activateTimetable = async (id: number) => {
    try {
      await api.post(`/timetables/${id}/activate/`)
      toast.success('Timetable activated successfully')
      fetchTimetables()
    } catch (error) {
      toast.error('Failed to activate timetable')
    }
  }

  const exportPDF = async (id: number, name: string) => {
    try {
      const response = await api.get(`/timetables/${id}/export_pdf/`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  const exportExcel = async (id: number, name: string) => {
    try {
      const response = await api.get(`/timetables/${id}/export_excel/`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Excel exported successfully')
    } catch (error) {
      toast.error('Failed to export Excel')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetables</h1>
          <p className="text-gray-600">Manage generated timetables</p>
        </div>
        <Link
          href="/dashboard/timetables/generate"
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Generate Timetable
        </Link>
      </div>

      {timetables.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No timetables yet</h3>
          <p className="text-gray-600 mb-6">
            Generate your first timetable to get started with scheduling
          </p>
          <Link
            href="/dashboard/timetables/generate"
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Generate First Timetable
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timetables.map((timetable) => (
            <div key={timetable.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {timetable.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {timetable.department_name} • Year {timetable.year} • Semester {timetable.semester}
                  </p>
                </div>
                {timetable.is_active && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Fitness Score:</span>
                  <span className="font-medium">{timetable.fitness?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      timetable.fitness >= 80 ? 'bg-green-500' :
                      timetable.fitness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(timetable.fitness, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Created by {timetable.created_by_username} on{' '}
                {new Date(timetable.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/timetables/${timetable.id}`}
                  className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                >
                  <EyeIcon className="h-3 w-3" />
                  View
                </Link>
                
                {!timetable.is_active && (
                  <button
                    onClick={() => activateTimetable(timetable.id)}
                    className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <CheckCircleIcon className="h-3 w-3" />
                    Activate
                  </button>
                )}
                
                <button
                  onClick={() => exportPDF(timetable.id, timetable.name)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="Export PDF"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => deleteTimetable(timetable.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}