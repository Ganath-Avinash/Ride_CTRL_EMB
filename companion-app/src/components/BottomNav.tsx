import React from 'react';
import { LayoutDashboard, Users, Bike, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppRoute } from '../types';

const TABS: { route: AppRoute; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { route: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { route: 'contacts',  label: 'Contacts',  Icon: Users },
  { route: 'garage',    label: 'Garage',    Icon: Bike },
  { route: 'profile',   label: 'Profile',   Icon: UserCircle },
];

export const BottomNav: React.FC = () => {
  const { route, navigate } = useApp();

  return (
    <nav className="bottom-nav">
      {TABS.map(({ route: r, label, Icon }) => {
        const active = route === r;
        return (
          <button
            key={r}
            id={`nav-${r}`}
            className={`nav-item${active ? ' nav-item--active' : ''}`}
            onClick={() => navigate(r)}
          >
            <div className="nav-icon-wrap">
              <Icon size={22} />
              {active && <span className="nav-dot" />}
            </div>
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
