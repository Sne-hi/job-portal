import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

export default function SelectRole() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const pickRole = async (role) => {
    const res = await axios.put('/auth/role', { role });
    setUser(res.data);
    navigate('/dashboard');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>I am a...</h2>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
        <button onClick={() => pickRole('applicant')}
          style={{ padding: '20px 40px', fontSize: '18px', cursor: 'pointer' }}>
          Job Seeker
        </button>
        <button onClick={() => pickRole('recruiter')}
          style={{ padding: '20px 40px', fontSize: '18px', cursor: 'pointer' }}>
          Recruiter
        </button>
      </div>
    </div>
  );
}