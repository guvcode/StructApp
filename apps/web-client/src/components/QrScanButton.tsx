import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

export type QrScanError = 'permission_denied' | 'no_match' | 'camera_unavailable';

export interface QrScanButtonProps {
  onScanResult: (qrValue: string) => void;
  onScanError?: (reason: QrScanError) => void;
}

export function QrScanButton({ onScanResult, onScanError }: QrScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const noMatchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 500,
    });

    return () => {
      if (readerRef.current) {
        (readerRef.current as BrowserQRCodeReader & { stop?: () => void }).stop?.();
      }
      if (noMatchTimerRef.current) {
        clearTimeout(noMatchTimerRef.current);
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    setIsScanning(false);
    setError(null);
    if (noMatchTimerRef.current) {
      clearTimeout(noMatchTimerRef.current);
      noMatchTimerRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    setError(null);
    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 500,
        });
      }

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const firstDevice = devices[0];

      if (!firstDevice) {
        onScanError?.('camera_unavailable');
        setError('No camera found. Please use a different device.');
        return;
      }

      setIsScanning(true);

      if (!videoRef.current) return;

      noMatchTimerRef.current = window.setTimeout(() => {
        if (isScanning) {
          onScanError?.('no_match');
        }
      }, 30000);

      readerRef.current.decodeFromVideoDevice(
        firstDevice.deviceId,
        videoRef.current,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any, error: any) => {
          if (result) {
            stopCamera();
            onScanResult(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            onScanError?.('camera_unavailable');
          }
        }
      );
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        onScanError?.('permission_denied');
      } else {
        onScanError?.('camera_unavailable');
      }
      setError('Camera access failed. Please allow camera permission.');
    }
  }, [onScanResult, onScanError, stopCamera]);

  return (
    <div className="relative">
      {!isScanning ? (
        <button
          type="button"
          onClick={startScan}
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          aria-label="Scan QR code"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m0 14v1m-8-8h1m14 0h1m-3.7-6.3l-.7.7M7.7 16.3l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Scan QR
        </button>
      ) : (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-text-primary font-semibold mb-4">Scan QR Code</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              aria-label="QR scanner video feed"
              className="w-full rounded-lg mb-4"
            />
            {error && (
              <p className="text-error text-sm mb-2">{error}</p>
            )}
            <button
              type="button"
              onClick={stopCamera}
              aria-label="Cancel QR scan"
              className="w-full rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary border border-border hover:bg-surface-tertiary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}