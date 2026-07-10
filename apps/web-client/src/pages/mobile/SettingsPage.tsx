import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { hasLocalPin } from '../../hooks/usePinAuth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [pinEnabled, setPinEnabled] = useState(false);

  useEffect(() => {
    hasLocalPin().then(setPinEnabled);
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/m/dashboard')} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">Settings</h2>
      <div className="border border-border rounded-md divide-y divide-border bg-surface-primary">
        <div className="px-4 py-3 text-sm text-text-secondary">
          App version: 2.0.0
        </div>
        {canInstall && (
          <div className="px-4 py-3">
            <button
              onClick={promptInstall}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Install to Phone
            </button>
          </div>
        )}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-primary font-medium">Offline PIN</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${pinEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {pinEnabled ? 'Enabled' : 'Off'}
            </span>
            <button
              onClick={() => navigate('/m/setup-pin')}
              className="text-sm text-accent hover:underline font-medium"
            >
              {pinEnabled ? 'Change' : 'Set up'}
            </button>
          </div>
        </div>
        <div className="px-2 py-1">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}