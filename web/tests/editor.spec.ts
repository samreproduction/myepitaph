import { test, expect, type Page } from '@playwright/test';
import { open } from '../../src/crypto.mjs';
import { fixtures } from '../src/fixtures';

type RequestBody = { message: string; branch: string; sha?: string; content?: string };
async function unlock(page: Page) {
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await page.getByRole('button', { name: '編輯', exact: true }).click();
}
async function saveToken(page: Page) {
  await page.getByLabel('貼上 GitHub 細粒度權杖', { exact: false }).fill('test-token-not-real');
  await page.getByRole('button', { name: '儲存權杖', exact: true }).click();
  await expect(page.getByText('權杖已載入', { exact: true })).toBeVisible();
}
async function setup(page: Page) {
  const requests: { url: string; method: string; body: RequestBody; authorization: string | undefined }[] = [];
  await page.route('https://api.github.com/**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { sha: 'mock-sha' } });
    requests.push({ url: request.url(), method: request.method(), body: request.postDataJSON(), authorization: request.headers().authorization });
    await route.fulfill({ status: 200, json: {} });
  });
  await page.goto('/');
  await unlock(page);
  return requests;
}

test('首次貼權杖，加密持久化，重整解鎖後不需重貼，移除後清除儲存', async ({ page }) => {
  await setup(page);
  await expect(page.getByLabel('貼上 GitHub 細粒度權杖', { exact: false })).toBeVisible();
  await saveToken(page);
  const raw = await page.evaluate(() => localStorage.getItem('blacktomb.token'));
  expect(raw).not.toContain('test-token-not-real');
  expect(await open(JSON.parse(raw!), 'test-password')).toBe('test-token-not-real');
  await page.reload();
  await unlock(page);
  await expect(page.getByText('權杖已載入', { exact: true })).toBeVisible();
  await expect(page.getByLabel('貼上 GitHub 細粒度權杖', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: '移除權杖', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('blacktomb.token'))).toBeNull();
});

test('修改物件只提交密文，完成後以新文字重新生長', async ({ page }) => {
  const requests = await setup(page);
  await saveToken(page);
  const row = page.getByTestId('edit-object').first();
  await row.locator('summary').click();
  const text = '修改後的測試文字\n只有瀏覽器能看見';
  await row.getByLabel('物件文字').fill(text);
  await row.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(row.getByRole('status')).toHaveText('已提交，約一分鐘後上線');
  const request = requests[0];
  expect(request.authorization).toBe('Bearer test-token-not-real');
  expect(request.method).toBe('PUT');
  expect(request.body.message).toBe('更新內容');
  expect(request.body.sha).toBe('mock-sha');
  expect(JSON.stringify(request.body)).not.toContain(text);
  expect(JSON.stringify(request.body)).not.toContain('test-token-not-real');
  const json = Buffer.from(request.body.content!, 'base64').toString('utf8');
  expect(json).toBe(JSON.stringify(JSON.parse(json), null, 2) + '\n');
  expect(await open(JSON.parse(json), 'test-password')).toBe(text);
  console.log('模擬 PUT request body：\n' + JSON.stringify(request.body, null, 2));
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
  await page.getByTestId('memory-object').first().click();
  await expect(page.locator('.memory-text')).toHaveText(text);
});

test('新增中文 slug，自動避開同名，新增為加密內容', async ({ page }) => {
  const requests = await setup(page);
  await saveToken(page);
  const section = page.getByRole('region', { name: '新增物件', exact: true });
  const today = await section.getByLabel('日期').inputValue();
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await section.getByLabel('短名').fill(' /新的想法\\ ');
  for (let index = 0; index < 2; index++) {
    await section.getByLabel('新增文字').fill('新增的假文字');
    await section.getByRole('button', { name: '儲存', exact: true }).click();
    await expect(section.getByRole('status')).toHaveText('已提交，約一分鐘後上線');
    expect(requests[index].url).toContain(`/objects/${today}-${encodeURIComponent('新的想法')}${index ? '-2' : ''}.md.enc.json`);
    expect(await open(JSON.parse(Buffer.from(requests[index].body.content!, 'base64').toString('utf8')), 'test-password')).toBe('新增的假文字');
  }
});

test('刪除必須確認，取消不發送，確認帶 sha 刪除；墓誌銘 PUT 正確路徑', async ({ page }) => {
  const requests = await setup(page);
  await saveToken(page);
  const row = page.getByTestId('edit-object').first();
  await row.locator('summary').click();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('確定刪除？內容仍保留在 Git 歷史');
    await dialog.dismiss();
  });
  await row.getByRole('button', { name: '刪除', exact: true }).click();
  expect(requests).toHaveLength(0);
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: '刪除', exact: true }).click();
  await expect(page.getByTestId('edit-object')).toHaveCount(7);
  expect(requests[0].method).toBe('DELETE');
  expect(requests[0].body).toEqual({ message: '更新內容', branch: 'main', sha: 'mock-sha' });
  expect(requests[0].url).toContain(`${fixtures[0].date}-${fixtures[0].slug}.md.enc.json`);
  const section = page.getByRole('region', { name: '編輯墓誌銘', exact: true });
  await section.getByLabel('墓誌銘', { exact: true }).fill('新的墓誌銘');
  await section.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(section.getByRole('status')).toHaveText('已提交，約一分鐘後上線');
  expect(requests[1].url).toMatch(/\/contents\/epitaph\.md\.enc\.json$/);
  expect(await open(JSON.parse(Buffer.from(requests[1].body.content!, 'base64').toString('utf8')), 'test-password')).toBe('新的墓誌銘');
});

test('401 顯示狀態碼而不暴露權杖，提交中停用儲存', async ({ page }) => {
  await setup(page);
  await saveToken(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('https://api.github.com/**', async (route) => {
    await pending;
    await route.fulfill({ status: 401, json: { message: 'test-token-not-real' } });
  });
  const section = page.getByRole('region', { name: '編輯墓誌銘', exact: true });
  await section.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(section.getByRole('button', { name: '提交中…', exact: true })).toBeDisabled();
  release();
  await expect(section.getByRole('status')).toContainText('401');
  await expect(page.locator('body')).not.toContainText('test-token-not-real');
});

test('390×844 編輯器無橫向捲動、文字框滿寬、按鈕至少 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await saveToken(page);
  await page.getByTestId('edit-object').first().locator('summary').click();
  expect(await page.locator('.editor').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await page.locator('.editor button:visible').all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  for (const area of await page.locator('.editor textarea:visible').all()) {
    expect(await area.evaluate((element) => Math.abs(element.getBoundingClientRect().width - element.parentElement!.clientWidth))).toBeLessThanOrEqual(1);
  }
});

test('844×390 密碼表單位於地平線之外，勾選框可點可聚焦', async ({ page }) => {
  await page.route('https://api.github.com/**', (route) => route.abort());
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  const form = (await page.locator('.gate form').boundingBox())!;
  const horizon = (await page.locator('.horizon').boundingBox())!;
  expect(form.y + form.height <= horizon.y - 24 || form.y >= horizon.y + 24).toBe(true);
  const checkbox = page.getByLabel('記住此裝置 30 天');
  await expect(checkbox).toHaveCSS('appearance', 'none');
  await page.locator('.remember').click();
  await expect(checkbox).toBeChecked();
  await checkbox.focus();
  await expect(checkbox).toBeFocused();
});
