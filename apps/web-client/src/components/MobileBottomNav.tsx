import { NavLink } from 'react-router-dom';
import { isFeatureEnabled } from '../lib/featureFlags';
import type { FeatureFlagId } from '../types/index';

const baseTabs = [
  {
    label: 'Dashboard',
    route: '/m/dashboard',
    flagId: null as string | null,
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Sync',
    route: '/m/sync',
    flagId: null as string | null,
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  {
    label: 'Timesheets',
    route: '/m/timesheets',
    flagId: 'timesheets' as string | null,
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: 'Settings',
    route: '/m/settings',
    flagId: null as string | null,
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

export default function MobileBottomNav() {
  const tabs = baseTabs.filter(t => !t.flagId || isFeatureEnabled(t.flagId as FeatureFlagId));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-primary border-t border-border flex safe-area-bottom">
      {tabs.map((tab) => (
        <NavLink
          key={tab.route}
          to={tab.route}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-text-secondary'
            }`
          }
        >
          {tab.icon}
          <span className="mt-0.5">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}