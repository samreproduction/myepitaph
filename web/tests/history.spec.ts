import { test, expect } from '@playwright/test';
import { epitaphFirst, firstVersions } from './history-fixtures';
import { seal } from '../../src/crypto.mjs';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/**', (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
});

test('第一件歷史三版，最新標目前，按需解開最舊版本', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/history/')) requests.push(request.url()); });
  await page.getByTestId('memory-object').first().click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: '歷史', exact: true }).click();
  const versions = panel.getByRole('region', { name: '歷史版本', exact: true });
  await expect(versions.getByRole('listitem')).toHaveCount(3);
  await expect(versions.getByRole('button').first()).toContainText('目前');
  await expect(versions.getByText('目前', { exact: true })).toHaveCount(1);
  await expect(versions.locator('time').first()).toHaveText(/^2026-10-03 \d{2}:\d{2}$/);
  expect(requests).toHaveLength(0);
  await versions.getByRole('button').last().click();
  await expect(panel.locator('.history-text')).toHaveText(firstVersions[0]);
  expect(requests).toHaveLength(1);
  await versions.getByRole('button').nth(1).click();
  await expect(panel.locator('.history-text')).toHaveText(firstVersions[1]);
  await versions.getByRole('button').first().click();
  await expect(panel.locator('.history-text')).toHaveText(firstVersions[2]);
});

test('墓誌銘使用同一面板列出兩版並解開舊版', async ({ page }) => {
  await page.locator('.epitaph').getByRole('button', { name: '歷史', exact: true }).click();
  const panel = page.getByRole('dialog');
  await expect(panel.getByRole('heading', { name: '墓誌銘' })).toBeVisible();
  const buttons = panel.getByRole('region', { name: '歷史版本', exact: true }).getByRole('button');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toContainText('目前');
  await buttons.last().click();
  await expect(panel.locator('.history-text')).toHaveText(epitaphFirst);
});

test('空缺按日期排列，不是按鈕、不播放、不開面板，仍有八件物件', async ({ page }) => {
  const gap = page.getByTestId('memory-gap');
  await expect(gap).toHaveCount(1);
  await expect(gap).toHaveAttribute('aria-label', '已刪除的物件，2026-09-10');
  await expect(gap.locator('.object-date')).toHaveText('2026-09-10');
  expect(await gap.evaluate((element) => element.previousElementSibling?.textContent)).toBe('2026-08-30');
  await expect(gap.locator('button, svg, video')).toHaveCount(0);
  await expect(gap.locator('.object-art')).toHaveCSS('border-top-style', 'dashed');
  await gap.hover();
  await gap.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('memory-object')).toHaveCount(8);
  await expect(page.locator('.memories').getByRole('button')).toHaveCount(8);
});

test('歷史密文解不開時顯示指定錯誤，沒有歷史時顯示空狀態', async ({ page }) => {
  await page.route('**/content/history/*.enc.json', (route) => route.fulfill({ json: {} }));
  await page.getByTestId('memory-object').first().click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: '歷史', exact: true }).click();
  await panel.getByRole('region', { name: '歷史版本', exact: true }).getByRole('button').last().click();
  await expect(panel.getByRole('status')).toHaveText('此版本無法用目前密碼解開');
  await expect(panel.getByLabel('舊密碼', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: '解開', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.route('**/content/index.json', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ json: { ...await response.json(), history: {} } });
  });
  await page.reload();
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await page.getByTestId('memory-object').first().click();
  await panel.getByRole('button', { name: '歷史', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('沒有歷史紀錄');
});

test('歷史單版用舊密碼解開，錯誤可重試，切換及關閉不保留舊密碼', async ({ page }) => {
  const oldText = '換密碼前的假歷史文字';
  const envelope = await seal(oldText, 'new-test-password');
  await page.route('**/content/history/*.enc.json', (route) => route.fulfill({ json: envelope }));
  const storedBefore = await page.evaluate(() => ({ ...localStorage }));
  await page.getByTestId('memory-object').first().click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: '歷史', exact: true }).click();
  const versions = panel.getByRole('region', { name: '歷史版本', exact: true });
  const oldest = versions.locator('ol button').last();
  await oldest.click();
  const input = panel.getByLabel('舊密碼', { exact: true });
  await expect(input).toBeVisible();
  await input.fill('test-password');
  await panel.getByRole('button', { name: '解開', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('舊密碼不正確');
  await expect(input).toHaveValue('');
  await input.fill('new-test-password');
  await panel.getByRole('button', { name: '解開', exact: true }).click();
  await expect(panel.locator('.history-text')).toHaveText(oldText);
  await expect(input).toHaveCount(0);
  await versions.locator('ol button').first().click();
  await expect(input).toHaveValue('');
  await expect(panel.locator('.history-text')).toHaveCount(0);
  await input.fill('new-test-password');
  await panel.getByRole('button', { name: '關閉文字面板' }).click();
  await page.getByTestId('memory-object').first().click();
  await panel.getByRole('button', { name: '歷史', exact: true }).click();
  await panel.getByRole('region', { name: '歷史版本', exact: true }).locator('ol button').last().click();
  await expect(input).toHaveValue('');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(storedBefore);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});
