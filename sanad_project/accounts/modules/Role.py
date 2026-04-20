from django.db import models

class Role(models.Model):
    nom = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.nom
