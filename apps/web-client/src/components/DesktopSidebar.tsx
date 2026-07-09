import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../types/index';
import { isFeatureEnabled } from '../lib/featureFlags';

interface SubMenuItem {
  label: string;
  route: string;
}

interface MenuSection {
  label: string;
  route: string;
  roles: UserRole[];
  phase: string;
  icon?: string;
  submenu?: SubMenuItem[];
}

const getIcon = (label: string) => {
  const icons: Record<string, JSX.Element> = {
    'Dashboard': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'Clients': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    'Users': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    'Inspections': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    'Remediation': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'Timesheets': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Register': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'Reports': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'Categories': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    'Audit Logs': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'Email Queue': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'Imports': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    'Calendar': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[label] || null;
};

const menuSections: MenuSection[] = [
  { label: 'Dashboard', route: '/reviewer/dashboard', roles: ['reviewer'], phase: 'P0' },
  { label: 'Dashboard', route: '/admin/dashboard', roles: ['admin'], phase: 'P0' },
  { label: 'Clients', route: '/admin/clients', roles: ['admin'], phase: 'P0', submenu: [
    { label: 'All Clients', route: '/admin/clients' },
    { label: 'New Client', route: '/admin/clients/new' },
  ]},
  { label: 'Users', route: '/admin/users', roles: ['admin'], phase: 'P0', submenu: [
    { label: 'All Users', route: '/admin/users' },
    { label: 'Invite User', route: '/admin/users/invite' },
  ]},
  { label: 'Inspections', route: '/inspections', roles: ['reviewer', 'admin'], phase: 'P0', submenu: [
    { label: 'All Inspections', route: '/inspections' },
    { label: 'Submitted', route: '/inspections?status=Submitted' },
    { label: 'Returned', route: '/inspections?status=Returned' },
    { label: 'Approved', route: '/inspections?status=Approved' },
  ]},
  { label: 'Remediation', route: '/remediation', roles: ['reviewer', 'admin'], phase: 'P1', submenu: [
    { label: 'Open', route: '/remediation?status=Open' },
    { label: 'Pending Verification', route: '/remediation?status=Remediated_Pending_Verification' },
    { label: 'Verified Closed', route: '/remediation?status=Verified_Closed' },
  ]},
  { label: 'Timesheets', route: '/timesheets/review', roles: ['reviewer', 'admin'], phase: 'P1', submenu: [
    { label: 'Pending Review', route: '/timesheets/review?status=Submitted' },
    { label: 'History', route: '/timesheets/review' },
  ]},
{ label: 'Register', route: '/register', roles: ['reviewer', 'admin'], phase: 'P0', submenu: [
    { label: 'Projects', route: '/register/projects' },
    { label: 'Sites', route: '/register/sites' },
    { label: 'Structures', route: '/register/structures' },
    { label: 'Component Types', route: '/categories/component-types' },
    { label: 'Work Types', route: '/categories/work-types' },
    { label: 'Other Taxonomies', route: '/categories/taxonomy' },
  ]},
  { label: 'Reports', route: '/reports', roles: ['reviewer', 'admin'], phase: 'P1' },
  { label: 'Audit Logs', route: '/admin/audit-logs', roles: ['admin', 'reviewer'], phase: 'P1' },
  { label: 'Email Queue', route: '/admin/email-queue', roles: ['admin', 'reviewer'], phase: 'P1' },
  { label: 'Imports', route: '/admin/imports', roles: ['admin'], phase: 'P2', submenu: [
    { label: 'Upload Batch', route: '/admin/imports' },
    { label: 'Batch History', route: '/admin/imports/history' },
  ]},
  { label: 'Calendar', route: '/calendar', roles: ['reviewer', 'admin'], phase: 'P2', submenu: [
    { label: 'Schedule Board', route: '/calendar' },
    { label: 'Recurring Schedules', route: '/calendar/schedules' },
  ]},
];

interface Props {
  role: UserRole;
}

export default function DesktopSidebar({ role }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-expanded-sections');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (route: string) => {
    setExpandedSections(prev => ({ ...prev, [route]: !prev[route] }));
  };

  const visibleSections = menuSections.filter(
    s => s.roles.includes(role) && (s.phase === 'P0' || (s.phase === 'P1' && (
      (s.route === '/remediation' && isFeatureEnabled('remediation')) ||
      (s.route === '/timesheets/review' && isFeatureEnabled('timesheets')) ||
      (s.route === '/reports' && isFeatureEnabled('reports')) ||
      (s.route === '/categories' && isFeatureEnabled('picklists')) ||
      (s.route === '/admin/audit-logs' && isFeatureEnabled('audit_logs')) ||
      (s.route === '/admin/imports' && isFeatureEnabled('imports')) ||
      (s.route === '/calendar' && isFeatureEnabled('calendar'))
    )))
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface-elevated border-r border-border h-full overflow-y-auto transition-all duration-300`}>
      {/* Collapse Toggle */}
      <div className="p-3 border-b border-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-secondary transition-all hover:-translate-y-0.5"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      <nav className="p-3">
        {visibleSections.map((section) => {
          const isExpanded = expandedSections[section.route] ?? false;
          const hasSubmenu = section.submenu && section.submenu.length > 0;
          
          return (
            <div key={section.route} className="mb-1">
              <div className="flex items-center">
                <NavLink
                  to={section.route}
                  className={({ isActive }) =>
`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all hover:-translate-y-0.5 flex-1 ${
                       isActive 
                         ? 'text-accent bg-accent/10 shadow-sm' 
                         : 'text-text-primary hover:bg-surface-secondary hover:text-text-primary'
                     }`
                  }
                  title={isCollapsed ? section.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-accent' : 'text-text-secondary'}>
                        {getIcon(section.label)}
                      </span>
                      {!isCollapsed && <span>{section.label}</span>}
                    </>
                  )}
                </NavLink>
                {!isCollapsed && hasSubmenu && (
                  <button
                    onClick={() => toggleSection(section.route)}
                    className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.label} submenu`}
                  >
                    <svg 
                      className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {!isCollapsed && hasSubmenu && isExpanded && (
                <div className="ml-11 mt-1 space-y-0.5 overflow-hidden transition-all duration-200">
                  {section.submenu!.map((item) => (
                    <NavLink
                      key={item.route}
                      to={item.route}
                      className={({ isActive }) =>
                        `block px-3 py-1.5 text-sm rounded-md transition-colors ${
                          isActive 
                            ? 'text-accent font-medium bg-accent/5' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}