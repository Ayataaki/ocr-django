from django.db import models
from .Utilisateur import Utilisateur

class Session(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField()
    est_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Session {self.id} - {self.utilisateur.nom_utilisateur}"
    
