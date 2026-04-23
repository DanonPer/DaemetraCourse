import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'net';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { NotificationGateway } from './notification.gateway';

interface ServerToClientEvents {
  pong: (data: string) => void;
}

interface ClientToServerEvents {
  ping: (data: string) => void;
}

describe('NotificationGateway', () => {
  let app: INestApplication;
  let gateway: NotificationGateway;
  let client: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let port: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [NotificationGateway],
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = app.get(NotificationGateway);

    await app.listen(0);

    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterEach(() => {
    client?.disconnect();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should emit "pong" on "ping"', async () => {
    client = io(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        client.emit('ping', 'Hello world!');
      });

      client.on('pong', (data) => {
        try {
          expect(data).toBe('Hello world!');
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });

      client.on('connect_error', (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  });
});
