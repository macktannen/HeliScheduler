import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const SettingsView = () => {
  const { currentUser, isAdmin, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [users, setUsers] = useState([]);
  
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(currentUser?.notifications ?? true);
  
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [createUserMsg, setCreateUserMsg] = useState('');

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      setUsers(authService.getUsers());
    }
  }, [isAdmin, activeTab]);

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      await authService.deleteUser(id);
      setUsers(authService.getUsers());
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await authService.adminCreateUser(newUserName, newUserEmail, newUserPassword, newUserRole);
      setUsers(authService.getUsers());
      setShowCreateUser(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setCreateUserMsg('');
    } catch (e) {
      setCreateUserMsg({ type: 'error', text: e.message });
    }
  };

  const handleRoleChange = async (id, newRole) => {
    if (id === currentUser.id && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges.");
      return;
    }
    await authService.updateUserRole(id, newRole);
    setUsers(authService.getUsers());
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ name, notifications });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (e) {
      setProfileMsg({ type: 'error', text: e.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await authService.updatePassword(currentUser.id, currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (e) {
      setPasswordMsg({ type: 'error', text: e.message });
    }
  };

  const handleResetAirportHistory = () => {
    if (window.confirm("Are you sure you want to clear your airport search history?")) {
      localStorage.removeItem('locationUsage');
      alert("Airport search history cleared!");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px' }}>
      {/* Sidebar for Settings */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div 
          onClick={() => setActiveTab('account')}
          style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: activeTab === 'account' ? 'bold' : 'normal', backgroundColor: activeTab === 'account' ? '#f4f5f7' : 'transparent', color: activeTab === 'account' ? 'var(--primary-color)' : 'var(--text-color)' }}
        >
          My Account
        </div>
        {isAdmin && (
          <div 
            onClick={() => setActiveTab('users')}
            style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: activeTab === 'users' ? 'bold' : 'normal', backgroundColor: activeTab === 'users' ? '#f4f5f7' : 'transparent', color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-color)' }}
          >
            System Users
          </div>
        )}
        <div 
          onClick={() => setActiveTab('development')}
          style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontWeight: activeTab === 'development' ? 'bold' : 'normal', backgroundColor: activeTab === 'development' ? '#f4f5f7' : 'transparent', color: activeTab === 'development' ? 'var(--primary-color)' : 'var(--text-color)' }}
        >
          Development
        </div>
      </div>

      {/* Main Settings Content */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '30px', overflowY: 'auto' }}>
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
                <input type="email" className="form-control" style={{ width: '100%', backgroundColor: '#f4f5f7' }} value={currentUser?.email || ''} disabled title="Email cannot be changed" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Role</label>
                <input type="text" className="form-control" style={{ width: '100%', backgroundColor: '#f4f5f7' }} value={currentUser?.role || 'user'} disabled />
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontWeight: 'bold' }}>Enable Notifications</span>
                </label>
                <p style={{ margin: '5px 0 0 26px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive email and push notifications about flight updates.</p>
              </div>

              <button className="btn btn-primary" style={{ width: 'fit-content', marginTop: '10px' }} onClick={handleUpdateProfile}>Save Profile</button>
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
              <button type="submit" className="btn btn-outline" style={{ width: 'fit-content', marginTop: '10px' }}>Update Password</button>
            </form>

            <h3 style={{ marginTop: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Data Management</h3>
            <div style={{ marginTop: '20px' }}>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)' }}>Clear your locally cached airport search history to remove phantom or old locations from the dropdown.</p>
              <button 
                className="btn btn-outline" 
                style={{ color: '#e53e3e', borderColor: '#e53e3e' }}
                onClick={handleResetAirportHistory}
              >
                Reset Airport History
              </button>
            </div>
          </div>
        )}

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
                  <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: createUserMsg.type === 'success' ? '#c6f6d5' : '#fed7d7', color: createUserMsg.type === 'success' ? '#2f855a' : '#c53030' }}>
                    {createUserMsg.text}
                  </div>
                )}
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Role</label>
                    <select className="form-control" style={{ width: '100%' }} value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                      <option value="admin">Admin</option>
                      <option value="pilot">Pilot</option>
                      <option value="crew">Crew</option>
                      <option value="user">User</option>
                      <option value="view_only">View Only</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" className="btn btn-primary">Create User</button>
                  </div>
                </form>
              </div>
            )}
            
            <table className="table" style={{ marginTop: '20px' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Password (Admin View)</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{u.password}</td>
                    <td>
                      <select 
                        value={u.role || 'user'} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-control"
                        style={{ padding: '4px', fontSize: '0.85rem' }}
                        disabled={u.id === currentUser.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="pilot">Pilot</option>
                        <option value="crew">Crew</option>
                        <option value="user">User</option>
                        <option value="view_only">View Only</option>
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
