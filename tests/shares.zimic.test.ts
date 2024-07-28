import { httpInterceptor } from 'zimic/interceptor/http';
import crypto from 'crypto';
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
import {
  ConversionOperations,
  ConversionSchema,
} from '../src/types/conversion.generated';

httpInterceptor.default.onUnhandledRequest({ log: false });

const conversionInterceptor = httpInterceptor.create<ConversionSchema>({
  type: 'local',
  baseURL: process.env.CONVERSION_API_URL!,
  saveRequests: true,
});

describe('Shares', () => {
  beforeAll(async () => {
    await conversionInterceptor.start();

    await app.ready();
  });

  beforeEach(async () => {
    conversionInterceptor.get('/conversions/:conversionId').respond({
      status: 404,
      body: { message: 'Not found' },
    });
  });

  afterEach(async () => {
    conversionInterceptor.clear();
  });

  afterAll(async () => {
    await app.close();

    await conversionInterceptor.stop();
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
    const conversionCreationHandler = conversionInterceptor
      .post('/conversions')
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

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

    expect(conversionCreationHandler.requests()).toHaveLength(0);
  });

  /**
   * Teste 2: Deve retornar uma resposta de sucesso quando um arquivo foi
   * compartilhado com conversão.
   */
  test('case 2', async () => {
    const pendingConversion: Conversion = {
      id: crypto.randomUUID(),
      state: 'PENDING',
      inputFile: {
        name: 'example.docx',
        format: 'docx',
      },
      outputFile: {
        name: 'example.pdf',
        format: 'pdf',
      },
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const conversionCreationHandler = conversionInterceptor
      .post('/conversions')
      .respond({
        status: 202,
        body: pendingConversion,
      });

    const conversionGetHandler = conversionInterceptor
      .get(`/conversions/${pendingConversion.id}`)
      .respond({
        status: 200,
        body: {
          ...pendingConversion,
          state: 'COMPLETED',
          completedAt: new Date().toISOString(),
        },
      });

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

    const conversionCreationRequests = conversionCreationHandler.requests();
    expect(conversionCreationRequests).toHaveLength(1);
    expect(conversionCreationRequests[0].body).toEqual<
      ConversionOperations['conversions/create']['request']['body']
    >({
      inputFile: {
        name: 'example.docx',
        format: 'docx',
      },
      outputFile: {
        format: 'pdf',
      },
    });

    expect(conversionGetHandler.requests()).toHaveLength(1);
  });

  /**
   * Teste 3: Deve retornar uma resposta de erro quando a conversão de um
   * arquivo compartilhado resultou em um erro.
   */
  test('case 3', async () => {
    const pendingConversion: Conversion = {
      id: crypto.randomUUID(),
      state: 'PENDING',
      inputFile: {
        name: 'example.docx',
        format: 'docx',
      },
      outputFile: {
        name: 'example.pdf',
        format: 'pdf',
      },
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const conversionCreationHandler = conversionInterceptor
      .post('/conversions')
      .respond({
        status: 202,
        body: pendingConversion,
      });

    const conversionGetHandler = conversionInterceptor
      .get(`/conversions/${pendingConversion.id}`)
      .respond({
        status: 200,
        body: {
          ...pendingConversion,
          state: 'ERROR',
          completedAt: new Date().toISOString(),
        },
      });

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

    const conversionCreationRequests = conversionCreationHandler.requests();
    expect(conversionCreationRequests).toHaveLength(1);
    expect(conversionCreationRequests[0].body).toEqual<
      ConversionOperations['conversions/create']['request']['body']
    >({
      inputFile: {
        name: 'example.docx',
        format: 'docx',
      },
      outputFile: {
        format: 'pdf',
      },
    });

    expect(conversionGetHandler.requests()).toHaveLength(1);
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não foi possível
   * utilizar a API de conversão por um erro desconhecido.
   */
  test('case 4', async () => {
    const conversionCreationHandler = conversionInterceptor
      .post('/conversions')
      .respond({
        status: 500,
        body: { message: 'Internal server error' },
      });

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

    const conversionCreationRequests = conversionCreationHandler.requests();
    expect(conversionCreationRequests).toHaveLength(1);
    expect(conversionCreationRequests[0].body).toEqual<
      ConversionOperations['conversions/create']['request']['body']
    >({
      inputFile: {
        name: 'example.docx',
        format: 'docx',
      },
      outputFile: {
        format: 'pdf',
      },
    });
  });
});
