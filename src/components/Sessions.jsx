
// account-ui/src/components/Sessions.jsx

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Divider,
  Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Delete as DeleteIcon, ExitToApp as LogoutIcon,
  Computer as ComputerIcon, Phone as PhoneIcon, Tablet as TabletIcon,
  ExpandMore as ExpandMoreIcon, LocationOn as LocationIcon,
  Schedule as ScheduleIcon, Apps as AppsIcon, Warning as WarningIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@spidy092/auth-client';

function Sessions() {
  const queryClient = useQueryClient();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(null);

  // Fetch ALL user sessions across different clients
  const { data: allSessions = [], isLoading } = useQuery({
    queryKey: ['all-user-sessions'],
    queryFn: async () => {
      // This should fetch sessions from ALL clients, not just account-ui
      const response = await auth.api.get('/account/sessions');
      return response.data;
    },
    
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  // Terminate session mutation
  // const terminateSessionMutation = useMutation({
  //   mutationFn: (sessionId) => auth.api.delete(`/account/sessions/${sessionId}`),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['all-user-sessions']);
  //     setConfirmTerminate(null);
  //   }
  // });

  const terminateSessionMutation = useMutation({
  mutationFn: (sessionId) => auth.api.delete(`/account/sessions/${sessionId}`),
  onSuccess: async () => {
    // ✅ Enhanced cache invalidation
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['all-user-sessions'] }),
      queryClient.invalidateQueries({ queryKey: ['session-validation'] })
    ]);
    
    setConfirmTerminate(null);
  }
});

  // Logout all sessions mutation
  // const logoutAllMutation = useMutation({
  //   mutationFn: () => auth.api.post('/account/logout-all'),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['all-user-sessions']);
  //     setConfirmLogoutAll(false);
  //     // Redirect to login since user will be logged out
  //     window.location.href = '/login';
  //   }
  // });


  const logoutAllMutation = useMutation({
  mutationFn: () => auth.api.post('/account/logout-all'),
  onSuccess: async () => {
    // ✅ Clear all cache before logout
    queryClient.clear();
    setConfirmLogoutAll(false);
    
    // Force logout
    auth.logout();
  }
});

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <ComputerIcon />;

    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <PhoneIcon />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <TabletIcon />;
    }
    return <ComputerIcon />;
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Desktop';

    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent) => {
    
    if (!userAgent) return 'Unknown Browser';

    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getCurrentSession = (session) => {
    // Logic to determine if this is the current session
    // This could be done by comparing session ID with current token claims
    return session.current || false;
  };

  const isSuspiciousSession = (session) => {
    console.log('Suspicious session check:', session);
    
    // Check for suspicious activity indicators
    if (!session.lastAccess) return false;

    const lastAccess = new Date(session.lastAccess);
    const now = new Date();
    const hoursSinceAccess = (now - lastAccess) / (1000 * 60 * 60);

    // Mark as suspicious if session is old but still active
    return hoursSinceAccess > 72; // 3 days
  };

  // Group sessions by client/application
  const groupSessionsByClient = () => {
    const grouped = allSessions.reduce((acc, session) => {
      const client = session.clientId || session.applicationName || 'Unknown App';
      if (!acc[client]) {
        acc[client] = [];
      }
      acc[client].push(session);
      return acc;
    }, {});

    return grouped;
  };

  const sessionsByClient = groupSessionsByClient();

  // Get session statistics
  const getSessionStats = () => {
    const total = allSessions.length;

    const active = allSessions.filter(s => s.active !== false).length;
    const suspicious = allSessions.filter(isSuspiciousSession).length;
    const clients = Object.keys(sessionsByClient).length;
    const devices = [...new Set(allSessions.map(s => getDeviceType(s.userAgent)))].length;

    return { total, active, suspicious, clients, devices };
  };

  const stats = getSessionStats();

  return (
    <Box>
      {/* Session Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Sessions
              </Typography>
              <Typography variant="h4" component="div">
                {stats.active}
              </Typography>
              <Typography variant="body2">
                Across {stats.clients} applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Device Types
              </Typography>
              <Typography variant="h4" component="div">
                {stats.devices}
              </Typography>
              <Typography variant="body2">
                Different device categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Applications
              </Typography>
              <Typography variant="h4" component="div">
                {stats.clients}
              </Typography>
              <Typography variant="body2">
                Connected services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Alerts
              </Typography>
              <Typography variant="h4" component="div" color={stats.suspicious > 0 ? 'error.main' : 'success.main'}>
                {stats.suspicious}
              </Typography>
              <Typography variant="body2">
                {stats.suspicious > 0 ? 'Suspicious sessions' : 'All secure'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert for suspicious sessions */}
      {stats.suspicious > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="subtitle2" gutterBottom>
            Security Alert
          </Typography>
          We detected {stats.suspicious} session{stats.suspicious > 1 ? 's' : ''} with unusual activity. 
          Please review and terminate any unrecognized sessions.
        </Alert>
      )}

      {/* Main Sessions Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                All Active Sessions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your sessions across all connected applications and devices
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => setConfirmLogoutAll(true)}
              disabled={allSessions.length === 0}
            >
              Logout All
            </Button>
          </Box>

          {/* Sessions grouped by client */}
          {Object.entries(sessionsByClient).map(([clientName, sessions]) => (
            <Accordion key={clientName} sx={{ mb: 2 }} defaultExpanded={sessions.some(getCurrentSession)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <AppsIcon />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {clientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sessions.length} session{sessions.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  {sessions.some(getCurrentSession) && (
                    <Chip label="Current" color="primary" size="small" />
                  )}
                  {sessions.some(isSuspiciousSession) && (
                    <Chip label="Alert" color="warning" size="small" />
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Device & Browser</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        
                        <TableRow 
                          key={session.id}
                          sx={isSuspiciousSession(session) ? { bgcolor: 'warning.light', opacity: 0.7 } : {}}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getDeviceIcon(session.userAgent)}
                              <Box ml={2}>
                                <Typography variant="body2">
                                  {getDeviceType(session.userAgent)} • {getBrowserInfo(session.userAgent)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {session.ipAddress}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                              <Typography variant="body2">
                                {session.location || session.country || 'Unknown Location'}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                              <Typography variant="body2">
                                {session.lastAccess 
                                  ? formatDistanceToNow(new Date(session.lastAccess), { addSuffix: true })
                                  : 'Unknown'
                                }
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              {getCurrentSession(session) ? (
                                <Chip label="Current" color="primary" size="small" />
                              ) : (
                                <Chip label="Active" color="default" size="small" />
                              )}
                              {isSuspiciousSession(session) && (
                                <Chip label="Alert" color="warning" size="small" />
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>
                            {!getCurrentSession(session) && (
                              <IconButton
                                onClick={() => setConfirmTerminate(session)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}

          {allSessions.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No active sessions found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Logout All Confirmation Dialog */}
      <Dialog open={confirmLogoutAll} onClose={() => setConfirmLogoutAll(false)}>
        <DialogTitle>Logout All Devices</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This will log you out of all devices and applications ({stats.active} sessions). 
            You'll need to sign in again on each device.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogoutAll(false)}>Cancel</Button>
          <Button 
            onClick={() => logoutAllMutation.mutate()}
            color="error"
            variant="contained"
            disabled={logoutAllMutation.isLoading}
          >
            {logoutAllMutation.isLoading ? 'Logging out...' : 'Logout All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Session Confirmation Dialog */}
      <Dialog open={!!confirmTerminate} onClose={() => setConfirmTerminate(null)}>
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to terminate this session?
          </Typography>
          {confirmTerminate && (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Details:
              </Typography>
              <Typography variant="body2">
                Device: {getDeviceType(confirmTerminate.userAgent)} • {getBrowserInfo(confirmTerminate.userAgent)}
              </Typography>
              <Typography variant="body2">
                IP: {confirmTerminate.ipAddress}
              </Typography>
              <Typography variant="body2">
                Application: {confirmTerminate.clientId || 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTerminate(null)}>Cancel</Button>
          <Button 
            onClick={() => terminateSessionMutation.mutate(confirmTerminate.id)}
            color="error"
            variant="contained"
            disabled={terminateSessionMutation.isLoading}
          >
            {terminateSessionMutation.isLoading ? 'Terminating...' : 'Terminate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Sessions;