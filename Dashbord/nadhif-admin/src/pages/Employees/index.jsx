
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Trash2, 
  Edit2, 
  Briefcase,
  User,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import { employeesService, teamsService } from '../../services/api';
import { toast } from 'react-hot-toast';

const Employees = () => {
  // --- States ---
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const [viewModal, setViewModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'Agent',
    phone: '',
    team_id: ''
  });

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, teamsRes] = await Promise.all([
        employeesService.getAll(),
        teamsService.getAll()
      ]);
      
      if (empRes.success) setEmployees(empRes.data || []);
      if (teamsRes.success) setTeams(teamsRes.data || []);
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleOpenModal = (employee = null) => {
    setViewModal(false);
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        full_name: employee.full_name || '',
        role: employee.role || 'Agent',
        phone: employee.phone || '',
        team_id: employee.team_id || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        full_name: '',
        role: 'Agent',
        phone: '',
        team_id: ''
      });
    }
    setShowModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingEmployee) {
        res = await employeesService.update(editingEmployee.id, formData);
        if (res.success) toast.success('Employé mis à jour avec succès');
      } else {
        res = await employeesService.create(formData);
        if (res.success) toast.success('Nouvel employé ajouté');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleViewEmployee = (employee) => {
    setViewEmployee(employee);
    setViewModal(true);
  };

  const handleDeleteClick = (id) => {
    setEmployeeToDelete(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const res = await employeesService.delete(employeeToDelete);
      if (res.success) {
        toast.success('Employé supprimé');
        setDeleteModal(false);
        setEmployeeToDelete(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de suppression');
    }
  };

  // Deprecated direct call
  const handleDeleteEmployee = handleDeleteClick;

  // --- Computed ---
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      (e.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const stats = useMemo(() => ({
    total: employees.length,
    agents: employees.filter(e => e.role === 'Agent').length,
    chefs: employees.filter(e => e.role === 'Chef').length
  }), [employees]);

  // --- UI Components ---
  if (loading && employees.length === 0) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: '#6b7280', fontWeight: '500' }}>Chargement des effectifs...</p>
      </div>
    );
  }

  return (
    <div className="employees-container" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '4px' }}>
            Gestion des Employés
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Gérez l'ensemble du personnel et leurs affectations.
          </p>
        </div>

      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Effectif Total', value: stats.total, icon: Users, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
          { label: 'Agents de terrain', value: stats.agents, icon: Briefcase, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Chefs d\'équipe', value: stats.chefs, icon: Shield, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{
            background: 'var(--white)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '16px', borderRadius: '16px' }}>
              <stat.icon size={28} />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div style={{
        background: 'var(--white)',
        padding: '20px',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou rôle..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '15px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="add-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#16a34a',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="table-wrapper" style={{
        background: 'var(--white)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--gray-50)' }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>NOM COMPLET</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>RÔLE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>TÉLÉPHONE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>ÉQUIPE</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Users size={64} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>Aucun employé trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="table-row" 
                  style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => handleViewEmployee(emp)}
                >
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)'
                      }}>
                        <User size={20} />
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: emp.role === 'Chef' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: emp.role === 'Chef' ? '#d97706' : '#0369a1'
                    }}>
                      {emp.role}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--gray-500)' }}>
                    {emp.phone || '-'}
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    {emp.team_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        <Briefcase size={16} style={{ color: 'var(--gray-400)' }} />
                        {emp.team_name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Non assigné</span>
                    )}
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(emp); }}
                        className="action-btn edit"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }}
                        className="action-btn delete"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- View Modal --- */}
      {viewModal && viewEmployee && (
        <div className="modal-overlay" onClick={() => setViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--text-primary)' }}>Détails de l'employé</h2>
              <button onClick={() => setViewModal(false)} className="close-modal-btn">
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '16px', background: 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)'
                }}>
                  <User size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{viewEmployee.full_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: viewEmployee.role === 'Chef' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: viewEmployee.role === 'Chef' ? '#d97706' : '#0369a1'
                    }}>
                      {viewEmployee.role}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                 <div className="detail-block" style={{ padding: '16px', borderRadius: '12px' }}>
                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>TÉLÉPHONE</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                     <Phone size={18} /> {viewEmployee.phone || 'N/A'}
                   </div>
                 </div>
                 <div className="detail-block" style={{ padding: '16px', borderRadius: '12px' }}>
                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>AFFECTATION</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                     <Briefcase size={18} /> {viewEmployee.team_name || 'Non assigné'}
                   </div>
                 </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => setViewModal(false)}
                  className="cancel-btn"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => handleOpenModal(viewEmployee)}
                  className="submit-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Edit2 size={16} /> Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
             <div className="delete-icon-wrapper" style={{ 
               width: '64px', height: '64px', borderRadius: '20px', 
               margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
               <AlertCircle size={32} />
             </div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Confirmer la suppression</h3>
             <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '32px' }}>
               Êtes-vous sûr de vouloir supprimer cet employé ? <br/>
               <span style={{ fontSize: '13px', color: '#f59e0b' }}>
                 (Cette action est irréversible)
               </span>
             </p>
             <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                 onClick={() => setDeleteModal(false)}
                 className="cancel-btn"
                  style={{ flex: 1, justifyContent: 'center', background: '#ffffff', color: '#374151' }}
               >
                 Annuler
               </button>
               <button 
                 onClick={confirmDelete}
                 className="submit-btn"
                 style={{ 
                   flex: 1, 
                   background: '#ef4444', 
                   boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
                   justifyContent: 'center' 
                 }}
               >
                 Supprimer
               </button>
             </div>
          </div>
        </div>
      )}

      {/* --- Modal --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--text-primary)' }}>
                {editingEmployee ? 'Modifier l\'employé' : 'Nouvel Employé'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="close-modal-btn"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Nom complet</label>
                  <input 
                    type="text" 
                    required
                    className="form-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Ex: Ahmed Benali"
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Rôle</label>
                  <select 
                    className="form-input"
                    value={formData.role}
                    required
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="Agent">Agent</option>
                    <option value="Chef">Chef d'équipe</option>
                    <option value="Chauffeur">Chauffeur</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Téléphone</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Ex: 0550 12 34 56"
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Affectation (Équipe)</label>
                  <select 
                    className="form-input"
                    value={formData.team_id}
                    onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">Aucune affectation</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                   style={{ background: '#ffffff', borderColor: '#e5e7eb', color: '#374151' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                >
                  {editingEmployee ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Styles --- */}
      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(22, 163, 74, 0.1);
          border-left-color: #16a34a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .table-row:hover { background-color: #f9fafb !important; }

        .action-btn {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn.edit:hover { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
        .action-btn.delete:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          display: flex; alignItems: center; justifyContent: center;
          z-index: 2000; padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content {
          background: white; border-radius: 24px; width: 100%; max-width: 600px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          padding: 24px 32px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #f3f4f6;
        }
        .modal-title { font-size: 20px; font-weight: 800; color: #111827; }

        .close-modal-btn {
          background: #f3f4f6; border: none; width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280;
        }
        .close-modal-btn:hover { background: #e5e7eb; color: #111827; }

        .modal-form { padding: 32px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 13px; color: #374151; }
        .form-input {
          width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid #e5e7eb; font-size: 14px;
          background: #f9fafb; transition: all 0.2s;
        }
        .form-input:focus { border-color: #16a34a; background: white; outline: none; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1); }

        .modal-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px; }
         .cancel-btn {
          padding: 12px 24px; border-radius: 12px; border: 1px solid #e5e7eb; background: #ffffff;
          font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .cancel-btn:hover { background: #f9fafb; color: #111827; }
        
        .submit-btn {
          padding: 12px 28px; border-radius: 12px; border: none; background: #111827;
          color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .submit-btn:hover { background: #1f2937; transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }
      `}</style>
    </div>
  );
};

export default Employees;
