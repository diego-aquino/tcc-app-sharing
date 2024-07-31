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

describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  // Exemplo (para habilitar, remova o `.skip`)
  test.skip('example', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
  });

  test('case 1', async () => {
    // Implemente aqui...
  });

  test('case 2', async () => {
    // Implemente aqui...
  });

  test('case 3', async () => {
    // Implemente aqui...
  });

  test('case 4', async () => {
    // Implemente aqui...
  });
});
