import { useState } from 'react';
import type { PicklistEntry } from '../types/index';

export type EntityLabel = 'Component Type' | 'Work Type' | 'Structure Type';

export interface PicklistManagerProps {
  entityLabel: EntityLabel;
  entries: PicklistEntry[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
}

type FilterMode = 'all' | 'active' | 'inactive';

export function PicklistManager({ entityLabel, entries, onAdd, onRename, onDeactivate, onReactivate }: PicklistManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (entry: PicklistEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.name);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const filtered = filter === 'all'
    ? entries
    : filter === 'active'
      ? entries.filter(e => e.isActive)
      : entries.filter(e => !e.isActive);

  return (
    <div className="flex flex-col">
      <h2 className="text-text-primary font-semibold text-lg mb-4">{entityLabel} Manager</h2>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add new ${entityLabel.toLowerCase()}...`}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {(['all', 'active', 'inactive'] as FilterMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setFilter(m)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === m
                ? 'bg-accent text-accent-foreground'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            {m === 'all' ? 'All' : m === 'active' ? 'Active' : 'Inactive'}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-lg bg-surface">
        {filtered.length === 0 ? (
          <p className="p-4 text-text-secondary text-sm">
            {filter === 'all'
              ? `No ${entityLabel.toLowerCase()}s configured.`
              : filter === 'active'
                ? `No active ${entityLabel.toLowerCase()}s.`
                : `No inactive ${entityLabel.toLowerCase()}s.`}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between p-3"
              >
                {editingId === entry.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    autoFocus
                    className="flex-1 rounded-md border border-accent bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent mr-2"
                  />
                ) : (
                  <span className={entry.isActive ? 'text-text-primary' : 'text-text-muted'}>
                    {entry.name}
                  </span>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  {!entry.isActive && (
                    <span className="text-xs bg-surface-secondary text-text-muted px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                  {entry.isActive && editingId !== entry.id && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="rounded-md bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeactivate(entry.id)}
                        className="rounded-md bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                  {!entry.isActive && editingId !== entry.id && (
                    <button
                      type="button"
                      onClick={() => onReactivate(entry.id)}
                      className="rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}