import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParvaz } from '@/store/parvaz';
import { qiblaBearing, reverseGeocode } from '@/lib/prayer';
import { Compass, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Qibla = () => {
  const { settings, updateSettings } = useParvaz();

  // deviceHeading = true north heading of the top of the device (degrees)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [permState, setPermState] = useState<'idle'|'asking'|'granted'|'denied'|'unsupported'>('idle');
  const [locating, setLocating] = useState(false);

  // smoothed heading using exponential moving average
  const smoothedHeading = useRef<number | null>(null);
  const [displayHeading, setDisplayHeading] = useState<number | null>(null);

  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── Qibla bearing from user location ──────────────────────────────────────
  const bearing = useMemo(() => {
    if (!settings.location) return null;
    return qiblaBearing(settings.location.latitude, settings.location.longitude);
  }, [settings.location]);

  // ── How far off is the compass from Qibla ─────────────────────────────────
  // compassAngle: how much to rotate the NEEDLE so it points to Qibla
  // = bearing - deviceHeading
  const compassAngle = useMemo(() => {
    if (bearing == null) return 0;
    if (displayHeading == null) return bearing; // static — just show bearing from north
    return ((bearing - displayHeading) + 360) % 360;
  }, [bearing, displayHeading]);

  // degrees off from Qibla (0 = perfectly aligned)
  const degreesOff = useMemo(() => {
    const diff = Math.abs(compassAngle % 360);
    return Math.min(diff, 360 - diff);
  }, [compassAngle]);

  const isAligned = degreesOff < 5;
  const isClose   = degreesOff < 15;

  // ── Smoothing loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      if (deviceHeading !== null) {
        if (smoothedHeading.current === null) {
          smoothedHeading.current = deviceHeading;
        } else {
          // Shortest-path interpolation (handles 0/360 wrap)
          let delta = deviceHeading - smoothedHeading.current;
          if (delta >  180) delta -= 360;
          if (delta < -180) delta += 360;
          smoothedHeading.current = smoothedHeading.current + delta * 0.15;
          smoothedHeading.current = ((smoothedHeading.current % 360) + 360) % 360;
        }
        setDisplayHeading(Math.round(smoothedHeading.current));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [deviceHeading]);

  const absoluteHandlerRef = useRef<((e: Event) => void) | null>(null);

  // ── Start compass ──────────────────────────────────────────────────────────
  const startCompass = async () => {
    const anyEvt = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };

    if (typeof anyEvt.requestPermission === 'function') {
      try {
        setPermState('asking');
        const res = await anyEvt.requestPermission();
        if (res !== 'granted') { setPermState('denied'); return; }
        setPermState('granted');
      } catch { setPermState('denied'); return; }
    } else if ('DeviceOrientationEvent' in window) {
      setPermState('granted');
    } else {
      setPermState('unsupported'); return;
    }

    const usingAbsoluteRef = { current: false };

    const handler = (e: DeviceOrientationEvent) => {
      const wk = (e as any).webkitCompassHeading as number | undefined;
      if (typeof wk === 'number' && wk >= 0) {
        setDeviceHeading(wk);
        return;
      }
      if ((e as any).absolute === true && e.alpha != null) {
        usingAbsoluteRef.current = true;
        setDeviceHeading((360 - e.alpha + 360) % 360);
        return;
      }
      if (!usingAbsoluteRef.current && e.alpha != null) {
        setDeviceHeading((360 - e.alpha + 360) % 360);
      }
    };

    const absoluteHandler = (e: Event) => {
      usingAbsoluteRef.current = true;
      handler(e as DeviceOrientationEvent);
    };

    // Store both refs for cleanup
    handlerRef.current = handler;
    absoluteHandlerRef.current = absoluteHandler;

    window.addEventListener('deviceorientationabsolute', absoluteHandler, true);
    window.addEventListener('deviceorientation', handler, true);
  };

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('deviceorientation', handlerRef.current, true);
        handlerRef.current = null;
      }
      if (absoluteHandlerRef.current) {
        window.removeEventListener('deviceorientationabsolute', absoluteHandlerRef.current, true);
        absoluteHandlerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // ── Haptic when aligned ────────────────────────────────────────────────────
  const wasAligned = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAligned.current) {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      wasAligned.current = true;
    }
    if (!isAligned) wasAligned.current = false;
  }, [isAligned]);

  // ── Detect location ────────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!('geolocation' in navigator)) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const meta = await reverseGeocode(latitude, longitude);
        updateSettings({ location: { latitude, longitude, ...meta } });
        toast.success('Location set', { description: meta.city ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` });
        setLocating(false);
      },
      () => { toast.error('Could not get location'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Needle color & glow ───────────────────────────────────────────────────
  const needleColor  = isAligned ? '#22c55e' : isClose ? '#eab308' : 'hsl(var(--primary))';
  const needleGlow   = isAligned
    ? '0 0 24px 8px rgba(34,197,94,0.7)'
    : isClose
    ? '0 0 16px 4px rgba(234,179,8,0.5)'
    : '0 0 12px rgba(var(--primary-raw,167,139,250),0.6)';

  // ── Compass face rotation: rotate face so N stays pointing to true north ──
  // (needle is fixed, face rotates under it — like a real compass)
  const faceRotation = displayHeading != null ? -displayHeading : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Qibla</p>
        <h1 className="font-display text-4xl md:text-5xl">Toward the <span className="gold-text">Kaaba</span></h1>
        <p className="text-muted-foreground text-sm mt-1">
          {settings.location
            ? `From ${settings.location.city ?? `${settings.location.latitude.toFixed(2)}, ${settings.location.longitude.toFixed(2)}`}`
            : 'Set your location to begin.'}
        </p>
      </header>

      {!settings.location && (
        <button onClick={detectLocation} disabled={locating}
          className="w-full glass-strong rounded-2xl p-5 inline-flex items-center justify-center gap-2 text-foreground/90">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
      )}

      <section className="glass-strong rounded-3xl p-8 relative overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-dawn blur-3xl opacity-50 animate-breathe" />

        <div className="relative flex flex-col items-center gap-6">
          {/* Alignment status */}
          {permState === 'granted' && bearing != null && (
            <div className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-500 ${
              isAligned
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : isClose
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'bg-primary/10 text-muted-foreground border border-border/30'
            }`}>
              {isAligned
                ? '✦ Facing Qibla'
                : isClose
                ? `Almost — ${degreesOff}° off`
                : `${degreesOff}° from Qibla`}
            </div>
          )}

          {/* Compass */}
          <div className="relative w-64 h-64">
            {/* Outer ring — glow when aligned */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                border: `2px solid ${needleColor}`,
                boxShadow: isClose ? needleGlow : 'none',
                opacity: permState === 'granted' ? 1 : 0.4,
              }}
            />

            {/* Rotating face — cardinal points + ticks rotate with device heading */}
            <div
              className="absolute inset-0 transition-transform duration-100"
              style={{ transform: `rotate(${faceRotation}deg)` }}
            >
              {/* Tick marks */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-40">
                {Array.from({ length: 72 }).map((_, i) => (
                  <line key={i}
                    x1="100" y1="8" x2="100" y2={i % 18 === 0 ? 22 : i % 9 === 0 ? 18 : 14}
                    stroke="currentColor" className="text-primary"
                    strokeWidth={i % 18 === 0 ? 2 : i % 9 === 0 ? 1.2 : 0.6}
                    transform={`rotate(${i * 5} 100 100)`}
                  />
                ))}
              </svg>

              {/* Cardinal labels */}
              {[
                { label: 'N', deg: 0   },
                { label: 'E', deg: 90  },
                { label: 'S', deg: 180 },
                { label: 'W', deg: 270 },
              ].map(({ label, deg }) => {
                const rad = (deg - 90) * Math.PI / 180;
                const r = 84;
                const cx = 50 + (r + 18) * Math.cos(rad) / 128 * 100;
                const cy = 50 + (r + 18) * Math.sin(rad) / 128 * 100;
                return (
                  <span
                    key={label}
                    className={`absolute text-[11px] font-bold tracking-widest -translate-x-1/2 -translate-y-1/2 ${label === 'N' ? 'text-red-400' : 'text-muted-foreground'}`}
                    style={{ left: `${cx}%`, top: `${cy}%` }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Fixed Qibla needle — always points to Qibla */}
            {bearing != null && (
              <div
                className="absolute inset-0 transition-transform duration-150 ease-out"
                style={{ transform: `rotate(${compassAngle}deg)` }}
              >
                {/* Needle */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                  {/* Needle tip (points toward Qibla) */}
                  <polygon
                    points="100,16 108,100 100,110 92,100"
                    style={{ fill: needleColor, filter: isClose ? `drop-shadow(0 0 6px ${needleColor})` : 'none', transition: 'fill 0.5s, filter 0.5s' }}
                  />
                  {/* Needle tail */}
                  <polygon
                    points="100,184 108,100 100,110 92,100"
                    fill="rgba(255,255,255,0.15)"
                  />
                </svg>
              </div>
            )}

            {/* Center Kaaba icon */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold text-primary-foreground transition-all duration-500"
                style={{
                  background: isAligned ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#D4AF37,#F5D76E)',
                  boxShadow: isAligned ? '0 0 16px rgba(34,197,94,0.6)' : '0 0 10px rgba(212,175,55,0.5)',
                }}
              >
                🕋
              </div>
            </div>
          </div>

          {/* Bearing info */}
          <div className="text-center space-y-1">
            {bearing != null ? (
              <>
                <p className="font-display text-3xl tabular-nums">{Math.round(bearing)}°</p>
                <p className="text-xs text-muted-foreground">Qibla from True North</p>
                {displayHeading != null && (
                  <p className="text-xs text-muted-foreground">Device heading: {Math.round(displayHeading)}°</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Set your location to see the direction.</p>
            )}
          </div>

          {/* Activate button */}
          {permState !== 'granted' && (
            <button onClick={startCompass}
              className="px-5 py-3 rounded-full bg-gradient-gold text-primary-foreground text-sm font-medium shadow-glow inline-flex items-center gap-2">
              <Compass className="w-4 h-4" />
              {permState === 'denied'
                ? 'Permission denied — showing static bearing'
                : 'Activate live compass'}
            </button>
          )}

          {permState === 'unsupported' && (
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Your device doesn't expose orientation. The bearing above is correct — align your phone with a physical compass.
            </p>
          )}

          {/* Instructions */}
          {permState === 'granted' && (
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Hold your phone flat and level. The needle points toward the Kaaba.
              {isAligned && ' 💚 You are facing Qibla!'}
            </p>
          )}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground italic">
        "So turn your face toward the Sacred Mosque." — Quran 2:144
      </p>
    </div>
  );
};
