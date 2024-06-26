import { Client } from '@litehex/node-vault';
import { expect } from 'chai';
import { execSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { resolve } from 'node:path';

const dcp = resolve('./tests/fixtures/docker-compose.yml');

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createInstance(unsealed: boolean = true): Promise<{
  vc: Client;
  keys: string[];
  root_token: string;
}> {
  launchVault();
  await sleep(2000);

  const vc = new Client();

  const resp = await vc.init({
    secret_shares: 1,
    secret_threshold: 1
  });
  expect(resp).not.have.property('errors');

  const { keys, root_token } = resp as any;

  await sleep(2000);

  if (unsealed) {
    await vc.unseal({
      key: keys[0]
    });
    await sleep(2000);
  }

  return { vc, keys, root_token };
}

export function launchVault(): void {
  accessSync(dcp);

  execSync(`docker compose -f ${dcp} up -d --force-recreate`, {
    stdio: 'ignore'
  });
}

export function destroyInstance(): void {
  execSync('docker compose -f ${dcp} down', {
    stdio: 'ignore'
  });
}

export function prettyJson(data: object): string {
  return JSON.stringify(data, null, 2);
}
