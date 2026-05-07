// src/pages/AdminUsers/index.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail, 
  Briefcase,
  AlertCircle,
  X,
  Plus,
  Search,
  ArrowUpDown,
  Pin,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

const AdminUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Nouveaux états pour la recherche et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('full_name'); 
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'admin',
    function: ''
  });
  const [error, setError] = useState('');
  const [isEmailManual, setIsEmailManual] = useState(false);


  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await authService.getAllAdmins();
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement admins:', err);
      toast.error('Impossible de charger la liste des administrateurs.');
    } finally {
      setLoading(false);
    }
  };

  // Logique de filtrage et tri
  const displayAdmins = React.useMemo(() => {
    // 1. Filtrer tous les utilisateurs
    const filtered = admins.filter(admin => 
      admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.function && admin.function.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Si on recherche, on traite tout le monde pareil (tri global)
    if (searchTerm.trim() !== '') {
      return [...filtered].sort((a, b) => {
        if (sortBy === 'last_login_at') {
          const dateA = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
          const dateB = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        const valA = String(a[sortBy] || '').trim();
        const valB = String(b[sortBy] || '').trim();
        const comparison = valA.localeCompare(valB, 'fr', { sensitivity: 'base' });
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // 3. Si pas de recherche : Pinned (Super Admin) d'abord, puis les autres triés
    const pinned = filtered.filter(admin => admin.role === 'super_admin');
    const others = filtered.filter(admin => admin.role !== 'super_admin')
      .sort((a, b) => {
        if (sortBy === 'last_login_at') {
          const dateA = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
          const dateB = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        const valA = String(a[sortBy] || '').trim();
        const valB = String(b[sortBy] || '').trim();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

    return [...pinned, ...others];
  }, [admins, searchTerm, sortBy, sortOrder]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      setIsEmailManual(true);
      setFormData(prev => ({ ...prev, email: value }));
    } else if (name === 'full_name' && !editMode && !isEmailManual) {
      // Générer le slug à la volée
      const slug = value
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, ".");
      
      setFormData(prev => ({ 
        ...prev, 
        full_name: value,
        email: `${slug}@nadhif.dz` 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setSelectedAdminId(null);
    setFormData({ email: '@nadhif.dz', password: '', full_name: '', role: 'admin', function: '' });
    setIsEmailManual(false);
    setShowPassword(false);
    setShowForm(true);
  };

  const handleOpenEdit = (admin) => {
    setEditMode(true);
    setSelectedAdminId(admin.id);
    setFormData({
      email: admin.email,
      password: '', // On ne pré-remplit pas le MDP pour des raisons de sécurité
      full_name: admin.full_name,
      role: admin.role,
      function: admin.function || ''
    });
    setShowPassword(false);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let response;
      if (editMode) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        response = await authService.updateAdmin(selectedAdminId, updateData);
      } else {
        response = await authService.createAdmin(formData);
      }

      if (response.success) {
        toast.success(editMode ? '✅ Compte modifié avec succès !' : '✅ Compte créé avec succès !');
        setShowForm(false);
        fetchAdmins();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'opération';
      setError(msg);
      toast.error(msg);
    }
  };

  const confirmDelete = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;
    try {
      setLoading(true);
      const response = await authService.deleteAdmin(adminToDelete.id);
      if (response.success) {
        setShowDeleteModal(false);
        setAdminToDelete(null);
        fetchAdmins();
        toast.success('✅ Compte supprimé avec succès !');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  if (loading && admins.length === 0) return <LoadingSpinner />;

  return (
    <div className="admin-manage-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Gestion des Administrateurs
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Configurez les accès et les rôles pour les utilisateurs du tableau de bord
        </p>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, email ou fonction..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={stopPropagation}
            onKeyUp={stopPropagation}
            onKeyPress={stopPropagation}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--green-primary)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <Plus size={20} />
          Nouveau compte
        </button>
      </div>

      {/* Liste des Admins */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th 
                onClick={() => toggleSort('full_name')}
                style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  NOM / EMAIL
                  <ArrowUpDown size={14} color={sortBy === 'full_name' ? 'var(--green-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('function')}
                style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  FONCTION
                  <ArrowUpDown size={14} color={sortBy === 'function' ? 'var(--green-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px' }}>RÔLE</th>
              <th 
                onClick={() => toggleSort('last_login_at')}
                style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  DERNIÈRE CONNEXION
                  <ArrowUpDown size={14} color={sortBy === 'last_login_at' ? 'var(--green-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {displayAdmins.map(admin => (
              <tr 
                key={admin.id} 
                style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  transition: 'background 0.2s',
                  background: admin.role === 'super_admin' ? 'rgba(22, 163, 74, 0.08)' : 'transparent' 
                }} 
              >
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {admin.role === 'super_admin' && (
                       <Pin size={14} style={{ color: 'var(--green-primary)', transform: 'rotate(45deg)' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{admin.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {admin.function || '-'}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    background: admin.role === 'super_admin' ? '#e0f2fe' : '#f3f4f6',
                    color: admin.role === 'super_admin' ? '#0369a1' : '#4b5563'
                  }}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenEdit(admin)}
                      title="Modifier"
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        color: 'var(--green-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <UserCheck size={18} />
                    </button>
                    {admin.email !== 'admin@nadhif.dz' && (
                      <button
                        onClick={() => confirmDelete(admin)}
                        title="Supprimer"
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          cursor: 'pointer',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de création/édition */}
      {showForm && createPortal(
        <div 
          onKeyDown={stopPropagation}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            width: '95%',
            maxWidth: '440px',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {editMode ? 'Modifier le compte' : 'Nouveau compte'}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {editMode ? 'Mettre à jour les accès' : 'Créer un nouvel accès'}
                </p>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                style={{ border: 'none', background: 'var(--bg-primary)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Nom complet</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  onKeyDown={stopPropagation}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyDown={stopPropagation}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Fonction</label>
                <input
                  type="text"
                  name="function"
                  value={formData.function}
                  onChange={handleInputChange}
                  onKeyDown={stopPropagation}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Mot de passe {editMode && '(opt.)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required={!editMode}
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={stopPropagation}
                    style={{ width: '100%', padding: '12px 48px 12px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#ffffff', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Annuler</button>
                <button type="submit" style={{ padding: '12px 28px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>{editMode ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* Styled Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div 
          onKeyDown={stopPropagation}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
              <Trash2 size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>Supprimer ce compte ?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer l'accès de <strong>{adminToDelete?.full_name}</strong> ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                onClick={handleDelete}
                disabled={loading}
                style={{ padding: '12px 28px', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
              >
                {loading ? 'Traitement...' : 'Oui, supprimer'}
              </button>
              <button 
                onClick={() => { setShowDeleteModal(false); setAdminToDelete(null); }}
                style={{ padding: '12px 24px', borderRadius: '12px', background: '#ffffff', color: '#475569', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      <style>{`
        @keyframes slideInToast {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;
