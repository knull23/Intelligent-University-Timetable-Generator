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
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

interface Course {
  id?: number
  course_id: string
  course_name: string
  course_type: string
  credits: number
  max_students: number
  duration: number
  sections: number[]
  section_names?: string[]
  classes_per_week: number
  instructors: number[]
  instructor_names?: string[]
}

interface Section {
  id: number
  section_name: string
  year: number
  semester: number
  department_name: string
}

interface Instructor {
  id: number
  name: string
  instructor_id: string
}

const courseTypes = [
  { value: 'Theory', label: 'Theory' },
  { value: 'Lab', label: 'Laboratory' },
  { value: 'Practical', label: 'Practical' },
]

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Course>({
    defaultValues: {
      course_type: 'Theory',
      credits: 3,
      max_students: 60,
      duration: 1,
      classes_per_week: 3,
      instructors: [],
      sections: []
    }
  })

  const courseType = watch('course_type')

  useEffect(() => {
    Promise.all([fetchCourses(), fetchSections(), fetchInstructors()])
  }, [])

  useEffect(() => {
    // Auto-adjust duration based on course type
    if (courseType === 'Lab') {
      setValue('duration', 2)
    } else {
      setValue('duration', 1)
    }
  }, [courseType, setValue])

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/')
      setCourses(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await api.get('/sections/')
      setSections(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to fetch sections')
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

  const onSubmit = async (data: Course) => {
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}/`, data)
        toast.success('Course updated successfully')
      } else {
        await api.post('/courses/', data)
        toast.success('Course created successfully')
      }
      
      fetchCourses()
      closeModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const deleteCourse = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      await api.delete(`/courses/${id}/`)
      toast.success('Course deleted successfully')
      fetchCourses()
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  const openModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      Object.keys(course).forEach((key) => {
        setValue(key as keyof Course, course[key as keyof Course])
      })
    } else {
      setEditingCourse(null)
      reset({
        course_type: 'Theory',
        credits: 3,
        max_students: 60,
        duration: 1,
        classes_per_week: 3,
        instructors: [],
        sections: []
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    reset()
  }

  const getCourseTypeColor = (type: string) => {
    switch (type) {
      case 'Lab':
        return 'bg-green-100 text-green-800'
      case 'Theory':
        return 'bg-blue-100 text-blue-800'
      case 'Practical':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Manage academic courses and subjects</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first course to start building the curriculum
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 mr-3">
                    {course.course_type === 'Lab' ? (
                      <AcademicCapIcon className="h-8 w-8 text-green-600" />
                    ) : (
                      <BookOpenIcon className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {course.course_name}
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {course.course_id}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => openModal(course)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id!)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCourseTypeColor(course.course_type)}`}>
                    {course.course_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Credits:</span>
                  <span className="font-medium">{course.credits}</span>
                </div>
                {course.section_names && course.section_names.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sections:</span>
                    <span className="font-medium text-xs">{course.section_names.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Students:</span>
                  <span className="font-medium">{course.max_students}</span>
                </div>
              </div>

              {course.instructor_names && course.instructor_names.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="text-gray-500">Instructors:</span>
                    <div className="mt-1 text-xs">
                      {course.instructor_names.map((name, index) => (
                        <div key={index} className="text-gray-900">• {name}</div>
                      ))}
                    </div>
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
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course ID
              </label>
              <input
                {...register('course_id', { required: 'Course ID is required' })}
                className="input-field"
                placeholder="e.g., CS101"
              />
              {errors.course_id && (
                <p className="text-red-600 text-sm mt-1">{errors.course_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Type
              </label>
              <select
                {...register('course_type', { required: 'Course type is required' })}
                className="input-field"
              >
                {courseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              {...register('course_name', { required: 'Course name is required' })}
              className="input-field"
              placeholder="e.g., Introduction to Programming"
            />
            {errors.course_name && (
              <p className="text-red-600 text-sm mt-1">{errors.course_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sections
            </label>
            <select
              {...register('sections')}
              multiple
              className="input-field"
              size={4}
            >
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.section_name} (Y{section.year} S{section.semester} - {section.department_name})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple sections
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits
              </label>
              <input
                {...register('credits', { 
                  required: 'Credits is required',
                  min: { value: 1, message: 'Minimum 1 credit' }
                })}
                type="number"
                className="input-field"
                placeholder="3"
              />
              {errors.credits && (
                <p className="text-red-600 text-sm mt-1">{errors.credits.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hrs)
              </label>
              <input
                {...register('duration', { 
                  required: 'Duration is required',
                  min: { value: 1, message: 'Minimum 1 hour' }
                })}
                type="number"
                className="input-field"
                placeholder={courseType === 'Lab' ? '2' : '1'}
                readOnly={courseType === 'Lab'}
              />
              {courseType === 'Lab' && (
                <p className="text-xs text-gray-500 mt-1">Lab sessions are 2 hours</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes/Week
              </label>
              <input
                {...register('classes_per_week', { 
                  required: 'Classes per week is required',
                  min: { value: 1, message: 'Minimum 1 class' }
                })}
                type="number"
                className="input-field"
                placeholder="3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Students
            </label>
            <input
              {...register('max_students', { 
                required: 'Max students is required',
                min: { value: 1, message: 'Minimum 1 student' }
              })}
              type="number"
              className="input-field"
              placeholder="60"
            />
            {errors.max_students && (
              <p className="text-red-600 text-sm mt-1">{errors.max_students.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructors
            </label>
            <select
              {...register('instructors')}
              multiple
              className="input-field"
              size={4}
            >
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} ({instructor.instructor_id})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple instructors
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingCourse ? 'Update' : 'Create'} Course
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