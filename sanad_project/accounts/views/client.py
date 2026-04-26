from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.db import models
from django.shortcuts import render, redirect, get_object_or_404

from accounts.modules.Client import Client, PersonnePhysique, PersonneMorale
from accounts.modules.Utilisateur import Utilisateur
from docs.modules.Dossier import Dossier
from accounts.modules.Audit import AuditLog


def _base_context(extra=None):
    ctx = {
        'clients':      Client.objects.select_related(
                            'personne_physique', 'personne_morale'
                        ).all(),
        'utilisateurs': Utilisateur.objects.select_related('role').all(),
        'dossiers':     Dossier.objects.select_related('client').all(),
        'journal':      AuditLog.objects.select_related('utilisateur')
                                .order_by('-date_action')[:10],
        'open_modal':   None,
        'active_panel': 'dashboard',
    }
    if extra:
        ctx.update(extra)
    return ctx


def client_detail_api(request, client_id):
    """
    API JSON — retourne toutes les infos d'un client.
    Appelée par le JS du panel nouveau dossier.
    """
    client = get_object_or_404(
        Client.objects.select_related('personne_physique', 'personne_morale'),
        pk=client_id
    )

    data = {
        "id":         client.id,
        "type_client": client.type_client,
        "email":      client.email,
        "telephone":  client.telephone,
        "adresse":    client.adresse,
        "ville":      client.ville,
        "code_postal": client.code_postal,
        "pays":       client.pays,
        "est_actif":  client.est_actif,
    }

    if client.type_client == 'physique' and client.personne_physique:
        pp = client.personne_physique
        data["personne_physique"] = {
            "nom":                pp.nom,
            "prenom":             pp.prenom,
            "type_identite":      pp.type_identite,
            "numero_identite":    pp.numero_identite,
            "nationalite":        pp.nationalite,
            "profession":         pp.profession,
            "date_naissance":     str(pp.date_naissance) if pp.date_naissance else None,
            "lieu_naissance":     pp.lieu_naissance,
            "situation_familiale": pp.situation_familiale,
        }

    elif client.type_client == 'morale' and client.personne_morale:
        pm = client.personne_morale
        data["personne_morale"] = {
            "raison_sociale":       pm.raison_sociale,
            "sigle":                pm.sigle,
            "type_societe":         pm.type_societe,
            "numero_rc":            pm.numero_rc,
            "numero_patente":       pm.numero_patente,
            "identifiant_fiscal":   pm.identifiant_fiscal,
            "numero_cnss":          pm.numero_cnss,
            "ice":                  pm.ice,
            "representant_nom":     pm.representant_nom,
            "representant_prenom":  pm.representant_prenom,
            "representant_fonction": pm.representant_fonction,
            "capital_social":       str(pm.capital_social) if pm.capital_social else None,
            "devise":               pm.devise,
            "effectif":             pm.effectif,
            "date_creation_societe": str(pm.date_creation_societe) if pm.date_creation_societe else None,
        }

    return JsonResponse(data)

# def client_detail_api(request, client_id):

#     client = get_object_or_404(Client, pk=client_id)

#     if (client.type_client == 'morale') {
#         displayPersonnePhysiqueDetails(data);
#     } else if (client.type_client === 'physique') {

#     }

#     data = {
#         "id": client.id,
#         "nom": client.nom,
#         "prenom": client.prenom,
#         "email": client.email,
#         "telephone": client.telephone,
#         "type_client": client.type_client,  # "physique" ou "morale"
#         # ajoute d’autres champs si nécessaire
#     }


#     return JsonResponse(data)

def client_list(request):
    ctx = _base_context({'active_panel': 'clients'})
    return render(request, "dashboards/admin/base.html", ctx)

def _get_post(request, key):
    """Raccourci : récupère et strip une valeur POST."""
    return request.POST.get(key, '').strip()


def client_create_admin(request):
    if request.method != 'POST':
        return redirect('admin_dashboard')

    type_client = _get_post(request, 'type_client')  # 'physique' ou 'morale'
    email       = _get_post(request, 'email')
    telephone   = _get_post(request, 'telephone')
    adresse     = _get_post(request, 'adresse')
    ville       = _get_post(request, 'ville')
    pays        = _get_post(request, 'pays') or 'Maroc'

    # ── Validation commune ──
    if not email or type_client not in ('physique', 'morale'):
        messages.error(request, "Email et type de client sont obligatoires.")
        ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
        return render(request, "dashboards/admin/base.html", ctx)

    if Client.objects.filter(email=email).exists():
        messages.error(request, f"Un client avec l'email « {email} » existe déjà.")
        ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
        return render(request, "dashboards/admin/base.html", ctx)

    try:
        if type_client == 'physique':
            nom             = _get_post(request, 'nom')
            prenom          = _get_post(request, 'prenom')
            numero_identite = _get_post(request, 'numero_identite')
            type_identite   = _get_post(request, 'type_identite')

            if not nom or not prenom or not numero_identite:
                messages.error(request, "Nom, prénom et numéro d'identité sont obligatoires.")
                ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
                return render(request, "dashboards/admin/base.html", ctx)

            # 1. Créer PersonnePhysique
            pp = PersonnePhysique.objects.create(
                nom               = nom,
                prenom            = prenom,
                type_identite     = type_identite,
                numero_identite   = numero_identite,
                nationalite       = _get_post(request, 'nationalite'),
                profession        = _get_post(request, 'profession'),
                date_naissance    = request.POST.get('date_naissance') or None,
                lieu_naissance    = _get_post(request, 'lieu_naissance'),
                situation_familiale = _get_post(request, 'situation_familiale'),
            )

            # 2. Créer Client lié
            Client.objects.create(
                type_client        = 'physique',
                email              = email,
                telephone          = telephone,
                adresse            = adresse,
                ville              = ville,
                pays               = pays,
                personne_physique  = pp,
            )

        else:  # morale
            raison_sociale = _get_post(request, 'raison_sociale')

            if not raison_sociale:
                messages.error(request, "La raison sociale est obligatoire.")
                ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
                return render(request, "dashboards/admin/base.html", ctx)

            capital = request.POST.get('capital_social') or None
            if capital:
                try:
                    capital = float(capital)
                except ValueError:
                    capital = None

            # 1. Créer PersonneMorale
            pm = PersonneMorale.objects.create(
                raison_sociale          = raison_sociale,
                sigle                   = _get_post(request, 'sigle'),
                type_societe            = _get_post(request, 'type_societe'),
                numero_rc               = _get_post(request, 'numero_rc'),
                numero_patente          = _get_post(request, 'numero_patente'),
                identifiant_fiscal      = _get_post(request, 'identifiant_fiscal'),
                ice                     = _get_post(request, 'ice'),
                representant_nom        = _get_post(request, 'representant_nom'),
                representant_prenom     = _get_post(request, 'representant_prenom'),
                representant_fonction   = _get_post(request, 'representant_fonction'),
                capital_social          = capital,
                date_creation_societe   = request.POST.get('date_creation_societe') or None,
            )

            # 2. Créer Client lié
            Client.objects.create(
                type_client      = 'morale',
                email            = email,
                telephone        = telephone,
                adresse          = adresse,
                ville            = ville,
                pays             = pays,
                personne_morale  = pm,
            )

        messages.success(request, "Client créé avec succès.")
        return redirect('admin_dashboard')

    except Exception as e:
        messages.error(request, f"Erreur lors de la création : {e}")
        ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
        return render(request, "dashboards/admin/base.html", ctx)


def client_create_operateur(request):
    """Même logique, redirige vers le dashboard opérateur."""
    if request.method != 'POST':
        return redirect('operateur_dashboard')

    # Réutilise exactement la même logique — délègue à client_create_admin
    # en changeant seulement le template de retour en cas d'erreur
    type_client = _get_post(request, 'type_client')
    email       = _get_post(request, 'email')

    if not email or type_client not in ('physique', 'morale'):
        messages.error(request, "Email et type de client sont obligatoires.")
        ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
        return render(request, "dashboards/operateur/base.html", ctx)

    # ... (même code que client_create_admin, remplacer le template de fallback)
    # Pour éviter la duplication, appelle la même fonction helper :
    return _create_client(request, redirect_url='operateur_dashboard',
                          error_template='dashboards/operateur/base.html')


def _create_client(request, redirect_url, error_template):
    """Logique commune de création, utilisée par admin et opérateur."""
    type_client = _get_post(request, 'type_client')
    email       = _get_post(request, 'email')
    telephone   = _get_post(request, 'telephone')
    adresse     = _get_post(request, 'adresse')
    ville       = _get_post(request, 'ville')
    pays        = _get_post(request, 'pays') or 'Maroc'

    def error(msg):
        messages.error(request, msg)
        ctx = _base_context({'open_modal': 'add-client', 'active_panel': 'clients'})
        return render(request, error_template, ctx)

    if Client.objects.filter(email=email).exists():
        return error(f"L'email « {email} » est déjà utilisé.")

    try:
        if type_client == 'physique':
            nom             = _get_post(request, 'nom')
            prenom          = _get_post(request, 'prenom')
            numero_identite = _get_post(request, 'numero_identite')

            if not all([nom, prenom, numero_identite]):
                return error("Nom, prénom et numéro d'identité sont obligatoires.")

            pp = PersonnePhysique.objects.create(
                nom=nom, prenom=prenom,
                type_identite=_get_post(request, 'type_identite'),
                numero_identite=numero_identite,
                nationalite=_get_post(request, 'nationalite'),
                profession=_get_post(request, 'profession'),
                date_naissance=request.POST.get('date_naissance') or None,
                lieu_naissance=_get_post(request, 'lieu_naissance'),
                situation_familiale=_get_post(request, 'situation_familiale'),
            )
            Client.objects.create(
                type_client='physique', email=email,
                telephone=telephone, adresse=adresse,
                ville=ville, pays=pays, personne_physique=pp,
            )

        else:
            raison_sociale = _get_post(request, 'raison_sociale')
            if not raison_sociale:
                return error("La raison sociale est obligatoire.")

            capital = request.POST.get('capital_social') or None
            if capital:
                try: capital = float(capital)
                except ValueError: capital = None

            pm = PersonneMorale.objects.create(
                raison_sociale=raison_sociale,
                sigle=_get_post(request, 'sigle'),
                type_societe=_get_post(request, 'type_societe'),
                numero_rc=_get_post(request, 'numero_rc'),
                identifiant_fiscal=_get_post(request, 'identifiant_fiscal'),
                ice=_get_post(request, 'ice'),
                representant_nom=_get_post(request, 'representant_nom'),
                representant_prenom=_get_post(request, 'representant_prenom'),
                representant_fonction=_get_post(request, 'representant_fonction'),
                capital_social=capital,
                date_creation_societe=request.POST.get('date_creation_societe') or None,
            )
            Client.objects.create(
                type_client='morale', email=email,
                telephone=telephone, adresse=adresse,
                ville=ville, pays=pays, personne_morale=pm,
            )

        messages.success(request, "Client créé avec succès.")
        return redirect(redirect_url)

    except Exception as e:
        return error(f"Erreur inattendue : {e}")


def search_clients(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse([], safe=False)

    # Chercher dans PersonnePhysique ET PersonneMorale via Client
    clients = Client.objects.select_related(
        'personne_physique', 'personne_morale'
    ).filter(
        models.Q(personne_physique__nom__icontains=query)      |
        models.Q(personne_physique__prenom__icontains=query)   |
        models.Q(personne_physique__numero_identite__icontains=query) |
        models.Q(personne_morale__raison_sociale__icontains=query)    |
        models.Q(personne_morale__numero_rc__icontains=query)
    )[:10]

    data = []
    for c in clients:
        if c.personne_physique:
            pp = c.personne_physique
            data.append({
                'id':      c.id,
                'label':   f"{pp.prenom} {pp.nom}",
                'cin':     pp.numero_identite,
                'type':    'physique',
                'email':   c.email,
                'tel':     c.telephone,
            })
        elif c.personne_morale:
            pm = c.personne_morale
            data.append({
                'id':    c.id,
                'label': pm.raison_sociale,
                'cin':   pm.numero_rc,
                'type':  'morale',
                'email': c.email,
                'tel':   c.telephone,
            })

    return JsonResponse(data, safe=False)