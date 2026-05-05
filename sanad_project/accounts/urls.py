from django.urls import path
from . import views

urlpatterns = [

    path("operateur/dashboard/", views.dashboard.operateur_dashboard, name="operateur_dashboard"),
    path("admin/dashboard/", views.dashboard.admin_dashboard, name="admin_dashboard"),

    path("utilisateurs/", views.utilisateur.utilisateur_list, name="utilisateur_list"),
    path("utilisateurs/form/", views.utilisateur.form_utilisateur, name="form_utilisateur"),
    path('utilisateurs/admin/create/', views.utilisateur.admin_creation, name='admin_creation'), 
    path("utilisateurs/create/", views.utilisateur.utilisateur_create, name="ajout_utilisateur"),

    path("clients/", views.client.client_list, name="client_list"),
    path("clients/search/", views.client.search_clients, name="search_clients"),
    path("clients/admin/create/", views.client.client_create_admin, name="ajout_client_admin"),
    path("clients/<int:client_id>/", views.client.client_detail_api, name="client_detail_api"),
    path("clients/operateur/create/", views.client.client_create_operateur, name="ajout_client_operateur"),
    path("clients/<int:client_id>/modifier/", views.client.client_update, name="modifier_client"),

    path("login/", views.auth.login_view, name="login"),
    path("logout/", views.auth.logout_view, name="logout"),

    
]


