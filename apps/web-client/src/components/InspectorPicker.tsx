import { useState, useMemo, useRef, useEffect } from 'react';
import { useUsersByRole } from '../hooks/useUsers';
import { UserRole } from '../types';

interface InspectorPickerProps {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

export function InspectorPicker({ value, onChange, placeholder = 'Search inspector...' }: InspectorPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: users = [], isLoading } = useUsersByRole('Contractor');

  const selected = users.find(u => u.id === value);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      u => u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setOpen(!open)}
        className="w-full rounded-md bg-surface px-3 py-2 text-sm text-text-primary border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between"
      >
        {selected ? (
          <span className="truncate">
            {selected.display_name}
            <span className="text-text-muted ml-1">({selected.email})</span>
          </span>
        ) : (
          <span className="text-text-muted">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-surface border border-border shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to filter..."
              className="w-full rounded-md bg-surface-secondary px-2 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-text-muted">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-muted">No inspectors found</div>
            ) : (
              filtered.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    onChange(u.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover transition-colors ${
                    u.id === value ? 'bg-accent/10 text-accent' : 'text-text-primary'
                  }`}
                >
                  <div className="font-medium">{u.display_name}</div>
                  <div className="text-xs text-text-muted">{u.email}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}