import React, { useState, useEffect } from 'react';
import { Search, User, Save, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import SaveButton from './SaveButton';
import { mockPilots } from '../data';

const PilotsList = () => {
  const [pilots, setPilots] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saved, setSaved] = useState(false);

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

      const schedules = JSON.parse(localStorage.getItem('crewSchedules') || '{}');
      let changed = false;
      Object.keys(schedules).forEach(k => {
        if (k.startsWith(`${editForm.id}_`) || k.startsWith(`${editForm.name}_`)) {
          delete schedules[k];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('crewSchedules', JSON.stringify(schedules));
      }

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
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      {/* LEFT COLUMN: LIST */}
      <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '15px', height: '100%', boxSizing: 'border-box' }}>
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
            placeholder="Search by Name or ID..." 
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
                    fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', 
                    backgroundColor: pilot.status === 'Available' ? '#c6f6d5' : pilot.status === 'On Duty' ? '#feebc8' : '#fed7d7',
                    color: pilot.status === 'Available' ? '#22543d' : pilot.status === 'On Duty' ? '#744210' : '#742a2a'
                  }}>
                    {pilot.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--primary-color)' }}>{pilot.id}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{pilot.hoursLogged || 0} hrs</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: EDITOR */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
        {!selectedPilot ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <User size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
            <h3>Select a Pilot</h3>
            <p style={{ fontSize: '0.875rem' }}>Click on a pilot from the left to view or edit their profile.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '0px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.4rem' }}>
                  {editForm.name || 'New Pilot'}
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name || ''} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value, id: e.target.value})}
                  placeholder="e.g. John Smith"
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Status</label>
                <select 
                  value={editForm.status || 'Available'} 
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Total Flight Hours Logged</label>
                <input 
                  type="number" 
                  value={editForm.hoursLogged || 0} 
                  onChange={(e) => setEditForm({...editForm, hoursLogged: parseInt(e.target.value) || 0})}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Medical Expiration Date</label>
                <input 
                  type="date" 
                  value={editForm.medicalExpiration || ''} 
                  onChange={(e) => setEditForm({...editForm, medicalExpiration: e.target.value})}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email || ''} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={editForm.phone || ''} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Certifications & Ratings</label>
              <input 
                type="text" 
                value={editForm.certifications || ''} 
                onChange={(e) => setEditForm({...editForm, certifications: e.target.value})}
                placeholder="e.g. CPL, ATP, Instrument, NVG"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--accent-color)' }}>General Notes</label>
              <textarea 
                value={editForm.notes || ''} 
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="e.g. Schedule preferences, training requirements..."
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '60px', resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
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
                <SaveButton type="submit" triggerSave={saved}>
                  Save Pilot
                </SaveButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PilotsList;
