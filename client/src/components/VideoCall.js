import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function VideoCall({ roomId, onClose }) {
  const { socket } = useSocket();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { roomId, candidate: event.candidate });
      }
    };

    return pc;
  }, [socket, roomId]);

  useEffect(() => {
    let mounted = true;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, audio: true
        });

        if (!mounted) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join_video_room', roomId);

        socket.on('video_room_created', () => {
          if (mounted) setStatus('Waiting for other person to join...');
        });

        socket.on('video_ready', async () => {
          if (!mounted) return;
          setStatus('Starting call...');
          const pc = createPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('video_offer', { roomId, offer });
        });

        socket.on('video_offer', async ({ offer }) => {
          if (!mounted) return;
          setStatus('Connecting...');
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('video_answer', { roomId, answer });
          setStatus('Connected!');
        });

        socket.on('video_answer', async ({ answer }) => {
          if (!mounted) return;
          await peerConnectionRef.current?.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          setStatus('Connected!');
        });

        socket.on('ice_candidate', async ({ candidate }) => {
          try {
            await peerConnectionRef.current?.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (e) {}
        });

        socket.on('peer_left', () => {
          if (mounted) setStatus('Other person left the call');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

      } catch (err) {
        if (mounted) setStatus('Camera/mic access denied. Please allow access.');
        console.error(err);
      }
    };

    startCall();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConnectionRef.current?.close();
      socket.emit('leave_video_room', roomId);
      socket.off('video_room_created');
      socket.off('video_ready');
      socket.off('video_offer');
      socket.off('video_answer');
      socket.off('ice_candidate');
      socket.off('peer_left');
    };
  }, [roomId, socket, createPeerConnection]);

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoOff);
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    socket.emit('leave_video_room', roomId);
    socket.off('video_room_created');
    socket.off('video_ready');
    socket.off('video_offer');
    socket.off('video_answer');
    socket.off('ice_candidate');
    socket.off('peer_left');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#1a1a2e', zIndex: 1000, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      <h3 style={{ color: 'white', marginBottom: '16px' }}>{status}</h3>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <video ref={remoteVideoRef} autoPlay playsInline
            style={{ width: '640px', height: '480px', background: '#000',
              borderRadius: '12px', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', bottom: '8px', left: '12px',
            color: 'white', fontSize: '14px' }}>Other Person</span>
        </div>

        <div style={{ position: 'relative' }}>
          <video ref={localVideoRef} autoPlay playsInline muted
            style={{ width: '240px', height: '180px', background: '#000',
              borderRadius: '12px', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', bottom: '8px', left: '12px',
            color: 'white', fontSize: '14px' }}>You</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button onClick={toggleMute}
          style={{ padding: '12px 24px', borderRadius: '50px', border: 'none',
            background: muted ? '#f44336' : '#333', color: 'white', cursor: 'pointer',
            fontSize: '16px' }}>
          {muted ? '🔇 Unmute' : '🎤 Mute'}
        </button>

        <button onClick={toggleVideo}
          style={{ padding: '12px 24px', borderRadius: '50px', border: 'none',
            background: videoOff ? '#f44336' : '#333', color: 'white', cursor: 'pointer',
            fontSize: '16px' }}>
          {videoOff ? '📷 Start Video' : '📹 Stop Video'}
        </button>

        <button onClick={endCall}
          style={{ padding: '12px 32px', borderRadius: '50px', border: 'none',
            background: '#f44336', color: 'white', cursor: 'pointer',
            fontSize: '16px', fontWeight: 'bold' }}>
          📵 End Call
        </button>
      </div>
    </div>
  );
}