from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('salvar-foto/', views.salvar_foto, name='salvar_foto'),
    path('run-treinamento/', views.run_treinamento, name='run_treinamento'),
    path('reconhecer-foto/', views.reconhecer_foto, name='reconhecer_foto'),
]