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

interface ClientToServerEvents {
  ping: (data: string) => void;
}

interface ServerToClientEvents {
  pong: (data: string) => void;
}

type InterServerEvents = Record<string, never>;

type SocketData = Record<string, never>;

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

  @WebSocketServer()
  server: NotificationServer;

  afterInit(server: NotificationServer): void {
    this.logger.log('Initialized');
    this.logger.debug(`Connected clients: ${server.sockets.sockets.size}`);
  }

  handleConnection(client: NotificationSocket): void {
    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(
      `Number of connected clients: ${this.server.sockets.sockets.size}`,
    );
  }

  handleDisconnect(client: NotificationSocket): void {
    this.logger.log(`Client id: ${client.id} disconnected`);
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
