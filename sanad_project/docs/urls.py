from django.urls import path
from . import views

urlpatterns = [
    path("dossiers/", views.dossier.dossier_list, name="dossier_list"),
    path("dossiers/create/", views.dossier.dossier_create, name="ajout_dossier"),
    path("dossiers/nouveau/", views.dossier.nv_dossier, name="nv_dossier"),

]


