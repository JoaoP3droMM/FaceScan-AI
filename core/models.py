from django.db import models

# Create your models here.
class Usuario(models.Model):
    nome = models.CharField(max_length=100)
    matricula = models.CharField(max_length=20, unique=True)
    caminho_foto = models.CharField(max_length=255)
    data_registro = models.DateTimeField(auto_now_add=True)
    ultimo_reconhecimento = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"{self.nome} - {self.matricula}"