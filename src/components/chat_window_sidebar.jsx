import React, {useEffect, useState} from 'react';
import './chat_window_sidebar.css';
import socket from '../socket';

const ChatList = ({ chatData, openChatWindow, targetChat, targetChatUser }) => {
  const [unreadMessages, setUnreadMessages] = useState({});
  
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (message.chat_id !== targetChat) {
        setUnreadMessages((prevUnread) => ({
          ...prevUnread,
          [message.chat_id]: (prevUnread[message.chat_id] || 0) + 1,
        }));
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [targetChat]);

  const clearUnreadMessages = (chatId) => {
    setUnreadMessages((prevUnread) => ({
      ...prevUnread,
      [chatId]: 0,
    }));
  };

  return (
    <div>
      <ul>
        {chatData.map((chat) => (
          <li key={chat.chat_id} style={{ width: '99%' }}>
            <span
              className={
                targetChatUser === chat.user_id
                  ? 'glow-item sidebar-chat-item'
                  : 'sidebar-chat-item'
              }
              onClick={() => {
                openChatWindow(chat.chat_id, chat.user_id);
                clearUnreadMessages(chat.chat_id);
              }}
            >
              {chat.name} (@{chat.username})
              <div className="cws-indicators">
              {unreadMessages[chat.chat_id] > 0 && (
                <div className="unread-indicator">{unreadMessages[chat.chat_id]}</div>
              )}
              {chat.connectionStatus === 1 ? (
                <img
                  className="connection-icon"
                  src="/online-icon.svg"
                  alt="online"
                />
              ) : (
                <img
                  className="connection-icon"
                  src="offline-icon.svg"
                  alt="offline"
                />
              )}
              </div>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;