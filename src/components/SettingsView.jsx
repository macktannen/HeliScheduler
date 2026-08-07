import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { ROLES, ROLE_LABELS, ROLE_COLORS, getUserRoles } from '../services/permissionService';

const RoleBadge = ({ role }) => {
  const colors = ROLE_COLORS[role] || { bg: '#e2e8f0', text: '#4a5568' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.text,
      marginRight: '4px',
      marginBottom: '2px',
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
};

const RoleCheckboxGroup = ({ value = [], onChange, disabled = false }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
    {ROLES.map(role => (
      <label key={role} style={{
        display: 'flex', alignItems: 'center', gap: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '5px 10px', borderRadius: '6px', border: `1px solid ${value.includes(role) ? ROLE_COLORS[role].text : 'var(--border-color)'}`,
        backgroundColor: value.includes(role) ? ROLE_COLORS[role].bg : 'white',
        opacity: disabled ? 0.6 : 1, fontSize: '0.82rem', fontWeight: 500,
        color: value.includes(role) ? ROLE_COLORS[role].text : 'var(--text-color)',
      }}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.includes(role)}
          onChange={e => {
            if (e.target.checked) onChange([...value, role]);
            else onChange(value.filter(r => r !== role));
          }}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        {ROLE_LABELS[role]}
      </label>
    ))}
  </div>
);

const SettingsView = () => {
  const { currentUser, isAdmin, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [users, setUsers] = useState([]);

  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(currentUser?.notifications ?? true);
  const [viewOwnFlightsOnly, setViewOwnFlightsOnly] = useState(currentUser?.viewOwnFlightsOnly ?? false);

  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoles, setNewUserRoles] = useState(['view_only']);
  const [createUserMsg, setCreateUserMsg] = useState('');

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      setUsers(authService.getUsers());
    }
  }, [isAdmin, activeTab]);

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) { alert('You cannot delete yourself.'); return; }
    if (window.confirm('Are you sure you want to delete this user?')) {
      await authService.deleteUser(id);
      setUsers(authService.getUsers());
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUserRoles.length === 0) {
      setCreateUserMsg({ type: 'error', text: 'Please assign at least one role.' });
      return;
    }
    try {
      await authService.adminCreateUser(newUserName, newUserEmail, newUserPassword, newUserRoles);
      setUsers(authService.getUsers());
      setShowCreateUser(false);
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRoles(['view_only']); setCreateUserMsg('');
    } catch (err) {
      setCreateUserMsg({ type: 'error', text: err.message });
    }
  };

  const handleRolesChange = async (userId, newRoles) => {
    if (userId === currentUser.id && !newRoles.includes('admin')) {
      alert('You cannot remove your own admin privileges.');
      return;
    }
    if (newRoles.length === 0) { alert('A user must have at least one role.'); return; }
    await authService.updateUserRoles(userId, newRoles);
    setUsers(authService.getUsers());
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ name, notifications, viewOwnFlightsOnly });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'New passwords do not match' }); return; }
    try {
      await authService.updatePassword(currentUser.id, currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    }
  };

  const handleResetAirportHistory = () => {
    if (window.confirm('Are you sure you want to clear your airport search history?')) {
      localStorage.removeItem('locationUsage');
      alert('Airport search history cleared!');
    }
  };

  const currentUserRoles = getUserRoles(currentUser);
  const isViewOnly = currentUserRoles.length === 1 && currentUserRoles[0] === 'view_only';

  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [aiMsg, setAiMsg] = useState('');
  const [testingKey, setTestingKey] = useState(false);

  const handleSaveGeminiKey = (e) => {
    e.preventDefault();
    const cleanKey = geminiKey.trim();
    localStorage.setItem('gemini_api_key', cleanKey);
    setAiMsg({ type: 'success', text: 'Gemini API Key saved to browser storage!' });
  };

  const handleTestGeminiKey = async () => {
    const keyToTest = geminiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY;
    if (!keyToTest) {
      setAiMsg({ type: 'error', text: 'Please enter an API key first.' });
      return;
    }
    setTestingKey(true);
    setAiMsg('');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToTest}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] })
      });
      if (res.ok) {
        setAiMsg({ type: 'success', text: '✅ API Key Connection Verified Successfully!' });
      } else {
        const errData = await res.json();
        setAiMsg({ type: 'error', text: `❌ API Error (${res.status}): ${errData.error?.message || 'Invalid Key'}` });
      }
    } catch(err) {
      setAiMsg({ type: 'error', text: `❌ Connection failed: ${err.message}` });
    } finally {
      setTestingKey(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    backgroundColor: activeTab === tab ? '#f4f5f7' : 'transparent',
    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-color)'
  });

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', height: 'fit-content' }}>
        <div onClick={() => setActiveTab('account')} style={tabStyle('account')}>My Account</div>
        <div onClick={() => setActiveTab('ai')} style={tabStyle('ai')}>AI & Integrations</div>
        {isAdmin && <div onClick={() => setActiveTab('users')} style={tabStyle('users')}>System Users</div>}
        <div onClick={() => setActiveTab('development')} style={tabStyle('development')}>Development</div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '30px', overflowY: 'auto' }}>

        {/* AI & INTEGRATIONS */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '650px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>AI Integrations & API Keys</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Configure your AI key to enable <strong>AI PDF Invoice & Receipt Reading</strong> across the application.
            </p>

            {aiMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 500, backgroundColor: aiMsg.type === 'success' ? '#c6f6d5' : '#fed7d7', color: aiMsg.type === 'success' ? '#2f855a' : '#c53030' }}>
                {aiMsg.text}
              </div>
            )}

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Google Gemini AI (Vision Engine)
                </h4>
                {geminiKey ? (
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#c6f6d5', color: '#22543d', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    Key Saved
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#feebc8', color: '#744210', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    Not Configured
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#4a5568', lineHeight: '1.4', marginBottom: '16px' }}>
                Google AI Studio provides <strong>1,500 free invoice scans per day</strong> at $0 cost. Get a free API key instantly at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>aistudio.google.com</a>.
              </p>

              <form onSubmit={handleSaveGeminiKey}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    Save Key
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGeminiKey}
                    disabled={testingKey}
                    className="btn btn-outline"
                  >
                    {testingKey ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MY ACCOUNT */}
        {activeTab === 'account' && (
          <div style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>My Profile</h3>

            {profileMsg && (
              <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: profileMsg.type === 'success' ? '#c6f6d5' : '#fed7d7', color: profileMsg.type === 'success' ? '#2f855a' : '#c53030' }}>
                {profileMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name</label>
                <input type="text" className="form-control" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
                <input type="email" className="form-control" style={{ width: '100%', backgroundColor: '#f4f5f7' }} value={currentUser?.email || ''} disabled />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>My Roles</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {currentUserRoles.map(r => <RoleBadge key={r} role={r} />)}
                </div>
              </div>

              {/* View Only toggle: all flights vs own flights */}
              {(isViewOnly || currentUserRoles.includes('view_only')) && (
                <div style={{ padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={viewOwnFlightsOnly}
                      onChange={e => setViewOwnFlightsOnly(e.target.checked)}
                      style={{ width: '16px', height: '16px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>Show My Flights Only</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        When checked, you will only see flights where you are listed as a passenger or crew member. Uncheck to view all scheduled flights.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div style={{ marginTop: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontWeight: 'bold' }}>Enable Notifications</span>
                </label>
                <p style={{ margin: '5px 0 0 26px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive email and push notifications about flight updates.</p>
              </div>

              <button className="btn btn-primary" style={{ width: 'fit-content', marginTop: '5px' }} onClick={handleUpdateProfile}>Save Profile</button>
            </div>

            <h3 style={{ marginTop: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Change Password</h3>

            {passwordMsg && (
              <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: passwordMsg.type === 'success' ? '#c6f6d5' : '#fed7d7', color: passwordMsg.type === 'success' ? '#2f855a' : '#c53030' }}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Current Password</label>
                <input type="password" required className="form-control" style={{ width: '100%' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>New Password</label>
                <input type="password" required className="form-control" style={{ width: '100%' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Confirm New Password</label>
                <input type="password" required className="form-control" style={{ width: '100%' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
              </div>
              <button type="submit" className="btn btn-outline" style={{ width: 'fit-content', marginTop: '5px' }}>Update Password</button>
            </form>

            <h3 style={{ marginTop: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Data Management</h3>
            <div style={{ marginTop: '20px' }}>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)' }}>Clear your locally cached airport search history to remove phantom or old locations from the dropdown.</p>
              <button className="btn btn-outline" style={{ color: '#e53e3e', borderColor: '#e53e3e' }} onClick={handleResetAirportHistory}>
                Reset Airport History
              </button>
            </div>
          </div>
        )}

        {/* SYSTEM USERS — Admin only */}
        {activeTab === 'users' && isAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>System Users</h3>
              <button className="btn btn-primary" onClick={() => setShowCreateUser(!showCreateUser)}>
                {showCreateUser ? 'Cancel' : '+ Create User'}
              </button>
            </div>

            {showCreateUser && (
              <div style={{ backgroundColor: '#f4f5f7', padding: '20px', borderRadius: '8px', marginTop: '15px' }}>
                <h4 style={{ marginTop: 0 }}>Create New User</h4>
                {createUserMsg && (
                  <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: createUserMsg.type === 'error' ? '#fed7d7' : '#c6f6d5', color: createUserMsg.type === 'error' ? '#c53030' : '#2f855a' }}>
                    {createUserMsg.text}
                  </div>
                )}
                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name</label>
                      <input type="text" required className="form-control" style={{ width: '100%' }} value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
                      <input type="email" required className="form-control" style={{ width: '100%' }} value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Password</label>
                      <input type="text" required className="form-control" style={{ width: '100%' }} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Roles <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(select all that apply)</span></label>
                    <RoleCheckboxGroup value={newUserRoles} onChange={setNewUserRoles} />
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">Create User</button>
                  </div>
                </form>
              </div>
            )}

            <table className="table" style={{ marginTop: '20px', width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Password</th>
                  <th style={{ minWidth: '320px' }}>Roles</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const uRoles = Array.isArray(u.roles) ? u.roles : [u.role || 'view_only'];
                  return (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.password}</td>
                      <td>
                        {u.id === currentUser.id ? (
                          <div>{uRoles.map(r => <RoleBadge key={r} role={r} />)}</div>
                        ) : (
                          <RoleCheckboxGroup
                            value={uRoles}
                            onChange={(newRoles) => handleRolesChange(u.id, newRoles)}
                          />
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ color: '#e53e3e', borderColor: '#e53e3e', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === currentUser.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DEVELOPMENT */}
        {activeTab === 'development' && (
          <div style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Development Reminders</h3>
            <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', padding: '15px', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#c53030' }}>⚠️ Temporary Feature Warning</h4>
              <p style={{ margin: 0, color: '#742a2a', lineHeight: '1.5' }}>
                <strong>IndexedDB File Storage:</strong> The current file upload system for expense receipts uses <code>localforage</code> to store files directly in the browser's IndexedDB for local testing purposes.
                <br /><br />
                <strong>REMINDER:</strong> Remove this <code>localforage</code> implementation and replace it with a true cloud storage integration (e.g., AWS S3, Google Drive) when building out the real production backend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
