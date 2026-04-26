from django.db import models
from accounts.modules.Client import Client
from simple_history.models import HistoricalRecords

class Dossier(models.Model):
    # typoo !!!!
    reference_dossier = models.CharField(max_length=255, unique=True) # Ex: "DUP-2024-001"
    # client = models.ForeignKey('accounts.Client', on_delete=models.CASCADE)
    client = models.ForeignKey(
        'accounts.Client', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=50, default='actif')  # 'actif', 'cloture', 'archive'
    # j'ai pas pu voir l'intérêt de ce champ !
    # date_cloture = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()


    def __str__(self):
        return f"{self.reference_dossier}"