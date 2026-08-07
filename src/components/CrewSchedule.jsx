import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Filter, Settings, Plane, X, Plus, GripVertical, Moon } from 'lucide-react';
import { startOfWeek, addDays, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import airportsData from '../data/airports.json';
import { mockCustomZones } from '../data';
import EventModal from './EventModal';

const LEGEND = {
  'Note': '#f59e0b', 
  'Off Duty': '#ef4444', 
  'On Duty': '#22c55e', 
  'Training': '#eab308', 
  'Vacation': '#3b82f6', 
  'Overnight': '#6b7280'
};

const CustomStatusDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'white' }}
      >
        {value && value !== 'Clear' ? (
          <><div style={{ width: 14, height: 14, backgroundColor: LEGEND[value], borderRadius: '2px' }}></div> {value}</>
        ) : (
          <span>-- Clear Status --</span>
        )}
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid var(--border-color)', zIndex: 500, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div 
            onClick={() => { onChange('Clear'); setIsOpen(false); }}
            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
          >
            -- Clear Status --
          </div>
          {Object.keys(LEGEND).map(s => (
            <div 
              key={s} 
              onClick={() => { onChange(s); setIsOpen(false); }}
              style={{ padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee' }}
            >
              <div style={{ width: 14, height: 14, backgroundColor: LEGEND[s], borderRadius: '2px' }}></div> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CrewSchedule = () => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [personnel, setPersonnel] = useState([]);
  const [flights, setFlights] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [visibleIds, setVisibleIds] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [cellModalOpen, setCellModalOpen] = useState(null); // { personId, dateStr, status, x, y }
  const [activeDuplicateStatus, setActiveDuplicateStatus] = useState(null);
  const [draggedPersonId, setDraggedPersonId] = useState(null);
  
  // Flight Modal state
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Add Schedule State
  const [addPilotId, setAddPilotId] = useState('');
  const [addDate, setAddDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addStatus, setAddStatus] = useState('On Duty');
  const [genPilotId, setGenPilotId] = useState('');
  const [genStartDate, setGenStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [genMode, setGenMode] = useState('7/7'); // '7/7' or 'specific'
  const [genDays, setGenDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const pilots = JSON.parse(localStorage.getItem('userPilots') || '[]');
    const pax = JSON.parse(localStorage.getItem('userPassengers') || '[]');
    const crewPax = pax.filter(p => p.isCrew);
    const passengerPax = pax.filter(p => !p.isCrew);
    const allPersonnel = [...pilots.map(p => ({ ...p, type: 'pilot' })),
                         ...crewPax.map(p => ({ ...p, type: 'crew' })),
                         ...passengerPax.map(p => ({ ...p, type: 'pax' }))];
    
    const savedOrder = JSON.parse(localStorage.getItem('crewOrder') || '[]');
    if (savedOrder.length > 0) {
      allPersonnel.sort((a, b) => {
         const idxA = savedOrder.indexOf(a.id);
         const idxB = savedOrder.indexOf(b.id);
         if (idxA === -1 && idxB === -1) return 0;
         if (idxA === -1) return 1;
         if (idxB === -1) return -1;
         return idxA - idxB;
      });
    }
    setPersonnel(allPersonnel);
    
    const savedVisibility = JSON.parse(localStorage.getItem('visibleCrew') || '[]');
    if (savedVisibility.length > 0) {
      setVisibleIds(savedVisibility);
    } else {
      // Default: show pilots and crew, hide passengers
      const defaultVisible = allPersonnel.filter(p => p.type !== 'pax').map(p => p.id);
      setVisibleIds(defaultVisible);
    }
    
    setFlights(JSON.parse(localStorage.getItem('userFlights') || '[]'));
    setSchedules(JSON.parse(localStorage.getItem('crewSchedules') || '{}'));

    const handleStorage = () => {
      setFlights(JSON.parse(localStorage.getItem('userFlights') || '[]'));
      setSchedules(JSON.parse(localStorage.getItem('crewSchedules') || '{}'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveSchedules = (newSched) => {
    setSchedules(newSched);
    localStorage.setItem('crewSchedules', JSON.stringify(newSched));
  };

  const toggleVisibility = (id) => {
    let newVis;
    if (visibleIds.includes(id)) newVis = visibleIds.filter(v => v !== id);
    else newVis = [...visibleIds, id];
    setVisibleIds(newVis);
    localStorage.setItem('visibleCrew', JSON.stringify(newVis));
  };

  const handleDropPerson = (targetPersonId) => {
    if (!draggedPersonId || draggedPersonId === targetPersonId) return;
    
    const newPersonnel = [...personnel];
    const draggedIdx = newPersonnel.findIndex(p => p.id === draggedPersonId);
    const targetIdx = newPersonnel.findIndex(p => p.id === targetPersonId);
    
    if (draggedIdx === -1 || targetIdx === -1) return;
    
    const [draggedItem] = newPersonnel.splice(draggedIdx, 1);
    newPersonnel.splice(targetIdx, 0, draggedItem);
    
    setPersonnel(newPersonnel);
    localStorage.setItem('crewOrder', JSON.stringify(newPersonnel.map(p => p.id)));
    setDraggedPersonId(null);
  };

  const handleCellClick = (personId, dateStr, status) => {
    const key = `${personId}_${dateStr}`;
    const newSched = { ...schedules };
    if (status === 'Clear' || !status) {
      delete newSched[key];
    } else if (newSched[key] === status) {
      delete newSched[key];
    } else {
      newSched[key] = status;
    }
    saveSchedules(newSched);
  };

  const handleSaveCellModal = () => {
    if (!cellModalOpen) return;
    const { personId, dateStr, status } = cellModalOpen;
    const key = `${personId}_${dateStr}`;
    const newSched = { ...schedules };
    if (status === 'Clear' || !status) {
      delete newSched[key];
    } else {
      newSched[key] = status;
    }
    saveSchedules(newSched);
    setCellModalOpen(null);
  };

  const handleSaveAddSchedule = () => {
    if (!addPilotId || !addDate || !addStatus) return;
    const key = `${addPilotId}_${addDate}`;
    const newSched = { ...schedules };
    newSched[key] = addStatus;
    saveSchedules(newSched);
    setAddScheduleOpen(false);
  };

  const runGenerator = () => {
    if (!genPilotId || !genStartDate) return;
    const newSched = { ...schedules };
    let currDate = new Date(genStartDate + 'T12:00:00Z');
    
    for (let day = 0; day < 365; day++) {
      const dateStr = currDate.toISOString().split('T')[0];
      const key = `${genPilotId}_${dateStr}`;
      
      let isOnDuty = false;
      if (genMode === '7/7') {
        isOnDuty = Math.floor(day / 7) % 2 === 0;
      } else {
        isOnDuty = genDays.includes(currDate.getUTCDay());
      }
      
      if (isOnDuty) {
        newSched[key] = 'On Duty';
      } else {
        delete newSched[key];
      }
      currDate.setDate(currDate.getDate() + 1);
    }
    saveSchedules(newSched);
    setGeneratorOpen(false);
  };

  const clearSchedule = () => {
    if (!genPilotId) return;
    if (!window.confirm("Are you sure you want to clear ALL scheduled statuses for this person?")) return;
    const newSched = { ...schedules };
    Object.keys(newSched).forEach(key => {
       if (key.startsWith(`${genPilotId}_`)) {
          delete newSched[key];
       }
    });
    saveSchedules(newSched);
    setGeneratorOpen(false);
  };

  const getFlightsForPersonAndDate = (personId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return flights.filter(f => {
      return (f.legs || []).some(l => {
         const lDate = l.date || (f.date ? f.date.split('T')[0] : null);
         const lArrDate = l.arrDate || lDate;
         if (!lDate) return false;
         if (dateStr >= lDate && dateStr <= lArrDate) {
            if (String(l.pilotId) === String(personId)) return true;
            if (l.passengers && l.passengers.includes(personId)) return true;
         }
         return false;
      });
    });
  };

  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeek, i));

  const getName = (loc) => {
    if (!loc) return '?';
    if (loc.type === 'airport') {
      const ap = airportsData.find(a => a.id === loc.id);
      return ap ? ap.id : loc.id;
    } else {
      let storedZones = [];
      try { storedZones = JSON.parse(localStorage.getItem('userCustomZones') || '[]'); } catch(e){}
      const cz = [...mockCustomZones, ...storedZones].find(c => c.id === loc.id);
      return cz ? (cz.id || cz.title) : loc.id;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', borderRadius: '8px 8px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn btn-outline" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft size={16}/></button>
          <h3 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </h3>
          <button className="btn btn-outline" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight size={16}/></button>
          <button className="btn btn-outline" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button className="btn btn-outline" onClick={() => setGeneratorOpen(true)}>
            <Settings size={16} /> Schedule Generator
          </button>
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button className="btn btn-outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <Filter size={16} /> Visible Personnel
            </button>

            {isFilterOpen && (
              <div style={{ position: 'absolute', top: '45px', right: '0', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', zIndex: 1000, width: '250px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Show/Hide Personnel</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {personnel.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={visibleIds.includes(p.id)}
                        onChange={() => toggleVisibility(p.id)}
                      />
                      <span>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#edf2f7', color: '#4a5568', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 500 }}>
                        {p.type === 'pilot' ? 'Pilot' : p.type === 'crew' ? 'Crew' : 'Passenger'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Mode Floating Banner */}
      {activeDuplicateStatus && (
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 6px 15px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Painting Status:</span>
            <div style={{ width: 14, height: 14, backgroundColor: LEGEND[activeDuplicateStatus], borderRadius: '2px' }}></div> 
            <strong>{activeDuplicateStatus}</strong>
          </div>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Click cells to assign)</span>
          <button className="btn btn-primary" style={{ border: '1px solid white', padding: '4px 12px', fontSize: '0.8rem', marginLeft: '10px' }} onClick={() => setActiveDuplicateStatus(null)}>Save Statuses</button>
        </div>
      )}

      {/* Gantt Grid */}
      <div style={{ flex: '1', overflow: 'auto', backgroundColor: '#f9fafb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--panel-bg)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            <tr>
              <th style={{ width: '200px', padding: '15px', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Crew / Passenger</th>
              {weekDays.map(day => (
                <th key={day.toString()} style={{ padding: '10px', borderRight: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{format(day, 'EEE')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{format(day, 'M/d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personnel.filter(p => visibleIds.includes(p.id)).map(person => (
              <tr 
                key={person.id} 
                draggable
                onDragStart={() => setDraggedPersonId(person.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropPerson(person.id)}
                style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  backgroundColor: draggedPersonId === person.id ? '#edf2f7' : 'white',
                }}
              >
                <td style={{ padding: '15px', borderRight: '1px solid var(--border-color)', fontWeight: 'bold', verticalAlign: 'middle', cursor: 'grab' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: '#cbd5e0' }}><GripVertical size={16} /></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: person.type === 'pilot' ? '#3b82f6' : person.type === 'crew' ? '#f59e0b' : '#10b981', flexShrink: 0 }}></div>
                    {person.name}
                  </div>
                </td>
                
                {weekDays.map(day => {
                  const dateStr = day.toISOString().split('T')[0];
                  const key = `${person.id}_${dateStr}`;
                  const cellStatus = schedules[key];
                  const dayFlights = getFlightsForPersonAndDate(person.id, day);
                  
                  return (
                    <td 
                      key={day.toString()} 
                      style={{ borderRight: '1px solid var(--border-color)', verticalAlign: 'top', padding: '4px', position: 'relative', cursor: activeDuplicateStatus ? 'crosshair' : 'pointer' }}
                      onClick={(e) => {
                         if (activeDuplicateStatus) {
                            handleCellClick(person.id, dateStr, activeDuplicateStatus);
                         } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            let x = rect.left;
                            let y = rect.bottom;
                            if (x > window.innerWidth - 300) x = window.innerWidth - 300;
                            if (y > window.innerHeight - 250) y = rect.top - 200;
                            setCellModalOpen({ personId: person.id, dateStr, status: cellStatus || 'On Duty', x, y });
                         }
                      }}
                    >
                      
                      {/* Status Background */}
                      {cellStatus && (
                         <div style={{ backgroundColor: LEGEND[cellStatus] || '#ccc', color: 'white', padding: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px', marginBottom: '4px' }}>
                           {cellStatus}
                         </div>
                      )}

                      {/* Flight Cards */}
                      {dayFlights.map(f => {
                         const color = f.tag === 'Emergency' ? '#ed8936' : f.tag === 'Maintenance' ? '#e53e3e' : '#8b5cf6';
                         const isOvernight = (f.legs || []).some(l => l.arrDate && l.date && l.arrDate > l.date);
                         return (
                           <div 
                             key={f.id} 
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedFlight(f);
                               setIsModalOpen(true);
                             }}
                             style={{ 
                               backgroundColor: color, color: 'white', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '4px',
                               cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', position: 'relative'
                             }}
                             title="Click to open flight card"
                           >
                             {isOvernight && (
                               <div 
                                 title="Overnight Flight"
                                 style={{
                                   position: 'absolute',
                                   top: '3px',
                                   right: '3px',
                                   backgroundColor: '#1a202c',
                                   color: '#f6e05e',
                                   padding: '2px',
                                   borderRadius: '50%',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                   zIndex: 5
                                 }}
                               >
                                 <Moon size={9} color="#f6e05e" fill="#f6e05e" />
                               </div>
                             )}
                             <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                               <Plane size={10} style={{ display: 'inline', marginRight: '4px' }}/>
                               #{f.flightNumber}
                             </div>
                             {f.legs && f.legs.length > 0 && f.legs.map((l, i) => (
                               <div key={i} style={{ opacity: 0.9 }}>
                                 {getName(l.departure)} &#8594; {getName(l.destination)}
                               </div>
                             ))}
                           </div>
                         );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
            {personnel.filter(p => visibleIds.includes(p.id)).length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No personnel visible. Use the filter to show crew or passengers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Legend */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', padding: '15px 20px', backgroundColor: 'var(--panel-bg)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
        <span style={{ marginRight: '10px' }}>LEGEND:</span>
        {Object.entries(LEGEND).map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: color, borderRadius: '2px' }}></div>
            {name}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
          Flight Assigned
        </div>
      </div>

      {/* 7/7 Generator Modal */}
      {generatorOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ width: '450px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Generate Schedule</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setGeneratorOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={`btn ${genMode === '7/7' ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setGenMode('7/7')}
                  style={{ flex: 1, padding: '8px' }}
                >
                  7/7 Rotation
                </button>
                <button 
                  className={`btn ${genMode === 'specific' ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setGenMode('specific')}
                  style={{ flex: 1, padding: '8px' }}
                >
                  Specific Days
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Personnel</label>
                <select className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} value={genPilotId} onChange={e => setGenPilotId(e.target.value)}>
                  <option value="">-- Select Personnel --</option>
                  {personnel.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Start Date</label>
                <input type="date" className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} value={genStartDate} onChange={e => setGenStartDate(e.target.value)} />
              </div>
              
              {genMode === 'specific' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Days of Week (On Duty)</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Sun', val: 0 }, { label: 'Mon', val: 1 }, { label: 'Tue', val: 2 },
                      { label: 'Wed', val: 3 }, { label: 'Thu', val: 4 }, { label: 'Fri', val: 5 }, { label: 'Sat', val: 6 }
                    ].map(day => (
                      <button
                        key={day.val}
                        onClick={() => {
                          if (genDays.includes(day.val)) setGenDays(genDays.filter(d => d !== day.val));
                          else setGenDays([...genDays, day.val].sort());
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: `1px solid ${genDays.includes(day.val) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          backgroundColor: genDays.includes(day.val) ? 'var(--primary-color)' : 'white',
                          color: genDays.includes(day.val) ? 'white' : 'var(--text-color)',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          flex: '1 1 auto'
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', fontSize: '0.85rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                <strong>Note:</strong> This will overwrite the next 365 days of their schedule with "On Duty" and "Off Duty" alternating weeks. Any manual adjustments previously made in that timeframe will be reset to the base rotation.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" style={{ color: '#e53e3e', borderColor: '#e53e3e', padding: '6px 12px' }} onClick={clearSchedule} disabled={!genPilotId}>Clear All for Person</button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setGeneratorOpen(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={runGenerator} disabled={!genPilotId || !genStartDate}>Generate 1-Year Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Popover for Cell Assignment */}
      {cellModalOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
            onClick={() => setCellModalOpen(null)}
          />
          <div 
            style={{ 
              position: 'fixed', 
              top: cellModalOpen.y, 
              left: cellModalOpen.x, 
              zIndex: 1000, 
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              width: '280px',
              padding: '12px',
              transform: 'translateY(5px)'
            }}
          >
            <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-color)', borderBottom: '1px solid #eee', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Assign Status ({cellModalOpen.dateStr})</span>
              <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setCellModalOpen(null)} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <CustomStatusDropdown 
                value={cellModalOpen.status} 
                onChange={v => setCellModalOpen({...cellModalOpen, status: v})}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
              <button className="btn btn-outline" style={{ color: '#e53e3e', borderColor: '#e53e3e', padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => { handleCellClick(cellModalOpen.personId, cellModalOpen.dateStr, 'Clear'); setCellModalOpen(null); }}>Clear</button>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button className="btn btn-outline" style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)', padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => { setActiveDuplicateStatus(cellModalOpen.status && cellModalOpen.status !== 'Clear' ? cellModalOpen.status : 'On Duty'); setCellModalOpen(null); }}>Duplicate</button>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={handleSaveCellModal}>Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Full Event Modal when a flight card is clicked */}
      {isModalOpen && selectedFlight && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFlight(null);
          }}
          flight={selectedFlight}
          onSave={(updatedFlight) => {
            try {
              const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
              const idx = storedFlights.findIndex(f => f.id === updatedFlight.id);
              let newFlights;
              if (idx >= 0) {
                newFlights = storedFlights.map(f => f.id === updatedFlight.id ? updatedFlight : f);
              } else {
                newFlights = [...storedFlights, updatedFlight];
              }
              localStorage.setItem('userFlights', JSON.stringify(newFlights));
              setFlights(newFlights);
              window.dispatchEvent(new Event('storage'));
            } catch(e) {
              console.error(e);
            }
            setIsModalOpen(false);
            setSelectedFlight(null);
          }}
          onDelete={(flightId) => {
            try {
              const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
              const newFlights = storedFlights.filter(f => f.id !== flightId);
              localStorage.setItem('userFlights', JSON.stringify(newFlights));
              setFlights(newFlights);
              window.dispatchEvent(new Event('storage'));
            } catch(e) {
              console.error(e);
            }
            setIsModalOpen(false);
            setSelectedFlight(null);
          }}
        />
      )}

    </div>
  );
};

export default CrewSchedule;
