import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthNavigate } from '@/services/api';

/**
 * Regista o `navigate` do React Router no serviço Axios para 401/403.
 */
export function AuthNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setAuthNavigate(navigate);
    return () => setAuthNavigate(null);
  }, [navigate]);

  return null;
}
