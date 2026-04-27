import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  isPreviewRequired,
  isPreviewSessionValid,
} from '@/utils/previewAccess';

export function PreviewGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isPreviewRequired()) return;
    if (isPreviewSessionValid()) return;
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}`
    );
    navigate(`/preview?redirect=${redirect}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  if (isPreviewRequired() && !isPreviewSessionValid()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#701515] text-white">
        <p>A redirecionar…</p>
      </div>
    );
  }

  return <Outlet />;
}
