from django.db import models
from docs.modules import Document, Page

class IndexMot(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    page = models.ForeignKey(Page, on_delete=models.CASCADE)
    mot = models.CharField(max_length=100, db_index=True)
    occurences = models.IntegerField()

    def __str__(self):
        return self.mot