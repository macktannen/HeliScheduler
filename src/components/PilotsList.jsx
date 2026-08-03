import React, { useState, useEffect } from 'react';
import { Search, User, Save, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { mockPilots } from '../data';

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const loadData = () => {
    let storedPilots = [];
    try {
      storedPilots = JSON.parse(localStorage.getItem('userPilots'));
      if (!storedPilots) {
        // First load: seed with mock pilots
        storedPilots = [...mockPilots].map(p => ({
          ...p,
          email: `${p.name.split(' ')[0].toLowerCase()}@example.com`,
          phone: '(555) 123-4567',
          medicalExpiration: '2027-01-01',
          certifications: 'CPL, IR',
          notes: ''
        }));
        localStorage.setItem('userPilots', JSON.stringify(storedPilots));
      }
    } catch (e) {
      console.error(e);
      storedPilots = [];
    }

    // Sort by name
    storedPilots.sort((a, b) => a.name.localeCompare(b.name));
    setPilots(storedPilots);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPilots = pilots.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (pilot) => {
    setSelectedPilot(pilot);
    setEditForm({ ...pilot, originalId: pilot.id });
  };

  const handleAddNew = () => {
    const newId = `P-${Date.now().toString().slice(-4)}`;
    const newPilot = {
      id: newId,
      name: 'New Pilot',
      status: 'Available',
      hoursLogged: 0,
      email: '',
      phone: '',
      medicalExpiration: '',
      certifications: '',
      notes: '',
      isNew: true
    };
    setSelectedPilot(newPilot);
    setEditForm(newPilot);
  };

  const handleDelete = () => {
    if (!editForm) return;
    if (!window.confirm(`Are you sure you want to delete ${editForm.name}?`)) return;
    try {
      const storedPilots = JSON.parse(localStorage.getItem('userPilots') || '[]');
      const updatedPilots = storedPilots.filter(p => p.id !== editForm.id);
      localStorage.setItem('userPilots', JSON.stringify(updatedPilots));
      loadData();
      setSelectedPilot(null);
      setEditForm(null);
    } catch (e) {
      alert('Failed to delete pilot.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editForm) return;

    try {
      const storedPilots = JSON.parse(localStorage.getItem('userPilots') || '[]');
      
      const pilotToSave = { ...editForm };
      const originalId = pilotToSave.originalId || pilotToSave.id;
      delete pilotToSave.isNew;
      delete pilotToSave.originalId;

      const existingIndex = storedPilots.findIndex(p => p.id === originalId);

      if (existingIndex >= 0) {
        storedPilots[existingIndex] = pilotToSave;
      } else {
        storedPilots.push(pilotToSave);
      }

      localStorage.setItem('userPilots', JSON.stringify(storedPilots));
      
      loadData();
      setSelectedPilot(pilotToSave);
      setEditForm({ ...pilotToSave, originalId: pilotToSave.id });
      alert('Pilot saved successfully!');
    } catch (e) {
      alert('Failed to save pilot.');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* LEFT COLUMN: LIST */}
      <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UsersIcon size={18} /> Pilots
          </h3>
          <button onClick={handleAddNew} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Add Pilot
          </button>
        </div>
        
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Search pilots..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '10px' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredPilots.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px', fontSize: '0.875rem' }}>
              No pilots found.
            </div>
          ) : (
            filteredPilots.map(pilot => (
              <div 
                key={pilot.id}
                onClick={() => handleSelect(pilot)}
                style={{
                  padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: selectedPilot?.id === pilot.id ? 'var(--primary-light)' : 'white',
                  borderLeft: selectedPilot?.id === pilot.id ? '4px solid var(--primary-color)' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '0.875rem' }}>{pilot.name}</strong>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px',
                    backgroundColor: pilot.status === 'Available' ? '#c6f6d5' : pilot.status === 'On Leave' ? '#fed7d7' : '#feebc8',
                    color: pilot.status === 'Available' ? '#22543d' : pilot.status === 'On Leave' ? '#822727' : '#7b341e'
                  }}>
                    {pilot.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                  <span>ID: {pilot.id}</span>
                  <span>{pilot.hoursLogged} hrs</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: EDITOR */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
        {!selectedPilot ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <User size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
            <h3>Select a Pilot</h3>
            <p style={{ fontSize: '0.875rem' }}>Click on a pilot from the left to view or edit their profile.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>
                  <input 
                    type="text" 
                    value={editForm.id} 
                    onChange={(e) => setEditForm({...editForm, id: e.target.value.toUpperCase()})}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', border: 'none', borderBottom: '2px dashed var(--border-color)', width: '150px', outline: 'none', backgroundColor: 'transparent', color: 'inherit' }}
                    placeholder="NEW-ID"
                    required
                  />
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name || ''} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
                <select 
                  value={editForm.status || 'Available'}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                >
                  <option value="Available">Available</option>
                  <option value="Duty/Training">Duty/Training</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {/* Contact Info */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-color)' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)' }}>Contact Information</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email || ''} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={editForm.phone || ''} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              
              {/* Pilot Credentials */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)' }}>Credentials & Hours</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Total Hours</label>
                    <input 
                      type="number" 
                      value={editForm.hoursLogged || 0} 
                      onChange={(e) => setEditForm({...editForm, hoursLogged: parseInt(e.target.value) || 0})}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Medical Expiration</label>
                    <input 
                      type="date" 
                      value={editForm.medicalExpiration || ''} 
                      onChange={(e) => setEditForm({...editForm, medicalExpiration: e.target.value})}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Certifications / Ratings</label>
                  <input 
                    type="text" 
                    value={editForm.certifications || ''} 
                    onChange={(e) => setEditForm({...editForm, certifications: e.target.value})}
                    placeholder="e.g. CPL, IR, CFI, NVG"
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--accent-color)' }}>Notes & Preferences</label>
              <textarea 
                value={editForm.notes || ''} 
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="e.g. Schedule preferences, training requirements..."
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '100px', resize: 'vertical', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!editForm.isNew && (
                  <button type="button" className="btn btn-outline" style={{ color: 'red', borderColor: 'red', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={handleDelete}>
                    <Trash2 size={16} /> Delete Pilot
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {JSON.stringify(editForm) !== JSON.stringify(selectedPilot) && (
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setEditForm({ ...selectedPilot })}
                  >
                    Discard Changes
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                  <Save size={16} /> Save Pilot
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PilotsList;
