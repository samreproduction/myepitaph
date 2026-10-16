import { test, expect } from '@playwright/test';
import { epitaphFirst, firstVersions } from './history-fixtures';

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
