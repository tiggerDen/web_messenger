import React, { useState } from 'react';
import Sidebar from './components/sidebar.jsx';
import './App.css';
import socket from './socket.js';
import ChatWindow from './components/chat_window.jsx'

function App() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [targetChat, setTargetChat] = useState(null);
  const [targetChatUser, setTargetChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const handleLoginSuccess = (response) => {
    console.log("Logged in:", response);
    socket.connect();
    socket.on('connect', () => {
      console.log(socket.id);
      const loggedUser = ({
        id: response.id,
        username: response.username,
        name: response.name,
        socketId: socket.id
      });
      setCurrentUser(loggedUser);
      socket.emit('loginData', loggedUser);
      console.log(loggedUser);
    });
    socket.on('message', (message) => {
      console.log(message);
    });
    socket.on('disconnect', () => {
      setShowChatWindow(false);
      setTargetChat(null);
      console.log('Disconnected');
    });
    /*socket.on('chatData', (chatData) => {
      console.log(chatData);
    });*/
  }
  const handleOpenChat = (chat_id, user_id) => {
    console.log('chatid',chat_id);
    console.log('userid',user_id)
    if (!chat_id){
      setTargetChat(null);
      setTargetChatUser(user_id);
      setShowChatWindow(true);
      setMessages([]);
    }
    else{
      console.log('Opening chat:', chat_id, user_id);
      socket.emit('loadMessages', chat_id)
      setLoading(true);
      setTargetChatUser(user_id);
      setTargetChat(chat_id);
      setShowChatWindow(true);
      console.log(showChatWindow);
    }

  }

  return (
    <div className="App">
      <Sidebar currentUser={currentUser} setCurrentUser={setCurrentUser} onLoginSuccess={handleLoginSuccess} handleOpenChat={handleOpenChat} targetChat={targetChat} targetChatUser={targetChatUser}/>
      {showChatWindow && <ChatWindow currentUser={currentUser} chat_id={targetChat} user_id={targetChatUser} setTargetChat={setTargetChat} messages={messages} setMessages={setMessages} loading={loading} setLoading={setLoading} />}
      <header className="App-header">
        {!currentUser && <p>Войдите в уже существующий аккаунт или создайте новый</p>}
        {currentUser && !showChatWindow && <p>Выберите чат и начните общение</p>}

      </header>
    </div>
  );
}

export default App;
