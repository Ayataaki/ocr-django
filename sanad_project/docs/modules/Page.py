from django.db import models    
from docs.modules import Document


class Page(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="pages")
    numero_page = models.IntegerField()
    texte = models.TextField()
    hash_page = models.CharField(max_length=255)

    def __str__(self):
        return f"Page {self.numero_page} - {self.document.libelle}"

