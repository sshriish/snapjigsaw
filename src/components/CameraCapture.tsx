import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCw, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { playBeep, playShutter } from '../utils/soundHelper';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onBack: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('loading');
  const [facingMode, setFacingMode] = useState<VideoFacingModeEnum>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  // Check for multiple video inputs (cameras)
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      })
      .catch((err) => {
        console.warn('Unable to enumerate camera devices:', err);
      });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setPermissionState('loading');
    stopCamera();

    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1024 },
        height: { ideal: 768 },
        aspectRatio: { ideal: 4 / 3 }
      },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionState('granted');
    } catch (err) {
      console.error('Camera permission denied or error:', err);
      setPermissionState('denied');
    }
  }, [facingMode, stopCamera]);

  // Initialize and clean up camera stream
  useEffect(() => {
    if (capturedPhoto) return; // don't start stream if we already have a captured photo

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode, capturedPhoto, startCamera, stopCamera]);

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const startCountdown = () => {
    if (countdown !== null) return;
    setCountdown(4);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger flash animation
    setFlashActive(true);
    playShutter();

    // Mirror image drawing if using the front ('user') camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Save as JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Stop camera feed after shutter sound plays
    setTimeout(() => {
      setFlashActive(false);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }, 250);
  }, [facingMode, stopCamera]);

  // Countdown timer loop
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      // Play a beep sound on each tick
      playBeep();
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished -> Capture Photo
      capturePhoto();
      setCountdown(null);
    }
  }, [countdown, capturePhoto]);

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  if (permissionState === 'denied') {
    return (
      <div className="glass-panel landing-card">
        <h2 className="landing-title" style={{ color: 'var(--error)' }}>Camera Required</h2>
        <p className="landing-desc">
          To play SnapJigsaw, we need permission to access your webcam or camera. 
          Please enable camera permissions in your browser and click retry.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
          <button className="btn-primary" onClick={startCamera}>
            <RefreshCw size={20} /> Retry Access
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel capture-card">
      {!capturedPhoto ? (
        <>
          <div className="camera-container active-glow">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
              </div>
            )}
            <div className={`camera-flash ${flashActive ? 'flash-active' : ''}`} />
          </div>

          <div className="capture-controls">
            <button className="btn-secondary" onClick={onBack}>
              Cancel
            </button>

            {countdown === null && (
              <button className="btn-primary" onClick={startCountdown}>
                <Camera size={20} /> Start Countdown
              </button>
            )}

            {hasMultipleCameras && countdown === null && (
              <button className="btn-secondary" onClick={switchCamera} title="Switch Camera">
                <RotateCw size={18} />
              </button>
            )}
          </div>
          <div className="camera-instructions" style={{ marginTop: '12px' }}>
            <span className="app-subtitle">Captures automatically after a 4s countdown beep</span>
          </div>
        </>
      ) : (
        <div className="captured-preview-container">
          <img src={capturedPhoto} alt="Captured preview" className="captured-image" />
          
          <div className="preview-actions">
            <button className="btn-secondary" onClick={handleRetake}>
              <RefreshCw size={18} /> Retake
            </button>
            <button className="btn-primary" onClick={handleConfirm}>
              <Check size={18} /> Keep Photo & Select Filter <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
