import { useEffect, useState } from 'react';
import { auth } from '@spidy092/auth-client';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = auth.getToken();
        if (!token || auth.isTokenExpired(token)) {
          auth.clearToken();
          return navigate('/login');
        }
        const res = await auth.api.get('/me');
        console.log('User data:', res.data);
        
        setUser(res.data);
      } catch (e) {
        console.error(e);
        setError('Could not load your profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <LoadingSpinner message="Loading your profile…" />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate('/login')} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}</h1>
      <p>Email: {user.email}</p>
      <button onClick={() => auth.logout()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
        Logout
      </button>
    </div>
  );
}
