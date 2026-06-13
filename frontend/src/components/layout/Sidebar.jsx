import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Search, 
  Calendar, 
  UserCircle,
  Stethoscope,
  Users,
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientLinks = [
    { to: '/patient/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/patient/upload', icon: <PlusCircle size={20} />, label: 'New Prediction' },
    { to: '/patient/history', icon: <History size={20} />, label: 'My History' },
    { to: '/patient/doctors', icon: <Search size={20} />, label: 'Find Doctors' },
    { to: '/patient/appointments', icon: <Calendar size={20} />, label: 'Appointments' },
    { to: '/patient/profile', icon: <UserCircle size={20} />, label: 'Profile' },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/doctor/appointments', icon: <Calendar size={20} />, label: 'Appointments' },
    { to: '/doctor/schedule', icon: <Stethoscope size={20} />, label: 'My Schedule' },
    { to: '/doctor/patients', icon: <Users size={20} />, label: 'My Patients' },
    { to: '/doctor/clinic', icon: <Settings size={20} />, label: 'Clinic Settings' },
    { to: '/doctor/profile', icon: <UserCircle size={20} />, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/doctors', icon: <ShieldCheck size={20} />, label: 'Manage Doctors' },
    { to: '/admin/patients', icon: <Users size={20} />, label: 'Manage Patients' },
  ];

  const links = isPatient ? patientLinks : (isDoctor ? doctorLinks : adminLinks);

  return (
    <aside className="w-64 bg-card border-r-2 border-foreground flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b-2 border-foreground">
        <h1 className="text-2xl font-black text-primary italic">SkinAI</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2 font-mono font-bold border-2 border-transparent transition-all
              ${isActive ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'hover:border-foreground hover:bg-accent'}
            `}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t-2 border-foreground">
        <div className="mb-4 px-4">
          <p className="font-bold text-sm">{user?.name}</p>
          <p className="text-xs text-muted-foreground uppercase font-mono">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 font-mono font-bold text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
