import React, { useState, useEffect} from "react";
import "./sidebar.css";
import PopupLogin from "./login_window.jsx";
import PopupRegister from "./register_window.jsx";
import socket from "../socket";
import ChatList from "./chat_window_sidebar.jsx";
import SearchUser from './search_user.jsx'

const Sidebar = ({ currentUser, onLoginSuccess, setCurrentUser, handleOpenChat, targetChat, targetChatUser}) => {
    console.log('Sidebar rendered');
    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [chatData, setChatData] = useState([]);
    const [openSearch, setOpenSearch] = useState(false);
  
    const handleOpenSearch = () => {
      if (openSearch){
          setOpenSearch(false);
          return;
      }
      if (openRegister) {
          setOpenRegister(false);
      }
      if (openLogin) {
          setOpenLogin(false);
      }
          setOpenSearch(true);
      };
    const handleOpenLogin = () => {
    if (openSearch){
        setOpenSearch(false);
    }
    if (openRegister) {
        setOpenRegister(false);
    }
    if (openLogin) {
        setOpenLogin(false);
        return;
    }
        setOpenLogin(true);
    };

    const handleOpenRegister = () => {
      if (openSearch){
          setOpenSearch(false);
      }
      if (openLogin) {
          setOpenLogin(false);
      }
      if (openRegister) {
          setOpenRegister(false);
          return;
      }
        setOpenRegister(true);
      };
  
    const handleCloseSearch = () => {
      setOpenSearch(false);
    };

    const handleCloseLogin = () => {
      setOpenLogin(false);
    };
  
    const handleCloseRegister = () => {
      setOpenRegister(false);
    };

    const handleLogout = () => {
      setCurrentUser(null);
      setChatData([]);
      socket.disconnect()
      socket.removeAllListeners();
    };
    const handleNewChat = (data) => {
      const index = chatData.findIndex((chat) => chat.user_id === data.user_id);
      if (index !== -1) {
        handleOpenChat(chatData[index].chat_id, data.user_id);
      } else {
        const newChatData = [...chatData];
        newChatData.unshift(data);
        setChatData(newChatData);
        console.log(newChatData);
      }
    };

    useEffect(() => {
      const handleConnectionStatus = (data) => {
      const index = chatData.findIndex((chat) => chat.user_id === data.id);
      if (index !== -1) {
        setChatData(prevstate => {
          const newChatData = [...prevstate];
          newChatData[index].connectionStatus = data.connectionStatus;
          return newChatData;
        })
      }
      }
      socket.on('connectionStatus', handleConnectionStatus);
      return () => {
        socket.off('connectionStatus', handleConnectionStatus);
      }
    }, [chatData]);

    useEffect(() => {
      const handleNewChat = (data) => {
        const newChatData = [...chatData];
        newChatData.unshift(data);
        setChatData(newChatData);
      };
      socket.on('receiveChat', handleNewChat);
      return () => {
        socket.off('receiveChat', handleNewChat);
      };
    }, [chatData]);

    useEffect (() => {
      socket.on('receiveChatID', (chatID) => {
        console.log('receiveChatID',chatID);
        const index = chatData.findIndex((chat) => chat.user_id === targetChatUser);
        console.log(index);
        if (index !== -1) {
          setChatData((prevstate) => {
            const newChatData = [...prevstate];
            newChatData[index] = { ...newChatData[index], chat_id: chatID };
            handleOpenChat(chatID, targetChatUser);
            return newChatData;
          });
        }
      });
      return () => {
        socket.off('receiveChatID');
      };
    }, [chatData, targetChatUser, handleOpenChat]);

    useEffect(() => {
      const handleChatData = (receivedChatData) => {
        setChatData(receivedChatData);
        console.log(receivedChatData);
        
      };
      socket.on('chatData', handleChatData);
      return () => {
        socket.off('chatData', handleChatData);
      };
    }, [currentUser]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Web Messenger</h3>
        {currentUser && <button className="button-style" onClick={handleOpenSearch}>Поиск</button>}
        {openSearch && <SearchUser currentUser={currentUser} newChat={handleNewChat} onClose={handleCloseSearch}/>}
      </div>
      <ChatList chatData={chatData} openChatWindow={handleOpenChat} targetChat={targetChat} targetChatUser={targetChatUser}></ChatList>
      <div className="sidebar-user">{(currentUser && currentUser.name) ? <div><div className="user-greeting">Привет,<b> {currentUser.name}</b></div><button className="button-style" onClick={handleLogout}>Выйти из аккаунта</button></div> :
       <div>
         <button className="button-style" onClick={handleOpenLogin}>Войти</button>
         {openLogin && <PopupLogin onClose={handleCloseLogin} onLoginSuccess={onLoginSuccess}/>}
         <button className="button-style" onClick={handleOpenRegister}>Зарегистрироваться</button>
         {openRegister && <PopupRegister onClose={handleCloseRegister} onLoginSuccess={onLoginSuccess} />}</div>}
      </div>
      <div className="sidebar-menu">
      </div>
    </div>
  );
};

export default Sidebar;