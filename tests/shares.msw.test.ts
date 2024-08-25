import { setupServer } from 'msw/node';
import crypto from 'crypto';
import { http } from 'msw';
import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import app, { ShareFileQuery } from '../src/server/app';
import { Conversion } from '../src/clients/ConversionClient';

const interceptorServer = setupServer(
  http.get(
    `${process.env.CONVERSION_API_URL}/conversions/:conversionId`,
    () => {
      return Response.json({ message: 'Not found' }, { status: 404 });
    },
  ),
);

describe('Shares', () => {
  beforeAll(async () => {
    interceptorServer.listen({ onUnhandledRequest: 'bypass' });

    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    interceptorServer.resetHandlers();
  });

  afterAll(async () => {
    await app.close();

    interceptorServer.close();
  });

  /**
   * Exemplo (para habilitar, remova o `.skip`)
   */
  test.skip('example', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
  });

  /**
   * Teste 1: Deve retornar uma resposta de sucesso quando um arquivo foi
   * compartilhado sem conversão.
   */
  test('case 1', async () => {
    let numberOfConversionCreationRequests = 0;

    interceptorServer.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        numberOfConversionCreationRequests++;
        return Response.json(
          { message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'example.docx',
      mode: 'public',
    });

    expect(numberOfConversionCreationRequests).toBe(0);
  });

  /**
   * Teste 2: Deve retornar uma resposta de sucesso quando um arquivo foi
   * compartilhado com conversão.
   */
  test('case 2', async () => {
    const pendingConversion: Conversion = {
      id: crypto.randomUUID(),
      state: 'PENDING',
      inputFileName: 'example.docx',
      inputFileFormat: 'docx',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    interceptorServer.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return Response.json(pendingConversion, { status: 202 });
      }),
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/${pendingConversion.id}`,
        () => {
          return Response.json({
            ...pendingConversion,
            state: 'COMPLETED',
            completedAt: new Date().toISOString(),
          });
        },
      ),
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'example.pdf',
      mode: 'public',
      originalFile: {
        name: 'example.docx',
      },
    });
  });

  /**
   * Teste 3: Deve retornar uma resposta de erro quando a conversão de um
   * arquivo compartilhado resultou em um erro.
   */
  test('case 3', async () => {
    const pendingConversion: Conversion = {
      id: crypto.randomUUID(),
      state: 'PENDING',
      inputFileName: 'example.docx',
      inputFileFormat: 'docx',
      outputFileName: 'example.pdf',
      outputFileFormat: 'pdf',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    interceptorServer.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return Response.json(pendingConversion, { status: 202 });
      }),
    );

    interceptorServer.use(
      http.get(
        `${process.env.CONVERSION_API_URL}/conversions/${pendingConversion.id}`,
        () => {
          return Response.json({
            ...pendingConversion,
            state: 'ERROR',
            completedAt: null,
          });
        },
      ),
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error converting file',
    });
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não foi possível
   * utilizar a API de conversão por um erro desconhecido.
   */
  test('case 4', async () => {
    interceptorServer.use(
      http.post(`${process.env.CONVERSION_API_URL}/conversions`, () => {
        return Response.json(
          { message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
        convertTo: 'pdf',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error',
    });
  });
});
