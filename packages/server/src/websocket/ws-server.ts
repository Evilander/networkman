import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@networkman/shared';
import { logger } from '../utils/logger.js';

export type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;

export function createWebSocketServer(httpServer: HttpServer): TypedIO {
  const io: TypedIO = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
