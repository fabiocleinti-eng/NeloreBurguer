import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePlaceholder() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/loja', { replace: true }); }, [navigate]);
  return null;
}
