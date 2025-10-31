'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'
import { PlusIcon, PencilIcon, TrashIcon, HomeIcon } from '@heroicons/react/24/outline'

interface Room {
  id?: number
  room_number: string
  capacity: number
  room_type: string
  is_available: boolean
}

const roomTypes = [
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Lab', label: 'Laboratory' },
  { value: 'Hall', label: 'Hall' },
  { value: 'Seminar', label: 'Seminar Room' },
]

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Room>()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/')
      setRooms(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Room) => {
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}/`, data)
        toast.success('Room updated successfully')
      } else {
        await api.post('/rooms/', data)
        toast.success('Room created successfully')
      }

      fetchRooms()
      closeModal()
    } catch (error: any) {
      // Handle Django REST Framework validation errors
      if (error.response?.data) {
        const errors = error.response.data
        if (typeof errors === 'object') {
          // Extract first error message from each field
          const errorMessages = Object.values(errors).flat()
          toast.error(errorMessages[0] as string || 'Validation failed')
        } else {
          toast.error(errors || 'Operation failed')
        }
      } else {
        toast.error('Operation failed')
      }
    }
  }

  const deleteRoom = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    try {
      await api.delete(`/rooms/${id}/`)
      toast.success('Room deleted successfully')
      fetchRooms()
    } catch (error) {
      toast.error('Failed to delete room')
    }
  }

  const openModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      Object.keys(room).forEach((key) => {
        setValue(key as keyof Room, room[key as keyof Room])
      })
    } else {
      setEditingRoom(null)
      reset({ room_type: 'Classroom', is_available: true })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRoom(null)
    reset()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="card p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600">Manage classrooms and facilities</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <HomeIcon className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">{room.room_number}</h3>
                  <p className="text-sm text-gray-600">{room.room_type}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(room)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRoom(room.id!)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Capacity:</span>
                <span className="font-medium">{room.capacity} students</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  room.is_available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {room.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="card p-12 text-center">
          <HomeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first room to start managing facilities
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add First Room
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Number
            </label>
            <input
              {...register('room_number', { required: 'Room number is required' })}
              className="input-field"
              placeholder="e.g., A101, Lab-1"
            />
            {errors.room_number && (
              <p className="text-red-600 text-sm mt-1">{errors.room_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity
            </label>
            <input
              {...register('capacity', { 
                required: 'Capacity is required',
                min: { value: 1, message: 'Capacity must be at least 1' }
              })}
              type="number"
              className="input-field"
              placeholder="e.g., 60"
            />
            {errors.capacity && (
              <p className="text-red-600 text-sm mt-1">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <select
              {...register('room_type', { required: 'Room type is required' })}
              className="input-field"
            >
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.room_type && (
              <p className="text-red-600 text-sm mt-1">{errors.room_type.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('is_available')}
              type="checkbox"
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Available for scheduling
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingRoom ? 'Update' : 'Create'} Room
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