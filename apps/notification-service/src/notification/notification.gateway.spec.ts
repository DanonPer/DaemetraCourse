import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'net';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { NotificationServiceModule } from '../notification-service.module';
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
  let jwtService: JwtService;
  let client: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let port: number;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.PRIVATE_KEY = process.env.PRIVATE_KEY ?? 'test-private-key';
    process.env.ACCESS_TOKEN_EXPIRES_IN =
      process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    gateway = app.get(NotificationGateway);
    jwtService = app.get(JwtService);

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
    const accessToken = jwtService.sign({
      id: 'user-123',
      login: 'tester',
      roles: ['USER'],
    });

    client = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      extraHeaders: {
        authorization: `Bearer ${accessToken}`,
      },
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
