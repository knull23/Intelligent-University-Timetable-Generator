'use client'

import { useState, useEffect } from 'react'

interface TimetableClass {
  course: string
  course_id: string
  instructor: string
  room: string
  section: string
  course_type: string
}

interface TimetableGridProps {
  schedule: Record<string, Record<string, TimetableClass[]>>
  title?: string
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TimetableGrid({ schedule, title }: TimetableGridProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([])

  useEffect(() => {
    // Extract all unique time slots and sort them
    const allTimeSlots = new Set<string>()
    Object.values(schedule).forEach(daySchedule => {
      Object.keys(daySchedule).forEach(timeSlot => {
        allTimeSlots.add(timeSlot)
      })
    })
    
    const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
      const timeA = a.split('-')[0]
      const timeB = b.split('-')[0]
      return timeA.localeCompare(timeB)
    })
    
    setTimeSlots(sortedTimeSlots)
  }, [schedule])

  const getCourseTypeColor = (courseType: string) => {
    switch (courseType.toLowerCase()) {
      case 'lab':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'theory':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'practical':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="card overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-gray-50 border-r border-gray-200">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const dayClasses = schedule[day]?.[timeSlot] || []
                  return (
                    <td key={`${day}-${timeSlot}`} className="px-2 py-2 align-top">
                      <div className="min-h-[80px] space-y-1">
                        {dayClasses.map((classInfo, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded border text-xs ${getCourseTypeColor(classInfo.course_type)}`}
                          >
                            <div className="font-semibold">{classInfo.course_id}</div>
                            <div className="text-xs opacity-90">{classInfo.course}</div>
                            <div className="text-xs mt-1">
                              <div>👨‍🏫 {classInfo.instructor}</div>
                              <div>🏠 {classInfo.room}</div>
                              <div>👥 {classInfo.section}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {timeSlots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No classes scheduled
        </div>
      )}
    </div>
  )
}