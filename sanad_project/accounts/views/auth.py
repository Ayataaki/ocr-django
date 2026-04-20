from django.contrib import messages
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.hashers import check_password
from accounts.modules.Utilisateur import Utilisateur


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("nom_utilisateur")
        password = request.POST.get("mot_de_passe")

        if not username or not password:
            messages.error(request, "Nom d'utilisateur et mot de passe sont obligatoires.")
            return render(request, "auth/login.html")

        try:
            user = Utilisateur.objects.get(nom_utilisateur=username)
        except Utilisateur.DoesNotExist:
            messages.error(request, "Utilisateur introuvable.")
            return render(request, "auth/login.html")

        if not user.est_actif:
            messages.error(request, "Compte désactivé.")
            return render(request, "auth/login.html")

# accounts/templates/accounts/operateur/dashboard.html

        if check_password(password, user.mot_de_passe):
            request.session["user_id"] = user.id
            messages.success(request, "Connexion réussie.")
            
            # return redirect("dashboard")
            # return render(request, "accounts/operateur/dashboard.html")

            if user.role.nom == "operateur":
                return redirect("operateur_dashboard")
            # we gonna put operator for the moment, until finishing the operator part
            elif user.role.nom == "admin":
                return redirect("admin_dashboard")


        else:
            messages.error(request, "Mot de passe incorrect.")
            return render(request, "auth/login.html")

    return render(request, "auth/login.html")


def logout_view(request):
    try:
        request.session.flush()
        messages.success(request, "Déconnexion réussie.")
    except Exception as e:
        messages.error(request, f"Erreur lors de la déconnexion : {e}")
    return redirect("login")
