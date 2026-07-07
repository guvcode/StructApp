import { NavLink } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import type { FeatureFlagId } from '../types/index';

const baseTabs = [
  { label: 'Dashboard', route: '/m/dashboard', flagId: null as string | null },
  { label: 'Sync', route: '/m/sync', flagId: null as string | null },
  { label: 'Timesheets', route: '/m/timesheets', flagId: 'timesheets' as string | null },
  { label: 'Settings', route: '/m/settings', flagId: null as string | null },
];

export default function MobileBottomNav() {
  const tabs = baseTabs.filter(t => !t.flagId || isFeatureEnabled(t.flagId as FeatureFlagId));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-primary border-t border-border flex">
      {tabs.map((tab) => (
        <NavLink
          key={tab.route}
          to={tab.route}
          className={({ isActive }) =>
            `flex-1 text-center py-3 text-xs font-medium ${
              isActive ? 'text-accent border-t-2 border-accent' : 'text-text-secondary'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}