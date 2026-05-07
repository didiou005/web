// src/config/sidebarConfig.js
import { 
  LayoutDashboard, 
  AlertCircle, 
  Map, 
  Users, 
  Shield, 
  Settings,
  FileText
} from 'lucide-react';

export const sidebarConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { 
        id: 'overview', 
        label: 'Vue globale', 
        path: 'dashboard',
        developed: true 
      },
      { 
        id: 'statistics', 
        label: 'Statistiques', 
        path: 'dashboard/stats',
        developed: true 
      }
    ]
  },
  {
    id: 'complaints',
    label: 'Plaintes',
    icon: AlertCircle,
    path: 'complaints',
    developed: true
  },
  {
    id: 'map',
    label: 'Carte',
    icon: Map,
    path: 'map',
    developed: true
  },
  {
    id: 'regions',
    label: 'Régions',
    icon: Map,
    path: 'regions',
    developed: true
  },

  {
    id: 'employees',
    label: 'Employés',
    icon: Users,
    path: 'employees',
    developed: true
  },
  {
    id: 'teams',
    label: 'Équipes',
    icon: Users,
    path: 'teams',
    developed: true
  },
  {
    id: 'admins',
    label: 'Utilisateurs admin',
    icon: Shield,
    path: 'admin-users',
    developed: true
  },
  {
    id: 'logs',
    label: 'Journal d\'activité',
    icon: FileText,
    path: 'logs',
    developed: true
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    path: 'settings',
    developed: true
  }
];
