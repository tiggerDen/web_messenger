const { io } = require("socket.io-client");

//const URL = "https://bear-dominant-basically.ngrok-free.app/";
const URL = "http://localhost:3001";

//const socket = io('http://localhost:3001');

const socket = io(URL, { autoConnect: false, extraHeaders: { "ngrok-skip-browser-warning":"69420"} });

export default socket;