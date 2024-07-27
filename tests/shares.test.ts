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
    // Implemente aqui...
  });

  /**
   * Teste 2: Deve retornar uma resposta de sucesso quando um arquivo foi
   * compartilhado com conversão.
   */
  test('case 2', async () => {
    // Implemente aqui...
  });

  /**
   * Teste 3: Deve retornar uma resposta de erro quando a conversão de um
   * arquivo compartilhado resultou em um erro.
   */
  test('case 3', async () => {
    // Implemente aqui...
  });

  /**
   * Teste 4: Deve retornar uma resposta de erro quando não foi possível
   * utilizar a API de conversão por um erro desconhecido.
   */
  test('case 4', async () => {
    // Implemente aqui...
  });
});
