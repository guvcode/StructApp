import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUsers, useUpdateUser, useDeactivateUser } from '../../hooks/useUsers';
import { useClients } from '../../hooks/useClients';
import { resendInvite, getInviteLink } from '../../services/api/users';
import type { User } from '../../types';
import { UserRole } from '../../types';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EditDrawer from '../../components/EditDrawer';

const roleOptions = [
  { value: UserRole.admin, label: 'Admin' },
  { value: UserRole.reviewer, label: 'Reviewer' },
  { value: UserRole.contractor, label: 'Contractor' },
  { value: UserRole.inspector, label: 'Inspector' },
  { value: UserRole.owner, label: 'Owner' },
];

function InviteActions({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const isActivated = !!user.invite_accepted_at || !!user.last_login_at;

  const resendMutation = useMutation({
    mutationFn: () => resendInvite(user.id),
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.invite_link);
      toast.success('New invite link copied to clipboard');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to resend invite'),
  });

  return isActivated ? (
    <span className="text-xs text-green-600 font-medium">Accepted</span>
  ) : (
    <div className="flex gap-1">
      <button
        onClick={() => resendMutation.mutate()}
        disabled={resendMutation.isPending}
        className="px-2 py-1 text-xs text-accent hover:bg-accent/10 font-medium rounded transition-colors disabled:opacity-50"
      >
        {resendMutation.isPending ? 'Sending...' : 'Resend'}
      </button>
      <button
        onClick={async () => {
          try {
            const data = await getInviteLink(user.id);
            if (data.invite_link) {
              navigator.clipboard.writeText(data.invite_link);
              toast.success('Invite link copied');
            } else {
              toast.error('No invite link available');
            }
          } catch {
            toast.error('Failed to get invite link');
          }
        }}
        className="px-2 py-1 text-xs text-accent hover:bg-accent/10 font-medium rounded transition-colors"
      >
        Copy
      </button>
    </div>
  );
}

function UserEditDrawer({
  user,
  clients,
  onClose,
  onSaved,
}: {
  user: User;
  clients: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [memberships, setMemberships] = useState(user.client_memberships.map(m => m.client_id));
  const updateUserMutation = useUpdateUser();

  const toggleMembership = (clientId: string) => {
    setMemberships(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId],
    );
  };

  const handleSave = useCallback(async () => {
    await updateUserMutation.mutateAsync({
      id: user.id,
      input: {
        role,
        client_memberships: memberships.map(clientId => ({
          client_id: clientId,
          client_role: 'secondary' as const,
        })),
      },
    });
    onSaved();
    onClose();
  }, [user.id, role, memberships, onClose, onSaved, updateUserMutation]);

  return (
    <EditDrawer title="Edit User" saving={updateUserMutation.isPending} onClose={onClose} onSave={handleSave}>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
        >
          {roleOptions.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Client Memberships</label>
        <div className="space-y-3 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
          {clients.map(c => (
            <label key={c.id} className="flex items-center gap-3 text-sm text-text-primary cursor-pointer hover:text-accent transition-colors">
              <input
                type="checkbox"
                checked={memberships.includes(c.id)}
                onChange={() => toggleMembership(c.id)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
    </EditDrawer>
  );
}

function DeactivateDialog({
  user,
  onConfirm,
  onCancel,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Deactivate user" onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}>
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-xl">
        <h3 className="text-xl font-bold text-text-primary mb-2">Deactivate User</h3>
        <p className="text-text-secondary text-sm mb-6">
          Are you sure you want to deactivate <strong>{user.display_name}</strong>?
          Historical records will retain their identity, but they will not be able to log in.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            Confirm Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserListPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: clients = [] } = useClients();
  const deactivateUserMutation = useDeactivateUser();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  const handleDeactivate = useCallback(async () => {
    if (!deactivatingUser) return;
    await deactivateUserMutation.mutateAsync(deactivatingUser.id);
    setDeactivatingUser(null);
  }, [deactivatingUser, deactivateUserMutation]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Users</h2>
        <Link
          to="/admin/users/invite"
          className="px-3 py-1.5 bg-accent text-white font-medium rounded-md shadow-sm hover:bg-accent/90 transition-colors border border-accent-200"
        >
          Invite User
        </Link>
      </div>
      {users.length === 0 ? (
        <Card padding="lg">
          <p className="text-text-secondary text-center">No users found</p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Name / Email</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Role</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Clients</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Active</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Invite</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-text-primary font-medium">{u.display_name}</p>
                      <p className="text-text-secondary text-xs">{u.email}</p>
                    </td>
                    <td className="py-4 text-text-primary capitalize">{u.role}</td>
                    <td className="py-4 text-text-secondary">
                      {u.client_memberships.map(m => {
                        const c = clients.find(cl => cl.id === m.client_id);
                        return c ? c.name : m.client_id;
                      }).join(', ') || '—'}
                    </td>
                    <td className="py-4">
                      {(() => {
                        const isActive = u.is_active && (!!u.last_login_at || !!u.invite_accepted_at);
                        const isInvited = u.is_active && !u.last_login_at && !u.invite_accepted_at;
                        return (
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                            isActive ? 'bg-green-50 text-green-700 border-green-200' :
                            isInvited ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {isActive ? 'Active' : isInvited ? 'Invited' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4">
                      {u.is_active ? (
                        <InviteActions user={u} />
                      ) : (
                        <span className="text-text-tertiary text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 text-accent hover:bg-accent/10 font-medium rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        {u.is_active && (
                          <button
                            onClick={() => setDeactivatingUser(u)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors border border-red-200"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {editingUser && (
        <UserEditDrawer
          user={editingUser}
          clients={clients}
          onClose={() => setEditingUser(null)}
          onSaved={() => {}}
        />
      )}
      {deactivatingUser && (
        <DeactivateDialog
          user={deactivatingUser}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivatingUser(null)}
        />
      )}
    </div>
  );
}