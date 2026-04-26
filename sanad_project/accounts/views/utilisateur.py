from urllib import request

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.hashers import make_password

from accounts.modules.Role import Role
from accounts.modules.Client import Client
from accounts.modules.Utilisateur import Utilisateur
from accounts.modules.Audit import AuditLog
from docs.modules.Dossier import Dossier


def _base_context(extra=None):
    ctx = {
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'journal': AuditLog.objects.select_related('utilisateur').all().order_by('-date_action')[:10],  # Affiche les 10 dernières actions
        'dossiers': Dossier.objects.select_related('client').all(),
        'roles': Role.objects.all(),
        'open_modal': None,
        'active_panel': 'utilisateurs',
    }
    if extra:
        ctx.update(extra)
    return ctx


def utilisateur_list(request):
    return render(request, "dashboards/admin/base.html", _base_context())

def form_utilisateur(request):
    roles = Role.objects.all()
    return render(request, "auth/ajout_utilisateur.html", {"roles": roles})

def admin_creation(request):
    roles = Role.objects.all()
    if request.method == "POST":
        try:
            nom = request.POST.get("nom")
            prenom = request.POST.get("prenom")
            nom_utilisateur = request.POST.get("nom_utilisateur")

            # Nom d'utilisateur de base
            base_username = f"{nom}.{prenom}"
            username = base_username
            # Vérifier si ce nom existe déjà
            counter = 1
            while Utilisateur.objects.filter(nom_utilisateur=username).exists():
            # while Utilisateur.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            email = request.POST.get("email")
            mot_de_passe = request.POST.get("mot_de_passe")
            cin = request.POST.get("cin")
            telephone = request.POST.get("telephone")
            role_id = request.POST.get("role")

            if not mot_de_passe:
                messages.error(request, "Le mot de passe est obligatoire.")
                return render(request, "auth/ajout_utilisateur.html", {"roles": roles})

            role = get_object_or_404(Role, id=role_id) if role_id else None

            Utilisateur.objects.create(
                nom_utilisateur=username,
                nom=nom,
                prenom=prenom,
                email=email,
                mot_de_passe=make_password(mot_de_passe),  # hash sécurisé
                cin=cin,
                telephone=telephone,
                role=role
            )
            messages.success(request, "Utilisateur créé avec succès.")
            return redirect("utilisateur_list")
        except Exception as e:
            print(e)
            messages.error(request, f"Erreur lors de la création de l'utilisateur : {e}")
            return render(request, "auth/ajout_utilisateur.html")
    return redirect("admin_dashboard")

def utilisateur_create(request):
    if request.method == "POST":
        try:
            nom = request.POST.get("nom")
            prenom = request.POST.get("prenom")

            # nom_utilisateur = request.POST.get("nom_utilisateur")
            nom_utilisateur = "" 
            # on va le générer automatiquement à partir du nom et prénom pour éviter les doublons et les erreurs de saisie

            # Nom d'utilisateur de base
            base_username = f"{nom}.{prenom}"
            username = base_username
            # Vérifier si ce nom existe déjà
            counter = 1
            while Utilisateur.objects.filter(nom_utilisateur=username).exists():
            # while Utilisateur.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1


            email = request.POST.get("email")
            mot_de_passe = request.POST.get("mot_de_passe")
            cin = request.POST.get("cin")
            telephone = request.POST.get("telephone")
            role_id = request.POST.get("role")

            if not mot_de_passe:
                messages.error(request, "Le mot de passe est obligatoire.")
                ctx = _base_context({'open_modal': 'add-user'})
                return render(request, "dashboards/admin/base.html", ctx)
                # return render(request, "dashboards/admin/modals/modalUser.html")

            role = get_object_or_404(Role, id=role_id) if role_id else None

            Utilisateur.objects.create(
                nom_utilisateur=username,
                nom=nom,
                prenom=prenom,
                email=email,
                mot_de_passe=make_password(mot_de_passe),  # hash sécurisé
                cin=cin,
                telephone=telephone,
                role=role
            )
            messages.success(request, "Utilisateur créé avec succès.")
            # return redirect("utilisateur_list")
            return redirect("admin_dashboard")
            
            # # return redirect("utilisateur_list")    
            # utilisateurs = Utilisateur.objects.all()
            # return render(request, "dashboards/admin/panels/panelUser.html", {"utilisateurs": utilisateurs})

        except Exception as e:
            messages.error(request, f"Erreur lors de la création de l'utilisateur : {e}")
            ctx = _base_context({'open_modal': 'add-user'})
            return render(request, "dashboards/admin/base.html", ctx)
            # return render(request, "dashboards/admin/modals/modalUser.html")

    # return redirect("utilisateur_list")
    return redirect("admin_dashboard")
