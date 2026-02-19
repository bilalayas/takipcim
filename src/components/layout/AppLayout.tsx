import { ReactNode, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';

const routes = ['/', '/planning', '/analytics', '/settings'];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = touchRef.current.x - e.changedTouches[0].clientX;
    const dy = Math.abs(touchRef.current.y - e.changedTouches[0].clientY);
    const currentIdx = routes.indexOf(location.pathname);

    // Only navigate on clear horizontal swipe (>120px horizontal, less vertical)
    if (Math.abs(dx) > 120 && dy < 80 && currentIdx !== -1) {
      if (dx > 0 && currentIdx < routes.length - 1) {
        navigate(routes[currentIdx + 1]);
      } else if (dx < 0 && currentIdx > 0) {
        navigate(routes[currentIdx - 1]);
      }
    }
    touchRef.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className="max-w-lg mx-auto pb-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
};
