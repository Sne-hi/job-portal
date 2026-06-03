import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Job Portal</h1>
      <p>Find jobs or hire talent</p>
      <a href="http://localhost:5000/api/auth/google">
        <button style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}>
          Sign in with Google
        </button>
      </a>
    </div>
  );
}