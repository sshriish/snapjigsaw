import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCw, RefreshCw, Check, ArrowRight, Palette } from 'lucide-react';
import { playBeep, playShutter } from '../utils/soundHelper';
import { FILTER_OPTIONS, CSS_FILTER_PREVIEWS, applyFilter } from '../utils/imageFilters';
import type { FilterType } from '../utils/imageFilters';

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
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [liveThumb, setLiveThumb] = useState<string | null>(null);

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

  // Grabs a cheap, cropped square snapshot of the live feed to power the
  // filter-strip thumbnails, so each filter chip previews the actual scene.
  const captureLiveThumb = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return;

    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    ctx.drawImage(video, sx, sy, side, side, 0, 0, canvas.width, canvas.height);

    setLiveThumb(canvas.toDataURL('image/jpeg', 0.7));
  }, [facingMode]);

  // Periodically refresh the filter-strip thumbnails while the viewfinder is live.
  useEffect(() => {
    if (capturedPhoto || permissionState !== 'granted' || countdown !== null) return;

    captureLiveThumb();
    const intervalId = setInterval(captureLiveThumb, 700);
    return () => clearInterval(intervalId);
  }, [capturedPhoto, permissionState, countdown, captureLiveThumb]);

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

    // Stop camera feed after shutter sound plays, then bake the filter
    // the user picked before shooting into the full-resolution capture.
    setTimeout(() => {
      void (async () => {
        setFlashActive(false);
        try {
          const finalDataUrl = await applyFilter(canvas, selectedFilter);
          setCapturedPhoto(finalDataUrl);
        } catch (err) {
          console.error('Failed to bake filter into captured photo, using raw frame:', err);
          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.95));
        }
        stopCamera();
      })();
    }, 250);
  }, [facingMode, stopCamera, selectedFilter]);

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
              style={{ filter: CSS_FILTER_PREVIEWS[selectedFilter] }}
            />
            {selectedFilter !== 'none' && countdown === null && (
              <div className="live-filter-badge">
                <Palette size={12} /> {FILTER_OPTIONS.find((f) => f.id === selectedFilter)?.name}
              </div>
            )}
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
              </div>
            )}
            <div className={`camera-flash ${flashActive ? 'flash-active' : ''}`} />
          </div>

          <div className="filter-strip-section">
            <div className="filter-strip-header">
              <Palette size={14} /> Pick your look before you shoot
            </div>
            <div className="filter-strip">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`filter-chip ${selectedFilter === option.id ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(option.id)}
                  disabled={countdown !== null}
                  title={option.description}
                >
                  <span
                    className="filter-chip-avatar"
                    style={{
                      backgroundImage: liveThumb ? `url(${liveThumb})` : undefined,
                      filter: CSS_FILTER_PREVIEWS[option.id]
                    }}
                  />
                  <span className="filter-chip-name">{option.name}</span>
                </button>
              ))}
            </div>
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

          {selectedFilter !== 'none' && (
            <div className="live-filter-badge static">
              <Palette size={12} /> {FILTER_OPTIONS.find((f) => f.id === selectedFilter)?.name} applied
            </div>
          )}

          <div className="preview-actions">
            <button className="btn-secondary" onClick={handleRetake}>
              <RefreshCw size={18} /> Retake
            </button>
            <button className="btn-primary" onClick={handleConfirm}>
              <Check size={18} /> Keep Photo & Start Puzzle <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
