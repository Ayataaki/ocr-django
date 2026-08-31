from django.db import models

class Document(models.Model):
    STATUT_CHOICES = [
        ('en attente', 'En attente'),
        ('traitement', 'Traitement'),
        ('complet', 'Complet'),
        ('echoue', 'Echoue'),
    ]

    titre = models.CharField(max_length=500, blank=True)
    chemin_fichier = models.TextField()
    nom_fichier = models.CharField(max_length=255)

    hash_sha256 = models.CharField(max_length=64, unique=True)
    taille_bytes = models.BigIntegerField(null=True)

    type = models.CharField(max_length=100, blank=True) # il fallait ajouter une nouvelle table pour les types !

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en attente')

    full_text = models.TextField(blank=True)

    upload_par = models.ForeignKey('accounts.Utilisateur', on_delete=models.SET_NULL, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)
