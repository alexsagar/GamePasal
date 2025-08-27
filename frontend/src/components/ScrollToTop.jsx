import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scroll restoration for React Router v6
// - On PUSH/REPLACE: scroll to top
// - On POP (back/forward): restore previous scroll position if available
export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef(new Map()); // key -> scrollY
  const prevKeyRef = useRef(location.key);

  // Save scroll position of the previous page before navigating away
  useEffect(() => {
    return () => {
      positionsRef.current.set(prevKeyRef.current, window.scrollY || window.pageYOffset || 0);
    };
  }, [location.key]);

  // On navigation, scroll accordingly
  useEffect(() => {
    const isPop = navigationType === 'POP';
    if (isPop) {
      const y = positionsRef.current.get(location.key) ?? 0;
      window.scrollTo(0, y);
    } else {
      window.scrollTo(0, 0);
    }
    prevKeyRef.current = location.key;
  }, [location.key, navigationType]);

  return null;
}


