import { useState, useEffect } from "react";
import socket from "../lib/socket";

/**
 * Subscribes to real-time updates from the Flask/Socket.IO backend.
 * Returns service alerts keyed by line letter, elevator outages list,
 * last update time, and connection state.
 */
export function useServiceStatus() {
  const [serviceStatus,   setServiceStatus]   = useState({});
  const [elevatorOutages, setElevatorOutages] = useState([]);
  const [lastUpdate,      setLastUpdate]      = useState(null);
  const [connected,       setConnected]       = useState(false);

  useEffect(() => {
    const onConnect         = ()     => setConnected(true);
    const onDisconnect      = ()     => setConnected(false);
    const onServiceUpdate   = (data) => { setServiceStatus(data);   setLastUpdate(new Date()); };
    const onElevatorUpdate  = (data) => { setElevatorOutages(data); };

    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("service_update",  onServiceUpdate);
    socket.on("elevator_update", onElevatorUpdate);

    return () => {
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("service_update",  onServiceUpdate);
      socket.off("elevator_update", onElevatorUpdate);
    };
  }, []);

  return { serviceStatus, elevatorOutages, lastUpdate, connected };
}
