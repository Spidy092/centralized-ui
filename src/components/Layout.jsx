
// account-ui/src/components/Layout.jsx

import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton,
  Menu, MenuItem, Divider, Chip, Alert, CircularProgress,
  useTheme, useMediaQuery, Badge, Switch, FormControlLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  Apps as AppsIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
 PrivacyTip as PrivacyTipIcon,
  VpnKey as KeyIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // ✅ Add useQueryClien
import { auth } from '@spidy092/auth-client';
import { useSessionMonitor } from '@spidy092/auth-client';

const drawerWidth = 300; // Increased width for better content



const navigationItems = [
  {
    path: '/profile',
    label: 'Profile',
    icon: <PersonIcon />,
    description: 'Personal information and settings'
  },
  {
    path: '/security',
    label: 'Security',
    icon: <SecurityIcon />,
    description: 'Password, 2FA, and security settings'
  },
  {
    path: '/sessions',
    label: 'Active Sessions',
    icon: <KeyIcon />,
    description: 'Manage sessions across all devices'
  },
  {
    path: '/applications',
    label: 'Applications',
    icon: <AppsIcon />,
    description: 'Connected apps and services'
  },
  {
    path: '/notifications',
    label: 'Notifications',
    icon: <NotificationsIcon />,
    description: 'Email and push preferences'
  },
  {
    path: '/privacy',
    label: 'Privacy',
    icon: <PrivacyTipIcon />,
    description: 'Data and privacy controls'
  },
  {
    path: '/preferences',
    label: 'Preferences',
    icon: <SettingsIcon />,
    description: 'Language, theme, and display'
  }
];

function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // Changed to lg for better responsive
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

    const queryClient = useQueryClient();

     const { data: sessionStatus } = useSessionMonitor({
    enabled: true,
    refetchInterval: 15 * 1000, // Check every 15 seconds
    onSessionInvalid: () => {
      console.log('🚨 Session invalid, forcing logout');
      // Clear all cached data
      queryClient.clear();
      // Force logout
      auth.logout();
    },
    onError: (error) => {
      console.error('Session monitor error:', error);
      if (error.message.includes('401')) {
        auth.logout();
      }
    }
  });

   

  // Fetch user profile for header display
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => auth.api.get('/account/profile').then(res => res.data),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch ALL user sessions (across different clients)
  const { data: allSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['all-user-sessions'],
    queryFn: async () => {
      try {
        // This should return sessions from ALL clients, not just account-ui
        const response = await auth.api.get('/account/sessions');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return [];
      }
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Fetch applications with their usage stats
  const { data: applications = [] } = useQuery({
    queryKey: ['user-applications'],
    queryFn: () => auth.api.get('/account/applications').then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setProfileMenuAnchor(null);
    auth.logout();
  };

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentItem = navigationItems.find(item => 
      location.pathname.startsWith(item.path)
    );
    return currentItem || { label: 'Account', description: 'Manage your account' };
  };

  const currentPage = getCurrentPageInfo();

  // Enhanced navigation items with badges and stats
  const getNavigationItemsWithBadges = () => {
    return navigationItems.map(item => {
      let badge = null;
      let badgeColor = 'default';

      if (item.path === '/sessions') {
        const activeSessions = allSessions.filter(s => s.active !== false).length;
        if (activeSessions > 0) {
          badge = activeSessions;
          badgeColor = activeSessions > 3 ? 'warning' : 'primary';
        }
      } else if (item.path === '/applications') {
        const enabledApps = applications.filter(app => app.enabled).length;
        if (enabledApps > 0) {
          badge = enabledApps;
          badgeColor = 'success';
        }
      } else if (item.path === '/security') {
        // Check for security issues
        const hasUnverifiedEmail = !user?.emailVerified;
        const hasWeakSecurity = !user?.attributes?.twoFactorEnabled;
        if (hasUnverifiedEmail || hasWeakSecurity) {
          badge = '!';
          badgeColor = 'error';
        }
      }

      return { ...item, badge, badgeColor };
    });
  };

  const enhancedNavigationItems = getNavigationItemsWithBadges();

  // Session summary for sidebar
  const getSessionSummary = () => {
    if (sessionsLoading) return 'Loading...';

    const activeSessions = allSessions.filter(s => s.active !== false);
    const currentSession = allSessions.find(s => s.current);
    const otherClients = [...new Set(allSessions.map(s => s.clientId))].filter(c => c !== 'account-ui');

    return {
      total: activeSessions.length,
      current: currentSession,
      otherClients: otherClients.length,
      recentActivity: allSessions[0]?.lastAccess
    };
  };

  const sessionSummary = getSessionSummary();

  // Drawer content with enhanced information
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Account Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your profile, security & privacy
        </Typography>
      </Box>

      {/* User Info Card */}
      {user && (
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                mr: 2,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                border: '3px solid',
                borderColor: user.enabled ? 'success.main' : 'error.main'
              }}
            >
              {user.firstName?.charAt(0)?.toUpperCase() || 
               user.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" fontWeight="600" noWrap>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {user.username}
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Status indicators */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip 
              label={user.enabled ? 'Active' : 'Suspended'}
              color={user.enabled ? 'success' : 'error'}
              size="small"
            />
            <Chip 
              label={user.emailVerified ? 'Verified' : 'Unverified'}
              color={user.emailVerified ? 'success' : 'warning'}
              size="small"
            />
            {user.attributes?.twoFactorEnabled && (
              <Chip 
                label="2FA Enabled"
                color="primary"
                size="small"
              />
            )}
          </Box>

          {/* Quick session info */}
          {sessionSummary && typeof sessionSummary === 'object' && (
            <Box sx={{ 
              bgcolor: 'action.hover', 
              borderRadius: 2, 
              p: 1.5,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="caption" fontWeight="600" display="block" gutterBottom>
                Session Overview
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {sessionSummary.total} active sessions
                </Typography>
                <Chip 
                  label={`${sessionSummary.otherClients} apps`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18 }}
                />
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1, px: 2 }}>
        {enhancedNavigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname.startsWith(item.path)}
              sx={{
                borderRadius: 3,
                minHeight: 64,
                px: 2,
                py: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '& .MuiChip-root': {
                    bgcolor: 'primary.contrastText',
                    color: 'primary.main',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge}
                    color={item.badgeColor}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: 18,
                        minWidth: 18
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" fontWeight={600}>
                    {item.label}
                  </Typography>
                }
                secondary={
                  !location.pathname.startsWith(item.path) && (
                    <Typography variant="caption" sx={{ mt: 0.5 }}>
                      {item.description}
                    </Typography>
                  )
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Quick Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Quick Actions
        </Typography>
        <Box display="flex" gap={1}>
          <Chip 
            icon={<EmailIcon />}
            label="Support"
            size="small"
            clickable
            variant="outlined"
            onClick={() => window.open('mailto:support@yourapp.com')}
          />
          <Chip 
            icon={<LanguageIcon />}
            label="Docs"
            size="small"
            clickable
            variant="outlined"
            onClick={() => window.open('/docs', '_blank')}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Secure Account Management
        </Typography>
        <Typography variant="caption" color="text.secondary">
          v2.0.0 • Last login: {sessionSummary?.recentActivity ? 
            new Date(sessionSummary.recentActivity).toLocaleDateString() : 'Today'}
        </Typography>
      </Box>
    </Box>
  );

  if (userError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load user profile. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed Sidebar - Always visible on desktop */}
      <Box
        component="nav"
        sx={{ 
          width: { lg: drawerWidth }, 
          flexShrink: { lg: 0 },
          position: 'relative' // Changed from absolute positioning
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: theme.shadows[8]
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer - Always fixed and visible */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              position: 'fixed', // Fixed position
              height: '100vh',
              border: 'none',
              borderRight: 1,
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: 'background.default',
          ml: { lg: `${drawerWidth}px` }, // Add left margin on desktop
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top App Bar */}
        <AppBar 
          position="sticky"
          elevation={1}
          sx={{ 
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            {/* Mobile menu button */}
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Page title */}
            <Box flex={1}>
              <Typography variant="h5" fontWeight="700" gutterBottom={false}>
                {currentPage.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>
                {currentPage.description}
              </Typography>
            </Box>

            {/* Header actions */}
            <Box display="flex" alignItems="center" gap={1}>
              {/* Quick stats */}
              {sessionSummary && typeof sessionSummary === 'object' && (
                <Chip 
                  label={`${sessionSummary.total} sessions`}
                  size="small"
                  variant="outlined"
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                />
              )}

              {/* User menu */}
              <IconButton
                onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                sx={{ ml: 1 }}
              >
                {userLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Avatar sx={{ width: 36, height: 36 }}>
                    {user?.firstName?.charAt(0)?.toUpperCase() || 
                     user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                )}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content area with proper spacing */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Enhanced Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        onClick={() => setProfileMenuAnchor(null)}
        PaperProps={{
          elevation: 8,
          sx: { 
            mt: 1, 
            minWidth: 240,
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="600">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.username
            }
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <MenuItem onClick={() => handleNavigation('/profile')}>
          <PersonIcon sx={{ mr: 2 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/security')}>
          <SecurityIcon sx={{ mr: 2 }} />
          Security Settings
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/preferences')}>
          <SettingsIcon sx={{ mr: 2 }} />
          Preferences
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Layout;