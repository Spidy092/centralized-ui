

// account-ui/src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@spidy092/auth-client';
import { getQueryParams } from '../utils/queryParams';
import { getClientConfig } from '../config/clientRegistry';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientCard from '../components/ClientCard';

export default function Login() {
  const { client, redirect_uri } = getQueryParams(window.location.search); // ✅ Remove state
  const navigate = useNavigate();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Determine which client we're serving
    let currentClient = client;
    let currentRedirectUri = redirect_uri;

    // If no client specified, default to account-ui
    if (!currentClient && !currentRedirectUri) {
      currentClient = 'account-ui';
      currentRedirectUri = getClientConfig(currentClient).redirectUrl;
    }

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
        : `${currentRedirectUri || getClientConfig(currentClient).redirectUrl}/callback?access_token=${token}`;
      
      console.log('Already authenticated, redirecting to:', destination);
      window.location.href = destination;
      return;
    }

    // ✅ Get client-specific configuration for display
    const clientConfig = getClientConfig(currentClient);
    setClientInfo({
      ...clientConfig,
      clientKey: currentClient, // Store the actual client key
      redirectUrl: currentRedirectUri || clientConfig.redirectUrl
    });

    console.log('Displaying login for client:', clientConfig);
  }, [client, redirect_uri]);

  const onLogin = () => {
    if (!clientInfo) return;
    
    setLoading(true);
    console.log('Initiating login for:', clientInfo.clientKey);
    
    // ✅ Use the dynamic client info
    auth.login(clientInfo.clientKey, clientInfo.redirectUrl);
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
