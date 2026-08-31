# docs/modules/Dossier.py
from django.db import models
from simple_history.models import HistoricalRecords


class Dossier(models.Model):

    STATUT_CHOICES = [
        ('actif',    'Actif'),
        ('cloture',  'Clôturé'),
        ('archive',  'Archivé'),
        ('suspendu', 'Suspendu'),
    ]

    # ── Identification ──────────────────────────────
    reference_dossier = models.CharField(max_length=255, unique=True)
    # Ex: "NOT-2026-BENALI-001"

    # ── Relations ───────────────────────────────────
    client = models.ForeignKey(
        'accounts.Client',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='dossiers'
    )

    # ── Contenu ─────────────────────────────────────
    description = models.TextField(blank=True)
    statut      = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='actif'
    )

    # ── Dates ────────────────────────────────────────
    # date_ouverture : date réelle de l'ouverture du dossier chez le notaire
    # ≠ date_creation : date d'enregistrement en base (auto)
    date_ouverture = models.DateField(null=True, blank=True)
    date_creation  = models.DateTimeField(auto_now_add=True)

    # ── Stockage physique ────────────────────────────
    chemin_dossier = models.CharField(max_length=500, blank=True)
    # Ex: "stockage/dossiers/BENALI_Khalid_12/NOT-2026-001/"

    history = HistoricalRecords()

    class Meta:
        verbose_name        = "Dossier"
        verbose_name_plural = "Dossiers"
        ordering            = ['-date_creation']

    def __str__(self):
        return self.reference_dossier