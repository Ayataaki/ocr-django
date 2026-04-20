from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

from accounts.modules.Utilisateur import Utilisateur
from accounts.modules.Client import Client
from docs.modules.Dossier import Dossier


def _base_context(extra=None):
    ctx = {
        'clients': Client.objects.all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers': Dossier.objects.select_related('client').all(),
        'open_modal': None,
        'active_panel': 'utilisateurs',
        'nouveau': 'nouveau',
    }
    if extra:
        ctx.update(extra)
    return ctx


def dossier_list(request):
    ctx = _base_context({'active_panel': 'dossiers'})
    return render(request, "dashboards/admin/base.html", ctx)

def nv_dossier(request):
    ctx = _base_context({'active_panel': 'nouveau'})
    return render(request, "dashboards/admin/base.html", ctx)

def dossier_create(request):
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
    
    # ctx = _base_context({'active_panel': 'dossiers', 'open_modal': 'add_dossier'})
    # return render(request, "dashboards/admin/base.html", ctx)

