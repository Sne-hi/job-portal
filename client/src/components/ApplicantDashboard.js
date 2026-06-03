import { useState, useEffect } from 'react';
import axios from '../api/axios';
import VideoCall from './VideoCall';

export default function ApplicantDashboard() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [tab, setTab] = useState('browse');
  const [videoRoom, setVideoRoom] = useState(null);

  useEffect(() => { fetchJobs(); fetchApplications(); }, []);

  const fetchJobs = async () => {
    const res = await axios.get(`/jobs?search=${search}`);
    setJobs(res.data);
  };

  const fetchApplications = async () => {
    const res = await axios.get('/applications/my');
    setMyApplications(res.data);
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(`/jobs/${jobId}/apply`, { coverLetter });
      alert('Applied successfully!');
      setSelectedJob(null);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying');
    }
  };

  const appliedJobIds = myApplications.map(a => a.job?._id);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => setTab('browse')}
          style={{ padding: '10px 20px', background: tab === 'browse' ? '#2196F3' : '#eee',
            color: tab === 'browse' ? 'white' : 'black', border: 'none',
            borderRadius: '6px', cursor: 'pointer' }}>
          Browse Jobs
        </button>
        <button onClick={() => setTab('applications')}
          style={{ padding: '10px 20px', background: tab === 'applications' ? '#2196F3' : '#eee',
            color: tab === 'applications' ? 'white' : 'black', border: 'none',
            borderRadius: '6px', cursor: 'pointer' }}>
          My Applications ({myApplications.length})
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <input placeholder="Search jobs..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyUp={fetchJobs}
            style={{ width: '100%', padding: '12px', marginBottom: '24px',
              borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px' }} />

          {jobs.map(job => (
            <div key={job._id} style={{ background: 'white', padding: '20px',
              borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px' }}>{job.title}</h3>
                  <p style={{ margin: '0 0 8px', color: '#666' }}>{job.company} • {job.location} • {job.type}</p>
                  <p style={{ margin: '0', fontSize: '14px' }}>{job.description?.slice(0, 100)}...</p>
                </div>
                {appliedJobIds.includes(job._id) ? (
                  <span style={{ padding: '8px 16px', background: '#e8f5e9',
                    color: '#4CAF50', borderRadius: '6px' }}>Applied</span>
                ) : (
                  <button onClick={() => setSelectedJob(job)}
                    style={{ padding: '8px 16px', background: '#2196F3', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Apply
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'applications' && (
        <div>
          {myApplications.map(app => (
            <div key={app._id} style={{ background: 'white', padding: '20px',
              borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 8px' }}>{app.job?.title}</h3>
              <p style={{ margin: '0', color: '#666' }}>{app.job?.company} • {app.job?.location}</p>
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px',
                borderRadius: '20px', fontSize: '14px',
                background: app.status === 'accepted' ? '#e8f5e9' :
                  app.status === 'rejected' ? '#ffebee' : '#fff3e0',
                color: app.status === 'accepted' ? '#4CAF50' :
                  app.status === 'rejected' ? '#f44336' : '#FF9800' }}>
                {app.status}
              </span>
              <br/>
              <button onClick={() => setVideoRoom(`interview-${app._id}`)}
                style={{ marginTop: '8px', padding: '6px 16px', background: '#9C27B0',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                📹 Join Interview
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '500px' }}>
            <h3>Apply for {selectedJob.title}</h3>
            <textarea placeholder="Write a cover letter..."
              value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
              style={{ width: '100%', height: '150px', padding: '12px',
                borderRadius: '6px', border: '1px solid #ddd', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleApply(selectedJob._id)}
                style={{ padding: '10px 24px', background: '#4CAF50', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Submit Application
              </button>
              <button onClick={() => setSelectedJob(null)}
                style={{ padding: '10px 24px', background: '#eee',
                  border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {videoRoom && (
        <VideoCall roomId={videoRoom} onClose={() => setVideoRoom(null)} />
      )}
    </div>
  );
}