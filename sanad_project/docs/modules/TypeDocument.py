from django.db import models
from simple_history.models import HistoricalRecords

class TypeDocument(models.Model):
    """Types de documents (ex: contrat, acte, facture, testament...)"""
    
    # Identifiant
    # code = models.CharField(max_length=50, unique=True)  # "CONTRAT_VENTE", "ACTE_NOTARIE"
    nom = models.CharField(max_length=100)  # "Contrat de vente"
    description = models.TextField(blank=True)
    
    # Classification
    categorie = models.CharField(max_length=50, blank=True)  # "Juridique", "Financier", "Administratif"
    
    date_creation = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()
    
    def __str__(self):
        return self.nom