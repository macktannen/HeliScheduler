import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, GripVertical, Moon } from 'lucide-react';
import { mockFlights, mockPilots, mockAircrafts, mockAccounts, mockCustomZones } from '../data';
import airportsData from '../data/airports.json';
import EventModal from './EventModal';

const getDefaultPilotForDate = (dateStr) => {
  try {
    const schedules = JSON.parse(localStorage.getItem('crewSchedules') || '{}');
    for (const [key, status] of Object.entries(schedules)) {
      if (key.endsWith(`_${dateStr}`) && status === 'On Duty') {
        return key.split('_')[0];
      }
    }
  } catch (e) {}
  return '';
};

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [flights, setFlights] = useState(() => {
    try {
      const stored = localStorage.getItem('userFlights');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return mockFlights;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingFlight, setEditingFlight] = useState(null);
  const [pilotsList, setPilotsList] = useState([]);
  const [passengersList, setPassengersList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [draggableFlightId, setDraggableFlightId] = useState(null);
  const [pendingDuplicateFlight, setPendingDuplicateFlight] = useState(null);
  const [crewSchedules, setCrewSchedules] = useState({});

  React.useEffect(() => {
    try {
      const storedPilots = JSON.parse(localStorage.getItem('userPilots'));
      if (storedPilots && storedPilots.length > 0) {
        setPilotsList(storedPilots);
      } else {
        setPilotsList(mockPilots);
      }
    } catch(e) {
      setPilotsList(mockPilots);
    }

    try {
      const storedPax = JSON.parse(localStorage.getItem('userPassengers'));
      if (storedPax && storedPax.length > 0) {
        setPassengersList(storedPax);
      }
    } catch(e) {
      setPassengersList([]);
    }

    try {
      const storedScheds = JSON.parse(localStorage.getItem('crewSchedules') || '{}');
      setCrewSchedules(storedScheds);
    } catch(e) {}

    try {
      const storedAccounts = JSON.parse(localStorage.getItem('userAccounts'));
      if (storedAccounts && storedAccounts.length > 0) setAccountsList(storedAccounts);
      else setAccountsList(mockAccounts);
    } catch(e) { setAccountsList(mockAccounts); }
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => setCurrentDate(addDays(monthStart, -1));
  const handleNextMonth = () => setCurrentDate(addDays(monthEnd, 1));

  const openModalForDate = (date) => {
    if (pendingDuplicateFlight) {
      const getNextFlightNumber = () => {
        if (flights.length === 0) return 1;
        const maxNum = Math.max(...flights.map(f => parseInt(f.flightNumber) || 0));
        return maxNum + 1;
      };
      
      const flightData = { ...pendingDuplicateFlight, date: date.toISOString(), id: Date.now(), flightNumber: getNextFlightNumber() };
      const updatedFlights = [...flights, flightData];
      setFlights(updatedFlights);
      localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
      setPendingDuplicateFlight(null);
      return;
    }
    setSelectedDate(date);
    setEditingFlight(null);
    setIsModalOpen(true);
  };

  const openModalForFlight = (flight) => {
    if (pendingDuplicateFlight) return; // Don't open if placing a duplicate
    setEditingFlight(flight);
    setIsModalOpen(true);
  };

  const handleSaveFlight = (flightData) => {
    let updatedFlights;
    let savedFlight = { ...flightData };
    if (editingFlight) {
      updatedFlights = flights.map(f => f.id === flightData.id ? flightData : f);
    } else {
      savedFlight.id = Date.now();
      updatedFlights = [...flights, savedFlight];
      setEditingFlight(savedFlight);
    }
    setFlights(updatedFlights);
    localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
    // Do not close modal automatically, allow user to continue editing or close manually
  };

  const handleDeleteFlight = (flightId) => {
    const updatedFlights = flights.filter(f => f.id !== flightId);
    setFlights(updatedFlights);
    localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
    setIsModalOpen(false);
  };

  const getFlightsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayFlights = flights.filter(f => {
      if (f.legs && f.legs.length > 0) {
        return f.legs.some(l => {
          const lDate = l.date || (f.date ? f.date.split('T')[0] : null);
          const lArrDate = l.arrDate || lDate;
          if (!lDate) return false;
          return dateStr >= lDate && dateStr <= lArrDate;
        });
      } else if (f.date) {
        return isSameDay(new Date(f.date), date);
      }
      return false;
    });

    return dayFlights.sort((a, b) => {
      const getFirstTime = (flight) => {
        if (!flight.legs || flight.legs.length === 0) return '23:59';
        const legsOnDay = flight.legs.filter(l => {
          const lDate = l.date || (flight.date ? flight.date.split('T')[0] : null);
          if (!lDate) return false;
          const d = new Date(lDate + 'T12:00:00Z');
          return d.getUTCFullYear() === date.getFullYear() && d.getUTCMonth() === date.getMonth() && d.getUTCDate() === date.getDate();
        });
        if (legsOnDay.length > 0 && legsOnDay[0].takeoffTime) {
          return legsOnDay[0].takeoffTime;
        }
        return '23:59';
      };
      return getFirstTime(a).localeCompare(getFirstTime(b));
    });
  };

  const handleDragStart = (e, flightId, sourceDay) => {
    e.dataTransfer.setData('flightId', flightId);
    if (sourceDay) {
      e.dataTransfer.setData('sourceDay', sourceDay.toISOString());
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    const flightId = e.dataTransfer.getData('flightId');
    const sourceDayStr = e.dataTransfer.getData('sourceDay');
    
    if (flightId) {
      const id = parseInt(flightId, 10);
      if (id && date) {
        const targetDateStr = format(date, 'yyyy-MM-dd');
        
        const updatedFlights = flights.map(f => {
          if (f.id === id) {
            const legs = f.legs || [];
            if (legs.length === 0) {
              return { ...f, date: date.toISOString() };
            }

            const sourceDepDate = sourceDayStr ? sourceDayStr.split('T')[0] : (legs[0]?.date || (f.date ? f.date.split('T')[0] : targetDateStr));
            
            let offsetDays = 0;
            if (sourceDepDate && sourceDepDate !== targetDateStr) {
               const sourceD = new Date(sourceDepDate + 'T12:00:00Z');
               const targetD = new Date(targetDateStr + 'T12:00:00Z');
               offsetDays = Math.round((targetD.getTime() - sourceD.getTime()) / (1000 * 60 * 60 * 24));
            }

            const newLegs = legs.map(l => {
               const lDepDateStr = l.date || sourceDepDate;
               const lArrDateStr = l.arrDate || lDepDateStr;

               const legMatchesSource = !sourceDayStr || legs.length === 1 || (sourceDepDate >= lDepDateStr && sourceDepDate <= lArrDateStr);

               if (legMatchesSource && offsetDays !== 0) {
                  let newDepDate = lDepDateStr;
                  let newArrDate = lArrDateStr;

                  if (lDepDateStr) {
                    const d = new Date(lDepDateStr + 'T12:00:00Z');
                    d.setDate(d.getDate() + offsetDays);
                    newDepDate = d.toISOString().split('T')[0];
                  }
                  if (lArrDateStr) {
                    const a = new Date(lArrDateStr + 'T12:00:00Z');
                    a.setDate(a.getDate() + offsetDays);
                    newArrDate = a.toISOString().split('T')[0];
                  }

                  if (newArrDate < newDepDate) {
                    newArrDate = newDepDate;
                  }

                  return {
                    ...l,
                    date: newDepDate,
                    arrDate: newArrDate,
                    pilotId: getDefaultPilotForDate(newDepDate) || l.pilotId
                  };
               }

               return l;
            });

            const sortedDates = newLegs.map(l => l.date).filter(Boolean).sort();
            const earliestDate = sortedDates[0] || targetDateStr;
            const newFlightDate = new Date(earliestDate + 'T12:00:00Z').toISOString();

            return { ...f, date: newFlightDate, legs: newLegs };
          }
          return f;
        });

        setFlights(updatedFlights);
        localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  const getStoredCustomZones = () => {
    try {
      return JSON.parse(localStorage.getItem('userCustomZones') || '[]');
    } catch (e) {
      return [];
    }
  };

  const getAircraftColor = (aircraftId) => {
    if (!aircraftId) return 'var(--primary-light)';
    const colors = [
      '#4376ac', // primary-light
      '#2a9d8f', // teal
      '#e76f51', // burnt orange
      '#1e3a8a', // royal blue
      '#059669', // emerald green
      '#b45309', // amber/brown
      '#374151', // slate grey
      '#0e7490', // cyan/ocean blue
    ];
    let hash = 0;
    for (let i = 0; i < aircraftId.length; i++) {
      hash = aircraftId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getName = (loc) => {
    if (!loc) return '?';
    if (loc.type === 'airport') {
      const ap = airportsData.find(a => a.id === loc.id);
      return ap ? ap.id : loc.id;
    } else {
      const storedZones = getStoredCustomZones();
      const cz = [...mockCustomZones, ...storedZones].find(c => c.id === loc.id);
      return cz ? (cz.id || cz.title) : loc.id;
    }
  };

  const renderRouteDetails = (flight, currentDay) => {
    if (flight.legs && flight.legs.length > 0) {
      const legsForDay = flight.legs.filter(l => {
         const lDate = l.date || (flight.date ? flight.date.split('T')[0] : null);
         if (!lDate) return true;
         const d = new Date(lDate + 'T12:00:00Z');
         return currentDay ? (d.getUTCFullYear() === currentDay.getFullYear() && d.getUTCMonth() === currentDay.getMonth() && d.getUTCDate() === currentDay.getDate()) : true;
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {legsForDay.map((leg, idx) => {
            const paxNames = (leg.passengers || []).map(pId => {
              const foundPax = passengersList.find(p => p.id === pId);
              return foundPax ? foundPax.name : pId;
            }).join(', ');

            return (
              <div key={idx} style={{ fontSize: '0.65rem', borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div><strong>{getName(leg.departure)}</strong> ({leg.takeoffTime}) &#8594; <strong>{getName(leg.destination)}</strong> ({leg.landTime})</div>
                {paxNames && <div style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>Pax: {paxNames}</div>}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Fallback for legacy mock flight route string / object
    return (
      <div style={{ fontSize: '0.7rem' }}>
        <strong>Time:</strong> {flight.takeoffTime} - {flight.landTime}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handlePrevMonth}><ChevronLeft size={16}/></button>
          <h2 style={{ minWidth: '150px', textAlign: 'center' }}>{format(currentDate, 'MMMM yyyy')}</h2>
          <button className="btn btn-outline" onClick={handleNextMonth}><ChevronRight size={16}/></button>
        </div>
        {pendingDuplicateFlight ? (
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Click a date to place the duplicated flight...</span>
            <button className="btn btn-outline" style={{ color: 'white', borderColor: 'white', padding: '4px 8px' }} onClick={() => setPendingDuplicateFlight(null)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => openModalForDate(new Date())}>
            <Plus size={16} /> Schedule Flight
          </button>
        )}
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dayFlights = getFlightsForDay(day);
          return (
            <div 
              key={day.toString()} 
              className={`calendar-cell ${!isSameMonth(day, monthStart) ? 'muted' : ''}`}
              onClick={() => openModalForDate(day)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, day);
              }}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <div className="day-number">
                {format(day, dateFormat)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayFlights.map(flight => {
                  const tagColor = flight.tag === 'Emergency' ? '#ed8936' : flight.tag === 'Maintenance' ? '#e53e3e' : '';
                  const firstLegPilots = flight.legs && flight.legs[0]
                    ? (flight.legs[0].pilots && flight.legs[0].pilots.length > 0 ? flight.legs[0].pilots : (flight.legs[0].pilotId ? [flight.legs[0].pilotId] : []))
                    : (flight.pilotId ? [flight.pilotId] : []);
                  const pilotName = firstLegPilots.map(pId => {
                    const p = pilotsList.find(item => String(item.id) === String(pId) || item.name === pId);
                    return p ? p.name : pId;
                  }).join(', ') || 'Unknown';
                  const account = accountsList.find(a => a.id === flight.accountId);
                  const accountName = account ? account.name : 'No Account';
                  
                  const firstLegDate = flight.legs && flight.legs[0] ? (flight.legs[0].date || (flight.date ? flight.date.split('T')[0] : null)) : null;
                  const isOvernight = (flight.legs || []).some(l => {
                    const depDate = l.date || (flight.date ? flight.date.split('T')[0] : null);
                    const arrDate = l.arrDate || depDate;
                    if (!depDate) return false;
                    return (arrDate > depDate) || (firstLegDate && depDate !== firstLegDate) || (firstLegDate && arrDate !== firstLegDate);
                  });

                  return (
                    <div 
                      key={flight.id} 
                      className="event-badge"
                      draggable
                      onDragStart={(e) => handleDragStart(e, flight.id, day)}
                      onDragEnd={() => setDraggableFlightId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModalForFlight(flight);
                      }}
                      style={{
                        whiteSpace: 'normal',
                        padding: '6px 8px',
                        lineHeight: '1.4',
                        backgroundColor: getAircraftColor(flight.aircraftId),
                        borderLeft: '4px solid rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        position: 'relative',
                        userSelect: 'text'
                      }}
                    >
                      {/* Top Right Overnight Symbol */}
                      {isOvernight && (
                        <div 
                          title="Overnight Flight (Spans multiple days)"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: '#1a202c',
                            color: '#f6e05e',
                            padding: '3px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            zIndex: 5
                          }}
                        >
                          <Moon size={11} color="#f6e05e" fill="#f6e05e" />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <div 
                          style={{ cursor: 'grab', marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={() => setDraggableFlightId(flight.id)}
                          onMouseLeave={() => setDraggableFlightId(null)}
                          onClick={(e) => e.stopPropagation()} // Prevent modal from opening when clicking drag handle
                        >
                          <GripVertical size={14} color="var(--primary-color)" style={{ opacity: 0.7 }} />
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span>#{flight.flightNumber}: {flight.title}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem' }}>{flight.aircraftId}</div>
                      <div style={{ fontSize: '0.7rem' }}>{accountName}</div>
                      <div style={{ fontSize: '0.7rem' }}><strong>{firstLegPilots.length > 1 ? 'Pilots:' : 'Pilot:'}</strong> {pilotName}</div>
                      
                      {renderRouteDetails(flight, day)}
                      
                      <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(255,255,255,0.4)', 
                          color: '#2d3748', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>{flight.status || 'Confirmed'}</span>
                        
                        {flight.tag && (
                          <span style={{ 
                            backgroundColor: flight.tag === 'Emergency' ? '#ed8936' : flight.tag === 'Maintenance' ? '#e53e3e' : '#e53e3e', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '0.65rem', 
                            fontWeight: 'bold' 
                          }}>
                            {flight.tag} {flight.tag === 'Emergency' || flight.tag === 'Maintenance' ? 'Flight' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', paddingTop: '8px' }}>
                {Object.keys(crewSchedules).map(key => {
                   const [pId, dateStr] = key.split('_');
                   const dayStr = day.toISOString().split('T')[0];
                   if (dateStr !== dayStr) return null;
                   
                   const status = crewSchedules[key];
                   const pilot = pilotsList.find(p => String(p.id) === String(pId) || p.name === pId);
                   const pax = passengersList.find(p => String(p.id) === String(pId) || p.name === pId);
                   if (!pilot && !pax) return null;
                   const name = pilot ? pilot.name : pax.name;
                   
                   const LEGEND = {
                     'Note': '#f59e0b', 
                     'Off Duty': '#ef4444', 
                     'On Duty': '#22c55e', 
                     'Training': '#eab308', 
                     'Vacation': '#3b82f6', 
                     'Overnight': '#6b7280'
                   };
                   const color = LEGEND[status] || '#ccc';

                   return (
                     <div key={key} style={{
                        backgroundColor: color,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                     }}>
                       <span>{name}</span>
                       <span style={{ opacity: 0.85, fontSize: '0.6rem', textTransform: 'uppercase' }}>{status}</span>
                     </div>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (() => {
        const sortedFlights = [...flights].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          const timeA = a.legs && a.legs[0] ? a.legs[0].takeoffTime : '00:00';
          const timeB = b.legs && b.legs[0] ? b.legs[0].takeoffTime : '00:00';
          return timeA.localeCompare(timeB);
        });
        
        const currentFlightIndex = editingFlight ? sortedFlights.findIndex(f => f.id === editingFlight.id) : -1;
        const hasPrev = currentFlightIndex > 0;
        const hasNext = currentFlightIndex !== -1 && currentFlightIndex < sortedFlights.length - 1;

        const handleNavigate = (direction) => {
          if (direction === 'prev' && hasPrev) {
            const prevFlight = sortedFlights[currentFlightIndex - 1];
            setEditingFlight(prevFlight);
            setSelectedDate(new Date(prevFlight.date));
          } else if (direction === 'next' && hasNext) {
            const nextFlight = sortedFlights[currentFlightIndex + 1];
            setEditingFlight(nextFlight);
            setSelectedDate(new Date(nextFlight.date));
          }
        };

        return (
          <EventModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveFlight}
            onDelete={handleDeleteFlight}
            onDuplicate={(flightData) => {
              setPendingDuplicateFlight(flightData);
              setIsModalOpen(false);
            }}
            onNavigate={handleNavigate}
            hasPrev={hasPrev}
            hasNext={hasNext}
            initialDate={selectedDate}
            flight={editingFlight}
            flightsCount={flights.length === 0 ? 0 : Math.max(...flights.map(f => parseInt(f.flightNumber) || 0))}
          />
        );
      })()}
    </div>
  );
};

export default CalendarView;
