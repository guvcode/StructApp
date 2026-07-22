import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';

export default function StructureSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: allStructures = [] } = useQuery({
    queryKey: ['structures'],
    queryFn: () => apiClient<Array<{ id: string; name: string; identifier: string; type: string }>>(ENDPOINTS.structures.list),
  });

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return allStructures.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.identifier && s.identifier.toLowerCase().includes(q))
    );
  }, [query, allStructures]);

  const searched = query.length >= 2;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/m/dashboard')} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">Structure Search</h2>
      <input
        placeholder="Search asset tag or description..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary placeholder-text-secondary"
      />
      <div className="bg-surface-primary border border-border rounded-xl p-4 text-center text-sm text-text-secondary">
        QR fallback: type an asset identifier above
      </div>
      {searched && results.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-4">No structures match your search.</p>
      )}
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map(s => (
            <li key={s.id} className="bg-surface-primary border border-border rounded-xl p-3 border-l-4 border-l-signal">
              <p className="text-sm font-semibold text-text-primary">{s.name}</p>
              <p className="text-xs text-text-secondary">{s.type} — {s.identifier}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}