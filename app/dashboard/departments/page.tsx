'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline'

interface Department {
  id?: number
  name: string
  code: string
  head_of_department?: number
  head_of_department_name?: string
}

interface Instructor {
  id: number
  name: string
  instructor_id: string
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Department>()

  useEffect(() => {
    Promise.all([fetchDepartments(), fetchInstructors()])
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/')
      setDepartments(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to fetch departments')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      const response = await api.get('/instructors/')
      setInstructors(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch instructors')
    }
  }

  const onSubmit = async (data: Department) => {
    try {
      // Convert empty string to null for head_of_department
      const submitData = {
        ...data,
        head_of_department: data.head_of_department || null
      }

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}/`, submitData)
        toast.success('Department updated successfully')
      } else {
        await api.post('/departments/', submitData)
        toast.success('Department created successfully')
      }
      
      fetchDepartments()
      closeModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const deleteDepartment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await api.delete(`/departments/${id}/`)
      toast.success('Department deleted successfully')
      fetchDepartments()
    } catch (error) {
      toast.error('Failed to delete department')
    }
  }

  const openModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      Object.keys(department).forEach((key) => {
        setValue(key as keyof Department, department[key as keyof Department])
      })
    } else {
      setEditingDepartment(null)
      reset()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDepartment(null)
    reset()
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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Manage academic departments</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="card p-12 text-center">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first department to start organizing courses
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div key={department.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center flex-1">
                  <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {department.code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openModal(department)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteDepartment(department.id!)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {department.head_of_department_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="text-gray-500">Head:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {department.head_of_department_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name
            </label>
            <input
              {...register('name', { required: 'Department name is required' })}
              className="input-field"
              placeholder="e.g., Computer Science"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Code
            </label>
            <input
              {...register('code', { required: 'Department code is required' })}
              className="input-field"
              placeholder="e.g., CS, EE, ME"
            />
            {errors.code && (
              <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Head of Department (Optional)
            </label>
            <select
              {...register('head_of_department')}
              className="input-field"
            >
              <option value="">Select Head of Department</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} ({instructor.instructor_id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingDepartment ? 'Update' : 'Create'} Department
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}