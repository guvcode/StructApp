import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../services/api/auth';
import { getHasUnsyncedWork } from '../lib/authStore';
import UnsyncedWarningDialog from './UnsyncedWarningDialog';

export default function LogoutButton() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    if (getHasUnsyncedWork()) {
      setShowWarning(true);
      return;
    }
    setLoading(true);
    await apiLogout();
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleConfirm = useCallback(async () => {
    setShowWarning(false);
    setLoading(true);
    await apiLogout();
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
      >
        {loading ? 'Logging out...' : 'Log out'}
      </button>
      <UnsyncedWarningDialog
        open={showWarning}
        onConfirm={handleConfirm}
        onCancel={() => setShowWarning(false)}
      />
    </>
  );
}