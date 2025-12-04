// import { auth } from '@spidy092/auth-client';

// export const authConfig = {
//   clientKey: 'centralized-login',
//   authBaseUrl: 'http://localhost:4000/auth',
//   redirectUri: `${window.location.origin}/callback`,
//   accountUiUrl: window.location.origin, // This app IS the account UI
// };

// auth.setConfig({
//   clientKey: 'account-ui',
//   authBaseUrl: 'http://localhost:4000/auth',
//   accountUiUrl: 'http://localhost:5173',
//   redirectUri: 'http://localhost:5173/callback'
// });

// // Initialize the auth client
// auth.setConfig(authConfig);

// // Client configurations for different apps
// export const CLIENT_CONFIGS = {
//   'pms': {
//     name: 'Property Management System',
//     description: 'Manage properties, tenants, and lease agreements',
//     icon: '🏢',
//     primaryColor: '#10B981',
//     redirectUrl: 'http://pms.localhost:3000',
//     features: ['Property Management', 'Tenant Portal', 'Maintenance Tracking']
//   },
//   'analytics': {
//     name: 'Analytics Dashboard',
//     description: 'View reports, metrics, and business insights',
//     icon: '📊',
//     primaryColor: '#8B5CF6', 
//     redirectUrl: 'http://analytics.localhost:3000',
//     features: ['Reports', 'Data Visualization', 'Export Tools']
//   },
//   'crm': {
//     name: 'Customer Relationship Management',
//     description: 'Manage customer relationships and sales',
//     icon: '🤝',
//     primaryColor: '#F59E0B',
//     redirectUrl: 'http://crm.localhost:3000',
//     features: ['Contact Management', 'Sales Pipeline', 'Communications']
//   },
//   'account-ui': {
//     name: 'Account Management',
//     description: 'Manage your profile, security, and preferences',
//     icon: '⚙️',
//     primaryColor: '#3B82F6',
//     redirectUrl: window.location.origin + '/profile',
//     features: ['Profile Management', 'Security Settings', 'Session Management']
//   }
// };

// export const getClientConfig = (clientId) => {
//   return CLIENT_CONFIGS[clientId] || CLIENT_CONFIGS['account-ui'];
// };


import { auth } from '@spidy092/auth-client';

const config = {
  clientKey: import.meta.env.VITE_CLIENT_KEY,
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL,
  accountUiUrl: import.meta.env.VITE_ACCOUNT_UI_URL,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
    isRouter: true
};

console.log('🔑 Auth config:', config);

auth.setConfig(config);



// Optional: Start auto-refresh for tokens
const refreshInterval = auth.startTokenRefresh();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

console.log('🔧 Account UI Auth configured:', {
  clientKey: 'account-ui',
  mode: 'ROUTER',
  authBaseUrl: 'http://auth.local.test:4000/auth'
});

export default config;

