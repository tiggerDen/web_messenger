import React, { useEffect, useState, useRef } from 'react';
import socket from '../socket.js';
import './chat_window.css';

const ChatWindow = ({ currentUser, chat_id, user_id, messages, setMessages, loading, setLoading }) => {
//  const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [showMore, setshowMore] = useState(false);  

    const handleLoadMoreMessages = (chat_id, earliest_message_id) => {
      socket.emit('loadMoreMessages', chat_id, earliest_message_id);
      setLoading(true);
    };

    useEffect(() => {
      const container = messagesEndRef.current;
      const isAtTop = container.scrollTop === 0;
    
      if (!isAtTop) {
        //messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        container.scrollTop = container.scrollHeight;
      }
    }, [messages]);
  
    const handleInputChange = (e) => {
      setNewMessage(e.target.value);
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!newMessage) return;
      const currentDate = new Date();
      const currentTimestampMySQLFormat = currentDate.toISOString().slice(0, 19).replace('T', ' ');
      const submitMessage = {
        chat_id: chat_id,
        user_id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        other_user_id: user_id,
        content: newMessage,
        timestamp: currentTimestampMySQLFormat,
      };
      socket.emit('messageSubmitted', submitMessage);
      setMessages((messages) => [...messages, {
        sender_id: currentUser.id,
        content: newMessage,
        timestamp: submitMessage.timestamp
      }]);
      console.log(submitMessage);
      setNewMessage('');
    };
  
    useEffect(() => {
  /*  const handleOnChatCreation = (chatid) => {
        setTargetChat(chatid);
    };*/

    const handleOnReceiveMessage = (message) => {
        if (message.chat_id === chat_id) {
          setMessages((messages) => [...messages, message]);
        }
      };

      const handleAdditionalMessagesLoaded = (newMessages) => {
        if (newMessages.length === 20) {
          setshowMore(true);
        }
        else{
          setshowMore(false);
        };
          setLoading(false);
        setMessages((prevMessages) => (
          [...prevMessages, ...newMessages].sort((a, b) => a.message_id - b.message_id)
        ));
      };
    socket.on('additionalMessagesLoaded', handleAdditionalMessagesLoaded);
    socket.on('receiveMessage', handleOnReceiveMessage);
    socket.on('messagesLoaded', (messages) => {
        if (messages.length === 20) {
          setshowMore(true);
        }
        else{
          setshowMore(false);
        };
          setLoading(false);
        const sortedMessages = messages.sort((a, b) => a.message_id - b.message_id);
        setMessages(sortedMessages);
        console.log(messages);
      });
      return () => {
        socket.off('receiveMessage', handleOnReceiveMessage);
        socket.off('messagesLoaded');
        socket.off('additionalMessagesLoaded', handleAdditionalMessagesLoaded);
      };
    }, [chat_id, setMessages, setLoading]);
  
    return (
      <div className='chat-window-container'>
        {loading ? (<div className = 'loading'></div>) :
        (<ul>
          {showMore && <button className='load-more-messages-btn' onClick={() => handleLoadMoreMessages(chat_id, messages[0].message_id)}>Загрузить больше</button>}
          {messages.map((message) => (
            <li className={message.sender_id === currentUser.id ? 'right-message' : 'left-message'}key={message.id}>
              {message.content}<div className='timestamp'>{message.timestamp.slice(5,16).replace('T',' ')}</div> </li>
          ))}
        </ul>)}
        <form onSubmit={handleSubmit} className='chat-window-form'>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Введите сообщение..."
          />
          <button className="send-msg-icon-btn" type="submit"><img src="/send-msg.svg" alt="Send message" className='send-msg-icon'/></button>
        </form>
        <div ref={messagesEndRef}></div>
      </div>
    );
  };
  
  export default ChatWindow;
  
