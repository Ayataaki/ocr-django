from django.db import models
from .Utilisateur import Utilisateur

class AuditLog(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    # document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    date_action = models.DateTimeField(auto_now_add=True)
    # which detail ? does not need to be inserted !
    # details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.utilisateur} - {self.action} - {self.date_action}"