import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Siren,
  ListChecks,
  Bell,
  User,
  LayoutDashboard,
  ClipboardList,
  History,
  MapPin,
  BarChart3,
  FileText,
  Users,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/layout/AppShell';
import { LocationSharingProvider } from '../hooks/useLocationSharing';

export const RoleLayout = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'reporter';

  let navItems = [];
  let bottomNavItems = [];

  if (role === 'admin') {
    navItems = [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/incidents', label: 'Incidents', icon: ListChecks },
      { to: '/admin/map', label: 'Live Map', icon: MapPin },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/reports', label: 'Monthly Report', icon: FileText },
      { to: '/admin/users', label: 'User Directory', icon: Users },
      { to: '/admin/responders/new', label: 'Add Responder', icon: UserPlus },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile Settings', icon: User },
    ];
  } else if (role === 'responder') {
    navItems = [
      { to: '/responder', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/responder/assignments', label: 'My Assignments', icon: ClipboardList },
      { to: '/responder/history', label: 'History', icon: History },
      { to: '/profile', label: 'Profile', icon: User },
    ];
    bottomNavItems = [
      { to: '/responder', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/responder/assignments', label: 'Assignments', icon: ClipboardList },
      { to: '/responder/history', label: 'History', icon: History },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  } else {
    // reporter
    navItems = [
      { to: '/reporter/report', label: 'Report Emergency', icon: Siren },
      { to: '/reporter/incidents', label: 'My Incidents', icon: ListChecks },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: User },
    ];
    bottomNavItems = [
      { to: '/reporter/report', label: 'Report', icon: Siren },
      { to: '/reporter/incidents', label: 'Incidents', icon: ListChecks },
      { to: '/notifications', label: 'Alerts', icon: Bell },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  }

  const content = (
    <AppShell
      role={role}
      navItems={navItems}
      bottomNavItems={bottomNavItems}
    >
      <Outlet />
    </AppShell>
  );

  if (role === 'responder') {
    return <LocationSharingProvider>{content}</LocationSharingProvider>;
  }

  return content;
};

export default RoleLayout;
