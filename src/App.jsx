import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Users, Settings, MapPin, Plane, UserCheck, Building, LogOut } from 'lucide-react';
import './index.css';
import { can as permCan } from './services/permissionService';
import CalendarView from './components/CalendarView';
import PilotsList from './components/PilotsList';
import LocationsView from './components/LocationsView';
import AircraftList from './components/AircraftList';
import PassengersList from './components/PassengersList';
import CrewView from './components/CrewView';
import { initDataSync } from './services/dataSyncService';
const APP_VERSION = "v0.1.38";
import AccountsContactsView from './components/AccountsContactsView';
import ExpensesPage from './components/ExpensesPage';
import SettingsView from './components/SettingsView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { DollarSign } from 'lucide-react';

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('calendar');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = initDataSync(() => {
      // Force UI re-render on sync when storage updates
      window.dispatchEvent(new Event('storage'));
    });
    return cleanup;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <CalendarIcon size={24} />
          <span>HeliScheduler</span>
          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>{APP_VERSION}</div>
        </div>
        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={20} />
            Calendar
          </li>
          <li 
            className={`nav-item ${activeTab === 'crew' ? 'active' : ''}`}
            onClick={() => setActiveTab('crew')}
          >
            <Users size={20} />
            Crew & Passengers
          </li>
          <li 
            className={`nav-item ${activeTab === 'airports' ? 'active' : ''}`}
            onClick={() => setActiveTab('airports')}
          >
            <MapPin size={20} />
            Airports & LZs
          </li>
          <li 
            className={`nav-item ${activeTab === 'aircraft' ? 'active' : ''}`}
            onClick={() => setActiveTab('aircraft')}
          >
            <Plane size={20} />
            Fleet
          </li>
          {permCan(currentUser, 'manageAccounts') && (
            <li 
              className={`nav-item ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              <Building size={20} />
              Accounts & Contacts
            </li>
          )}
          {permCan(currentUser, 'viewExpensesOverview') && (
            <li 
              className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <DollarSign size={20} />
              Expenses
            </li>
          )}
          <li 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            Settings
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <h2>
            {activeTab === 'calendar' && 'Flight Schedule'}
            {activeTab === 'crew' && 'Crew & Passenger Management'}
            {activeTab === 'airports' && 'Airports & Landing Zones'}
            {activeTab === 'aircraft' && 'Aircraft Fleet Management'}
            {activeTab === 'accounts' && 'Accounts & Contacts'}
            {activeTab === 'expenses' && 'Expenses Overview'}
            {activeTab === 'settings' && 'Settings'}
          </h2>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{currentUser?.name || 'User'}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                onClick={handleLogout}
                className="has-tooltip"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                data-tooltip="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'crew' && <CrewView />}
          {activeTab === 'airports' && <LocationsView />}
          {activeTab === 'aircraft' && <AircraftList />}
          {activeTab === 'accounts' && <AccountsContactsView />}
          {activeTab === 'expenses' && <ExpensesPage />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
