from django.apps import AppConfig
from django.db.models.signals import post_migrate


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        from django.contrib.auth.hashers import make_password
        # from accounts.modules import Utilisateur, Role
        from accounts.modules.Role import Role
        from accounts.modules.Utilisateur import Utilisateur

        def create_admin(sender, **kwargs):
            # Vérifie que le rôle admin existe
            role_admin, _ = Role.objects.get_or_create(
                nom="admin", defaults={"description": "Administrateur"}
            )

            # Crée l’utilisateur admin si il n’existe pas
            if not Utilisateur.objects.filter(nom_utilisateur="admin").exists():
                Utilisateur.objects.create(
                    nom_utilisateur="admin",
                    nom="Admin",
                    prenom="User",
                    email="admin@sanad.com",
                    mot_de_passe=make_password("admin123"),  # mot de passe haché
                    cin="00000000",
                    telephone="0000000000",
                    role=role_admin,
                )
                print("Admin créé avec succès")

        post_migrate.connect(create_admin, sender=self)
