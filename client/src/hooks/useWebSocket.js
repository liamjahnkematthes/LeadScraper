import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';

export const useWebSocket = (url = WEBSOCKET_URL) => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        setConnectionStatus('Connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        const message = {
          data: event.data,
          timestamp: new Date().toISOString()
        };
        
        setLastMessage(message);
        setMessageHistory(prev => [...prev.slice(-99), message]); // Keep last 100 messages
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket Disconnected:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setConnectionStatus(`Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionStatus('Failed');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setConnectionStatus('Error');
      };

    } catch (error) {
      console.error('WebSocket Connection Error:', error);
      setConnectionStatus('Error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Intentional disconnect');
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return false;
    }
  }, []);

  const getReadyState = useCallback(() => {
    if (!ws.current) return WebSocket.CLOSED;
    return ws.current.readyState;
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [sendMessage]);

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    sendMessage,
    connect,
    disconnect,
    getReadyState
  };
}; 