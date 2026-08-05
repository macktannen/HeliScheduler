import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, MapPin, Plus, Minus, ArrowDown, GripVertical, Plane, MessageSquare, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockPilots, mockCustomZones, mockAccounts, mockAircrafts, mockVendors } from '../data';
import airportsData from '../data/airports.json';
import tzlookup from 'tz-lookup';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import FlightLogTab from './FlightLogTab';
import ExpensesTab from './ExpensesTab';
import SaveButton from './SaveButton';

const getDefaultPilotForDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const schedules = JSON.parse(localStorage.getItem('crewSchedules') || '{}');
    let storedPilots = [];
    try {
      storedPilots = JSON.parse(localStorage.getItem('userPilots') || '[]');
    } catch(e) {}
    const allPilots = storedPilots.length > 0 ? storedPilots : mockPilots;

    // Find any key that ends with _dateStr and status === 'On Duty'
    for (const [key, status] of Object.entries(schedules)) {
      if (key.endsWith(`_${dateStr}`) && (status === 'On Duty' || status === 'Duty/Training')) {
        const rawPersonId = key.substring(0, key.lastIndexOf(`_${dateStr}`));
        // Check if rawPersonId is in pilots list
        const matchedPilot = allPilots.find(p => p.id === rawPersonId || p.name === rawPersonId);
        if (matchedPilot) return matchedPilot.id;
      }
    }
  } catch (e) {}
  return '';
};

const getDefaultPassengersForDate = (dateStr) => {
  if (!dateStr) return [];
  try {
    const schedules = JSON.parse(localStorage.getItem('crewSchedules') || '{}');
    let storedPax = [];
    try {
      storedPax = JSON.parse(localStorage.getItem('userPassengers') || '[]');
    } catch(e) {}
    
    const onDutyPax = [];
    for (const [key, status] of Object.entries(schedules)) {
      if (key.endsWith(`_${dateStr}`) && (status === 'On Duty' || status === 'Duty/Training')) {
        const rawPersonId = key.substring(0, key.lastIndexOf(`_${dateStr}`));
        const matchedPax = storedPax.find(p => p.id === rawPersonId || p.name === rawPersonId);
        if (matchedPax) {
          onDutyPax.push(matchedPax.id);
        }
      }
    }
    return onDutyPax;
  } catch (e) {}
  return [];
};

// --- CUSTOM ZONE CREATION MODAL ---
const CustomZoneModal = ({ isOpen, onClose, onSave, initialSearch }) => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hazards, setHazards] = useState('');

  useEffect(() => {
    if (initialSearch) {
      setTitle(initialSearch);
      setId(initialSearch.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6));
    }
  }, [initialSearch]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newZone = {
      id: id || `CZ-${Date.now().toString().slice(-4)}`,
      title,
      address,
      coordinates,
      contactName,
      contactPhone,
      hazards,
      usageCount: 1, // Start with 1 so it appears in recent
      type: 'custom'
    };
    onSave(newZone);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '20px'
    }}>
      <div className="card" style={{ width: '500px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>Create Custom Landing Zone</h3>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>ID / Abbreviation</label>
              <input type="text" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. HOSP1"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Location Name</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. North Hospital Helipad"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Address (Optional)</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St, City, ST"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>GPS Coordinates (Optional)</label>
            <input type="text" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} placeholder="e.g. 41.40338, 2.17403"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contact Name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Who to call"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contact Phone</label>
              <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone number"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--accent-color)' }}>Hazards / Notes</label>
            <textarea value={hazards} onChange={(e) => setHazards(e.target.value)} placeholder="e.g. Power lines on short final approach"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Save to Database</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- LOCATION SELECT ---
const LocationSelect = ({ value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const listRef = useRef(null);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the custom modal
      const customModal = document.getElementById('custom-zone-modal');
      if (customModal && customModal.contains(event.target)) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Fetch user-created zones from local storage to act as our persistent database
  const getStoredCustomZones = () => {
    try {
      return JSON.parse(localStorage.getItem('userCustomZones') || '[]');
    } catch (e) {
      return [];
    }
  };

  const getUsageCount = (id) => {
    try {
      const usageData = JSON.parse(localStorage.getItem('locationUsage') || '{}');
      return usageData[id] || 0;
    } catch (e) {
      return 0;
    }
  };

  const storedZones = getStoredCustomZones();

  const allLocations = [
    ...mockCustomZones.map(cz => {
      const override = storedZones.find(s => s.id === cz.id);
      const data = override || cz;
      return { ...data, isCustom: true, displayName: data.title, searchString: `${data.title} ${data.address || ''}`.toLowerCase(), usageCount: getUsageCount(data.id) };
    }),
    ...storedZones.filter(sz => sz.type === 'custom' && !mockCustomZones.find(c => c.id === sz.id)).map(cz => {
      return { ...cz, isCustom: true, displayName: cz.title, searchString: `${cz.title} ${cz.address || ''}`.toLowerCase(), usageCount: getUsageCount(cz.id) };
    }),
    ...airportsData.map(ap => {
      const override = storedZones.find(s => s.id === ap.id);
      const data = override || ap;
      return { ...data, isCustom: false, displayName: `${data.id} - ${data.title || data.name}`, searchString: `${data.id} ${data.title || data.name} ${data.address || data.municipality}`.toLowerCase(), usageCount: getUsageCount(data.id) };
    })
  ];

  const selectedDisplay = () => {
    if (!value) return placeholder || 'Select...';
    
    // First check custom zones or overrides
    const cz = [...mockCustomZones, ...storedZones].find(c => c.id === value.id);
    if (cz) return cz.title || cz.name || cz.id;

    // Then check raw airports
    if (value.type === 'airport') {
      const ap = airportsData.find(a => a.id === value.id);
      return ap ? `${ap.id} - ${ap.name}` : value.id;
    }
    
    return 'Custom Zone';
  };

  let displayList = [];
  if (search.trim() === '') {
    displayList = allLocations.filter(loc => loc.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount);
  } else {
    displayList = allLocations.filter(loc => loc.searchString.includes(search.toLowerCase())).sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  const visibleLocations = displayList.slice(0, visibleCount);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setVisibleCount(prev => Math.min(prev + 30, displayList.length));
    }
  };

  useEffect(() => {
    setVisibleCount(30);
  }, [search]);

  const handleSaveCustomZone = (newZone) => {
    // Save to local storage database
    const currentZones = getStoredCustomZones();
    localStorage.setItem('userCustomZones', JSON.stringify([...currentZones, newZone]));
    
    // Auto increment usage so it shows up in recents
    const usageData = JSON.parse(localStorage.getItem('locationUsage') || '{}');
    usageData[newZone.id] = (usageData[newZone.id] || 0) + 1;
    localStorage.setItem('locationUsage', JSON.stringify(usageData));

    // Select it
    onChange({ type: 'custom', id: newZone.id });
    setIsCustomModalOpen(false);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', flex: 1, minWidth: 0, zIndex: isOpen ? 100 : 1 }}>
      {label && <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>}
      <div 
        style={{ 
          padding: '0 8px', borderRadius: '4px', border: '1px solid var(--border-color)', 
          backgroundColor: 'white', display: 'flex', alignItems: 'center',
          height: '36px', width: '100%', boxSizing: 'border-box'
        }}
      >
        <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input 
          type="text"
          placeholder={placeholder || 'Select...'}
          value={isOpen ? search : (value ? selectedDisplay() : '')}
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          onChange={(e) => { setSearch(e.target.value); if(!isOpen) setIsOpen(true); }}
          style={{ 
            border: 'none', outline: 'none', background: 'transparent', width: '100%', 
            fontSize: '0.875rem', paddingLeft: '8px', color: 'inherit'
          }}
        />
      </div>

      {isOpen && !isCustomModalOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          backgroundColor: 'white', border: '1px solid var(--border-color)', 
          borderRadius: '4px', zIndex: 10, maxHeight: '300px', 
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-md)', marginTop: '4px', minWidth: '250px'
        }}>
          
          <div ref={listRef} onScroll={handleScroll} style={{ overflowY: 'auto', flex: 1 }}>
            {search.trim() === '' && displayList.length > 0 && (
               <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', backgroundColor: 'var(--bg-color)' }}>
                 Frequently Used
               </div>
            )}
            {search.trim() === '' && displayList.length === 0 && (
               <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>
                 Start typing to search...
               </div>
            )}

            {visibleLocations.map(loc => (
              <div 
                key={loc.isCustom ? `custom-${loc.id}` : `ap-${loc.id}`}
                onClick={() => { onChange({ type: loc.isCustom ? 'custom' : 'airport', id: loc.id }); setIsOpen(false); setSearch(''); }}
                style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.875rem' }}>{loc.isCustom ? loc.title : loc.id}</strong>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {loc.isCustom && <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>Custom LZ</span>}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {loc.isCustom ? loc.address : `${loc.name} - ${loc.municipality}, ${loc.state}`}
                </div>
              </div>
            ))}
            
            {/* Create Custom Location Button */}
            {search.trim() !== '' && (
              <div 
                onClick={() => setIsCustomModalOpen(true)}
                style={{ 
                  padding: '10px 12px', cursor: 'pointer', 
                  backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
                  fontWeight: '500', fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderTop: '1px solid var(--primary-color)'
                }}
              >
                <Plus size={16} /> Add "{search}" as new Custom LZ...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portal/Inline modal for custom zone creation */}
      <div id="custom-zone-modal">
        <CustomZoneModal 
          isOpen={isCustomModalOpen} 
          onClose={() => setIsCustomModalOpen(false)} 
          onSave={handleSaveCustomZone}
          initialSearch={search}
        />
      </div>
    </div>
  );
};


// --- EVENT MODAL ---
const EventModal = ({ isOpen, onClose, onSave, onDelete, onDuplicate, onNavigate, hasPrev, hasNext, initialDate, flight, flightsCount, defaultActiveView = 'Plan' }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  let initialDateStr = '';
  if (initialDate instanceof Date) {
     const y = initialDate.getFullYear();
     const m = String(initialDate.getMonth() + 1).padStart(2, '0');
     const d = String(initialDate.getDate()).padStart(2, '0');
     initialDateStr = `${y}-${m}-${d}`;
  } else if (typeof initialDate === 'string' && initialDate) {
     initialDateStr = initialDate.split('T')[0];
  } else if (flight?.date) {
     initialDateStr = flight.date.split('T')[0];
  } else {
     const now = new Date();
     const y = now.getFullYear();
     const m = String(now.getMonth() + 1).padStart(2, '0');
     const d = String(now.getDate()).padStart(2, '0');
     initialDateStr = `${y}-${m}-${d}`;
  }

  const [date, setDate] = useState(initialDateStr);
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber || `FLT-${Math.floor(Math.random() * 10000)}`);
  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [comments, setComments] = useState('');
  const [opsNotes, setOpsNotes] = useState('');
  const [activeTab, setActiveTab] = useState('Crew Notes');
  const [status, setStatus] = useState('on hold');
  const [tag, setTag] = useState('');
  
  const [activeView, setActiveView] = useState(defaultActiveView || 'Plan'); // 'Plan' or 'Log' or 'Expenses'
  const [flightLog, setFlightLog] = useState({});
  const [expenses, setExpenses] = useState([]);

  const [legs, setLegs] = useState([
    { departure: null, destination: null, takeoffTime: '08:00', landTime: '09:00', duration: 60, passengers: [], pilotId: getDefaultPilotForDate(initialDateStr), date: initialDateStr }
  ]);

  const [aircraftId, setAircraftId] = useState('');
  const [pilotsList, setPilotsList] = useState([]);
  const [aircraftList, setAircraftList] = useState([]);
  const [passengersList, setPassengersList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);

  useEffect(() => {
    try {
      const storedPilots = JSON.parse(localStorage.getItem('userPilots'));
      if (storedPilots && storedPilots.length > 0) setPilotsList(storedPilots);
      else setPilotsList(mockPilots);
    } catch(e) { setPilotsList(mockPilots); }

    try {
      const storedAircraft = JSON.parse(localStorage.getItem('userAircraft'));
      if (storedAircraft && storedAircraft.length > 0) setAircraftList(storedAircraft);
      else setAircraftList(mockAircrafts);
    } catch(e) { setAircraftList(mockAircrafts); }

    try {
      const storedPax = JSON.parse(localStorage.getItem('userPassengers'));
      if (storedPax && storedPax.length > 0) setPassengersList(storedPax);
    } catch(e) {}

    try {
      const storedAccounts = JSON.parse(localStorage.getItem('userAccounts'));
      if (storedAccounts && storedAccounts.length > 0) setAccountsList(storedAccounts);
      else setAccountsList(mockAccounts);
    } catch(e) { setAccountsList(mockAccounts); }

    try {
      const storedVendors = JSON.parse(localStorage.getItem('userVendors'));
      if (storedVendors && storedVendors.length > 0) setVendorsList(storedVendors);
      else setVendorsList(mockVendors);
    } catch(e) { setVendorsList(mockVendors); }
  }, []);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [draggableLegIndex, setDraggableLegIndex] = useState(null);

  useEffect(() => {
    setActiveView(defaultActiveView || 'Plan');
    if (flight) {
      setDate(flight.date ? flight.date.split('T')[0] : '');
      setFlightNumber(flight.flightNumber || '');
      setTitle(flight.title || '');
      setAccountId(flight.accountId || '');
      setComments(flight.comments || '');
      setOpsNotes(flight.opsNotes || '');
      setStatus(flight.status || 'confirmed');
      setTag(flight.tag || '');
      setFlightLog(flight.flightLog || {});
      setExpenses(flight.expenses || []);
      
      if (flight.legs && flight.legs.length > 0) {
        const mappedLegs = flight.legs.map((l, i) => {
          let dist = l.distance;
          if (!dist && l.departure && l.destination) {
             const coords1 = getLocationCoords(l.departure);
             const coords2 = getLocationCoords(l.destination);
             if (coords1 && coords2) {
                const rawDist = getDistanceNM(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
                if (rawDist !== null) dist = Math.round(rawDist);
             }
          }
          return {
            ...l,
            duration: l.duration || 60,
            distance: dist,
            passengers: l.passengers || (i === 0 && flight.passengers ? flight.passengers : []),
            pilotId: l.pilotId || (i === 0 && flight.pilotId ? flight.pilotId : ''),
            date: l.date || (flight.date ? flight.date.split('T')[0] : initialDateStr)
          };
        });
        setLegs(mappedLegs);
      } else {
        setLegs([{ departure: null, destination: null, takeoffTime: '08:00', landTime: '09:00', duration: 60, distance: null, passengers: [], pilotId: '', date: initialDateStr }]);
      }
      setAircraftId(flight.aircraftId || '');
    } else {
      setDate(initialDateStr);
      setFlightNumber(flightsCount + 1);
      setTitle('');
      setAccountId('');
      setComments('');
      setOpsNotes('');
      setStatus('on hold');
      setTag('');
      setFlightLog({});
      setExpenses([]);
      setAircraftId('');
      const defaultPilot = getDefaultPilotForDate(initialDateStr);
      const defaultPax = getDefaultPassengersForDate(initialDateStr);
      setLegs([{ 
        departure: null, 
        destination: null, 
        takeoffTime: '08:00', 
        landTime: '09:00', 
        duration: 60, 
        distance: null, 
        passengers: defaultPax, 
        pilotId: defaultPilot, 
        date: initialDateStr 
      }]);
    }
  }, [flight, initialDateStr, flightsCount, defaultActiveView]);

  if (!isOpen) return null;

  // Safely get timezone; fallback to browser TZ if missing
  const getLocationTimeZone = (locationVal) => {
    const coords = getLocationCoords(locationVal);
    if (coords && coords.lat && coords.lon) {
      try {
        return tzlookup(coords.lat, coords.lon);
      } catch (e) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const getTzAbbreviation = (timeZone, dateStr, timeStr) => {
    if (!timeZone) return '';
    try {
      const d = toDate(`${dateStr || new Date().toISOString().split('T')[0]}T${timeStr || '12:00'}:00`, { timeZone });
      return formatInTimeZone(d, timeZone, 'zzz');
    } catch(e) {
      return timeZone;
    }
  };

  const recalculateLegTimes = (legArray) => {
    const newLegs = [...legArray];
    
    for (let i = 0; i < newLegs.length; i++) {
      const leg = newLegs[i];
      if (i > 0) {
         const prevLeg = newLegs[i-1];
         const prevArrTz = getLocationTimeZone(prevLeg.destination);
         const currDepTz = getLocationTimeZone(leg.departure);
         const prevLandDate = prevLeg.arrDate || prevLeg.date || new Date().toISOString().split('T')[0];
         const prevLandTime = prevLeg.landTime || "09:00";
         
         const prevLandAbs = toDate(`${prevLandDate}T${prevLandTime}:00`, { timeZone: prevArrTz });
         const newTakeoffAbs = new Date(prevLandAbs.getTime() + 15 * 60000); // 15 mins layover
         
         leg.takeoffTime = formatInTimeZone(newTakeoffAbs, currDepTz, 'HH:mm');
         leg.date = formatInTimeZone(newTakeoffAbs, currDepTz, 'yyyy-MM-dd');
      }
      
      const depTz = getLocationTimeZone(leg.departure);
      const arrTz = getLocationTimeZone(leg.destination);
      const takeoffDate = leg.date || new Date().toISOString().split('T')[0];
      const takeoffTime = leg.takeoffTime || "08:00";
      const duration = leg.duration || 60;
      
      const depAbs = toDate(`${takeoffDate}T${takeoffTime}:00`, { timeZone: depTz });
      const arrAbs = new Date(depAbs.getTime() + duration * 60000);

      // Guard against invalid dates
      if (!isNaN(arrAbs.getTime())) {
        leg.landTime = formatInTimeZone(arrAbs, arrTz, 'HH:mm');
        leg.arrDate = formatInTimeZone(arrAbs, arrTz, 'yyyy-MM-dd');
      } else {
        leg.landTime = '';
        leg.arrDate = '';
      }
    }
    return newLegs;
  };

  const getDistanceNM = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 3440.065;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getLocationCoords = (locationVal) => {
    if (!locationVal || !locationVal.id) return null;
    if (locationVal.type === 'airport') {
      const ap = airportsData.find(a => a.id === locationVal.id);
      return ap ? { lat: ap.lat, lon: ap.lon } : null;
    } else {
      let storedZones = [];
      try { storedZones = JSON.parse(localStorage.getItem('userCustomZones') || '[]'); } catch(e){}
      const cz = [...mockCustomZones, ...storedZones].find(c => c.id === locationVal.id);
      if (!cz) return null;
      if (cz.lat && cz.lon) return { lat: parseFloat(cz.lat), lon: parseFloat(cz.lon) };
      if (cz.coordinates) {
        const parts = cz.coordinates.split(',');
        if (parts.length === 2) return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
      }
      return null;
    }
  };

  const calculateEstimatedMinutes = (dep, dest, acId) => {
    const coords1 = getLocationCoords(dep);
    const coords2 = getLocationCoords(dest);
    if (!coords1 || !coords2) return null;
    const distNM = getDistanceNM(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
    if (distNM === null) return null;
    let speed = 120;
    if (acId) {
      const ac = aircraftList.find(a => a.id === acId);
      if (ac && ac.maxCruiseSpeed) speed = ac.maxCruiseSpeed;
    }
    const minutes = Math.ceil((distNM / speed) * 60);
    return { mins: Math.max(1, minutes), nm: Math.round(distNM) };
  };

  const handleUpdateLeg = (index, field, value) => {
    let newLegs = [...legs];
    newLegs[index][field] = value;
    
    if (field === 'date') {
       newLegs[index].pilotId = getDefaultPilotForDate(value) || newLegs[index].pilotId;
    }
    
    if (field === 'departure' || field === 'destination') {
       const est = calculateEstimatedMinutes(newLegs[index].departure, newLegs[index].destination, aircraftId);
       if (est) {
         newLegs[index].duration = est.mins;
         newLegs[index].distance = est.nm;
         const depTz = getLocationTimeZone(newLegs[index].departure);
         const arrTz = getLocationTimeZone(newLegs[index].destination);
         const depAbs = toDate(`${newLegs[index].date || new Date().toISOString().split('T')[0]}T${newLegs[index].takeoffTime}:00`, { timeZone: depTz });
         const arrAbs = new Date(depAbs.getTime() + est.mins * 60000);
         if (!isNaN(arrAbs.getTime())) {
           newLegs[index].landTime = formatInTimeZone(arrAbs, arrTz, 'HH:mm');
           newLegs[index].arrDate = formatInTimeZone(arrAbs, arrTz, 'yyyy-MM-dd');
         } else {
           newLegs[index].landTime = '';
           newLegs[index].arrDate = '';
         }
         newLegs = recalculateLegTimes(newLegs);
       }
    } else if (field === 'landTime') {
         newLegs[index].landTime = value;
         if (newLegs[index].takeoffTime) {
            const depTz = getLocationTimeZone(newLegs[index].departure);
            const arrTz = getLocationTimeZone(newLegs[index].destination);
            const depAbs = toDate(`${newLegs[index].date || new Date().toISOString().split('T')[0]}T${newLegs[index].takeoffTime}:00`, { timeZone: depTz });
            let arrAbs = toDate(`${newLegs[index].arrDate || newLegs[index].date || new Date().toISOString().split('T')[0]}T${value}:00`, { timeZone: arrTz });
            
            let diffMins = (arrAbs.getTime() - depAbs.getTime()) / 60000;
            if (diffMins < 0) {
               arrAbs = new Date(arrAbs.getTime() + 24 * 60 * 60000);
               diffMins = (arrAbs.getTime() - depAbs.getTime()) / 60000;
               newLegs[index].arrDate = formatInTimeZone(arrAbs, arrTz, 'yyyy-MM-dd');
            }
            newLegs[index].duration = parseFloat(diffMins.toFixed(2));
         }
         if (index < newLegs.length - 1) {
            newLegs = recalculateLegTimes(newLegs);
         }
    } else if (field === 'duration') {
       const hours = parseFloat(value) || 0;
       const mins = Math.round(hours * 60);
       newLegs[index].duration = mins;
       newLegs = recalculateLegTimes(newLegs);
    } else if (field === 'takeoffTime' || field === 'date') {
       newLegs = recalculateLegTimes(newLegs);
    }
    
    setLegs(newLegs);
  };

  const handleSort = () => {
    let _legs = [...legs];
    const draggedItemContent = _legs.splice(dragItem.current, 1)[0];
    _legs.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    _legs = recalculateLegTimes(_legs);
    setLegs(_legs);
  };

  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    let newTakeoff = '10:00';
    let newDate = lastLeg.date;
    // Ensure we have a valid landTime before calculating next departure
    if (lastLeg.landTime) {
      const arrTz = getLocationTimeZone(lastLeg.destination);
      const arrAbs = toDate(`${lastLeg.arrDate || lastLeg.date}T${lastLeg.landTime}:00`, { timeZone: arrTz });
      const nextDepAbs = new Date(arrAbs.getTime() + 15 * 60000);
      if (!isNaN(nextDepAbs.getTime())) {
        newTakeoff = formatInTimeZone(nextDepAbs, arrTz, 'HH:mm');
        newDate = formatInTimeZone(nextDepAbs, arrTz, 'yyyy-MM-dd');
      }
    }
    const defaultPilot = getDefaultPilotForDate(newDate) || lastLeg.pilotId || '';
    const defaultPax = getDefaultPassengersForDate(newDate);
    const tempLegs = [...legs, { 
      departure: lastLeg.destination || null, 
      destination: null, 
      takeoffTime: newTakeoff, 
      landTime: '', 
      duration: 60, 
      distance: null, 
      passengers: defaultPax.length > 0 ? defaultPax : (lastLeg.passengers || []), 
      pilotId: defaultPilot,
      date: newDate
    }];
    setLegs(recalculateLegTimes(tempLegs));
  };

  const handleRemoveLeg = (index) => {
    let newLegs = legs.filter((_, i) => i !== index);
    if (newLegs.length > 0) {
       newLegs = recalculateLegTimes(newLegs);
    } else {
       newLegs = [{ departure: null, destination: null, takeoffTime: '08:00', landTime: '09:00', duration: 60, passengers: [], pilotId: getDefaultPilotForDate(date), date: date }];
    }
    setLegs(newLegs);
  };

  const incrementUsage = (locationId) => {
    if (!locationId) return;
    try {
      const usageData = JSON.parse(localStorage.getItem('locationUsage') || '{}');
      usageData[locationId] = (usageData[locationId] || 0) + 1;
      localStorage.setItem('locationUsage', JSON.stringify(usageData));
    } catch (e) {}
  };

  const handleSubmit = () => {
    legs.forEach(leg => {
      if (leg.departure && leg.departure.id) incrementUsage(leg.departure.id);
      if (leg.destination && leg.destination.id) incrementUsage(leg.destination.id);
    });

    const firstLeg = legs[0] || {};
    const passengers = firstLeg.passengers || [];

    onSave({
      id: flight ? flight.id : undefined,
      flightNumber,
      title,
      accountId,
      date: legs[0]?.date ? new Date(legs[0].date).toISOString() : new Date(date).toISOString(),
      aircraftId,
      comments,
      opsNotes,
      status,
      tag,
      legs,
      passengers,
      pilotId: firstLeg.pilotId || '',
      flightLog,
      expenses
    });
    
    setIsSaved(false);
    setTimeout(() => {
      setIsSaved(true);
    }, 50);
  };

  const isValidRoute = legs.every(l => l.departure !== null && l.destination !== null);
  
  const isValidExpenses = expenses.every(exp => {
    const isFilled = exp.vendor || exp.category || exp.location || exp.amount || exp.description || exp.payer || exp.fuelType || exp.gallons;
    if (!isFilled) return true;
    return exp.vendor && exp.category && exp.location && (exp.amount !== '' && exp.amount != null);
  });
  
  const canSave = isValidRoute && isValidExpenses;
  
  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}H ${m}M`;
  };

  const getLocationDetails = (locVal) => {
    if (!locVal || !locVal.id) return { display: '', city: '' };
    if (locVal.type === 'airport') {
      const ap = airportsData.find(a => a.id === locVal.id);
      return ap ? { display: ap.id, city: `${ap.municipality || ap.name}, ${ap.state}`, name: ap.name } : { display: locVal.id, city: '' };
    } else {
      let storedZones = [];
      try { storedZones = JSON.parse(localStorage.getItem('userCustomZones') || '[]'); } catch(e){}
      const cz = [...mockCustomZones, ...storedZones].find(c => c.id === locVal.id);
      if (!cz) return { display: locVal.id, city: '' };
      return { display: cz.title, city: cz.address || 'Custom LZ', name: cz.title };
    }
  };

  return (
    <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: '5vh', left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 1000, padding: '10px'
        }}
      >
      <div 
          onClick={(e) => e.stopPropagation()}
          style={{ width: '95vw', maxWidth: '1400px', height: '90vh', maxHeight: '90vh', backgroundColor: '#f4f5f7', borderRadius: '8px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
        >
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderBottom: '2px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '2px' }}>
               <button type="button" onClick={() => onNavigate && onNavigate('prev')} style={{ background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default', padding: '4px', display: 'flex', alignItems: 'center' }} disabled={!hasPrev}>
                 <ChevronLeft size={24} color={hasPrev ? "var(--primary-color)" : "#cbd5e0"}/>
               </button>
               <button type="button" onClick={() => onNavigate && onNavigate('next')} style={{ background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default', padding: '4px', display: 'flex', alignItems: 'center' }} disabled={!hasNext}>
                 <ChevronRight size={24} color={hasNext ? "var(--primary-color)" : "#cbd5e0"}/>
               </button>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            
            {/* VIEW TOGGLE */}
            <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
               <button 
                 type="button"
                 onClick={() => setActiveView('Plan')}
                 style={{ 
                   border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer',
                   backgroundColor: activeView === 'Plan' ? 'white' : 'transparent',
                   color: activeView === 'Plan' ? 'var(--primary-color)' : 'var(--text-muted)',
                   boxShadow: activeView === 'Plan' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}
               >
                 Flight Plan
               </button>
               <button 
                 type="button"
                 onClick={() => setActiveView('Log')}
                 style={{ 
                   border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer',
                   backgroundColor: activeView === 'Log' ? 'white' : 'transparent',
                   color: activeView === 'Log' ? 'var(--primary-color)' : 'var(--text-muted)',
                   boxShadow: activeView === 'Log' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}
               >
                 Flight Log
               </button>
               <button 
                 type="button"
                 onClick={() => setActiveView('Expenses')}
                 style={{ 
                   border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer',
                   backgroundColor: activeView === 'Expenses' ? 'white' : 'transparent',
                   color: activeView === 'Expenses' ? 'var(--primary-color)' : 'var(--text-muted)',
                   boxShadow: activeView === 'Expenses' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}
               >
                 Expenses
               </button>
            </div>

            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>TRIP # <strong style={{ color: 'var(--text-color)' }}>{flightNumber || 'NEW'}</strong></div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' }}>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TITLE</span>
               <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ border: 'none', fontWeight: 'bold', fontSize: '1rem', outline: 'none', color: 'var(--text-color)', width: '100%' }} placeholder="Enter Trip Title..." />
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <select 
                 value={status} 
                 onChange={e => setStatus(e.target.value)} 
                 style={{ 
                   border: 'none', fontWeight: 'bold', outline: 'none', 
                   fontSize: '1rem', backgroundColor: 'transparent', cursor: 'pointer',
                   color: status === 'on hold' ? '#d69e2e' : 
                          status === 'confirmed' ? '#38a169' : 
                          status === 'completed' ? '#3182ce' : 
                          status === 'maintenance' ? '#805ad5' : 
                          status === 'canceled' ? '#e53e3e' : '#718096'
                 }}
               >
                 <option value="on hold">On Hold</option>
                 <option value="confirmed">Confirmed</option>
                 <option value="completed">Completed</option>
                 <option value="maintenance">Maintenance</option>
                 <option value="canceled">Canceled</option>
               </select>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>ACCOUNT</span>
               <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{ border: 'none', fontWeight: '500', outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent', cursor: 'pointer' }}>
                 <option value="">Select Account...</option>
                 {accountsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>AIRCRAFT</span>
               <select value={aircraftId} onChange={e => {
                  const newAcId = e.target.value;
                  setAircraftId(newAcId);
                  let newLegs = [...legs];
                  let changed = false;
                  for (let i = 0; i < newLegs.length; i++) {
                     const est = calculateEstimatedMinutes(newLegs[i].departure, newLegs[i].destination, newAcId);
                     if (est) {
                       newLegs[i].duration = est.mins;
                       newLegs[i].distance = est.nm;
                       const depTz = getLocationTimeZone(newLegs[i].departure);
                       const arrTz = getLocationTimeZone(newLegs[i].destination);
                       const depAbs = toDate(`${newLegs[i].date || new Date().toISOString().split('T')[0]}T${newLegs[i].takeoffTime}:00`, { timeZone: depTz });
                       const arrAbs = new Date(depAbs.getTime() + est.mins * 60000);
                       newLegs[i].landTime = formatInTimeZone(arrAbs, arrTz, 'HH:mm');
                       newLegs[i].arrDate = formatInTimeZone(arrAbs, arrTz, 'yyyy-MM-dd');
                       changed = true;
                     }
                  }
                  if (changed) setLegs(recalculateLegTimes(newLegs));
               }} style={{ border: 'none', fontWeight: '500', outline: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }}>
                 <option value="">Select Aircraft...</option>
                 {aircraftList.map(a => <option key={a.id} value={a.id}>{a.id} ({a.model})</option>)}
               </select>
            </div>
            
            <div style={{ 
               backgroundColor: tag === 'Emergency' ? '#ed8936' : tag === 'Maintenance' ? '#e53e3e' : 'var(--primary-color)', 
               color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '5px' 
            }}>
              <BookOpen size={12}/> 
              <select value={tag} onChange={e => setTag(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                <option value="" style={{color: 'black'}}>TAGS</option>
                <option value="Emergency" style={{color: 'black'}}>Emergency</option>
                <option value="Maintenance" style={{color: 'black'}}>Maintenance</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="var(--text-muted)"/></button>
          </div>
        </div>

        {/* CONTENT AREA */}
        {activeView === 'Plan' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {legs.map((leg, index) => {
              const depLoc = getLocationDetails(leg.departure);
              const arrLoc = getLocationDetails(leg.destination);
              
              const depTz = getLocationTimeZone(leg.departure);
              const arrTz = getLocationTimeZone(leg.destination);
              const depTzLabel = getTzAbbreviation(depTz, leg.date, leg.takeoffTime);
              const arrTzLabel = getTzAbbreviation(arrTz, leg.arrDate || leg.date, leg.landTime);
              
              return (
                <React.Fragment key={index}>
                  <div 
                    draggable={draggableLegIndex === index}
                    onDragStart={(e) => (dragItem.current = index)}
                    onDragEnter={(e) => (dragOverItem.current = index)}
                    onDragEnd={() => { handleSort(); setDraggableLegIndex(null); }}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ 
                      display: 'flex', backgroundColor: 'white', borderRadius: index === 0 ? '8px 8px 0 0' : '0', 
                      border: '1px solid var(--border-color)', borderBottom: 'none', overflow: 'visible',
                      position: 'relative', zIndex: 1000 - index
                    }}
                  >
                    {/* Leg Number */}
                    <div style={{ width: '40px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', backgroundColor: '#fafbfc' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{index + 1}</div>
                      <div style={{ cursor: 'grab', marginTop: 'auto', paddingBottom: '4px' }} onMouseEnter={() => setDraggableLegIndex(index)} onMouseLeave={() => setDraggableLegIndex(null)}><GripVertical size={14} color="var(--text-muted)"/></div>
                    </div>

                    {/* Departure */}
                    <div style={{ flex: '1', padding: '4px 8px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <input type="date" value={leg.date} onChange={e => handleUpdateLeg(index, 'date', e.target.value)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', padding: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                           <input type="time" value={leg.takeoffTime} onChange={e => handleUpdateLeg(index, 'takeoffTime', e.target.value)} style={{ fontSize: '1rem', fontWeight: 'bold', color: '#48bb78', border: 'none', outline: 'none', cursor: 'pointer' }} />
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>[{depTzLabel}]</span>
                        </div>
                      </div>
                      <LocationSelect value={leg.departure} onChange={(val) => handleUpdateLeg(index, 'departure', val)} placeholder="Type origin..." />
                      {depLoc.display && (
                         <div style={{ marginTop: '2px' }}>
                           <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{depLoc.display}</div>
                           <div style={{ fontSize: '0.75rem' }}>{depLoc.name}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{depLoc.city}</span>
                              <span style={{ fontWeight: 'bold' }}>{leg.passengers.length} PAX</span>
                           </div>
                         </div>
                      )}
                    </div>

                    {/* Flight Path */}
                    <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{leg.distance || '?'} NM</div>
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', margin: '5px 0', width: '100%' }}>
                        <span style={{ flex: 1, borderTop: '2px dashed var(--border-color)' }}></span>
                        <Plane size={16} style={{ margin: '0 5px' }} />
                        <span style={{ flex: 1, borderTop: '2px dashed var(--border-color)' }}></span>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'orange' }}>
                        <input type="number" min="0" step="0.1" value={leg.duration ? parseFloat((leg.duration / 60).toFixed(2)) : ''} onChange={e => handleUpdateLeg(index, 'duration', e.target.value)} style={{ width: '40px', border: 'none', outline: 'none', textAlign: 'center', color: 'orange', fontWeight: 'bold' }} /> HR
                      </div>
                    </div>

                    {/* Arrival */}
                    <div style={{ flex: '1', padding: '4px 8px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <input type="date" value={leg.arrDate || leg.date} onChange={e => handleUpdateLeg(index, 'arrDate', e.target.value)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', padding: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                           <input type="time" value={leg.landTime} onChange={e => handleUpdateLeg(index, 'landTime', e.target.value)} style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-color)', border: 'none', outline: 'none', cursor: 'pointer' }} />
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>[{arrTzLabel}]</span>
                        </div>
                      </div>
                      <LocationSelect value={leg.destination} onChange={(val) => handleUpdateLeg(index, 'destination', val)} placeholder="Type destination..." />
                      {arrLoc.display && (
                         <div style={{ marginTop: '2px' }}>
                           <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{arrLoc.display}</div>
                           <div style={{ fontSize: '0.75rem' }}>{arrLoc.name}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{arrLoc.city}</span>
                           </div>
                         </div>
                      )}
                    </div>

                    {/* Crew & Pax (Right Sidebar) */}
                    <div style={{ width: '220px', padding: '4px 8px', borderLeft: '1px solid var(--border-color)', backgroundColor: '#fafbfc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                         <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Pilot / Crew</label>
                         <select value={leg.pilotId} onChange={e => handleUpdateLeg(index, 'pilotId', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', backgroundColor: 'white' }}>
                           <option value="">Select Pilot...</option>
                           {pilotsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Passengers ({leg.passengers.length})</label>
                         <select 
                           value="" 
                           onChange={e => {
                             if (!e.target.value) return;
                             const paxId = e.target.value;
                             const current = leg.passengers || [];
                             if (!current.includes(paxId)) {
                               handleUpdateLeg(index, 'passengers', [...current, paxId]);
                             }
                           }}
                           style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', backgroundColor: 'white' }}
                         >
                           <option value="">Add Passenger...</option>
                           {passengersList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                         {leg.passengers.length > 0 && (
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                             {leg.passengers.map(pId => {
                               const pax = passengersList.find(p => p.id === pId || p.name === pId);
                               return (
                                 <div key={pId} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                   {pax ? pax.name : pId}
                                   <X size={10} style={{ marginLeft: '4px', cursor: 'pointer' }} onClick={() => handleUpdateLeg(index, 'passengers', leg.passengers.filter(p => p !== pId))} />
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                       {legs.length > 1 && (
                         <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                           <button onClick={() => handleRemoveLeg(index)} style={{ background: 'none', border: 'none', color: 'red', fontSize: '0.75rem', cursor: 'pointer', padding: '0', width: 'fit-content' }}>Remove Leg</button>
                         </div>
                       )}
                    </div>
                  </div>
                  
                  {/* Layover/Flight Time Bar */}
                  <div style={{ backgroundColor: '#d1d5db', padding: '2px 8px', fontSize: '0.6rem', fontWeight: 'bold', color: '#4b5563', display: 'flex', gap: '30px', alignItems: 'center', border: '1px solid #9ca3af', borderTop: 'none', borderRadius: index === legs.length - 1 ? '0 0 8px 8px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12}/> {formatTime(leg.duration)} FLIGHT</div>
                    {index < legs.length - 1 && (() => {
                       const currLand = toDate(`${leg.arrDate || leg.date}T${leg.landTime}:00`, { timeZone: arrTz });
                       const nextDepTz = getLocationTimeZone(legs[index+1].departure);
                       const nextTakeoff = toDate(`${legs[index+1].date}T${legs[index+1].takeoffTime}:00`, { timeZone: nextDepTz });
                       let layover = (nextTakeoff.getTime() - currLand.getTime()) / 60000;
                       if (layover < 0) layover += 24 * 60;
                       return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>{formatTime(layover)} LAYOVER</div>
                       );
                    })()}
                  </div>
                </React.Fragment>
              );
            })}
            
            <div style={{ marginTop: '15px' }}>
              <button type="button" onClick={handleAddLeg} style={{ backgroundColor: 'white', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <Plus size={16}/> ADD LEG
              </button>
            </div>
          </div>

          {/* BOTTOM TABS */}
          <div style={{ backgroundColor: 'white', marginTop: 'auto', display: 'flex', borderTop: '1px solid var(--border-color)', height: '140px', flexShrink: 0 }}>
             <div style={{ width: '200px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {['Crew Notes', 'Operations Notes'].map(tab => (
                   <div 
                     key={tab} 
                     onClick={() => setActiveTab(tab)}
                     style={{ padding: '15px 20px', cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal', backgroundColor: activeTab === tab ? '#f4f5f7' : 'transparent', borderBottom: '1px solid var(--border-color)' }}
                   >
                     {tab}
                   </div>
                ))}
             </div>
             <div style={{ flex: 1, padding: '10px', backgroundColor: '#f4f5f7' }}>
                {activeTab === 'Crew Notes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                     <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Crew Notes</label>
                     <textarea 
                       value={comments} 
                       onChange={e => setComments(e.target.value)}
                       placeholder="Add notes for the crew..." 
                       style={{ flex: 1, width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'none', backgroundColor: 'white', fontSize: '0.8rem' }}
                     />
                  </div>
                )}
                {activeTab === 'Operations Notes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                     <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Operations Notes</label>
                     <textarea 
                       value={opsNotes} 
                       onChange={e => setOpsNotes(e.target.value)}
                       placeholder="Add internal operations notes..." 
                       style={{ flex: 1, width: '100%', padding: '15px', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'none', backgroundColor: 'white' }}
                     />
                  </div>
                )}
                {(activeTab !== 'Crew Notes' && activeTab !== 'Operations Notes') && (
                  <div style={{ color: 'var(--text-muted)' }}>No {activeTab.toLowerCase()} to display.</div>
                )}
             </div>
          </div>

        </div>
        ) : activeView === 'Log' ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
             <FlightLogTab 
                legs={legs} 
                flightLog={flightLog} 
                setFlightLog={setFlightLog}
                aircraftId={aircraftId}
                aircraftList={aircraftList}
                pilotsList={pilotsList}
             />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
             <ExpensesTab expenses={expenses} setExpenses={setExpenses} legs={legs} aircraftId={aircraftId} vendorsList={vendorsList} flightDate={date} />
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', width: '100%', padding: '15px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'white', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
           <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => flight && onDelete(flight.id)} disabled={!flight} className="btn btn-outline" style={{ color: '#e53e3e', borderColor: '#e53e3e', opacity: flight ? 1 : 0.5 }}>
                <Trash2 size={16}/> Delete
             </button>
           </div>
           <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => onDuplicate && onDuplicate({ title, accountId, legs, aircraftId, comments, opsNotes, status, tag })} className="btn btn-outline">
                <BookOpen size={16}/> Duplicate
             </button>
             <button className="btn btn-outline">
                <Plus size={16}/> Flight Uploads
             </button>
             <SaveButton onClick={handleSubmit} disabled={!canSave} triggerSave={isSaved}>Save Flight</SaveButton>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EventModal;
