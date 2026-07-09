import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="bg-surface-primary border border-border rounded-lg shadow-lg p-4 mb-3 flex items-center justify-between gap-3">
      <div className="text-sm">
        <p className="font-semibold text-text-primary">Install StructApp</p>
        <p className="text-text-secondary text-xs">Add to your home screen for quick access</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => { promptInstall().catch(console.error) }}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Install
        </button>
      </div>
    </div>
  );
}