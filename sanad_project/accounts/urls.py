from django.urls import path
from . import views

urlpatterns = [

    path("operateur/dashboard/", views.dashboard.operateur_dashboard, name="operateur_dashboard"),
    path("admin/dashboard/", views.dashboard.admin_dashboard, name="admin_dashboard"),

    path("utilisateurs/", views.utilisateur.utilisateur_list, name="utilisateur_list"),
    path("utilisateurs/create/", views.utilisateur.utilisateur_create, name="ajout_utilisateur"),

    path("clients/", views.client.client_list, name="client_list"),
    path("clients/admin/create/", views.client.client_create_admin, name="ajout_client_admin"),
    path("clients/operateur/create/", views.client.client_create_operateur, name="ajout_client_operateur"),

    path("login/", views.auth.login_view, name="login"),
    path("logout/", views.auth.logout_view, name="logout"),

    
]


