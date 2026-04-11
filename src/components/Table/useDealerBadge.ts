/**
 * Manages dealer badge visibility with an exit animation.
 * Returns showBadge (whether to render) and badgeExiting (whether the
 * fade-out animation is playing).
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useDealerBadge(isDealer: boolean) {
  const [showBadge, setShowBadge] = useState(isDealer);
  const [badgeExiting, setBadgeExiting] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBadgeExit = useCallback(() => {
    setBadgeExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setShowBadge(false);
      setBadgeExiting(false);
    }, 260);
  }, []);

  useEffect(() => {
    if (isDealer) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setBadgeExiting(false);
      setShowBadge(true);
    } else if (showBadge) {
      triggerBadgeExit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDealer]);

  return { showBadge, badgeExiting };
}
