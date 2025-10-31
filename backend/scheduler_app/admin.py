from django.contrib import admin
from .models import *

# -------------------------
# Instructor Admin
# -------------------------
@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ['instructor_id', 'name', 'email', 'is_available', 'created_at']
    list_filter = ['is_available']
    search_fields = ['name', 'instructor_id', 'email']

# -------------------------
# Room Admin
# -------------------------
@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'capacity', 'room_type', 'is_available']
    list_filter = ['room_type', 'is_available']
    search_fields = ['room_number']

# -------------------------
# MeetingTime Admin
# -------------------------
@admin.register(MeetingTime)
class MeetingTimeAdmin(admin.ModelAdmin):
    list_display = ['pid', 'day', 'start_time', 'end_time', 'is_lunch_break']
    list_filter = ['day', 'is_lunch_break']
    ordering = ['day', 'start_time']

# -------------------------
# Department Admin
# -------------------------
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'head_of_department']
    search_fields = ['name', 'code']

# -------------------------
# Course Admin
# -------------------------
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_id', 'course_name', 'course_type', 'get_sections']
    list_filter = ['course_type']
    search_fields = ['course_name', 'course_id']
    filter_horizontal = ['instructors', 'sections']

    def get_sections(self, obj):
        return ", ".join([section.section_id for section in obj.sections.all()])
    get_sections.short_description = 'Sections'

# -------------------------
# Section Admin
# -------------------------
@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['section_id', 'department', 'year', 'semester', 'num_students']
    list_filter = ['department', 'year', 'semester']
    search_fields = ['section_id']
    filter_horizontal = ['instructors']

# -------------------------
# Class Admin
# -------------------------
@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['class_id', 'course', 'instructor', 'room', 'meeting_time', 'section']
    list_filter = ['meeting_time__day']
    search_fields = ['class_id', 'course__course_name']

# -------------------------
# Timetable Admin
# -------------------------
@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'year', 'semester', 'fitness', 'is_active', 'created_by']
    list_filter = ['department', 'year', 'semester', 'is_active']
    search_fields = ['name']
    filter_horizontal = ['classes']
