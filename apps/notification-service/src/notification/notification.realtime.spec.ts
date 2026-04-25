import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'net';
import request from 'supertest';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { NotificationServiceModule } from '../notification-service.module';

interface ServerToClientEvents {
  pong: (data: string) => void;
  notification: (payload: { data: string }) => void;
}

interface ClientToServerEvents {
  ping: (data: string) => void;
}

describe('Notification realtime flow', () => {
  let app: INestApplication;
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

  it('should disconnect client with invalid token', async () => {
    client = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      extraHeaders: {
        authorization: 'Bearer invalid-token',
      },
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        setTimeout(() => {
          if (!client.connected) {
            resolve();
            return;
          }

          reject(new Error('Client should be disconnected'));
        }, 50);
      });

      client.on('connect_error', () => {
        resolve();
      });
    });
  });

  it('should deliver notification to authenticated user room', async () => {
    const userId = 'user-123';
    const accessToken = jwtService.sign({
      id: userId,
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
        void request(app.getHttpServer())
          .post('/notification')
          .send({
            userId,
            data: 'hello!',
          })
          .expect(201)
          .then(() => undefined)
          .catch((error: unknown) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });

      client.on('notification', (payload) => {
        try {
          expect(payload).toEqual({ data: 'hello!' });
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
