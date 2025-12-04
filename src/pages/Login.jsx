

// account-ui/src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientCard from '../components/ClientCard';

export default function Login() {
  const { client, redirect_uri } = getQueryParams(window.location.search);
  const navigate = useNavigate();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  // Resolve client
  let currentClient = client || "account-ui";

  // Always take redirect URL from registry
  const registryConfig = getClientConfig(currentClient);
  let currentRedirectUri = registryConfig.redirectUrl;

  console.log('Centralized Login serving client:', {
    requestedClient: client,
    resolvedClient: currentClient,
    redirectUri: currentRedirectUri
  });

  // Check if already authenticated
  const token = auth.getToken();
  if (token && !auth.isTokenExpired(token)) {
    const destination = currentClient === 'account-ui'
      ? '/profile'
      : `${currentRedirectUri}/callback?access_token=${token}`;
    
    console.log('Already authenticated, redirecting to:', destination);
    window.location.href = destination;
    return;
  }

  // Load client info
  setClientInfo({
    ...registryConfig,
    clientKey: currentClient,
    redirectUrl: currentRedirectUri
  });

  console.log('Displaying login for client:', registryConfig);
}, [client, redirect_uri]);


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
