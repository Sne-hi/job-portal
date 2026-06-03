import { useAuth } from '../context/AuthContext';
import RecruiterDashboard from '../components/RecruiterDashboard';
import ApplicantDashboard from '../components/ApplicantDashboard';

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <nav style={{ padding: '16px 32px', background: '#1a1a2e', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Job Portal</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>{user.name} ({user.role})</span>
          <button onClick={logout}
            style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>
      {user.role === 'recruiter' ? <RecruiterDashboard /> : <ApplicantDashboard />}
    </div>
  );
}