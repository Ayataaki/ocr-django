from django.db import models
from simple_history.models import HistoricalRecords

class Client(models.Model):
    """Classe de base abstraite pour les deux types de clients"""
    
    TYPE_CLIENT_CHOICES = [
        ('physique', 'Personne physique'),
        ('morale', 'Personne morale'),
    ]
    
    type_client = models.CharField(
                max_length=10,         
                choices=TYPE_CLIENT_CHOICES,
                default='physique' 
            )
    
    # Champs communs aux deux types
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True) # professionnel
    adresse = models.TextField(blank=True)
    ville = models.CharField(max_length=100, blank=True)
    code_postal = models.CharField(max_length=20, blank=True)
    pays = models.CharField(max_length=100, default='Maroc')
    date_creation = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(default=True)
    
    # Relation polymorphique (un client a soit une personne physique, soit une personne morale)
    personne_physique = models.OneToOneField('PersonnePhysique', on_delete=models.CASCADE, null=True, blank=True)
    personne_morale = models.OneToOneField('PersonneMorale', on_delete=models.CASCADE, null=True, blank=True)
    
    history = HistoricalRecords()
    
    def __str__(self):
        if self.personne_physique:
            return str(self.personne_physique)
        elif self.personne_morale:
            return str(self.personne_morale)
        return f"Client {self.id}"
    
    def get_nom_complet(self):
        if self.personne_physique:
            return f"{self.personne_physique.prenom} {self.personne_physique.nom}"
        elif self.personne_morale:
            return self.personne_morale.raison_sociale
        return "Client inconnu"


class PersonnePhysique(models.Model):
    """Personne physique (client individuel)"""
    
    # Identité
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    
    # Identification
    type_identite = models.CharField(max_length=50, blank=True)  # CIN, Passeport, Carte séjour
    numero_identite = models.CharField(max_length=50, unique=True)
    
    # Informations personnelles
    nationalite = models.CharField(max_length=50, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=100, blank=True)
    
    # Situation familiale (optionnel)
    situation_familiale = models.CharField(max_length=50, blank=True)  # Célibataire, Marié, Divorcé, Veuf
    # nom_conjoint = models.CharField(max_length=100, blank=True)
    # regime_matrimonial = models.CharField(max_length=50, blank=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()
    
    def __str__(self):
        return f"{self.prenom} {self.nom}"


class PersonneMorale(models.Model):
    """Personne morale (entreprise, association, société)"""
    
    TYPE_SOCIETE_CHOICES = [
        ('SARL', 'SARL'),
        ('SA', 'Société Anonyme'),
        ('SAS', 'SAS'),
        ('SNC', 'SNC'),
        ('SCI', 'SCI'),
        ('Association', 'Association'),
        ('Autre', 'Autre'),
    ]
    
    # Identité légale
    raison_sociale = models.CharField(max_length=255)  # Nom de l'entreprise
    sigle = models.CharField(max_length=50, blank=True)  # Sigle (ex: SARL, SA...)
    
    # Immatriculation
    type_societe = models.CharField(max_length=50, choices=TYPE_SOCIETE_CHOICES, blank=True)
    numero_rc = models.CharField(max_length=100, blank=True, verbose_name="Numéro Registre de Commerce")
    numero_patente = models.CharField(max_length=100, blank=True)
    identifiant_fiscal = models.CharField(max_length=100, blank=True)
    numero_cnss = models.CharField(max_length=100, blank=True)
    ice = models.CharField(max_length=100, blank=True, verbose_name="ICE (Identifiant Commun de l'Entreprise)")
    
    # Représentation légale
    representant_nom = models.CharField(max_length=100, blank=True)
    representant_prenom = models.CharField(max_length=100, blank=True)
    representant_fonction = models.CharField(max_length=100, blank=True)  # Gérant, PDG, Directeur...
    
    # Informations société
    capital_social = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    devise = models.CharField(max_length=3, default='MAD')
    effectif = models.IntegerField(null=True, blank=True)
    
    # Dates
    date_creation_societe = models.DateField(null=True, blank=True)
    date_immatriculation = models.DateField(null=True, blank=True)
    
    # Champs généraux
    # site_web = models.URLField(blank=True)
    # notes = models.TextField(blank=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()
    
    def __str__(self):
        return self.raison_sociale