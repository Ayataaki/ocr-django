from django.db import models
from .Role import Role
from simple_history.models import HistoricalRecords


class Utilisateur(models.Model):
    # On garde les champs de AbstractUser (username, password, email, etc.)
    # et on ajoute ceux que tu veux
    nom_utilisateur = models.CharField(max_length=150, unique=True)
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=128)
    cin = models.CharField(max_length=20, unique=True)
    telephone = models.CharField(max_length=20, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    # Ajoute ces deux attributs pour que Django soit content
    # USERNAME_FIELD = "nom_utilisateur"   # champ utilisé comme identifiant
    # REQUIRED_FIELDS = ["email", "nom", "prenom"]

    def __str__(self):
        return f"{self.nom} {self.prenom}"