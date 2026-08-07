import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Check, X, Upload, FileText, Trash2, Sparkles } from 'lucide-react';
import { FileStorageService } from '../services/FileStorageService';
import AIInvoiceUploader from './AIInvoiceUploader';

const ALL_CATEGORIES = [
  'Catering', 'Cleaning / Detailing', 'Crew Meal', 'Customs / Border Fees', 
  'De-icing', 'Fuel', 'GPU / Start Cart', 'Ground Transportation', 'Handling', 
  'Hangar / Storage', 'Hotel', 'Landing Fee', 'Lavatory Service', 'Maintenance / Repairs', 
  'Navigation / Overflight', 'Oil / Fluids', 'Oxygen Service', 'Ramp Fee', 
  'Tie-down / Parking', 'Wi-Fi / Data', 'Other'
];

const CategoryCombobox = ({ value, onChange, options, style }) => {
  const [isTyping, setIsTyping] = useState(false);
  const isCustom = value && !options.includes(value);

  if (isTyping || isCustom) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <input 
          autoFocus={isTyping && !value}
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
          placeholder="Type category..."
          style={{ ...style, paddingRight: '24px', boxSizing: 'border-box' }}
        />
        <button 
          onClick={() => { setIsTyping(false); onChange(''); }}
          title="Clear and select from list"
          style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#a0aec0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <select 
      value={value || ''} 
      onChange={e => {
        if (e.target.value === '___CUSTOM___') {
          setIsTyping(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }} 
      style={{ ...style, cursor: 'pointer' }}
    >
      <option value="" disabled>Select a Category</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
      <option value="___CUSTOM___" style={{ fontWeight: 'bold', color: '#3182ce' }}>+ Custom Category...</option>
    </select>
  );
};

const ExpensesTab = ({ expenses, setExpenses, legs = [], aircraftId = '', vendorsList = [], flightDate = '' }) => {
  const fileInputRef = useRef(null);
  const [uploadingExpId, setUploadingExpId] = useState(null);
  const [viewingExpId, setViewingExpId] = useState(null);
  const [loadedReceipts, setLoadedReceipts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const handleHeaderClick = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  const sortedExpenses = useMemo(() => {
    if (!sortConfig.key) return expenses;
    const sorted = [...expenses];
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
  }, [expenses, sortConfig]);  
  useEffect(() => {
    if (viewingExpId && viewingExpId !== 'demo') {
      const exp = expenses.find(x => x.id === viewingExpId);
      if (exp && exp.receiptFiles) {
        const loadFiles = async () => {
          const files = await Promise.all(
            exp.receiptFiles.map(async (f) => {
              if (f.url) return f; // already loaded
              const fileData = await FileStorageService.getFile(f.fileId);
              if (fileData && fileData.blob) {
                return {
                  ...f,
                  url: URL.createObjectURL(fileData.blob)
                };
              }
              return f;
            })
          );
          setLoadedReceipts(files);
        };
        loadFiles();
      } else {
        setLoadedReceipts([]);
      }
    }
  }, [viewingExpId, expenses]);

  useEffect(() => {
    if (!viewingExpId) {
      loadedReceipts.forEach(f => {
        if (f.url && f.url.startsWith('blob:')) {
          URL.revokeObjectURL(f.url);
        }
      });
      setLoadedReceipts([]);
    }
  }, [viewingExpId]);
  
  // Global expense frequencies across all saved flights plus current local expenses
  const expenseFrequencies = useMemo(() => {
    const freqs = { vendor: {}, category: {}, payer: {}, fuelType: {} };
    let allStoredExpenses = [];
    try {
      const storedFlights = JSON.parse(localStorage.getItem('userFlights') || '[]');
      storedFlights.forEach(f => {
        if (f.expenses && Array.isArray(f.expenses)) {
          allStoredExpenses.push(...f.expenses);
        }
      });
    } catch(e) {}
    
    // Combine stored flights' expenses with local component state expenses
    const combined = [...allStoredExpenses, ...(expenses || [])];
    combined.forEach(e => {
      if (e.vendor) freqs.vendor[e.vendor] = (freqs.vendor[e.vendor] || 0) + 1;
      if (e.category) freqs.category[e.category] = (freqs.category[e.category] || 0) + 1;
      if (e.payer) freqs.payer[e.payer] = (freqs.payer[e.payer] || 0) + 1;
      if (e.fuelType) freqs.fuelType[e.fuelType] = (freqs.fuelType[e.fuelType] || 0) + 1;
    });
    return freqs;
  }, [expenses]);

  // Helper to sort items by frequency (descending) then name (alphabetical ascending)
  const sortByUsageThenAlpha = (items, freqMap, getName = (item) => item) => {
    return [...items].sort((a, b) => {
      const nameA = getName(a) || '';
      const nameB = getName(b) || '';
      const freqA = freqMap[nameA] || 0;
      const freqB = freqMap[nameB] || 0;
      if (freqB !== freqA) {
        return freqB - freqA;
      }
      return nameA.localeCompare(nameB);
    });
  };

  const sortedCategories = useMemo(() => {
    const allSet = new Set([...ALL_CATEGORIES, ...Object.keys(expenseFrequencies.category)]);
    return sortByUsageThenAlpha(Array.from(allSet), expenseFrequencies.category);
  }, [expenseFrequencies]);

  const sortedVendors = useMemo(() => {
    return sortByUsageThenAlpha(vendorsList || [], expenseFrequencies.vendor, v => v.vendorId || v.name);
  }, [vendorsList, expenseFrequencies]);

  const sortedPayers = useMemo(() => {
    const defaultPayers = ['Avcard', 'Avfuel', 'World Fuel', 'Direct Bill', 'Titan', 'Company Card', 'Personal Card', 'Other'];
    const allSet = new Set([...defaultPayers, ...Object.keys(expenseFrequencies.payer)]);
    return sortByUsageThenAlpha(Array.from(allSet), expenseFrequencies.payer);
  }, [expenseFrequencies]);

  const sortedFuelTypes = useMemo(() => {
    const defaultFuelTypes = ['Avfuel', 'AEG', 'Atlantic', 'Everest', 'EVO', 'FBO', 'Phillip66', 'Signature', 'Titan', 'World Fuel', 'CAA', 'Other'];
    const allSet = new Set([...defaultFuelTypes, ...Object.keys(expenseFrequencies.fuelType)]);
    return sortByUsageThenAlpha(Array.from(allSet), expenseFrequencies.fuelType);
  }, [expenseFrequencies]);

  const flightAirports = useMemo(() => {
    const apts = new Set();
    legs.forEach(leg => {
      if (leg.departure) {
        apts.add(typeof leg.departure === 'string' ? leg.departure : leg.departure.id);
      }
      if (leg.destination) {
        apts.add(typeof leg.destination === 'string' ? leg.destination : leg.destination.id);
      }
    });
    return Array.from(apts).filter(Boolean);
  }, [legs]);
  const defaultDate = flightDate || new Date().toISOString().split('T')[0];

  // If expenses array is totally empty on mount, you can leave it empty or initialize one row.
  // The user requested NO default multiple lines, so we just let it be empty if empty.
  // But to be safe, if we need it completely empty we just do nothing in useEffect.

  const handleAdd = () => {
    setExpenses([...expenses, { id: Date.now(), category: '', vendor: '', amount: '', description: '', date: defaultDate, payer: '', location: '', fuelType: '', gallons: '', purchaser: aircraftId, receiptCount: 0 }]);
  };

  const handleAutoFillParsedExpense = async (parsedData) => {
    const defaultPayers = ['Avcard', 'Avfuel', 'World Fuel', 'Direct Bill', 'Titan', 'Company Card', 'Personal Card', 'Other'];
    const defaultFuelTypes = ['Avfuel', 'AEG', 'Atlantic', 'Everest', 'EVO', 'FBO', 'Phillip66', 'Signature', 'Titan', 'World Fuel', 'CAA', 'Other'];

    // Validate category - allow if it matches existing categories OR is a new custom category
    const validCategory = parsedData.category || '';

    // Validate payment - only use if it matches known payers
    const allPayers = new Set([...defaultPayers, ...Object.keys(expenseFrequencies.payer)]);
    const validPayer = parsedData.payment && allPayers.has(parsedData.payment) ? parsedData.payment : '';

    // Fuel logic: only set fuelType/gallons if category is Fuel
    let validFuelType = '';
    let validGallons = '';
    if (validCategory === 'Fuel') {
      const allFuelTypes = new Set([...defaultFuelTypes, ...Object.keys(expenseFrequencies.fuelType)]);
      validFuelType = parsedData.fuelType && allFuelTypes.has(parsedData.fuelType) ? parsedData.fuelType : 'FBO';
      validGallons = parsedData.gallons != null && parsedData.gallons !== '' ? parsedData.gallons : '';
    }

    // Intelligent Vendor Matching & Creation
    let finalVendorName = parsedData.vendor || '';
    if (parsedData.vendor && parsedData.vendor.trim()) {
      try {
        const storedVendors = JSON.parse(localStorage.getItem('userVendors') || '[]');
        let currentVendors = storedVendors;
        if (currentVendors.length === 0) {
          const { mockVendors } = await import('../data');
          currentVendors = mockVendors;
        }

        const rawVendorInput = parsedData.vendor.trim().toLowerCase();
        const matchedVendorId = (parsedData.matchedVendorId || '').toLowerCase();

        // 1. Try to find exact or fuzzy match among existing vendors (by ID, vendorId, name, or address)
        const matchedVendor = currentVendors.find(v => {
          const vId = (v.id || '').toLowerCase();
          const vVendorId = (v.vendorId || '').toLowerCase();
          const vName = (v.name || '').toLowerCase();
          const vAddr = (v.address || '').toLowerCase();

          return (
            (matchedVendorId && (vId === matchedVendorId || vVendorId === matchedVendorId)) ||
            vName === rawVendorInput ||
            (vVendorId && vVendorId === rawVendorInput) ||
            vName.includes(rawVendorInput) ||
            rawVendorInput.includes(vName) ||
            (vAddr && rawVendorInput.includes(vAddr))
          );
        });

        if (matchedVendor) {
          finalVendorName = matchedVendor.vendorId || matchedVendor.name;
        } else {
          // 2. Create a new vendor if no existing match was found
          const cleanName = parsedData.vendor.trim();
          const newVendorId = cleanName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10).toUpperCase();
          
          const newVendorObj = {
            id: `V-${Date.now()}`,
            vendorId: newVendorId,
            name: cleanName,
            category: validCategory || 'Other',
            address: parsedData.vendorAddress || '',
            phone: parsedData.vendorPhone || '',
            email: '',
            poc: ''
          };

          const updatedVendorsList = [...currentVendors, newVendorObj];
          localStorage.setItem('userVendors', JSON.stringify(updatedVendorsList));
          window.dispatchEvent(new Event('storage'));
          finalVendorName = newVendorObj.vendorId || cleanName;
        }
      } catch(e) { console.warn('Vendor matching/creation error:', e); }
    }

    // Auto-upload document as receipt attachment
    let receiptFiles = [];
    let receiptCount = 0;
    if (parsedData._originalFile) {
      try {
        const fileId = await FileStorageService.saveFile(parsedData._originalFile);
        receiptFiles = [{ fileId, name: parsedData._originalFile.name, type: parsedData._originalFile.type }];
        receiptCount = 1;
      } catch(e) { console.warn('Receipt upload error:', e); }
    }

    const newExp = {
      id: Date.now(),
      category: validCategory,
      vendor: finalVendorName,
      amount: parsedData.amount !== '' && parsedData.amount != null ? parsedData.amount : '',
      description: parsedData.invoiceNumber ? `[Inv #${parsedData.invoiceNumber}] ${parsedData.description || ''}` : (parsedData.description || ''),
      date: parsedData.date || defaultDate,
      payer: validPayer,
      location: flightAirports[0] || '',
      fuelType: validFuelType,
      gallons: validGallons,
      purchaser: aircraftId,
      receiptFiles,
      receiptCount,
      hasReceipt: receiptCount > 0,
      autoParsed: true
    };
    setExpenses([...expenses, newExp]);
  };

  const handleUpdate = (id, field, value) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleRemove = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleDeleteReceipt = async (expId, fileIndex) => {
    if (expId === 'demo') {
      alert("Cannot delete the demo receipt.");
      return;
    }
    const exp = expenses.find(x => x.id === expId);
    if (!exp) return;
    const currentFiles = exp.receiptFiles || [];
    const fileToDelete = currentFiles[fileIndex];
    
    if (fileToDelete && fileToDelete.fileId) {
      try {
        await FileStorageService.deleteFile(fileToDelete.fileId);
      } catch (err) {
        console.error("Failed to delete from IndexedDB", err);
      }
    }

    const newFiles = currentFiles.filter((_, idx) => idx !== fileIndex);
    
    // Update the main expense list in one atomic state update
    setExpenses(prev => prev.map(e => e.id === expId ? {
      ...e,
      receiptFiles: newFiles,
      receiptCount: newFiles.length,
      hasReceipt: newFiles.length > 0
    } : e));
    
    // If the viewer is currently open for this expense, refresh its local list
    if (viewingExpId === expId) {
      setLoadedReceipts(prev => prev.filter((_, idx) => idx !== fileIndex));
      // If no files remain, close the viewer
      if (newFiles.length === 0) {
        setViewingExpId(null);
      }
    }
  };

  const isRowFilled = (exp) => {
    return exp.vendor || exp.category || exp.location || exp.amount || exp.description || exp.payer || exp.fuelType || exp.gallons;
  };

  const isRowValid = (exp) => {
    if (!isRowFilled(exp)) return true;
    return exp.vendor && exp.category && exp.location && (exp.amount !== '' && exp.amount != null);
  };

  const getStyle = (exp, field, baseStyle = inputStyle) => {
    if (!isRowFilled(exp)) return baseStyle;
    let isMissing = false;
    if (field === 'vendor') isMissing = !exp.vendor;
    else if (field === 'category') isMissing = !exp.category;
    else if (field === 'location') isMissing = !exp.location;
    else if (field === 'amount') isMissing = (exp.amount === '' || exp.amount == null);
    
    return { ...baseStyle, border: isMissing ? '1px solid #e53e3e' : baseStyle.border, backgroundColor: isMissing ? '#fff5f5' : (baseStyle.backgroundColor || 'transparent') };
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalGallons = expenses.reduce((sum, e) => sum + (parseFloat(e.gallons) || 0), 0);

  const tdStyle = { padding: '4px', verticalAlign: 'middle' };
  const inputStyle = { width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem' };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', backgroundColor: '#fff' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '30px', padding: '8px' }}></th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('date')}>Date</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('vendor')}>Vendor</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('category')}>Category</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('payer')}>Payment</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('location')}>Airport / Location</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('fuelType')}>Fuel</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, width: '60px', cursor: 'pointer' }} onClick={() => handleHeaderClick('gallons')}>Gal</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('purchaser')}>Purchaser</th>
              <th style={{ padding: '8px', textAlign: 'right', fontSize: '0.75rem', color: '#718096', fontWeight: 500, width: '80px', cursor: 'pointer' }} onClick={() => handleHeaderClick('amount')}>Amount</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.75rem', color: '#718096', fontWeight: 500, cursor: 'pointer' }} onClick={() => handleHeaderClick('description')}>Notes</th>
              <th style={{ width: '60px', padding: '8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {(sortedExpenses || []).map(exp => {
              const valid = isRowValid(exp);
              const filled = isRowFilled(exp);
              return (
                <tr key={exp.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {filled && valid ? (
                      <Check size={18} color="#48bb78" />
                    ) : (
                      <button type="button" onClick={handleAdd} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                        <Plus size={18} color="#cbd5e0" />
                      </button>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <input type="date" value={exp.date || ''} onChange={e => handleUpdate(exp.id, 'date', e.target.value)} style={inputStyle} />
                  </td>
                  <td style={{ padding: '0 4px', width: '12%' }}>
                    <select
                      value={exp.vendor || ''}
                      onChange={(e) => handleUpdate(exp.id, 'vendor', e.target.value)}
                      style={getStyle(exp, 'vendor', { width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem' })}
                    >
                      <option value="">Vendor</option>
                      {sortedVendors.map(v => (
                        <option key={v.id} value={v.vendorId || v.name}>{v.vendorId || v.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <CategoryCombobox 
                      value={exp.category} 
                      onChange={val => handleUpdate(exp.id, 'category', val)} 
                      options={sortedCategories}
                      style={getStyle(exp, 'category', inputStyle)} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <select value={exp.payer || ''} onChange={e => handleUpdate(exp.id, 'payer', e.target.value)} style={{ ...inputStyle, color: exp.payer ? 'inherit' : '#a0aec0' }}>
                      <option value="" disabled>Select Payment</option>
                      {sortedPayers.map(pOpt => (
                        <option key={pOpt} value={pOpt}>{pOpt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={exp.location || ''} onChange={e => handleUpdate(exp.id, 'location', e.target.value)} style={getStyle(exp, 'location', { ...inputStyle, color: exp.location ? 'inherit' : '#a0aec0' })}>
                      <option value="" disabled>Select Airport</option>
                      {flightAirports.map(apt => (
                        <option key={apt} value={apt}>{apt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select value={exp.fuelType || ''} onChange={e => handleUpdate(exp.id, 'fuelType', e.target.value)} style={{ ...inputStyle, color: exp.fuelType ? 'inherit' : '#a0aec0' }}>
                      <option value="">-- Select Fuel --</option>
                      {sortedFuelTypes.map(fOpt => (
                        <option key={fOpt} value={fOpt}>{fOpt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input type="number" step="1" value={exp.gallons || ''} onChange={e => handleUpdate(exp.id, 'gallons', e.target.value ? parseInt(e.target.value, 10) : '')} style={{ ...inputStyle, textAlign: 'center' }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="text" value={exp.purchaser || ''} onChange={e => handleUpdate(exp.id, 'purchaser', e.target.value)} placeholder="Purchaser" style={inputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" step="0.01" value={exp.amount || ''} onChange={e => handleUpdate(exp.id, 'amount', e.target.value ? parseFloat(e.target.value) : '')} style={getStyle(exp, 'amount', { ...inputStyle, textAlign: 'right' })} />
                  </td>
                  <td style={tdStyle}>
                    <input type="text" value={exp.description || ''} onChange={e => handleUpdate(exp.id, 'description', e.target.value)} placeholder="Notes" style={inputStyle} />
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <button 
                        type="button" 
                        onClick={() => { 
                          if (exp.receiptCount > 0 || exp.hasReceipt || (exp.receiptFiles && exp.receiptFiles.length > 0)) { 
                            setViewingExpId(exp.id); 
                          } else { 
                            setUploadingExpId(exp.id); 
                            fileInputRef.current?.click(); 
                          } 
                        }} 
                        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: (exp.receiptCount > 0 || exp.hasReceipt || (exp.receiptFiles && exp.receiptFiles.length > 0)) ? '#3182ce' : '#e53e3e', padding: '4px', display: 'flex', alignItems: 'center' }} 
                        title="Upload Receipt"
                      >
                        <FileText size={16} />
                        {(exp.receiptCount > 1) && (
                          <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#e53e3e', color: 'white', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {exp.receiptCount}
                          </div>
                        )}
                      </button>
                      <button type="button" onClick={() => handleRemove(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: '4px', display: 'flex', alignItems: 'center' }} title="Remove Expense">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {(expenses && expenses.length > 0) && (
              <tr>
                <td colSpan="7" style={{ padding: '12px 12px 12px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '0.875rem', color: '#2d3748' }}>Total:</td>
                <td style={{ padding: '12px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.875rem', color: '#2d3748' }}>
                  {totalGallons > 0 ? totalGallons : ''}
                </td>
                <td></td>
                <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.875rem', color: '#2d3748' }}>
                  ${totalAmount.toFixed(2)}
                </td>
                <td colSpan="2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ padding: '15px', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'flex-start', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          type="button" 
          onClick={handleAdd} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <Plus size={16} /> Add Expense
        </button>

        <AIInvoiceUploader onExpenseParsed={handleAutoFillParsedExpense} />
        
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files.length > 0) {
              if (uploadingExpId) {
                const currentExp = expenses.find(x => x.id === uploadingExpId);
                const handleUploads = async () => {
                  try {
                    const newFiles = await Promise.all(
                      Array.from(e.target.files).map(async (f) => {
                        const fileId = await FileStorageService.saveFile(f);
                        return {
                          fileId,
                          name: f.name,
                          type: f.type
                        };
                      })
                    );
                    const currentFiles = currentExp?.receiptFiles || [];
                    const combined = [...currentFiles, ...newFiles];
                    
                    setExpenses(prev => prev.map(e => e.id === uploadingExpId ? {
                      ...e,
                      receiptFiles: combined,
                      receiptCount: combined.length,
                      hasReceipt: true
                    } : e));
                    
                    setUploadingExpId(null);
                  } catch (err) {
                    console.error("Upload error", err);
                  }
                };
                handleUploads();
              }
              // Clear the input so the same file can be selected again if needed
              e.target.value = '';
            }
          }}
          accept="image/*,.pdf"
          multiple
        />


      </div>

      {viewingExpId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #edf2f7', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary-color)" /> Receipt Viewer
              </h3>
              <button onClick={() => setViewingExpId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#edf2f7' }}>
              {(() => {
                if (loadedReceipts.length === 0) return <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>No receipts found for this expense.</div>;
                
                return loadedReceipts.map((file, idx) => (
                  <div key={idx} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '10px 15px', backgroundColor: '#2d3748', color: 'white', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{file.name}</span>
                      <button 
                        onClick={() => handleDeleteReceipt(viewingExpId, idx)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', display: 'flex', alignItems: 'center', padding: '4px' }} 
                        title="Delete Receipt"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', backgroundColor: '#f7fafc', minHeight: '200px' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                      ) : file.type === 'application/pdf' ? (
                        <iframe src={file.url} width="100%" height="500px" style={{ border: 'none' }} title={file.name} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', padding: '40px' }}>
                          Preview not available for this file type.
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div style={{ padding: '15px 20px', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => {
                  setUploadingExpId(viewingExpId);
                  fileInputRef.current?.click();
                }} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Upload size={16} /> Upload Additional
              </button>
              <button onClick={() => setViewingExpId(null)} className="btn btn-primary">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
