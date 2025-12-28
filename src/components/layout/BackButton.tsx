import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === '/') {
    return null;
  }

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to home if no history
      navigate('/');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className="shrink-0"
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
