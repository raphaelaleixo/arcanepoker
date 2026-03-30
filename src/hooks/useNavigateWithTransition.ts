import { useNavigate } from 'react-router-dom';

export function useNavigateWithTransition(): (to: string) => void {
  const navigate = useNavigate();

  return (to: string) => {
    if (!document.startViewTransition) {
      navigate(to);
      return;
    }
    document.startViewTransition(() => {
      navigate(to);
    });
  };
}
