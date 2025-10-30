
// account-ui/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import "./config/authConfig";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Layout from "./components/Layout";
import Profile from "./components/Profile";
import Applications from "./components/Applications";
import Sessions from "./components/Sessions";
import SecuritySettings from "./components/SecuritySettings";
import Notifications from "./components/Notifications";
import PrivacySettings from "./components/PrivacySettings";
import Preferences from "./components/Preferences";
import ProtectedRoute from "./components/ProtectedRoute";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />

            {/* Protected routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Default redirect to profile */}
              <Route index element={<Navigate to="/profile" replace />} />

              {/* Account management routes */}
              <Route path="profile" element={<Profile />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="applications" element={<Applications />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="privacy" element={<PrivacySettings />} />
              <Route path="preferences" element={<Preferences />} />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
