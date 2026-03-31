import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export function useNavigateWithTransition(): (to: string, type?: 'default' | 'fade') => void {
  const navigate = useNavigate();

  return (to: string, type: 'default' | 'fade' = 'default') => {
    if (!document.startViewTransition) {
      navigate(to);
      return;
    }
    if (type === 'fade') {
      document.documentElement.dataset.vtType = 'fade';
    }
    const transition = document.startViewTransition(() => {
      flushSync(() => navigate(to));
    });
    transition.finished.finally(() => {
      delete document.documentElement.dataset.vtType;
    });
  };
}
