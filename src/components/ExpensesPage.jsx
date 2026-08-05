import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Search, Calendar, FileText, Building, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { mockVendors } from '../data';
import EventModal from './EventModal';

const getCategoryColor = (category) => {
  if (!category) return { bg: '#edf2f7', text: '#4a5568' };
  const presets = {
    'FBO': { bg: '#ebf8ff', text: '#2b6cb0' },
    'Fuel Provider': { bg: '#fff5f5', text: '#c53030' },
    'Fuel': { bg: '#fff5f5', text: '#c53030' },
    'Lodging': { bg: '#faf5ff', text: '#6b46c1' },
    'Hotel': { bg: '#faf5ff', text: '#6b46c1' },
    'Catering': { bg: '#f0fff4', text: '#2f855a' },
    'Crew Meal': { bg: '#f0fff4', text: '#2f855a' },
    'Handling': { bg: '#fffff0', text: '#975a16' },
    'Landing Fee': { bg: '#e6fffa', text: '#285e61' },
    'Other': { bg: '#edf2f7', text: '#4a5568' }
  };
  if (presets[category]) return presets[category];
  
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return { bg: `hsl(${hue}, 85%, 90%)`, text: `hsl(${hue}, 85%, 25%)` };
};

const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Expenses State
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal State for Flight Card
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const handleHeaderClick = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  // Vendors State
  const [vendors, setVendors] = useState([]);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editForm, setEditForm] = useState({ vendorId: '', name: '', category: '', address: '', phone: '', email: '', poc: '' });

  const loadExpensesData = () => {
    try {
      const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
      let allExpenses = [];
      storedFlights.forEach(flight => {
        if (flight.expenses && flight.expenses.length > 0) {
          flight.expenses.forEach(exp => {
            allExpenses.push({
              ...exp,
              flightId: flight.id,
              flightNumber: flight.flightNumber || 'Unknown',
              flightTitle: flight.title || 'Untitled',
              flightDate: flight.date || exp.date,
              isPaid: exp.isPaid || false
            });
          });
        }
      });
      allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(allExpenses);
    } catch (e) { console.error("Error loading expenses", e); }
  };

  useEffect(() => {
    loadExpensesData();

    // Load Vendors
    try {
      const storedVendors = JSON.parse(localStorage.getItem('userVendors'));
      if (storedVendors && storedVendors.length > 0) setVendors(storedVendors);
      else setVendors(mockVendors);
    } catch(e) { setVendors(mockVendors); }
  }, []);

  const handleOpenFlightCard = (exp) => {
    try {
      const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
      const flight = storedFlights.find(f => String(f.id) === String(exp.flightId));
      if (flight) {
        setSelectedFlight(flight);
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFlight = (flightData) => {
    try {
      const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
      const updatedFlights = storedFlights.map(f => f.id === flightData.id ? flightData : f);
      localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
      loadExpensesData();
    } catch (e) {
      console.error(e);
    }
  };

  const saveVendors = (newVendors) => {
    setVendors(newVendors);
    localStorage.setItem('userVendors', JSON.stringify(newVendors));
  };

  const handleAddVendor = () => {
    const newVendor = { id: `V-${Date.now()}`, vendorId: '', name: '', category: '', address: '', phone: '', email: '', poc: '' };
    saveVendors([...vendors, newVendor]);
    setEditingVendorId(newVendor.id);
    setEditForm({ vendorId: '', name: '', category: '', address: '', phone: '', email: '', poc: '' });
  };

  const handleDeleteVendor = (id) => {
    saveVendors(vendors.filter(v => v.id !== id));
  };

  const handleSaveVendor = () => {
    saveVendors(vendors.map(v => v.id === editingVendorId ? { ...v, ...editForm } : v));
    setEditingVendorId(null);
  };

  const filteredExpenses = expenses.filter(e => {
    const searchLower = search.toLowerCase();
    // Combine searchable fields into one string
    const searchable = `${e.description || ''} ${e.flightNumber || ''} ${e.flightTitle || ''} ${e.vendor || ''} ${e.category || ''} ${e.location || ''} ${e.payer || ''} ${e.amount || ''} ${e.date || ''} ${e.flightDate || ''}`.toLowerCase();
    const matchesSearch =
      searchable.includes(searchLower) ||
      (searchLower.includes('paid') && e.isPaid) ||
      (searchLower.includes('unpaid') && !e.isPaid);
    const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorted expenses based on column
  const sortedExpenses = useMemo(() => {
    if (!sortConfig.key) return filteredExpenses;
    const sorted = [...filteredExpenses];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      if (sortConfig.key === 'amount') {
        return (parseFloat(aVal) - parseFloat(bVal)) * (sortConfig.direction === 'asc' ? 1 : -1);
      }
      if (sortConfig.key === 'date') {
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      return aVal.toString().localeCompare(bVal.toString()) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
    return sorted;
  }, [filteredExpenses, sortConfig]);

  const handleTogglePaid = (expId, flightId, newPaidStatus) => {
    setExpenses(prev => prev.map(e => (e.id === expId && e.flightId === flightId) ? { ...e, isPaid: newPaidStatus } : e));
    try {
      const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
      const flightIndex = storedFlights.findIndex(f => f.id === flightId);
      if (flightIndex >= 0) {
        const flight = storedFlights[flightIndex];
        const expIndex = flight.expenses.findIndex(e => e.id === expId);
        if (expIndex >= 0) {
          flight.expenses[expIndex].isPaid = newPaidStatus;
          localStorage.setItem('userFlights', JSON.stringify(storedFlights));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalPaid = filteredExpenses.reduce((sum, e) => sum + (e.isPaid ? parseFloat(e.amount || 0) : 0), 0);
  const totalUnpaid = filteredExpenses.reduce((sum, e) => sum + (!e.isPaid ? parseFloat(e.amount || 0) : 0), 0);
  const categories = [
    'All', 'Catering', 'Cleaning / Detailing', 'Crew Meal', 'Customs / Border Fees', 
    'De-icing', 'Fuel', 'GPU / Start Cart', 'Ground Transportation', 'Handling', 
    'Hangar / Storage', 'Hotel', 'Landing Fee', 'Lavatory Service', 'Maintenance / Repairs', 
    'Navigation / Overflight', 'Oil / Fluids', 'Oxygen Service', 'Ramp Fee', 
    'Tie-down / Parking', 'Wi-Fi / Data', 'Other'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <DollarSign size={16} /> Expenses Overview
        </button>
        <button 
          className={`btn ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vendors')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Building size={16} /> Vendor Management
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#e6fffa', borderRadius: '50%', color: '#319795' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Expenses</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalAmount.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f0fff4', borderRadius: '50%', color: '#38a169' }}>
                <Check size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Paid</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>${totalPaid.toFixed(2)}</div>
              </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#fff5f5', borderRadius: '50%', color: '#e53e3e' }}>
                <X size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unpaid</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e53e3e' }}>${totalUnpaid.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#ebf8ff', borderRadius: '50%', color: '#3182ce' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Records</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{filteredExpenses.length}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <input 
                  type="text" 
                  placeholder="Search by flight, vendor, notes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: '4px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category:</span>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '150px' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleHeaderClick('date')}>Date</th>
                    <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleHeaderClick('flightNumber')}>Trip</th>
                    <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleHeaderClick('vendor')}>Vendor</th>
                    <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleHeaderClick('category')}>Category</th>
                    <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleHeaderClick('description')}>Notes</th>
                    <th style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleHeaderClick('isPaid')}>Paid</th>
                    <th style={{ padding: '12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleHeaderClick('amount')}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No expenses found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((exp, i) => (
                      <tr key={`${exp.id}-${i}`} onClick={() => handleOpenFlightCard(exp)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            {exp.date}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{exp.flightNumber}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.flightTitle}</div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 500 }}>
                          {(() => {
                            const foundVendor = vendors.find(v => v.vendorId === exp.vendor || v.name === exp.vendor);
                            if (foundVendor && foundVendor.vendorId) {
                              return `[${foundVendor.vendorId}] ${foundVendor.name}`;
                            }
                            return exp.vendor || '-';
                          })()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, 
                            backgroundColor: getCategoryColor(exp.category).bg, 
                            color: getCategoryColor(exp.category).text 
                          }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{exp.description || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={exp.isPaid || false} 
                            onChange={(e) => handleTogglePaid(exp.id, exp.flightId, e.target.checked)}
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                          ${parseFloat(exp.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'vendors' && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={20} color="var(--primary-color)" /> Manage Vendors
            </h3>
            <button className="btn btn-primary" onClick={handleAddVendor} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Vendor
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '12px' }}>Vendor ID</th>
                  <th style={{ padding: '12px' }}>Vendor Name</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Address</th>
                  <th style={{ padding: '12px' }}>Contact Details</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="ID (e.g. SIG)"
                          value={editForm.vendorId} 
                          onChange={e => setEditForm({ ...editForm, vendorId: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '4px' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{v.vendorId || '-'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="Vendor Name"
                          value={editForm.name} 
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '4px' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 500 }}>{v.name}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="Point of Contact"
                          value={editForm.poc} 
                          onChange={e => setEditForm({ ...editForm, poc: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{v.poc || '-'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="Phone Number"
                          value={editForm.phone} 
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{v.phone || '-'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="email" 
                          placeholder="Email"
                          value={editForm.email} 
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{v.email || '-'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="Address"
                          value={editForm.address} 
                          onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{v.address || '-'}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <input 
                          type="text" 
                          placeholder="Category"
                          value={editForm.category} 
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          style={{ padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block',
                          backgroundColor: getCategoryColor(v.category || 'Other').bg, 
                          color: getCategoryColor(v.category || 'Other').text 
                        }}>
                          {v.category || 'Other'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top' }}>
                      {editingVendorId === v.id ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button onClick={handleSaveVendor} style={{ background: 'none', border: 'none', color: '#38a169', cursor: 'pointer' }}><Check size={18} /></button>
                          <button onClick={() => setEditingVendorId(null)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button onClick={() => { setEditingVendorId(v.id); setEditForm({ vendorId: v.vendorId || '', name: v.name, category: v.category, address: v.address || '', phone: v.phone || '', email: v.email || '', poc: v.poc || '' }); }} style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteVendor(v.id)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isModalOpen && selectedFlight && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFlight(null);
          }}
          onSave={handleSaveFlight}
          onDelete={(flightId) => {
            try {
              const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
              const updatedFlights = storedFlights.filter(f => f.id !== flightId);
              localStorage.setItem('userFlights', JSON.stringify(updatedFlights));
              setIsModalOpen(false);
              setSelectedFlight(null);
              loadExpensesData();
            } catch (e) { console.error(e); }
          }}
          flight={selectedFlight}
          defaultActiveView="Expenses"
        />
      )}
    </div>
  );
};

export default ExpensesPage;
