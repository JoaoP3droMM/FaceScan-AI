from django.urls import path
from . import views

urlpatterns = [
    path('face/', views.index, name='index'),
    path('', views.dashboard, name='dashboard'),
    path('salvar-foto/', views.salvar_foto, name='salvar_foto'),
    path('run-treinamento/', views.run_treinamento, name='run_treinamento'),
    path('reconhecer-foto/', views.reconhecer_foto, name='reconhecer_foto'),
    path('lista-usuarios/', views.lista_usuarios, name='lista_usuarios'),
    path('api/buscar-usuario/', views.buscar_usuario_api, name='buscar_usuario_api'),
    path('api/deletar-usuario/', views.deletar_usuario_api, name='deletar_usuario_api'),
    path('api/atualizar-usuario/', views.atualizar_usuario_api, name='atualizar_usuario_api'),
]