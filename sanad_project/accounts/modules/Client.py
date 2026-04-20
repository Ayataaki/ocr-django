from django.db import models
from simple_history.models import HistoricalRecords

class Client(models.Model):
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True)
    nationalite = models.CharField(max_length=50, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    type_identite = models.CharField(max_length=50, blank=True)  # CIN, Passeport, etc.
    numero_identite = models.CharField(max_length=50, unique=True)  # CIN, Passeport, etc.
    date_naissance = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True) # pour préserver au lieu de supprimer
    # Cette ligne crée automatiquement la table HistoricalClient, 
    # pour garder un historique des changements de ce modèle
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.nom} {self.prenom}"
    