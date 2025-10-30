import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Callback() {
  const { access_token, error: authError } = getQueryParams(window.location.search);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (authError) throw new Error(`Authentication failed: ${authError}`);
      if (!access_token) throw new Error('No access token received');
      
      const token = auth.handleCallback();
      if (!token) throw new Error('Processing callback failed');
      
      const originalApp = sessionStorage.getItem('originalApp');
      const returnUrl = sessionStorage.getItem('returnUrl');
      
      console.log('Callback processed successfully:', {
        token,
        originalApp,
        returnUrl
      });
      
      sessionStorage.clear();
      
      // If no originalApp stored, assume account-ui
      if (!originalApp || originalApp === 'account-ui') {
        navigate('/profile', { replace: true });
      } else {
        const cfg = getClientConfig(originalApp);
        window.location.href = `${returnUrl || cfg.redirectUrl}/callback?access_token=${token}`;
      }
    } catch (e) {
      console.error('Callback error:', e);
      setError(e.message);
    }
  }, [access_token, authError, navigate]);

  if (error) return <ErrorMessage message={error} onRetry={() => navigate('/login')} />;
  return <LoadingSpinner message="Finalizing authentication…" />;
}
