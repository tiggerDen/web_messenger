import React, { useState } from 'react';
import axios from 'axios';
import './search_user.css';

const SearchUser = ({currentUser, newChat, onClose}) => {
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://localhost:3001/api/users/search?username=${username}`,{
        headers: {
          'ngrok-skip-browser-warning': '69420',
        },
      });
      console.log(response);
      console.log(response.status);
      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching for users:', error);
    }
  };
  const handleClose = () => {
    onClose();
  };
  const handleStartNewChat = (user) => {
    if (user.user_id === currentUser.id) {
      console.log('You can\'t start a chat with yourself');
      return;
    }
      const data = {
      sender_id: currentUser.id,
      connectionStatus: user.connectionStatus,
      name: user.name,
      username: user.username,
      user_id: user.user_id,
      sender_username: currentUser.username,
      sender_name: currentUser.name
    }
   newChat(data);
    console.log(data);
   handleClose();
    }
  return (
    <div className = 'search-user-container'>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Введите логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Поиск</button>
      </form>
    <div className = 'search-result-container' >
      <ul>
        {searchResults.map((user) => (
          <li onClick = {() => handleStartNewChat(user)} className = 'search-result-item' key={user.user_id}><span>{user.username}</span></li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default SearchUser;