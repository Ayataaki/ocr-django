from django.urls import path
from . import views

urlpatterns = [
    
    path("dossiers/", views.dossier.dossier_list, name="dossier_list"),
    path('dossiers/<int:dossier_id>/', views.dossier.get_dossier_details, name='get-dossier-details'),
    path("dossiers/operateur/create/", views.dossier.dossier_create_operateur, name="ajout_dossier_operateur"),
    path("dossiers/admin/create/", views.dossier.dossier_create_admin, name="ajout_dossier_admin"),
    path("dossiers/nouveau/", views.dossier.nv_dossier, name="nv_dossier"),
    # path("dossiers/client/<int:client_id>/", views.dossier.get_dossiers_by_client, name='dossiers_by_client'),
    path("dossiers/clients/<int:client_id>/", views.dossier.dossiers_par_client, name="dossiers_par_client"),

    path("documents/", views.document.dossier_list, name="document_list"),
    path("documents/nouveau", views.document.create_document, name="document_ajout"),

]


