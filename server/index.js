const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const passport = require('./config/passport');

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.IO
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their userId
  socket.on('user_online', (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit('online_users', Object.keys(onlineUsers));
  });

  // Join a chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Send message
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('typing', data);
  });

  // Video signaling
  socket.on('join_video_room', (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    const numClients = clients ? clients.size : 0;

    if (numClients === 0) {
      socket.join(roomId);
      socket.emit('video_room_created', roomId);
    } else if (numClients === 1) {
      socket.join(roomId);
      socket.emit('video_room_joined', roomId);
      io.to(roomId).emit('video_ready', roomId);
    } else {
      socket.emit('video_room_full', roomId);
    }
  });

  socket.on('video_offer', (data) => {
    socket.to(data.roomId).emit('video_offer', data);
  });

  socket.on('video_answer', (data) => {
    socket.to(data.roomId).emit('video_answer', data);
  });

  socket.on('ice_candidate', (data) => {
    socket.to(data.roomId).emit('ice_candidate', data);
  });

  socket.on('leave_video_room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('peer_left');
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(onlineUsers).find(
      key => onlineUsers[key] === socket.id
    );
    if (userId) delete onlineUsers[userId];
    io.emit('online_users', Object.keys(onlineUsers));
    console.log('User disconnected:', socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));