import React, { useState, useEffect } from 'react';
import { Download, FileText, Lock, Unlock, PenTool, Printer, Trash2 } from 'lucide-react';
import { authService } from '../services/authService';

const FlightLogTab = ({ legs, flightLog, setFlightLog, aircraftId, aircraftList, pilotsList }) => {
  const [log, setLog] = useState({
    legsActuals: legs.map(() => ({
      flightHrs: '', blockHrs: '', hobbs: '', engineCycles: '', landings: '', landingType: '', totalPax: ''
    })),
    signature: null, // { name: '', timestamp: '' }
    isLocked: false,
    auditLog: [],
    ...flightLog
  });

  const currentUser = authService.getCurrentUser() || { name: 'Admin', role: 'admin' };
  const isAdmin = currentUser?.role === 'admin';
  const legPilotId = legs[0]?.pilotId;
  const pilotName = pilotsList?.find(p => p.id === legPilotId)?.name;
  
  // Pilot can sign if their name matches the scheduled pilot, or if they are admin
  const canSign = currentUser?.name === pilotName || isAdmin;
  
  const isEditable = !log.isLocked;

  const [aircraft, setAircraft] = useState(null);
  
  useEffect(() => {
    // If we have an aircraft selected, we can pull its totals
    if (aircraftId && aircraftList) {
      const ac = aircraftList.find(a => a.id === aircraftId);
      if (ac) {
        setAircraft(ac);
        // Pre-fill initial aircraft totals if not already set
        if (!log.aircraftTotals) {
           setLog(prev => ({
             ...prev,
             aircraftTotals: {
               flightBefore: ac.totalHours || 0,
               hobbsBefore: ac.hobbs || 0,
               landingsBefore: ac.landings || 0,
               engine1Before: ac.engine1Hours !== undefined ? ac.engine1Hours : (ac.engineHours || ac.totalHours || 0),
               engine2Before: ac.engine2Hours || 0,
               cycles1Before: ac.engine1Cycles !== undefined ? ac.engine1Cycles : (ac.engineCycles || 0),
               cycles2Before: ac.engine2Cycles || 0,
               dualEngine: ac.dualEngine || false
             }
           }));
        }
      }
    }
  }, [aircraftId, aircraftList, log.aircraftTotals]);

  // Sync back to parent when log changes
  useEffect(() => {
    setFlightLog(log);
  }, [log, setFlightLog]);

  const handleUpdateLeg = (index, field, value) => {
    const newLegs = [...log.legsActuals];
    if (!newLegs[index]) {
       newLegs[index] = { flightHrs: '', blockHrs: '', hobbs: '', engineCycles: '', landings: '', landingType: '', totalPax: '' };
    }
    newLegs[index][field] = value;
    setLog(prev => ({ ...prev, legsActuals: newLegs }));
  };

  const calculateTotals = () => {
    let flight = 0, block = 0, hobbs = 0, pax = 0, cycles = 0, lndgs = 0;
    log.legsActuals.forEach(l => {
      flight += parseFloat(l.flightHrs || 0);
      block += parseFloat(l.blockHrs || 0);
      hobbs += parseFloat(l.hobbs || 0);
      pax += parseInt(l.totalPax || 0);
      cycles += parseInt(l.engineCycles || 0);
      lndgs += parseInt(l.landings || 0);
    });
    return { flight: flight.toFixed(1), block: block.toFixed(1), hobbs: hobbs.toFixed(1), pax, cycles, lndgs };
  };

  const totals = calculateTotals();

  // Auto-calculated changes based on legs
  const changeHobbs = parseFloat(totals.hobbs) || 0;
  const changeFlight = parseFloat(totals.flight) || 0;
  const changeLandings = totals.lndgs || 0;
  const changeEngineCycles = totals.cycles || 0;

  const updateGlobalAircraft = (multiplier = 1) => {
    if (!aircraftId) return;
    try {
      const storedAircraft = JSON.parse(localStorage.getItem('userAircraft') || '[]');
      const acIndex = storedAircraft.findIndex(a => a.id === aircraftId);
      if (acIndex >= 0) {
        const ac = storedAircraft[acIndex];
        ac.totalHours = Math.max(0, parseFloat(ac.totalHours || 0) + (changeFlight * multiplier)).toFixed(1);
        ac.engine1Hours = Math.max(0, parseFloat(ac.engine1Hours !== undefined ? ac.engine1Hours : (ac.engineHours || ac.totalHours || 0)) + (changeFlight * multiplier)).toFixed(1);
        ac.engineHours = ac.engine1Hours;
        ac.engine1Cycles = Math.max(0, parseInt(ac.engine1Cycles !== undefined ? ac.engine1Cycles : (ac.engineCycles || 0)) + (changeEngineCycles * multiplier));
        ac.engineCycles = ac.engine1Cycles;

        if (ac.dualEngine) {
          ac.engine2Hours = Math.max(0, parseFloat(ac.engine2Hours || 0) + (changeFlight * multiplier)).toFixed(1);
          ac.engine2Cycles = Math.max(0, parseInt(ac.engine2Cycles || 0) + (changeEngineCycles * multiplier));
        }

        ac.hobbs = Math.max(0, parseFloat(ac.hobbs || 0) + (changeHobbs * multiplier)).toFixed(1);
        ac.landings = Math.max(0, parseInt(ac.landings || 0) + (changeLandings * multiplier));
        localStorage.setItem('userAircraft', JSON.stringify(storedAircraft));
      }
    } catch(e) { console.error("Failed to update aircraft totals", e); }
  };

  const handleSign = () => {
    updateGlobalAircraft(1); // Add totals
    setLog(prev => ({
      ...prev,
      isLocked: true,
      signature: {
        name: currentUser.name || 'Pilot',
        timestamp: new Date().toLocaleString(),
        isoTimestamp: new Date().toISOString()
      }
    }));
  };

  const handleClearSignature = () => {
    updateGlobalAircraft(-1); // Revert totals
    setLog(prev => ({ ...prev, signature: null, isLocked: false, auditLog: [...(prev.auditLog || []), `Signature cleared by ${currentUser.name} on ${new Date().toLocaleString()}`] }));
  };
  
  const handleToggleLock = () => {
    const hoursSinceSign = log.signature?.isoTimestamp ? (Date.now() - new Date(log.signature.isoTimestamp).getTime()) / (1000 * 60 * 60) : 0;
    const canToggle = isAdmin || (canSign && hoursSinceSign <= 24);
    if (!canToggle) return;
    
    setLog(prev => {
      const newLocked = !prev.isLocked;
      const action = newLocked ? 'locked' : 'unlocked';
      if (newLocked) updateGlobalAircraft(1);
      else updateGlobalAircraft(-1);
      
      return {
        ...prev,
        isLocked: newLocked,
        auditLog: [...(prev.auditLog || []), `Log ${action} by Admin (${currentUser.name}) on ${new Date().toLocaleString()}`]
      };
    });
  };


  const formatLoc = (loc) => {
    if (!loc) return '';
    if (loc.type === 'airport') return loc.id;
    return loc.id || 'Custom';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', backgroundColor: '#f4f5f7', padding: '10px' }}>
      
      {/* 1. LEGS ACTUALS */}
      <div className="card" style={{ padding: '0', overflowX: 'auto', marginBottom: '10px' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr>
              <th style={{ borderRight: '1px solid #e2e8f0', padding: '2px 4px' }}></th>
              <th colSpan="3" style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '2px 4px', backgroundColor: '#e2e8f0' }}>Utilization</th>
              <th colSpan="3" style={{ textAlign: 'center', padding: '2px 4px', backgroundColor: '#edf2f7' }}>Cycles</th>
            </tr>
            <tr style={{ backgroundColor: '#f7fafc' }}>
              <th style={{ minWidth: '100px', padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>Trip</th>
              <th style={{ padding: '2px 4px' }}>Flight (Hrs)</th>
              <th style={{ padding: '2px 4px' }}>Block (Hrs)</th>
              <th style={{ borderRight: '1px solid #e2e8f0', padding: '2px 4px' }}>Hobbs</th>
              <th style={{ padding: '2px 4px' }}>Engine Cycles</th>
              <th style={{ padding: '2px 4px' }}>Landings (#)</th>
              <th style={{ padding: '2px 4px' }}>Landing Type</th>
              <th style={{ padding: '2px 4px' }}>Total Pax</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, index) => {
               const act = log.legsActuals[index] || {};
               return (
                 <tr key={index}>
                   <td style={{ fontWeight: 'bold', padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>{formatLoc(leg.departure)} &rarr; {formatLoc(leg.destination)}</td>
                   <td style={{ padding: '2px 4px' }}><input type="number" step="0.1" value={act.flightHrs} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'flightHrs', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                   <td style={{ padding: '2px 4px' }}><input type="number" step="0.1" value={act.blockHrs} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'blockHrs', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                   <td style={{ borderRight: '1px solid #e2e8f0', padding: '2px 4px' }}><input type="number" step="0.1" value={act.hobbs} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'hobbs', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                   <td style={{ padding: '2px 4px' }}><input type="number" value={act.engineCycles} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'engineCycles', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                   <td style={{ padding: '2px 4px' }}><input type="number" value={act.landings} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'landings', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                   <td style={{ padding: '2px 4px' }}>
                      <select value={act.landingType} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'landingType', e.target.value)} style={{ padding: '1px 2px', width: '70px', fontSize: '0.7rem' }}>
                         <option value="">Select...</option>
                         <option value="Day">Day</option>
                         <option value="Night">Night</option>
                         <option value="NVG">NVG</option>
                      </select>
                   </td>
                   <td style={{ padding: '2px 4px' }}><input type="number" value={act.totalPax} disabled={!isEditable} onChange={e => handleUpdateLeg(index, 'totalPax', e.target.value)} style={{ width: '50px', padding: '1px 2px', fontSize: '0.7rem' }} /></td>
                 </tr>
               );
            })}
            <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
              <td style={{ padding: '2px 4px', borderRight: '1px solid #e2e8f0' }}>Totals</td>
              <td style={{ padding: '2px 4px' }}>{totals.flight}</td>
              <td style={{ padding: '2px 4px' }}>{totals.block}</td>
              <td style={{ borderRight: '1px solid #e2e8f0', padding: '2px 4px' }}>{totals.hobbs}</td>
              <td style={{ padding: '2px 4px' }}>{totals.cycles}</td>
              <td style={{ padding: '2px 4px' }}>{totals.lndgs}</td>
              <td style={{ padding: '2px 4px' }}></td>
              <td style={{ padding: '2px 4px' }}>{totals.pax}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. SIGNATURE */}
      <div className="card" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center', padding: '6px 10px' }}>
        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signature</h4>
        <div style={{ display: 'flex', alignItems: 'center' }}>
           {log.signature ? (
             <div style={{ padding: '2px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f0fff4', color: '#276749', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ fontFamily: 'cursive', fontSize: '1rem', borderBottom: '1px solid #276749' }}>
                 {log.signature.name}
               </div>
               <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column' }}>
                  <span>By: {log.signature.name}</span>
                  <span>{log.signature.timestamp}</span>
               </div>
             </div>
           ) : (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 8px', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                <button type="button" className="btn btn-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={handleSign} disabled={!canSign}>
                  <PenTool size={12} style={{ marginRight: '4px' }} /> 
                  {canSign ? 'Sign Logbook' : 'Only assigned pilot or admin can sign'}
                </button>
             </div>
           )}
        </div>
      </div>

      {/* 3. AIRCRAFT TOTALS */}
      <div className="card" style={{ padding: '0', overflowX: 'auto', marginBottom: '10px' }}>
        <div style={{ padding: '4px 10px', backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem' }}>
          Aircraft Totals {aircraftId && `(${aircraftId})`}
        </div>
        <table className="data-table" style={{ width: '100%', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th style={{ width: '200px', padding: '2px 4px' }}>Meter</th>
              <th style={{ padding: '2px 4px' }}>Before</th>
              <th style={{ padding: '2px 4px' }}>After</th>
              <th style={{ width: '100px', textAlign: 'right', padding: '2px 4px' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '2px 4px' }}>Aircraft Hours</td>
              <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.flightBefore || 1100.2}</td>
              <td style={{ padding: '2px 4px' }}>{(parseFloat(log.aircraftTotals?.flightBefore || 1100.2) + changeFlight).toFixed(1)}</td>
              <td style={{ textAlign: 'right', color: changeFlight > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeFlight.toFixed(1)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '2px 4px' }}>Aircraft Landings</td>
              <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.landingsBefore || 450}</td>
              <td style={{ padding: '2px 4px' }}>{(parseInt(log.aircraftTotals?.landingsBefore || 450) + changeLandings)}</td>
              <td style={{ textAlign: 'right', color: changeLandings > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeLandings}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '2px 4px' }}>{log.aircraftTotals?.dualEngine ? 'Engine 1 Hours' : 'Engine Hours'}</td>
              <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.engine1Before || 1100.2}</td>
              <td style={{ padding: '2px 4px' }}>{(parseFloat(log.aircraftTotals?.engine1Before || 1100.2) + changeFlight).toFixed(1)}</td>
              <td style={{ textAlign: 'right', color: changeFlight > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeFlight.toFixed(1)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '2px 4px' }}>{log.aircraftTotals?.dualEngine ? 'Engine 1 Cycles' : 'Engine Cycles'}</td>
              <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.cycles1Before || 450}</td>
              <td style={{ padding: '2px 4px' }}>{(parseInt(log.aircraftTotals?.cycles1Before || 450) + changeEngineCycles)}</td>
              <td style={{ textAlign: 'right', color: changeEngineCycles > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeEngineCycles}</td>
            </tr>
            {log.aircraftTotals?.dualEngine && (
              <>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '2px 4px', color: '#2b6cb0' }}>Engine 2 Hours</td>
                  <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.engine2Before || 0}</td>
                  <td style={{ padding: '2px 4px' }}>{(parseFloat(log.aircraftTotals?.engine2Before || 0) + changeFlight).toFixed(1)}</td>
                  <td style={{ textAlign: 'right', color: changeFlight > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeFlight.toFixed(1)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '2px 4px', color: '#2b6cb0' }}>Engine 2 Cycles</td>
                  <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.cycles2Before || 0}</td>
                  <td style={{ padding: '2px 4px' }}>{(parseInt(log.aircraftTotals?.cycles2Before || 0) + changeEngineCycles)}</td>
                  <td style={{ textAlign: 'right', color: changeEngineCycles > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeEngineCycles}</td>
                </tr>
              </>
            )}
            <tr>
              <td style={{ fontWeight: 'bold', padding: '2px 4px' }}>Hobbs</td>
              <td style={{ padding: '2px 4px' }}>{log.aircraftTotals?.hobbsBefore || 1200.5}</td>
              <td style={{ padding: '2px 4px' }}>{(parseFloat(log.aircraftTotals?.hobbsBefore || 1200.5) + changeHobbs).toFixed(1)}</td>
              <td style={{ textAlign: 'right', color: changeHobbs > 0 ? 'green' : 'inherit', padding: '2px 4px' }}>+{changeHobbs.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. LOG SUMMARY */}
      <div className="card" style={{ padding: '0', overflowX: 'auto', marginBottom: '10px' }}>
        <div style={{ padding: '4px 10px', backgroundColor: '#edf2f7', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem' }}>
          Aircraft Log Summary
        </div>
        <table className="data-table" style={{ width: '100%', fontSize: '0.7rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '2px 4px' }}>Trip</th>
              <th style={{ padding: '2px 4px' }}>Date (UTC)</th>
              <th style={{ padding: '2px 4px' }}>Flt Hrs</th>
              <th style={{ padding: '2px 4px' }}>Blk Hrs</th>
              <th style={{ padding: '2px 4px' }}>Hobbs</th>
              <th style={{ padding: '2px 4px' }}>PIC</th>
              <th style={{ padding: '2px 4px' }}>SIC</th>
              <th style={{ padding: '2px 4px' }}>PAX</th>
            </tr>
          </thead>
          <tbody>
             {legs.map((leg, index) => {
               const act = log.legsActuals[index] || {};
               return (
                 <tr key={index}>
                   <td style={{ padding: '2px 4px' }}>{formatLoc(leg.departure)} &rarr; {formatLoc(leg.destination)}</td>
                   <td style={{ padding: '2px 4px' }}>{leg.date}</td>
                   <td style={{ padding: '2px 4px' }}>{act.flightHrs || '0.0'}</td>
                   <td style={{ padding: '2px 4px' }}>{act.blockHrs || '0.0'}</td>
                   <td style={{ padding: '2px 4px' }}>{act.hobbs || '0.0'}</td>
                   <td style={{ padding: '2px 4px' }}>{leg.pilotId || 'Unknown'}</td>
                   <td style={{ padding: '2px 4px' }}></td>
                   <td style={{ padding: '2px 4px' }}>{act.totalPax || '0'}</td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      {log.auditLog && log.auditLog.length > 0 && (
         <div style={{ padding: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '10px' }}>
            <strong>Audit Log:</strong>
            <ul style={{ paddingLeft: '20px', margin: '5px 0 0 0' }}>
               {log.auditLog.map((entry, i) => <li key={i}>{entry}</li>)}
            </ul>
         </div>
      )}

      {/* 5. ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn" style={{ backgroundColor: '#e53e3e', color: 'white', fontWeight: 'bold', padding: '4px 8px', fontSize: '0.7rem' }} onClick={handleClearSignature} disabled={!log.signature || (!isAdmin && !canSign)}>
           <Trash2 size={12} style={{ marginRight: '4px' }} /> CLEAR SIGNATURE
        </button>
        {log.signature && (() => {
           const hoursSinceSign = log.signature.isoTimestamp ? (Date.now() - new Date(log.signature.isoTimestamp).getTime()) / (1000 * 60 * 60) : 0;
           const canToggle = isAdmin || (canSign && hoursSinceSign <= 24);
           
           return (
             <button 
               type="button" 
               className="btn btn-primary" 
               onClick={handleToggleLock}
               disabled={!canToggle}
               title={!canToggle && !isAdmin ? "Only admins can unlock after 24 hours" : ""}
               style={{ 
                  flex: 'none', 
                  backgroundColor: log.isLocked ? '#e53e3e' : '#48bb78', 
                  fontWeight: 'bold', padding: '4px 8px', fontSize: '0.7rem',
                  opacity: canToggle ? 1 : 0.5, cursor: canToggle ? 'pointer' : 'not-allowed'
               }}>
                {log.isLocked ? <Lock size={12} style={{ marginRight: '4px' }} /> : <Unlock size={12} style={{ marginRight: '4px' }} />}
                {log.isLocked ? 'LOCKED' : 'UNLOCKED'}
             </button>
           );
        })()}
      </div>

    </div>
  );
};

export default FlightLogTab;
