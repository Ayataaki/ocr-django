from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.http import require_GET

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

def dossier_create_admin(request):
    if request.method == "POST":
        try:
            reference_dossier = request.POST.get("reference_dossier")
            client_id = request.POST.get("client")
            description = request.POST.get("description")
            statut = request.POST.get("statut")

            if not reference_dossier or not client_id:
                messages.error(request, "La référence du dossier et le client sont obligatoires.")
                ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
                return render(request, "dashboards/admin/base.html", ctx)

            client = Client.objects.get(pk=client_id)
            
            Dossier.objects.create(
                reference_dossier=reference_dossier,
                client=client,
                description=description,
                statut=statut
            )
            return redirect("admin_dashboard")
        
        except Exception as e:
            print(f"Error creating dossier: {e}")
            messages.error(request, "Une erreur est survenue lors de la création du dossier.")
            ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
            return render(request, "dashboards/admin/base.html", ctx)

    return redirect("admin_dashboard")
    
def dossier_create_operateur(request):
    if request.method == "POST":
        try:
            reference_dossier = request.POST.get("reference_dossier")
            client_id = request.POST.get("client")
            description = request.POST.get("description")
            statut = request.POST.get("statut")

            if not reference_dossier or not client_id:
                messages.error(request, "La référence du dossier et le client sont obligatoires.")
                ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
                return render(request, "dashboards/operateur/base.html", ctx)

            client = Client.objects.get(pk=client_id)
            
            Dossier.objects.create(
                reference_dossier=reference_dossier,
                client=client,
                description=description,
                statut=statut
            )
            return redirect("operateur_dashboard")
        
        except Exception as e:
            print(f"Error creating dossier: {e}")
            messages.error(request, "Une erreur est survenue lors de la création du dossier.")
            ctx = _base_context({'open_modal': 'add-dossier', 'active_panel': 'dossiers'})
            return render(request, "dashboards/operateur/base.html", ctx)

    return redirect("operateur_dashboard")



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