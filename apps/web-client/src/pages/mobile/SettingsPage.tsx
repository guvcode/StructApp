import LogoutButton from '../../components/LogoutButton';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export default function SettingsPage() {
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <div className="space-y-6">
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
        <div className="px-2 py-1">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}