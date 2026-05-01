import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && accessToken) {
      const newSocket = io(window.location.origin, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on('connect', () => {
        newSocket.emit('join:personal', `user:${user.id}`);
      });

      newSocket.on('connect_error', (err) => {
        // Auth failures on reconnect — don't spam, socket.io will retry automatically
        if (err.message?.includes('Authentication error')) {
          newSocket.disconnect();
        }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [user, accessToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
