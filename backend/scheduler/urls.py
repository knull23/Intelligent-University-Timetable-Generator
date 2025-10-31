from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Default route to prevent 404 when visiting http://127.0.0.1:8000/
def index(request):
    return JsonResponse({
        "message": "✅ Django backend is running",
        "status": "ok",
        "api_base": "/api/"
    })

urlpatterns = [
    path('', index, name='index'),                     # Root health check route
    path('admin/', admin.site.urls),                   # Django admin panel
    path('api/', include('scheduler_app.urls')),        # API routes
]
