
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Truck, 
  Clock, 
  MapPin, 
  Trash2, 
  Edit2, 
  UserPlus,
  Phone,
  Briefcase,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Check
} from 'lucide-react';
import { teamsService, regionsService, employeesService } from '../../services/api';
import { toast } from 'react-hot-toast';

const EmployeeSelect = ({ value, onChange, options, placeholder = "Sélectionner un agent..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Find selected option label
  const selectedOption = value === 'new' 
    ? { label: '➕ Nouveau membre (Saisie manuelle)', value: 'new' }
    : options.find(o => o.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="member-input"
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontWeight: value && value !== 'new' ? '600' : 'normal',
          color: value && value !== 'new' ? '#16a34a' : 'var(--text-primary)',
          background: value && value !== 'new' ? '#f0fdf4' : 'var(--bg-primary)',
          borderColor: value && value !== 'new' ? '#bbf7d0' : 'var(--border-color)'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} color="#9ca3af" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          marginTop: '4px',
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.1s ease-out'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                autoFocus
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            <div 
              onClick={() => { onChange('new'); setIsOpen(false); }}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              className={`dropdown-item ${value === 'new' ? 'active' : ''}`}
            >
              <div className="icon-box" style={{ 
                width: '24px', height: '24px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Plus size={14} />
              </div>
              Nouveau membre (Saisie manuelle)
            </div>
            
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  className={`dropdown-item ${value === opt.value ? 'selected' : ''}`}
                >
                   <span>{opt.label}</span>
                   {value === opt.value && <Check size={14} />}
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Aucun résultat pour "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .dropdown-item:hover { background-color: #f9fafb !important; }
      `}</style>
    </div>
  );
};

const Teams = () => {
  // --- States ---
  const [teams, setTeams] = useState([]);
  const [regions, setRegions] = useState([]);
  const [employees, setEmployees] = useState([]); // List of all employees
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModal, setViewModal] = useState(false);
  const [viewTeam, setViewTeam] = useState(null);
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'admin';

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    vehicle_info: '',
    working_hours: '08:00 - 16:00',
    region_id: '',
    members: []
  });

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, regionsRes, employeesRes] = await Promise.all([
        teamsService.getAll(),
        regionsService.getAll(),
        employeesService.getAll()
      ]);
      
      if (teamsRes.success) setTeams(teamsRes.data || []);
      if (regionsRes.success) setRegions(regionsRes.data || []);
      if (employeesRes.success) setEmployees(employeesRes.data || []);
      
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleOpenModal = (team = null) => {
    setViewModal(false); // Close view modal if open
    if (team) {
      setEditingTeam(team);
      // Fetch details with members
      fetchTeamDetails(team.id);
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        vehicle_info: '',
        working_hours: '08:00 - 16:00',
        region_id: regions[0]?.id || '',
        members: [{ id: null, full_name: '', role: 'Chef', phone: '' }] 
      });
      setShowModal(true);
    }
  };

  const handleViewTeam = async (team) => {
    try {
      // Fetch full details including members before showing
      const res = await teamsService.getById(team.id);
      if (res) {
        setViewTeam(res);
        setViewModal(true);
      }
    } catch (error) {
      toast.error('Impossible de charger les détails');
    }
  };

  const fetchTeamDetails = async (id) => {
    try {
      const res = await teamsService.getById(id);
      if (res) {
        setFormData({
          name: res.name || '',
          vehicle_info: res.vehicle_info || '',
          working_hours: res.working_hours || '08:00 - 16:00',
          region_id: res.region_id || '',
          members: res.members || []
        });
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Impossible de charger les détails de l\'équipe');
    }
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!formData.region_id) {
      toast.error('Veuillez sélectionner une zone d\'affectation');
      return;
    }

    try {
      let res;
      if (editingTeam) {
        res = await teamsService.update(editingTeam.id, formData);
        if (res.success) toast.success('Équipe mise à jour avec succès');
      } else {
        res = await teamsService.create(formData);
        if (res.success) toast.success('Nouvelle équipe créée');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteClick = (id) => {
    setTeamToDelete(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      const res = await teamsService.delete(teamToDelete);
      if (res.success) {
        toast.success('Équipe supprimée');
        setDeleteModal(false);
        setTeamToDelete(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de suppression');
    }
  };

  // Deprecated direct call, now we use handleDeleteClick
  const handleDeleteTeam = handleDeleteClick; 


  // --- Member Methods ---
  const addMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { id: null, full_name: '', role: 'Agent', phone: '' }]
    });
  };

  const removeMember = (index) => {
    const newMembers = [...formData.members];
    newMembers.splice(index, 1);
    setFormData({ ...formData, members: newMembers });
  };

  const updateMember = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const handleSelectEmployee = (index, employeeId) => {
    const newMembers = [...formData.members];
    
    if (employeeId === 'new') {
      // Reset to new member
      newMembers[index] = { id: null, full_name: '', role: 'Agent', phone: '' };
    } else {
      // Find existing employee
      const emp = employees.find(e => e.id === employeeId);
      if (emp) {
        newMembers[index] = { 
          id: emp.id, 
          full_name: emp.full_name, 
          role: emp.role, 
          phone: emp.phone 
        };
      }
    }
    setFormData({ ...formData, members: newMembers });
  };

  // --- Computed ---
  // Filter employees available for selection (not already in this team form, or is the current row's selection)
  // Actually, we can list all, maybe marking those already selected as disabled
  const getAvailableEmployees = (currentIndex) => {
     // Optional: Filter out employees already selected in other rows of this form
     const selectedIds = formData.members.map(m => m.id).filter(id => id);
     return employees.filter(e => !selectedIds.includes(e.id) || e.id === formData.members[currentIndex].id);
  };
  
  const filteredTeams = useMemo(() => {
    return teams.filter(t => 
      (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.region_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const stats = useMemo(() => ({
    total: teams.length,
    members: teams.reduce((acc, t) => acc + (parseInt(t.members_count) || 0), 0),
    vehicles: teams.filter(t => t.vehicle_info).length
  }), [teams]);

  // --- UI Components ---
  if (loading && teams.length === 0) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: '#6b7280', fontWeight: '500' }}>Chargement de la brigade...</p>
      </div>
    );
  }

  return (
    <div className="teams-container" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '4px' }}>
            Gestion des Équipes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Supervisez vos agents de collecte et leurs zones d'intervention.
          </p>
        </div>

      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Total Équipes', value: stats.total, icon: Users, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
          { label: 'Agents Actifs', value: stats.members, icon: ShieldCheck, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Véhicules Déployés', value: stats.vehicles, icon: Truck, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
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
            placeholder="Rechercher par nom d'équipe ou zone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '15px',
              transition: 'border-color 0.2s',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
            className="search-input"
          />
        </div>
        {userRole === 'super_admin' && (
        <button 
          onClick={() => handleOpenModal()} 
          className="add-team-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(22, 163, 74, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nouvelle Équipe</span>
        </button>
        )}
      </div>

      {/* Teams Grid / Table */}
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
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>BRIGADE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>ZONE D'AFFECTATION</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>LOGISTIQUE</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>MEMBRES</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border-color)' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Users size={64} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>Aucune équipe trouvée</p>
                    <p style={{ fontSize: '14px' }}>Commencez par créer une nouvelle brigade de collecte.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr 
                  key={team.id} 
                  className="table-row" 
                  style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => handleViewTeam(team)}
                >
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '14px', 
                        background: 'linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)'
                      }}>
                        <Briefcase size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{team.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)', fontFamily: 'monospace' }}>ID: {team.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      <div style={{ color: '#16a34a' }}><MapPin size={18} /></div>
                      <span>{team.region_name || 'Non affectée'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Truck size={14} />
                        <span>{team.vehicle_info || 'Pas de véhicule'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Clock size={14} />
                        <span>{team.working_hours || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '100px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#0369a1',
                      fontSize: '13px', fontWeight: '700'
                    }}>
                      <Users size={14} />
                      {team.members_count} membres
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {userRole === 'super_admin' && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(team); }}
                            className="action-btn edit"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                            className="action-btn delete"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- View Modal --- */}
      {viewModal && viewTeam && (
        <div className="modal-overlay" onClick={() => setViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--text-primary)' }}>Détails de l'équipe</h2>
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
                  <Briefcase size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{viewTeam.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MapPin size={16} />
                    <span>{viewTeam.region_name || 'Aucune zone affectée'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                 <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '12px' }}>
                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>VÉHICULE</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                     <Truck size={18} /> {viewTeam.vehicle_info || 'N/A'}
                   </div>
                 </div>
                 <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '12px' }}>
                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>HORAIRES</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                     <Clock size={18} /> {viewTeam.working_hours || 'N/A'}
                   </div>
                 </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                Membres de l'équipe ({viewTeam.members?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {viewTeam.members && viewTeam.members.length > 0 ? (
                  viewTeam.members.map((member, idx) => (
                    <div key={idx} style={{ 
                      padding: '12px', background: 'var(--white)', border: '1px solid var(--border-color)', 
                      borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(3, 105, 161, 0.1)', 
                          color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px'
                        }}>
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                           <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{member.full_name}</div>
                           <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '6px' }}>
                        <Phone size={14} /> {member.phone}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', background: 'var(--gray-50)', borderRadius: '12px' }}>
                    Aucun membre assigné
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => setViewModal(false)}
                  className="cancel-btn"
                >
                  Fermer
                </button>
                {userRole === 'super_admin' && (
                  <button 
                    onClick={() => handleOpenModal(viewTeam)}
                    className="submit-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Edit2 size={16} /> Modifier
                  </button>
                )}
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
               Êtes-vous sûr de vouloir supprimer cette équipe ? <br/>
               <span style={{ fontSize: '13px', color: '#f59e0b' }}>
                 (Les membres seront conservés mais désaffectés)
               </span>
             </p>
             <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                 onClick={() => setDeleteModal(false)}
                 className="cancel-btn"
                 style={{ flex: 1, justifyContent: 'center'}}
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

      {/* --- Edit/Create Modal Section (Existing) --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--text-primary)' }}>
                {editingTeam ? 'Éditer la Brigade' : 'Nouvelle Équipe'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="close-modal-btn"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Nom de l'équipe</label>
                  <input 
                    type="text" 
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Brigade Nord 1"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Zone d'intervention (Région)</label>
                  <select 
                    className="form-input"
                    value={formData.region_id}
                    required
                    onChange={(e) => setFormData({...formData, region_id: e.target.value})}
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">Sélectionner une zone</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Information Véhicule</label>
                  <div style={{ position: 'relative' }}>
                    <Truck size={18} className="input-icon" style={{ top: '12px' }} />
                    <input 
                      type="text" 
                      className="form-input with-icon"
                      value={formData.vehicle_info}
                      onChange={(e) => setFormData({...formData, vehicle_info: e.target.value})}
                      placeholder="Ex: Camion Benné 10T"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Horaires de travail</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={18} className="input-icon" style={{ top: '12px' }} />
                    <input 
                      type="text" 
                      className="form-input with-icon"
                      value={formData.working_hours}
                      onChange={(e) => setFormData({...formData, working_hours: e.target.value})}
                      placeholder="Ex: 08:00 - 16:00"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Members Section */}
              <div className="members-section">
                <div className="section-header">
                  <h3 className="section-title">Composition de l'équipe</h3>
                  <button 
                    type="button" 
                    onClick={addMember}
                    className="add-member-link"
                  >
                    <UserPlus size={16} /> Ajouter un agent
                  </button>
                </div>

                <div className="members-list">
                  {formData.members.map((member, idx) => (
                    <div key={idx} className="member-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <EmployeeSelect
                          value={member.id || 'new'}
                          onChange={(val) => handleSelectEmployee(idx, val)}
                          options={getAvailableEmployees(idx).map(emp => ({
                            value: emp.id,
                            label: `${emp.full_name} (${emp.role}) ${emp.team_name ? `- ${emp.team_name}` : ''}`
                          }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <input 
                            placeholder="Nom complet" 
                            className="member-input"
                            value={member.full_name}
                            required
                            disabled={!!member.id} // Disable editing if linked to existing employee
                            onChange={(e) => updateMember(idx, 'full_name', e.target.value)}
                          />
                        </div>
                        <div style={{ width: '130px' }}>
                          <select 
                            value={member.role}
                            className="member-input"
                            disabled={!!member.id} // Disable editing role here, edit in Employees page instead? Or allow override? Let's allow but it updates employee.
                             // Actually, updating here updates the employee in DB too thanks to our controller logic!
                             // So let's keep it ENABLED so they can change role on the fly.
                             onChange={(e) => updateMember(idx, 'role', e.target.value)}
                          >
                            <option value="Chef">Chef</option>
                            <option value="Agent">Agent</option>
                            <option value="Chauffeur">Chauffeur</option>
                          </select>
                        </div>
                        <div style={{ width: '150px' }}>
                          <input 
                            placeholder="Téléphone" 
                            className="member-input"
                            value={member.phone}
                            onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeMember(idx)}
                          className="delete-member-btn"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                >
                  {editingTeam ? 'Enregistrer les modifications' : 'Créer la brigade'}
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .table-row:hover {
          background-color: #f9fafb !important;
        }

        .action-btn {
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.edit:hover {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #16a34a;
          transform: translateY(-2px);
        }

        .action-btn.delete:hover {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
          transform: translateY(-2px);
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .member-input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .member-input:focus {
          border-color: #16a34a;
          background: var(--white);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          maxWidth: 750px;
          maxHeight: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          padding: 32px 32px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f3f4f6;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-title { font-size: 24px; fontWeight: 800; color: #111827; }

        .close-modal-btn {
          background: #f3f4f6;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }
        .close-modal-btn:hover { background: #e5e7eb; color: #111827; transform: rotate(90deg); }

        .modal-form { padding: 32px; }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          margin-bottom: 10px;
          font-weight: 700;
          font-size: 14px;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 15px;
          transition: all 0.2s;
          background: #f9fafb;
        }
        .form-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
          background: white;
          outline: none;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        .form-input.with-icon { padding-left: 40px; }

        .members-section {
          margin-top: 40px;
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title { font-size: 18px; fontWeight: 800; color: #111827; margin: 0; }

        .add-member-link {
          background: none;
          border: none;
          color: #16a34a;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .add-member-link:hover { text-decoration: underline; }

        .member-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
          background: #f9fafb;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid #f3f4f6;
        }

        .member-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
          outline: none;
        }
        .member-input:focus { border-color: #16a34a; background: white; }

        .delete-member-btn {
          color: #ef4444; border: none; background: none; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;
        }
        .delete-member-btn:hover { background: #fee2e2; }
        .delete-member-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .modal-footer {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 48px;
        }

        .cancel-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-weight: 600;
          color: #6b7280;
          
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-btn:hover { background: #f9fafb; color: #111827; }

        .submit-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          background: #111827;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .submit-btn:hover { background: #1f2937; transform: translateY(-1px); }
      `}</style>
    </div>
  );
};

export default Teams;
