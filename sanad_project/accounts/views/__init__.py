from .auth import login_view, logout_view
from .dashboard import operateur_dashboard, admin_dashboard
from .utilisateur import utilisateur_list, utilisateur_create
from .client import client_list, client_create_admin, client_create_operateur
from .audit import audit_list, create_audit_entry