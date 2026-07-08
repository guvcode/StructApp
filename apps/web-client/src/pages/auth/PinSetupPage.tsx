import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/Card';
import { savePinLocally } from '../../hooks/usePinAuth';
import { getLandingRoute } from '../../lib/authStore';

export default function PinSetupPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [saving, setSaving] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (step === 'enter') {
      if (pin.length < 6) setPin(prev => prev + digit);
    } else {
      if (confirmPin.length < 6) setConfirmPin(prev => prev + digit);
    }
  }, [step, pin.length, confirmPin.length]);

  const handleBackspace = useCallback(() => {
    if (step === 'enter') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    setStep('confirm');
  }, [pin]);

  const handleSave = useCallback(async () => {
    if (confirmPin !== pin) {
      toast.error('PINs do not match');
      setConfirmPin('');
      return;
    }
    setSaving(true);
    try {
      await savePinLocally(pin);
      toast.success('PIN saved');
      navigate(getLandingRoute(), { replace: true });
    } catch {
      toast.error('Failed to save PIN');
    } finally {
      setSaving(false);
    }
  }, [pin, confirmPin, navigate]);

  const handleSkip = useCallback(() => {
    navigate(getLandingRoute(), { replace: true });
  }, [navigate]);

  const displayPin = step === 'enter' ? pin : confirmPin;

  return (
    <Card className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {step === 'enter' ? 'Set Offline PIN' : 'Confirm PIN'}
        </h1>
        <p className="text-sm text-text-secondary">
          {step === 'enter'
            ? 'Enter a 4-6 digit PIN for offline access'
            : 'Re-enter your PIN to confirm'}
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < displayPin.length
                ? 'bg-accent border-accent'
                : 'border-border'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-4">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all"
        >
          ⌫
        </button>
      </div>

      <div className="space-y-2">
        {step === 'enter' ? (
          <>
            <button
              onClick={handleNext}
              disabled={pin.length < 4}
              className="w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Next
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Skip
            </button>
          </>
        ) : (
          <button
            onClick={handleSave}
            disabled={confirmPin.length < 4 || saving}
            className="w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save PIN'}
          </button>
        )}
      </div>
    </Card>
  );
}