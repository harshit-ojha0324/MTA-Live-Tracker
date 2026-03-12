import { io } from "socket.io-client";

// Single shared Socket.IO instance for the entire app.
// During development Vite proxies /socket.io → Flask :5000.
const socket = io("/transit", { path: "/socket.io" });

export default socket;
