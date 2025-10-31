from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.contrib.auth.models import User
from .models import (
    Instructor, Room, MeetingTime, Department,
    Course, Section, Class, Timetable
)
from .serializers import *
from .genetic_algorithm import GeneticAlgorithm
from .utils import export_timetable_pdf, export_timetable_excel
import uuid

# ----------------------------------------
# ✅ User Profile (JWT-based authentication)
# ----------------------------------------
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return basic user info (used after JWT login)"""
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff
        }, status=status.HTTP_200_OK)


# ----------------------------------------
# ✅ Scheduler App Endpoints
# ----------------------------------------
class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    permission_classes = [permissions.IsAuthenticated]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]


class MeetingTimeViewSet(viewsets.ModelViewSet):
    queryset = MeetingTime.objects.all()
    serializer_class = MeetingTimeSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Course.objects.all()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section_id=section)
        return queryset


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Section.objects.all()
        department = self.request.query_params.get('department')
        year = self.request.query_params.get('year')
        if department:
            queryset = queryset.filter(department_id=department)
        if year:
            queryset = queryset.filter(year=year)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        course_instructor_assignments = data.pop('course_instructor_assignments', {})

        # Create the section first
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        section = serializer.save()

        # Update course instructor assignments
        self._update_course_instructors(course_instructor_assignments)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        course_instructor_assignments = data.pop('course_instructor_assignments', {})

        # Update the section
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        section = serializer.save()

        # Update course instructor assignments
        self._update_course_instructors(course_instructor_assignments)

        return Response(serializer.data)

    def _update_course_instructors(self, course_instructor_assignments):
        """Update instructor assignments for courses"""
        for course_id, instructor_id in course_instructor_assignments.items():
            try:
                course = Course.objects.get(id=course_id)
                instructor = Instructor.objects.get(id=instructor_id)
                course.instructors.set([instructor])
            except (Course.DoesNotExist, Instructor.DoesNotExist):
                continue

    @action(detail=True, methods=['get'])
    def instructors(self, request, pk=None):
        """Get instructors who teach courses assigned to this section"""
        section = self.get_object()
        # Get all instructors who teach courses assigned to this section
        instructors = Instructor.objects.filter(
            courses_teaching__sections=section
        ).distinct()
        serializer = InstructorSerializer(instructors, many=True)
        return Response(serializer.data)


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]


class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Timetable.objects.all()
        department = self.request.query_params.get('department')
        year = self.request.query_params.get('year')
        if department:
            queryset = queryset.filter(department_id=department)
        if year:
            queryset = queryset.filter(year=year)
        return queryset

    # ----------------------------------------
    # Generate Timetable (Genetic Algorithm)
    # ----------------------------------------
    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = TimetableGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        try:
            # Generate single combined timetable for all selected departments and years
            ga = GeneticAlgorithm(
                department_ids=data['department_ids'],
                years=data['years'],
                semester=data['semester'],
                population_size=data.get('population_size', 50),
                mutation_rate=data.get('mutation_rate', 0.1),
                elite_rate=data.get('elite_rate', 0.1),
                generations=data.get('generations', 500)
            )
            best_solution, fitness = ga.evolve()

            # Create timetable name with all departments and years
            department_names = [dept.name for dept in ga.departments]
            year_names = [f"Year {year}" for year in sorted(data['years'])]
            timetable_name = f"Combined Timetable - {', '.join(department_names)} - {', '.join(year_names)} - Semester {data['semester']} - {uuid.uuid4().hex[:8]}"

            # Use first department as primary department for the timetable record
            primary_department = ga.departments.first()

            timetable = Timetable.objects.create(
                name=timetable_name,
                department=primary_department,
                year=min(data['years']),  # Use minimum year as primary
                semester=data['semester'],
                fitness=fitness,
                created_by=request.user.username if request.user.is_authenticated else "admin"
            )

            if best_solution:
                for class_data in best_solution:
                    if all([class_data.get('instructor'), class_data.get('room'), class_data.get('meeting_time')]):
                        if class_data['duration'] == 2 and class_data.get('consecutive_slots'):
                            for i, slot in enumerate(class_data['consecutive_slots']):
                                class_id = f"{class_data['id']}_slot_{i}_{uuid.uuid4().hex[:4]}"
                                class_obj = Class.objects.create(
                                    class_id=class_id,
                                    course=class_data['course'],
                                    instructor=class_data['instructor'],
                                    meeting_time=slot,
                                    room=class_data['room'],
                                    section=class_data['section']
                                )
                                timetable.classes.add(class_obj)
                        else:
                            class_id = f"{class_data['id']}_{uuid.uuid4().hex[:4]}"
                            class_obj = Class.objects.create(
                                class_id=class_id,
                                course=class_data['course'],
                                instructor=class_data['instructor'],
                                meeting_time=class_data['meeting_time'],
                                room=class_data['room'],
                                section=class_data['section']
                            )
                            timetable.classes.add(class_obj)

            if fitness >= 80:
                timetable.is_active = True
                timetable.save()

            return Response({
                'message': 'Combined timetable generated successfully',
                'timetable_id': timetable.id,
                'fitness': fitness,
                'total_classes': len(best_solution) if best_solution else 0,
                'departments': department_names,
                'years': sorted(data['years']),
                'semester': data['semester']
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': f'Failed to generate timetable: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ----------------------------------------
    # View Timetable Schedule
    # ----------------------------------------
    @action(detail=True, methods=['get'])
    def view_schedule(self, request, pk=None):
        timetable = self.get_object()
        classes = timetable.classes.all()

        schedule = {day: {} for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
        for cls in classes:
            day = cls.meeting_time.day
            time_slot = f"{cls.meeting_time.start_time}-{cls.meeting_time.end_time}"
            if time_slot not in schedule[day]:
                schedule[day][time_slot] = []
            schedule[day][time_slot].append({
                'course': cls.course.course_name,
                'course_id': cls.course.course_id,
                'instructor': cls.instructor.name,
                'room': cls.room.room_number,
                'section': cls.section.section_id,
                'course_type': cls.course.course_type
            })

        return Response({
            'timetable_name': timetable.name,
            'fitness': timetable.fitness,
            'schedule': schedule
        })

    # ----------------------------------------
    # Export Functions
    # ----------------------------------------
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        timetable = self.get_object()
        pdf_content = export_timetable_pdf(timetable)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{timetable.name}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def export_excel(self, request, pk=None):
        timetable = self.get_object()
        excel_content = export_timetable_excel(timetable)
        response = HttpResponse(
            excel_content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{timetable.name}.xlsx"'
        return response

    # ----------------------------------------
    # Activate Timetable
    # ----------------------------------------
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        timetable = self.get_object()
        Timetable.objects.filter(
            department=timetable.department,
            year=timetable.year,
            semester=timetable.semester
        ).update(is_active=False)

        timetable.is_active = True
        timetable.save()
        return Response({'message': 'Timetable activated successfully'})


# ----------------------------------------
# ✅ JWT /auth/user/ endpoint for frontend
# ----------------------------------------
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
    })
