import { test, expect, type Page } from '@playwright/test';
import { epitaph, fixtures } from '../src/fixtures';

async function unlock(page: Page, remember = false) {
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  if (remember) await page.getByLabel('記住此裝置 30 天').check();
  await page.getByLabel('密碼', { exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: '上鎖', exact: true })).toBeVisible();
}

test('錯密碼顯示錯誤、清空與聚焦，沒有物件；正確密碼解出八件與面板', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('密碼', { exact: true });
  await expect(page.getByLabel('記住此裝置 30 天')).not.toBeChecked();
  await input.fill('incorrect');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('密碼不正確');
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.getByTestId('memory-object')).toHaveCount(0);
  await unlock(page);
  await expect(page.getByTestId('memory-object')).toHaveCount(8);
  await expect(page.locator('.epitaph')).toContainText(epitaph.split('\n')[0]);
  await page.getByTestId('memory-object').first().click();
  await expect(page.locator('.memory-text')).toHaveText(fixtures[0].text);
});

test('記住三十天，重整直接解鎖；上鎖刪記錄，重整仍在密碼閘', async ({ page }) => {
  await page.goto('/');
  const before = Date.now();
  await unlock(page, true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('blacktomb.unlock')!));
  expect(saved.expiresAt).toBeGreaterThanOrEqual(before + 30 * 24 * 60 * 60 * 1000);
  expect(saved.expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await page.reload();
  await expect(page.getByRole('button', { name: '上鎖', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '上鎖', exact: true }).click();
  await expect(page.getByLabel('密碼', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('blacktomb.unlock'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('button', { name: '進入', exact: true })).toBeVisible();
  await expect(page.getByTestId('memory-object')).toHaveCount(0);
});

test('不勾記住，重整回到密碼閘', async ({ page }) => {
  await page.goto('/');
  await unlock(page);
  expect(await page.evaluate(() => localStorage.getItem('blacktomb.unlock'))).toBeNull();
  await page.reload();
  await expect(page.getByLabel('密碼', { exact: true })).toBeVisible();
  await expect(page.getByTestId('memory-object')).toHaveCount(0);
});

for (const mode of ['expired', 'incorrect', 'malformed']) {
  test(`已記住記錄 ${mode} 時清除並回到密碼閘`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((mode) => localStorage.setItem('blacktomb.unlock', mode === 'malformed' ? '{' : JSON.stringify({
      password: mode === 'incorrect' ? 'incorrect' : 'test-password',
      expiresAt: mode === 'expired' ? Date.now() - 1 : Date.now() + 100000,
    })), mode);
    await page.reload();
    await expect(page.getByRole('button', { name: '進入', exact: true })).toBeEnabled();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('blacktomb.unlock'))).toBeNull();
    await expect(page.getByTestId('memory-object')).toHaveCount(0);
    await expect(page.locator('.epitaph')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '編輯', exact: true })).toHaveCount(0);
    if (mode === 'incorrect') await expect(page.getByRole('alert')).toHaveText('密碼不正確');
  });
}

for (const objects of [[], ['bad.json']]) {
  test(`空內容送出任意密碼仍在密碼閘且不儲存（${objects.length ? '不合格物件' : '空索引'}）`, async ({ page }) => {
    await page.route('**/content/index.json', (route) => route.fulfill({ json: { epitaph: null, objects } }));
    await page.goto('/');
    await page.getByLabel('密碼', { exact: true }).fill('arbitrary');
    await page.getByLabel('記住此裝置 30 天').check();
    await page.getByRole('button', { name: '進入', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('目前還沒有內容');
    await expect(page.locator('.gate form')).toBeVisible();
    await expect(page.getByRole('button', { name: '上鎖', exact: true })).toHaveCount(0);
    await expect(page.getByTestId('memory-object')).toHaveCount(0);
    await expect(page.locator('.epitaph')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('blacktomb.unlock'))).toBeNull();
    const formBottom = await page.locator('.gate form').evaluate((element) => element.getBoundingClientRect().bottom);
    const horizonTop = await page.locator('.horizon').evaluate((element) => element.getBoundingClientRect().top);
    expect(formBottom).toBeLessThanOrEqual(horizonTop - 24);
  });
}

for (const kind of ['epitaph', 'object']) {
  test(`只有一個${kind}仍以解密驗證密碼`, async ({ page }) => {
    await page.route('**/content/index.json', (route) => route.fulfill({ json: {
      epitaph: kind === 'epitaph' ? 'epitaph.md.enc.json' : null,
      objects: kind === 'object' ? [`${fixtures[0].date}-${fixtures[0].slug}.md.enc.json`] : [],
    } }));
    await page.goto('/');
    await page.getByLabel('密碼', { exact: true }).fill('incorrect');
    await page.getByRole('button', { name: '進入', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('密碼不正確');
    await unlock(page);
    await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
    await expect(page.getByTestId('memory-object')).toHaveCount(kind === 'object' ? 1 : 0);
    await expect(page.locator('.epitaph')).toHaveCount(kind === 'epitaph' ? 1 : 0);
  });
}

test('localStorage 不可用仍可解鎖與上鎖', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Object.defineProperty(Storage.prototype, method, { value: () => { throw new Error('Storage unavailable'); } });
    }
  });
  await page.goto('/');
  await unlock(page, true);
  await page.getByRole('button', { name: '上鎖', exact: true }).click();
  await expect(page.getByLabel('密碼', { exact: true })).toBeVisible();
});
