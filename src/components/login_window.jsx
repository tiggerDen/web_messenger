import React, { useState } from "react";
import "./login_window.css";
import axios from "axios";

const PopupLogin = ({ onClose, onLoginSuccess }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleClose = () => {
    onClose();
  };
  const handleLogin = (e) => {
    e.preventDefault();
    if (!login || !password) {
      setError("Ошибка аутентификации: введите логин и пароль");
      return;
    }
    const user = {
        username: login,
        password: password,
      };
      console.log(user);
      axios.post('http://localhost:3001/api/login', user,{
        headers: {
          'ngrok-skip-browser-warning': '69420',
        },
      })
  .then(response => {
    console.log('Response:', response.data);
    onLoginSuccess(response.data);
    handleClose();
  })
  .catch(error => {
    console.error('Error:', error.response ? error.response.data : error.message);
    setError("Ошибка аутентификации: неверные логин или пароль");
  });
  };

  return (
    <div className = "login-window">
      <form id = "login-form" onSubmit={handleLogin}>
        <input type = "text" placeholder = "Логин" value={login} onChange={(e) => setLogin(e.target.value)} />
        <input type = "password" placeholder = "Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type = "submit">Войти</button>
      </form>
      {error && <p style= {{marginBottom:"7px", marginTop:"0px", fontSize: "15px", fontWeight: "bold"}}>{error}</p>}
      <span className = "close-span" onClick={handleClose}>X</span>
    </div>
  );
};


export default PopupLogin;