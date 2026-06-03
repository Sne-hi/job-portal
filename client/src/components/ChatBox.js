import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

export default function ChatBox({ roomId, otherUser }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();
    socket?.emit('join_room', roomId);

    socket?.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket?.on('typing', (data) => {
      if (data.userId !== user._id) setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    return () => {
      socket?.off('receive_message');
      socket?.off('typing');
    };
  }, [roomId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const res = await axios.get(`/messages/${roomId}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const res = await axios.post('/messages', { roomId, content: input });
    socket?.emit('send_message', { ...res.data, roomId });
    setMessages(prev => [...prev, res.data]);
    setInput('');
  };

  const handleTyping = () => {
    socket?.emit('typing', { roomId, userId: user._id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px',
      border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px', background: '#1a1a2e', color: 'white' }}>
        <strong>Chat with {otherUser?.name || 'User'}</strong>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9f9f9' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.sender?._id === user._id ? 'flex-end' : 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{
              maxWidth: '70%', padding: '10px 14px', borderRadius: '18px',
              background: msg.sender?._id === user._id ? '#2196F3' : 'white',
              color: msg.sender?._id === user._id ? 'white' : 'black',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              <small style={{ opacity: 0.7, fontSize: '11px' }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
        {typing && <p style={{ color: '#999', fontStyle: 'italic' }}>{otherUser?.name} is typing...</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', padding: '12px', borderTop: '1px solid #ddd', background: 'white' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyUp={handleTyping}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', borderRadius: '20px',
            border: '1px solid #ddd', outline: 'none', marginRight: '8px' }}
        />
        <button onClick={sendMessage}
          style={{ padding: '10px 20px', background: '#2196F3', color: 'white',
            border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}