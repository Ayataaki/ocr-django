from django.db import models
from .Client import Client

class Adresse(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    type_adresse = models.CharField(max_length=20, default='personnelle') # 'personnelle', 'professionnelle', 'facturation'
    rue = models.CharField(max_length=255)
    complement = models.CharField(max_length=255, blank=True) # Appartement, étage, résidence
    ville = models.CharField(max_length=100)
    code_postal = models.CharField(max_length=20, blank=True)
    pays = models.CharField(max_length=100, default='Maroc')
    est_principale = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.rue}, {self.ville}"