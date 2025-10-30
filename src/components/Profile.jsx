
// account-ui/src/components/Profile.jsx

import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Avatar, IconButton, Divider, Alert, Chip, LinearProgress, Snackbar, MenuItem
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@spidy092/auth-client';



let api = auth.api;

function Profile() {
  const [toastOpen, setToastOpen] = useState(false);
const [toastMessage, setToastMessage] = useState('');

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
   
    bio: '',
    mobile: '',
    gender: ''
  });

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get('/account/profile').then(res => res.data),
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Populate form data when profile loads or changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
       
        bio: profile.attributes?.bio?.[0] || '',
          mobile: profile.metadata?.mobile || '', // Add this
      gender: profile.metadata?.gender || ''   // Add this
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
  mutationFn: async (data) => {
    const {  bio, mobile, gender, ...profileData } = data;
    
    // Update basic profile fields (including mobile and gender in database)
    const profileResponse = await api.put('/account/profile', {
      ...profileData,
      mobile,
      gender,
      bio,
    });
    
    
    return profileResponse;
  },
  onSuccess: () => {
    queryClient.invalidateQueries('user-profile');
    setEditing(false);
    // Add toast notification here
    setToastMessage('Profile updated successfully');
    setToastOpen(true);
  },
  onError: (error) => {
    console.error('Profile update failed:', error);
    alert(error.response?.data?.message || 'Failed to update profile');
  }
});



  

  const handleSave = () => {
    if (!formData.firstName?.trim() || !formData.email?.trim()) {
      alert('First name and email are required');
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        bio: profile.attributes?.bio?.[0] || ''
      });
    }
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <LinearProgress sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading profile...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load profile. Please try refreshing the page.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Profile Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <PersonIcon />
              Profile Information
            </Typography>
            {!editing ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>

          {/* User Avatar and Basic Info */}
          <Box display="flex" alignItems="center" mb={4}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                mr: 3, 
                fontSize: '2.5rem',
                bgcolor: 'primary.main',
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 3
              }}
            >
              {(formData.firstName || profile?.firstName || profile?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="600" gutterBottom>
                {formData.firstName || formData.lastName 
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : profile?.username || 'User'
                }
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {formData.email || profile?.email}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip 
                  label={`ID: ${profile?.username || profile?.id}`}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  label={`Member since ${profile?.createdTimestamp ? 
                    formatDistanceToNow(new Date(profile.createdTimestamp), { addSuffix: true }) : 
                    'Unknown'}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          {/* Form Fields */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name *"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!editing}
                required
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
                helperText={!editing ? "Your first name" : "Required field"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!editing}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
                helperText={!editing ? "Your last name" : "Optional"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!editing}
                required
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
                helperText={!editing ? "Your email address" : "Required field"}
              />
            </Grid>

           
            
<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    label="Mobile Number"
    type="tel"
    value={formData.mobile}
    onChange={(e) => handleInputChange('mobile', e.target.value)}
    disabled={!editing}
    placeholder={editing ? "Enter your mobile number" : "Not set"}
    InputProps={{
      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
    }}
    helperText={!editing ? "Your mobile phone number" : "Optional"}
  />
</Grid>

<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    select
    label="Gender"
    value={formData.gender}
    onChange={(e) => handleInputChange('gender', e.target.value)}
    disabled={!editing}
    helperText={!editing ? "Your gender identity" : "Optional"}
  >
    <MenuItem value="">
      <em>Prefer not to say</em>
    </MenuItem>
    <MenuItem value="male">Male</MenuItem>
    <MenuItem value="female">Female</MenuItem>
    <MenuItem value="other">Other</MenuItem>
    <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
  </TextField>
</Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={3}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!editing}
                placeholder={editing ? "Tell us about yourself..." : "No bio set"}
                InputProps={{
                  startAdornment: <InfoIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                }}
                helperText={!editing ? "A short description about yourself" : "Optional - Tell others about yourself"}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Status
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Alert 
                severity={profile?.enabled ? 'success' : 'error'}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">
                  Account Status
                </Typography>
                <Typography variant="body2">
                  {profile?.enabled ? 'Active' : 'Disabled'}
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Alert 
                severity={profile?.emailVerified ? 'success' : 'warning'}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">
                  Email Verification
                </Typography>
                <Typography variant="body2">
                  {profile?.emailVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Alert 
                severity={profile?.totp ? 'success' : 'info'}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">
                  Two-Factor Auth
                </Typography>
                <Typography variant="body2">
                  {profile?.totp ? 'Enabled' : 'Disabled'}
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Alert 
                severity="info"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">
                  Account Age
                </Typography>
                <Typography variant="body2">
                  {profile?.createdTimestamp ? 
                    formatDistanceToNow(new Date(profile.createdTimestamp)) : 
                    'Unknown'
                  }
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          {/* Additional Account Information */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {profile?.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body2">
                  {profile?.username}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Locale
                </Typography>
                <Typography variant="body2">
                  {profile?.attributes?.locale?.[0] || 'en'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {profile?.notBefore ? 
                    new Date(profile.notBefore * 1000).toLocaleDateString() : 
                    'Not available'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
      <Snackbar
  open={toastOpen}
  autoHideDuration={3000}
  onClose={() => setToastOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert onClose={() => setToastOpen(false)} severity="success" variant="filled">
    {toastMessage}
  </Alert>
</Snackbar>

    </Box>

    



  );
  
}

export default Profile;