import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationAuthService } from './notification-auth.service';

interface ClientToServerEvents {
  ping: (data: string) => void;
}

interface NotificationPayload {
  data: string;
}

interface ServerToClientEvents {
  pong: (data: string) => void;
  notification: (payload: NotificationPayload) => void;
}

type InterServerEvents = Record<string, never>;

interface SocketData {
  userId: string;
}

type NotificationServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type NotificationSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type PongResponse = WsResponse<string>;

@WebSocketGateway()
export class NotificationGateway
  implements
    OnGatewayInit<NotificationServer>,
    OnGatewayConnection<NotificationSocket>,
    OnGatewayDisconnect<NotificationSocket>
{
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly notificationAuthService: NotificationAuthService,
  ) {}

  @WebSocketServer()
  io: NotificationServer;

  afterInit(server: NotificationServer): void {
    this.logger.log('Initialized');
    this.logger.debug(`Connected clients: ${server.sockets.sockets.size}`);
  }

  async handleConnection(client: NotificationSocket): Promise<void> {
    this.logger.log(`Client id: ${client.id} connected`);

    try {
      const userId = this.notificationAuthService.verifyAuthorizationHeader(
        client.handshake.headers.authorization,
      );

      client.data.userId = userId;
      await client.join(userId);

      this.logger.debug(`Client id: ${client.id} joined room: ${userId}`);
      this.logger.debug(
        `Number of connected clients: ${this.io.sockets.sockets.size}`,
      );
    } catch {
      this.logger.warn(
        `Client id: ${client.id} disconnected due to invalid JWT`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: NotificationSocket): void {
    this.logger.log(`Client id: ${client.id} disconnected`);
  }

  sendNotification(userId: string, payload: NotificationPayload): void {
    this.io.to(userId).emit('notification', payload);
    this.logger.log(`Notification sent to room: ${userId}`);
  }

  @SubscribeMessage('ping')
  handleMessage(client: NotificationSocket, data: string): PongResponse {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);

    return {
      event: 'pong',
      data,
    };
  }
}
