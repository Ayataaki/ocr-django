from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_GET
from django.utils import timezone
from datetime import datetime
from django.urls import reverse

from accounts.modules.Utilisateur import Utilisateur
from accounts.modules.Client import Client
from docs.modules.Dossier import Dossier


def _base_context(extra=None):
    ctx = {
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'dossiers',
        'nouveau': 'nouveau',
    }
    if extra:
        ctx.update(extra)
    return ctx


def dossier_list(request):
    ctx = _base_context({'active_panel': 'dossiers'})
    return render(request, "dashboards/admin/base.html", ctx)


# def get_dossiers_by_client(request, client_id):
#     dossiers = Dossier.objects.filter(client_id=client_id)

#     data = list(dossiers.values("id", "reference_dossier"))
#     return JsonResponse(data, safe=False)


# def dossiers_par_client(request, client_id):
#     dossiers = Dossier.objects.filter(client_id=client_id).values("id", "reference_dossier", "description")
#     return JsonResponse(list(dossiers), safe=False)

# def dossiers_par_client(request, client_id):
#     """
#     Retourne les dossiers d'un client en JSON.
#     GET /dossiers/client/<client_id>/
#     """
#     get_object_or_404(Client, pk=client_id)  # 404 si client inexistant

#     dossiers = (
#         Dossier.objects
#         .filter(client_id=client_id)
#         .values('id', 'reference_dossier', 'description',
#                 'statut', 'date_acte', 'date_creation')
#         .order_by('-date_creation')
#     )

#     return JsonResponse({
#         'client_id': client_id,
#         'dossiers':  list(dossiers),
#     })

def nv_dossier(request):
    ctx = _base_context({'active_panel': 'nouveau'})
    return render(request, "dashboards/admin/base.html", ctx)

# def dossier_create_admin(request):
#     if request.method == "POST":
#         try:
#             reference_dossier = request.POST.get("reference_dossier")
#             client_id = request.POST.get("client")
#             description = request.POST.get("description")
#             statut = request.POST.get("statut")

#             if not reference_dossier or not client_id:
#                 messages.error(request, "La référence du dossier et le client sont obligatoires.")
#                 ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
#                 return render(request, "dashboards/admin/base.html", ctx)

#             client = Client.objects.get(pk=client_id)
            
#             Dossier.objects.create(
#                 reference_dossier=reference_dossier,
#                 client=client,
#                 description=description,
#                 statut=statut
#             )
#             return redirect("admin_dashboard")
        
#         except Exception as e:
#             print(f"Error creating dossier: {e}")
#             messages.error(request, "Une erreur est survenue lors de la création du dossier.")
#             ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
#             return render(request, "dashboards/admin/base.html", ctx)

#     return redirect("admin_dashboard")
    
# def dossier_create_operateur(request):
#     if request.method == "POST":
#         try:
#             reference_dossier = request.POST.get("reference_dossier")
#             client_id = request.POST.get("client")
#             description = request.POST.get("description")
#             statut = request.POST.get("statut")

#             if not reference_dossier or not client_id:
#                 messages.error(request, "La référence du dossier et le client sont obligatoires.")
#                 ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
#                 return render(request, "dashboards/operateur/base.html", ctx)

#             client = Client.objects.get(pk=client_id)
            
#             Dossier.objects.create(
#                 reference_dossier=reference_dossier,
#                 client=client,
#                 description=description,
#                 statut=statut
#             )
#             return redirect("operateur_dashboard")
        
#         except Exception as e:
#             print(f"Error creating dossier: {e}")
#             messages.error(request, "Une erreur est survenue lors de la création du dossier.")
#             ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
#             return render(request, "dashboards/operateur/base.html", ctx)

#     return redirect("operateur_dashboard")


def dossier_create_universal(request, user_role='operateur'):
    """Vue unifiée pour la création de dossier (admin et opérateur)"""
    
    if request.method != "POST":
        # Redirection vers le dashboard approprié
        if user_role == 'admin':
            return redirect("admin_dashboard")
        return redirect("operateur_dashboard")
    
    try:
        # Récupération des données du formulaire
        reference_dossier = request.POST.get("reference_dossier", "").strip()
        client_id = request.POST.get("client", "").strip()
        description = request.POST.get("description", "").strip()
        statut = request.POST.get("statut", "actif")
        date_ouverture_str = request.POST.get("date_ouverture", "")
        
        # Validation des champs obligatoires
        if not reference_dossier:
            messages.error(request, "La référence du dossier est obligatoire.")
            return _redirect_with_modal(request, user_role, 'add-dossier')
        
        if not client_id:
            messages.error(request, "Veuillez sélectionner un client.")
            return _redirect_with_modal(request, user_role, 'add-dossier')
        
        # Vérifier si la référence existe déjà
        if Dossier.objects.filter(reference_dossier=reference_dossier).exists():
            messages.error(request, f"Un dossier avec la référence '{reference_dossier}' existe déjà.")
            return _redirect_with_modal(request, user_role, 'add-dossier')
        
        # Récupérer le client
        try:
            client = Client.objects.get(pk=client_id)
        except Client.DoesNotExist:
            messages.error(request, "Le client sélectionné n'existe pas.")
            return _redirect_with_modal(request, user_role, 'add-dossier')
        
        # Traiter la date d'ouverture
        date_ouverture = None
        if date_ouverture_str:
            try:
                date_ouverture = datetime.strptime(date_ouverture_str, '%Y-%m-%d').date()
            except ValueError:
                date_ouverture = timezone.now().date()
        else:
            date_ouverture = timezone.now().date()
        
        # Création du dossier
        dossier = Dossier.objects.create(
            reference_dossier=reference_dossier,
            client=client,
            description=description,
            statut=statut,
            date_ouverture=date_ouverture
        )
        
        messages.success(request, f"Dossier '{reference_dossier}' créé avec succès.")
        
        # Redirection avec succès
        if user_role == 'admin':
            return redirect("admin_dashboard")
        return redirect("operateur_dashboard")
        
    except Exception as e:
        print(f"Error creating dossier: {e}")
        messages.error(request, f"Une erreur est survenue: {str(e)}")
        return _redirect_with_modal(request, user_role, 'add-dossier')


def _redirect_with_modal(request, user_role, modal_name):
    """Helper pour rediriger avec ouverture du modal"""
    
    ctx = {
        'open_modal': modal_name,
        'active_panel': 'dossiers'
    }
    
    if user_role == 'admin':
        return render(request, "dashboards/admin/base.html", ctx)
    return render(request, "dashboards/operateur/base.html", ctx)


# Dans vos views existantes, remplacez par :
def dossier_create_admin(request):
    return dossier_create_universal(request, user_role='admin')

def dossier_create_operateur(request):
    return dossier_create_universal(request, user_role='operateur')

def _get_client_details(client):
    """Récupère les détails formatés d'un client"""
    if not client:
        return None
    
    details = {
        'id': client.id,
        'type': client.type_client,
        'email': client.email,
        'telephone': client.telephone
    }
    
    if client.personne_physique:
        pp = client.personne_physique
        details['nom'] = pp.nom
        details['prenom'] = pp.prenom
        details['nom_complet'] = f"{pp.prenom} {pp.nom}"
        details['numero_identite'] = pp.numero_identite
        details['profession'] = pp.profession
    elif client.personne_morale:
        pm = client.personne_morale
        details['raison_sociale'] = pm.raison_sociale
        details['nom_complet'] = pm.raison_sociale
        details['ice'] = pm.ice
        details['numero_rc'] = pm.numero_rc
    
    return details

@require_GET
def get_dossier_details(request, dossier_id):
    """
    Récupère les détails complets d'un dossier par son ID
    
    URL: /dossiers/<dossier_id>/
    Méthode: GET
    Retour: JSON avec les données du dossier
    """
    try:
        # Récupérer le dossier avec ses relations
        dossier = Dossier.objects.select_related('client').get(id=dossier_id)
        
        # Construction de la réponse JSON
        data = {
            'success': True,
            'dossier': {
                'id': dossier.id,
                'reference': dossier.reference_dossier,
                'description': dossier.description or '',
                'statut': dossier.statut,
                'date_ouverture': dossier.date_ouverture.isoformat() if dossier.date_ouverture else None,
                'date_creation': dossier.date_creation.isoformat() if dossier.date_creation else None,
                'date_modification': dossier.date_modification.isoformat() if hasattr(dossier, 'date_modification') and dossier.date_modification else None,
                'client_id': dossier.client.id if dossier.client else None,
                'client_name': str(dossier.client) if dossier.client else None,
                # Informations client détaillées
                'client_details': _get_client_details(dossier.client) if dossier.client else None
            }
        }
        
        return JsonResponse(data, status=200)
        
    except Dossier.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': f'Dossier avec ID {dossier_id} non trouvé'
        }, status=404)
        
    except Exception as e:
        print(f"Erreur dans get_dossier_details: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Erreur interne du serveur'
        }, status=500)


@require_GET
def dossiers_par_client(request, client_id):
    """
    GET /dossiers/client/<client_id>/
    Retourne les dossiers d'un client en JSON.
    Appelée par dossier_select.js après sélection d'un client.
    """
    get_object_or_404(Client, pk=client_id)
 
    dossiers = list(
        Dossier.objects
        .filter(client_id=client_id)
        .values(
            'id',
            'reference_dossier',
            'description',
            'statut',
            'date_ouverture',   # date réelle d'ouverture
            'date_creation',    # date d'enregistrement
            'chemin_dossier',
        )
        .order_by('-date_creation')
    )
 
    # Sérialiser les dates en string ISO pour le JS
    for d in dossiers:
        if d['date_ouverture']:
            d['date_ouverture'] = str(d['date_ouverture'])
        if d['date_creation']:
            d['date_creation'] = d['date_creation'].strftime('%Y-%m-%d')
 
    return JsonResponse({
        'client_id': client_id,
        'count':     len(dossiers),
        'dossiers':  dossiers,
    })