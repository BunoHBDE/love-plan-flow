import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Component that handles auth redirects from Supabase email links.
 * Detects recovery tokens in URL hash and redirects to the appropriate page.
 */
export function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash with auth tokens
    const hash = window.location.hash;
    
    if (hash && hash.includes('type=recovery')) {
      // Redirect to password reset page with the hash
      navigate(`/redefinir-senha${hash}`, { replace: true });
    }
  }, [navigate, location]);

  return null;
}
