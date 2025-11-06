// src/pages/TrustedDevices.jsx

import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Divider, Grid, Tooltip,
  CircularProgress, Badge, Switch, FormControlLabel, Paper, Stack
} from '@mui/material';
import {
  Laptop as LaptopIcon,
  PhoneAndroid as PhoneIcon,
  Tablet as TabletIcon,
  DesktopWindows as DesktopIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Shield as ShieldIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  Verified as VerifiedIcon,
  Refresh as RefreshIcon,
  ReportProblem as AlertTriangleIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';

let api = auth.api;

function TrustedDevices() {
  // State management
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [autoTrustEnabled, setAutoTrustEnabled] = useState(false);

  // Fetch trusted devices
 const { data: devicesData = {}, isLoading, error, refetch } = useQuery({
  queryKey: ['trusted-devices'],
  queryFn: async () => {
    const res = await api.get('/trusted-devices');
    // API returns { success: true, data: [...], count: 2 }
    const devicesArray = res.data.data || [];
    return {
      devices: devicesArray,
      count: res.data.count || 0,
      insights: {
        total: devicesArray.length,
        trusted: devicesArray.filter(d => d.trust_status === 'trusted').length,
        pending: devicesArray.filter(d => d.trust_status === 'pending').length,
        revoked: devicesArray.filter(d => d.trust_status === 'revoked').length,
        exposureLevel: 'Low'
      }
    };
  },
  staleTime: 2 * 60 * 1000,
  retry: 2
});

const devices = devicesData.devices || [];
const securityInsights = devicesData.insights || {};



  

  // Register current device on component mount
  useEffect(() => {
    registerCurrentDevice();
  }, []);

  const registerCurrentDevice = async () => {
    try {
      const deviceData = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        colorDepth: window.screen.colorDepth,
        location: null
      };

      const response = await api.post('/trusted-devices/register', deviceData);

      if (response.data.success) {
        setCurrentDeviceId(response.data.device.id);

        // Show notification if risk level is elevated
        if (response.data.device.created && response.data.security?.riskLevel === 'HIGH') {
          showSnackbar(
            'New device registered. Please review your security settings.',
            'warning'
          );
        }
      }
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  };

  // Revoke device mutation
  const revokeDeviceMutation = useMutation({
    mutationFn: (deviceId) =>
      api.delete(`/trusted-devices/${deviceId}`, { data: { reason: 'user_initiated' } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trusted-devices']);
      setRevokeDialogOpen(false);
      setSelectedDevice(null);
      showSnackbar('Device access revoked successfully', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to revoke device';
      showSnackbar(message, 'error');
    }
  });

  // Trust pending device mutation
  const trustDeviceMutation = useMutation({
    mutationFn: (deviceId) =>
      api.post(`/trusted-devices/${deviceId}/trust` ,  { trustDays: 30 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trusted-devices']);
      showSnackbar('Device marked as trusted', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to trust device';
      showSnackbar(message, 'error');
    }
  });

  // Revoke all devices mutation
 const revokeAllMutation = useMutation({
  mutationFn: () =>
    api.post('/trusted-devices/emergency/revoke-all', {
      reason: 'User initiated security action'
    }),
    onSuccess: async () => {
      queryClient.clear();
      setRevokeAllDialogOpen(false);
      showSnackbar('All devices revoked. Please sign in again.', 'success');
      // Logout user after brief delay
      setTimeout(() => {
        auth.logout();
      }, 2000);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to revoke all devices';
      showSnackbar(message, 'error');
    }
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getDeviceIcon = (deviceType) => {
    const iconProps = { sx: { fontSize: 40 } };
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <PhoneIcon {...iconProps} color="primary" />;
      case 'tablet':
        return <TabletIcon {...iconProps} color="primary" />;
      case 'desktop':
        return <DesktopIcon {...iconProps} color="primary" />;
      default:
        return <LaptopIcon {...iconProps} color="primary" />;
    }
  };

  const getTrustStatusChip = (status) => {
    const statusConfig = {
      trusted: { label: 'Trusted', color: 'success', icon: <CheckCircleIcon /> },
      pending: { label: 'Pending Review', color: 'warning', icon: <WarningIcon /> },
      revoked: { label: 'Revoked', color: 'error', icon: <DeleteIcon /> },
      expired: { label: 'Expired', color: 'default', icon: <AccessTimeIcon /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  const getRiskLevelConfig = (level) => {
    const configs = {
      LOW: { color: 'success', label: 'Low Risk', icon: <CheckCircleIcon /> },
      MEDIUM: { color: 'warning', label: 'Medium Risk', icon: <WarningIcon /> },
      HIGH: { color: 'error', label: 'High Risk', icon: <AlertTriangleIcon /> }
    };
    return configs[level] || configs.MEDIUM;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load trusted devices. Please try refreshing the page.
      </Alert>
    );
  }

  const activeTrustedDevices = devices.filter(d => d.trust_status === 'trusted').length;
  const pendingDevices = devices.filter(d => d.trust_status === 'pending').length;

  return (
    <Box>
      {/* Security Overview Card - Gradient Header */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <ShieldIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h5">Device Security Overview</Typography>
              <Typography variant="caption">
                Manage and monitor all your trusted devices
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3">{devices.length}</Typography>
                <Typography variant="body2">Registered Devices</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3">{activeTrustedDevices}</Typography>
                <Typography variant="body2">Trusted</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3">{pendingDevices}</Typography>
                <Typography variant="body2">Pending Review</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3">
                  {securityInsights.exposureLevel || 'Low'}
                </Typography>
                <Typography variant="body2">Exposure Risk</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {pendingDevices > 0 && (
        <Alert severity="warning" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <AlertTriangleIcon sx={{ mr: 1 }} />
          You have {pendingDevices} device{pendingDevices > 1 ? 's' : ''} awaiting trust confirmation.
          Please review and trust or revoke unrecognized devices.
        </Alert>
      )}

      {/* Auto-trust toggle */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Auto-Trust This Browser
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Automatically trust devices on subsequent logins
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoTrustEnabled}
                onChange={(e) => setAutoTrustEnabled(e.target.checked)}
              />
            }
            label=""
          />
        </Box>
      </Paper>

      {/* Main Devices Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6">Your Devices</Typography>
              <Typography variant="caption" color="text.secondary">
                {devices.length} device{devices.length !== 1 ? 's' : ''} registered
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => refetch()}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {devices.length === 0 ? (
            <Alert severity="info">
              No devices found. The current device will be registered automatically.
            </Alert>
          ) : (
            <List sx={{ width: '100%' }}>
              {devices.map((device, index) => {
                const riskConfig = getRiskLevelConfig(device.risk_level);
                const isCurrent = device.id === currentDeviceId;

                return (
                  <Box key={device.id}>
                    <ListItem
                      sx={{
                        bgcolor: isCurrent ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: isCurrent ? 'primary.main' : 'divider',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: isCurrent ? 'primary.main' : 'action.hover',
                            width: 56,
                            height: 56
                          }}
                        >
                          {getDeviceIcon(device.device_type)}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {device.device_name}
                            </Typography>
                            {isCurrent && (
                              <Chip
                                label="Current Device"
                                size="small"
                                color="primary"
                                variant="filled"
                              />
                            )}
                            {getTrustStatusChip(device.trust_status)}
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                              <Chip
                                icon={<LocationIcon />}
                                label={device.location || 'Unknown Location'}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={device.ip_address}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                icon={<AccessTimeIcon />}
                                label={formatDistanceToNow(new Date(device.last_used), {
                                  addSuffix: true
                                })}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={riskConfig.label}
                                size="small"
                                variant="filled"
                                color={riskConfig.color}
                                icon={riskConfig.icon}
                              />
                            </Box>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {device.browser} on {device.os} {device.os_version}
                            </Typography>
                            {device.trust_status === 'pending' && (
                              <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                                ⚠️ Awaiting your confirmation
                              </Typography>
                            )}
                          </Box>
                        }
                      />

                      <Box display="flex" gap={1} alignItems="center" ml={2}>
                        {device.trust_status === 'pending' && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => trustDeviceMutation.mutate(device.id)}
                            disabled={trustDeviceMutation.isLoading}
                          >
                            Trust
                          </Button>
                        )}

                        {!isCurrent && (
                          <Tooltip title="Revoke Device">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setSelectedDevice(device);
                                setRevokeDialogOpen(true);
                              }}
                              disabled={revokeDeviceMutation.isLoading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedDevice(device)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>

                    {index < devices.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Alert severity="error" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2">Security Concern?</Typography>
            <Typography variant="caption">
              If you suspect unauthorized access, revoke all devices immediately.
            </Typography>
          </Box>
          <Button
            color="error"
            variant="contained"
            onClick={() => setRevokeAllDialogOpen(true)}
            size="small"
          >
            Revoke All
          </Button>
        </Box>
      </Alert>

      {/* Device Details Dialog */}
      <Dialog
        open={selectedDevice && !revokeDialogOpen}
        onClose={() => setSelectedDevice(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Device Details</DialogTitle>
        <DialogContent dividers>
          {selectedDevice && (
            <Box>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mr: 2 }}>
                  {getDeviceIcon(selectedDevice.device_type)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedDevice.device_name}</Typography>
                  {getTrustStatusChip(selectedDevice.trust_status)}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Device Type
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedDevice.device_type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Browser
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedDevice.browser}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    OS
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedDevice.os} {selectedDevice.os_version}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedDevice.ip_address}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedDevice.location || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Last Used
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {format(new Date(selectedDevice.last_used), 'PPpp')}
                  </Typography>
                </Grid>
                {selectedDevice.expires_at && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Expires At
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {format(new Date(selectedDevice.expires_at), 'PPpp')}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Risk Level
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {(() => {
                      const config = getRiskLevelConfig(selectedDevice.risk_level);
                      return (
                        <Chip
                          label={config.label}
                          color={config.color}
                          icon={config.icon}
                        />
                      );
                    })()}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDevice(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Device Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Revoke Device Access?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will remove trust for this device. You'll need to verify your
            identity again when signing in from this device.
          </Alert>
          {selectedDevice && (
            <Box>
              <Typography variant="body2">
                <strong>Device:</strong> {selectedDevice.device_name}
              </Typography>
              <Typography variant="body2">
                <strong>Location:</strong> {selectedDevice.location || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>IP Address:</strong> {selectedDevice.ip_address}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => revokeDeviceMutation.mutate(selectedDevice?.id)}
            color="error"
            variant="contained"
            disabled={revokeDeviceMutation.isLoading}
          >
            {revokeDeviceMutation.isLoading ? 'Revoking...' : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke All Devices Dialog */}
      <Dialog open={revokeAllDialogOpen} onClose={() => setRevokeAllDialogOpen(false)}>
        <DialogTitle>Revoke All Devices?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Warning!</strong> This will immediately log you out from all devices.
            You'll need to sign in again on each device.
          </Alert>
          <Typography variant="body2">
            This action is recommended if you believe your account has been compromised or
            if you've lost a device.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeAllDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => revokeAllMutation.mutate()}
            color="error"
            variant="contained"
            disabled={revokeAllMutation.isLoading}
          >
            {revokeAllMutation.isLoading ? 'Processing...' : 'Revoke All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TrustedDevices;
