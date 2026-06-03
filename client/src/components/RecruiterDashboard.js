import { useState, useEffect } from 'react';
import axios from '../api/axios';
import ChatBox from './ChatBox';
import VideoCall from './VideoCall';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [videoRoom, setVideoRoom] = useState(null);
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'Full-time',
    description: '', skills: '', salary: ''
  });

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    const res = await axios.get('/jobs');
    setJobs(res.data);
  };

  const handleSubmit = async () => {
    await axios.post('/jobs', {
      ...form,
      skills: form.skills.split(',').map(s => s.trim())
    });
    setShowForm(false);
    setForm({ title: '', company: '', location: '', type: 'Full-time',
      description: '', skills: '', salary: '' });
    fetchJobs();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/jobs/${id}`);
    fetchJobs();
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>My Job Listings</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#4CAF50', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          + Post a Job
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f5f5f5', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3>Post New Job</h3>
          {['title', 'company', 'location', 'salary'].map(field => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '10px',
                marginBottom: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
          ))}
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '12px' }}>
            {['Full-time', 'Part-time', 'Internship', 'Remote'].map(t =>
              <option key={t}>{t}</option>)}
          </select>
          <input placeholder="Skills (comma separated)"
            value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '12px',
              borderRadius: '4px', border: '1px solid #ddd' }} />
          <textarea placeholder="Job Description" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '12px',
              borderRadius: '4px', border: '1px solid #ddd', height: '100px' }} />
          <button onClick={handleSubmit}
            style={{ padding: '10px 24px', background: '#2196F3', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Post Job
          </button>
        </div>
      )}

      {jobs.map(job => (
        <div key={job._id} style={{ background: 'white', padding: '20px', borderRadius: '8px',
          marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 8px' }}>{job.title}</h3>
              <p style={{ margin: '0', color: '#666' }}>{job.company} • {job.location} • {job.type}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setVideoRoom(`interview-${job._id}`)}
                style={{ padding: '8px 16px', background: '#9C27B0', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                📹 Interview
              </button>
              <button onClick={() => handleDelete(job._id)}
                style={{ padding: '8px 16px', background: '#f44336', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {activeChat && (
        <div style={{ marginTop: '32px' }}>
          <ChatBox roomId={activeChat.roomId} otherUser={activeChat.user} />
        </div>
      )}

      {videoRoom && (
        <VideoCall roomId={videoRoom} onClose={() => setVideoRoom(null)} />
      )}
    </div>
  );
}