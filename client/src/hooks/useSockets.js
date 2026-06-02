import { useEffect, useState, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../socket/socket";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => { setConnected(true); setError(null); };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err) => { setError(err.message); setConnected(false); };
    const onError = ({ message }) => setError(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("error", onError);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("error", onError);
    };
  }, []);

  return { socket: getSocket(), connected, error };
}