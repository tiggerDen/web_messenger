const express = require('express');
const http = require('http');
const mysql = require('mysql2');
const cors = require('cors');
const socketIo = require('socket.io');
const messagesQueries = require ('./sql-logic.js');
const loadInitialMessages = messagesQueries.loadInitialMessages;
const loadAdditionalMessages = messagesQueries.loadAdditionalMessages;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*'}})

const PORT = 3001;
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*',
}));

var onlineUsers = [];

const loginCheck = (username, password, callback) => {
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  loginCheck(username, password, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {

      return res.json({
        id: results[0].user_id,
        username: results[0].username,
        name: results[0].name,
      });

    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  });
});


app.get('/api/users/search',(req, res) => {
    const { username } = req.query;
    /*if (!username) {
      return res.status(400).json({ error: 'Username is required in the query parameter.' });
    }*/
    const sql = `SELECT * FROM users WHERE username LIKE ?;`;
    const searchTerm = `%${username}%`;
    db.query(sql, [searchTerm], (err,results) => {
      if (err){
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const usersWithConnectionStatus = results.map(user => {
          const isOnline = onlineUsers.some(onlineUser => onlineUser.id === user.user_id);
          const connectionStatus = isOnline ? 1 : 0;
          return { ...user, connectionStatus };
      });
        const searchResults = usersWithConnectionStatus.map(({ password, ...rest }) => rest);
        res.json(searchResults);
      }
    })
});

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '97538642',
  database: 'user_auth_db',
  connectionLimit: 10,
});

const getChats = (user_id, callback) => {
try{
  const sql = `
  SELECT
    chat_id,
    CASE
      WHEN user1_id = '${user_id}' THEN user2_id
      WHEN user2_id = '${user_id}' THEN user1_id
    END AS user_id,
    CASE
      WHEN user1_id = '${user_id}' THEN Users2.username
      WHEN user2_id = '${user_id}' THEN Users1.username
    END AS username,
    CASE
      WHEN user1_id = '${user_id}' THEN Users2.name
      WHEN user2_id = '${user_id}' THEN Users1.name
    END AS name
  FROM Chats
  LEFT JOIN Users AS Users1 ON Chats.user1_id = Users1.user_id
  LEFT JOIN Users AS Users2 ON Chats.user2_id = Users2.user_id
  WHERE
    '${user_id}' IN (user1_id, user2_id);
`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      callback(err, null);
    } else {
      const chatData = results.map((row) => ({
        chat_id: row.chat_id,
        user_id: row.user_id,
        connectionStatus: onlineUsers.some(user => user.id === row.user_id) ? 1 : 0,
        username: row.username,
        name: row.name
      }));
      callback(null, chatData);
    }
  });
} catch (error) {
  console.error('Error loading chats:', error);
}
};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('loginData' , (data) => {
      onlineUsers.push({
        id: data.id,
        username: data.username,
        name: data.name,
        socketId: data.socketId
      });
        getChats(data.id, (err, results) => {
          if (err) {
            console.error('Error loading chats:', err);
          } else {
            socket.emit('chatData', results);
            const connectionStatus = {
              id: data.id,
              connectionStatus: 1
            }
            io.emit('connectionStatus', connectionStatus)
          }
        })
    })
    socket.on('message', (data) => {
      io.emit('message', data);
    });

    socket.on('loadMessages', chat_id => {
    const sql = loadInitialMessages;
    db.query(sql, [chat_id], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
      } else {
        socket.emit('messagesLoaded', results);
      }
    });
    });

    socket.on('loadMoreMessages', (chat_id, earliestMessageId) => {
      const sql = loadAdditionalMessages;
      db.query(sql, [chat_id, earliestMessageId], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
        } else {
          socket.emit('additionalMessagesLoaded', results);
        }
      });
      });
    
    socket.on('messageSubmitted', (message) => {
      const isUserOnline = onlineUsers.find(user => user.id === message.other_user_id); 
      if (!message.chat_id) {
        const values = [message.user_id, message.other_user_id];
        db.query(messagesQueries.appendChat, values, (err, results) =>{
          if (err) {
            console.error('Error executing query:', err);
          } else {
            console.log('Chat created successfully', results);
            db.query(messagesQueries.getLatestChatId, (err, results) => {
              if (err) {
                console.error('Error executing query:', err);
              } else {
                  message.chat_id = results[0].chat_id;
                  if (isUserOnline) {
                    io.to(isUserOnline.socketId).emit('receiveChat', {
                      chat_id: message.chat_id,
                      user_id: message.user_id,
                      connectionStatus: 1,
                      username: message.username,
                      name: message.name
                    });
                    io.to(isUserOnline.socketId).emit('receiveMessage', message);
                    const currentUser = onlineUsers.find(user => user.id === message.user_id);
                    io.to(currentUser.socketId).emit('receiveChatID', message.chat_id)
                    db.query(messagesQueries.appendMessage, [message.chat_id, message.user_id, message.content, message.timestamp]);
                  }
              }
            });
          }
        });
        } else {
          if (isUserOnline) {
            io.to(isUserOnline.socketId).emit('receiveMessage', message);
          }
          db.query(messagesQueries.appendMessage, [message.chat_id, message.user_id, message.content, message.timestamp]);
        }
        return;
      });
  
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const disconnectedUser = onlineUsers.find(user => user.socketId === socket.id);
      const disconnectedUserId = disconnectedUser ? disconnectedUser.id : null;
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
      const connectionStatus = {
        id: disconnectedUserId,
        connectionStatus: 0
      }
      socket.broadcast.emit('connectionStatus', connectionStatus);
    });
  });

  io.on('message', (data) => {
    console.log(data);
  });


app.get('/api/userList', (req, res) => {
  const sql = 'SELECT user_id, username, name FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});


app.post('/api/register', (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password and name are required' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  //check if username already exists in the database
  const sqlCheck = `SELECT * FROM users WHERE username = '${username}'`;
  db.query(sqlCheck, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      else {
        const sql = 'INSERT INTO users (username, password, name) VALUES (?, ?, ?)';
        db.query(sql, [username, password, name], (err, result) => {
          if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.json({ message: 'User added successfully', userId: result.insertId });
          }
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
