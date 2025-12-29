

// account-ui/src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientCard from '../components/ClientCard';

export default function Login() {
  const { client, redirect_uri } = getQueryParams(window.location.search);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Check if session expired
  const sessionExpired = searchParams.get('expired') === 'true';
  const expiredReason = searchParams.get('reason');

  useEffect(() => {
  // Resolve client
  let currentClient = client || "account-ui";

  // Always take redirect URL from registry
  const registryConfig = getClientConfig(currentClient);
  let currentRedirectUri = registryConfig.redirectUrl;

  console.log('Centralized Login serving client:', {
    requestedClient: client,
    resolvedClient: currentClient,
    redirectUri: currentRedirectUri,
    sessionExpired,
    expiredReason
  });

  // If session expired, don't auto-redirect even if token exists
  if (sessionExpired) {
    console.log('⚠️ Session expired, clearing any stale tokens');
    auth.clearToken();
    auth.clearRefreshToken();
  }

  // Check if already authenticated (only if not coming from expiration)
  if (!sessionExpired) {
    const token = auth.getToken();
    if (token && !auth.isTokenExpired(token)) {
      // Note: currentRedirectUri already ends with /callback (e.g., http://admin.local.test:5173/callback)
      // So we just append the query parameters, not another /callback
      const destination = currentClient === 'account-ui'
        ? '/profile'
        : `${currentRedirectUri}?access_token=${token}`;
      
      console.log('Already authenticated, redirecting to:', destination);
      window.location.href = destination;
      return;
    }
  }

  // Load client info
  setClientInfo({
    ...registryConfig,
    clientKey: currentClient,
    redirectUrl: currentRedirectUri
  });

  console.log('Displaying login for client:', registryConfig);
}, [client, redirect_uri, sessionExpired, expiredReason]);


  const onLogin = () => {
    if (!clientInfo) return;
    
    setLoading(true);
    console.log('🔐 Redirecting to auth service for:', clientInfo.clientKey);

    try {
      auth.login(clientInfo.clientKey, clientInfo.redirectUrl);
    } catch (error) {
      console.error('❌ Failed to initiate login:', error);
      setLoading(false);
      alert('Failed to start login. Please try again.');
    }
  };

  if (!clientInfo) return <LoadingSpinner />;
  
  return (
    <div className="login-container">
      {/* Session Expired Message */}
      {sessionExpired && (
        <div className="session-expired-alert" style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400E' }}>Session Expired</strong>
            <p style={{ margin: '4px 0 0', color: '#B45309', fontSize: '14px' }}>
              {expiredReason === 'session_deleted' 
                ? 'Your session was terminated by an administrator. Please sign in again.'
                : 'Your session has expired. Please sign in again to continue.'}
            </p>
          </div>
        </div>
      )}
      
      <div className="login-header">
        <h2>Sign in to continue</h2>
        <p>You are being redirected from <strong>{clientInfo.name}</strong></p>
      </div>
      <ClientCard 
        client={clientInfo} 
        onLogin={onLogin} 
        isLoading={loading} 
      />
    </div>
  );
}

