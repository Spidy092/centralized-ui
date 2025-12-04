import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Callback() {
  const { access_token, refresh_token, error: authError } = getQueryParams(window.location.search);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (authError) throw new Error(`Authentication failed: ${authError}`);
      if (!access_token) throw new Error('No access token received');
      
      const originalApp = sessionStorage.getItem('originalApp');
      const returnUrl = sessionStorage.getItem('returnUrl');
      const token = auth.handleCallback();
      if (!token) throw new Error('Processing callback failed');
      
      console.log('Callback processed successfully:', {
        token,
        originalApp,
        returnUrl
      });
      
      // If no originalApp stored, assume account-ui
      if (!originalApp || originalApp === 'account-ui') {
        navigate('/profile', { replace: true });
      } else {
        const cfg = getClientConfig(originalApp);
        let redirectTarget;

        try {
          if (returnUrl) {
            redirectTarget = new URL(returnUrl);
          } else {
            const baseUrl = cfg.redirectUrl || window.location.origin;
            const ensured = baseUrl.endsWith('/callback') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/callback`;
            redirectTarget = new URL(ensured);
          }
        } catch (urlError) {
          console.warn('Invalid return URL, falling back to default callback', urlError);
          redirectTarget = new URL('/callback', cfg.redirectUrl || window.location.origin);
        }

        redirectTarget.searchParams.set('access_token', token);
        if (refresh_token) {
          redirectTarget.searchParams.set('refresh_token', refresh_token);
        }
        window.location.href = redirectTarget.toString();
      }
    } catch (e) {
      console.error('Callback error:', e);
      setError(e.message);
    }
  }, [access_token, authError, navigate]);

  if (error) return <ErrorMessage message={error} onRetry={() => navigate('/login')} />;
  return <LoadingSpinner message="Finalizing authentication…" />;
}
