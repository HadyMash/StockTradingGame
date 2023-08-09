import { io } from 'socket.io-client';

const socketURL = 'http://localhost:3000';

export var socket;

export function setSocketQuery(query) {
  if (socket?.connected) {
    throw new Error('Socket already connected');
  }
  socket = io(socketURL, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 10000,
    reconnectionDelayMax: 10000,
    query: query,
  });
}

socket = setSocketQuery({});
