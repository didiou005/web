// src/services/api.js
import axios from 'axios';

// En production, on veut généralement que l'API soit relative à la racine ou via une variable d'env
const API_BASE_URL = import.meta.env.VITE_API_URL || '/admin/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Service Auth
export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  },
  getMe: async () => {
    const { data } = await api.get('auth/me');
    return data;
  },
  getAllAdmins: async () => {
    const { data } = await api.get('auth/list');
    return data;
  },
  createAdmin: async (adminData) => {
    const { data } = await api.post('auth/register', adminData);
    return data;
  },
  updateAdmin: async (id, adminData) => {
    const { data } = await api.put(`auth/${id}`, adminData);
    return data;
  },
  deleteAdmin: async (id) => {
    const { data } = await api.delete(`auth/${id}`);
    return data;
  }
};

// Service Régions
export const regionsService = {
  getAll: async () => {
    const { data } = await api.get('regions');
    return data;
  },
  getMapData: async () => {
    const { data } = await api.get('regions/map-data');
    return data;
  },
  create: async (regionData) => {
    const { data } = await api.post('regions', regionData);
    return data;
  },
  update: async (id, regionData) => {
    const { data } = await api.put(`regions/${id}`, regionData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`regions/${id}`);
    return data;
  }
};

// Service Communes
export const communeService = {
  getAll: async () => {
    // Assuming backend has GET /api/communes (it was used in ComplaintForm)
    // If not, we might need to rely on the backend route we saw earlier 'getCommunes'
    // Let's assume standard REST endpoint
    const { data } = await api.get('communes'); // Adjust if route is different
    return data; 
  }
};

// Service Stats
export const statsService = {
  getStats: async (params) => {
    const { data } = await api.post('stats/stats', params);
    return data.data || [];
  },
  getFilteredKPIs: async (filters) => {
    const { data } = await api.post('stats/kpis', filters);
    return data.data;
  }
};

// Service Dashboard
export const dashboardService = {
  getKPIs: async () => {
    const { data } = await api.get('dashboard/kpis');
    return data.data;
  },
  getComplaintsTrend: async (days = 30) => {
    const { data } = await api.get(`dashboard/trend?days=${days}`);
    return data.data;
  },
  getRegionsStats: async () => {
    const { data } = await api.get('dashboard/regions-stats');
    return data.data;
  },
  getCommunesDistribution: async () => {
    const { data } = await api.get('dashboard/communes-distribution');
    return data.data;
  }
};

// Service Équipes
export const teamsService = {
  getAll: async () => {
    const { data } = await api.get('teams');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`teams/${id}`);
    return data.data;
  },
  getPerformance: async (id) => {
    const { data } = await api.get(`teams/${id}/performance`);
    return data.data;
  },
  create: async (teamData) => {
    const { data } = await api.post('teams', teamData);
    return data;
  },
  update: async (id, teamData) => {
    const { data } = await api.put(`teams/${id}`, teamData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`teams/${id}`);
    return data;
  }
};

// Service Employés
export const employeesService = {
  getAll: async () => {
    const { data } = await api.get('employees');
    return data;
  },
  create: async (employeeData) => {
    const { data } = await api.post('employees', employeeData);
    return data;
  },
  update: async (id, employeeData) => {
    const { data } = await api.put(`employees/${id}`, employeeData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`employees/${id}`);
    return data;
  }
};

// Service Plaintes (pour la carte)
export const complaintsService = {
  getComplaintsCoords: async (filters = {}) => {
    // Si l'endpoint n'existe pas encore, on simulera ou on l'ajoutera plus tard.
    // Pour l'instant on suppose un endpoint générique de recherche
    const { data } = await api.get('complaints/coords', { params: filters });
    return data; // Supposé retourner { data: [{lat, lng, type, status}, ...] }
  },
  getHeatmapData: async () => {
    const { data } = await api.get('complaints/heatmap');
    return data;
  },
  getAll: async (params) => {
    const { data } = await api.get('complaints', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`complaints/${id}`);
    return data;
  },
  updateStatus: async (id, statusData) => {
    const { data } = await api.patch(`complaints/${id}/status`, statusData);
    return data;
  },
  exportExcel: async (params) => {
    const response = await api.get('complaints/export/excel', { 
        params, 
        responseType: 'blob' 
    });
    return response;
  }
};

// Service Logs
export const logsService = {
  getLogs: async (params) => {
    const { data } = await api.get('logs', { params });
    return data;
  }
};

export default api;
