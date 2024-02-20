import React, { useState } from "react";
import "./login_window.css";
import axios from "axios";
import socket from "../socket"

const PopupRegister = ({ onClose, onLoginSuccess }) => {
  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const handleClose = () => {
    onClose();
  };
  const handleRegister = (e) => {
    e.preventDefault();
    if (!login || !password || !name) {
      setError("Введите имя, логин и пароль");
      return;
    }
    const newUser = {
      username: login,
      password: password,
      name: name,
    };
    console.log(newUser);
    axios.post("http://localhost:3001/api/register", newUser,{
      headers: {
        'ngrok-skip-browser-warning': '69420',
      },
    })
    .then((response) => {
      console.log('Response:', response.data);
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
    });
    socket.on('message', (message) => {
      console.log(message);
    });
  })
  .catch(error => {
    setError('Ошибка регистрации')
    console.error('Error:', error.response ? error.response.data : error.message);
  });
  };

  return (
    <div className="login-window">
      <form id = "login-form" onSubmit={handleRegister}>
        <input type="name" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Регистрация</button>
      </form>
      {error && <p style= {{marginBottom:"7px", marginTop:"0px", fontSize: "15px", fontWeight: "bold"}}>{error}</p>}
      <span className="close-span" onClick={handleClose}>X</span>
    </div>
  );
};


export default PopupRegister;
