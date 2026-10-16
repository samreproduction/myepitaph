import { test, expect, type Locator } from '@playwright/test';
import { fixtures } from '../src/fixtures';
import { shapeFor, shapeKinds } from '../src/shape';
import { writeFile } from 'node:fs/promises';

async function movingPart(object: Locator) {
  return object.locator(await object.getAttribute('data-kind') === 'mountain' ? '[data-part="moon"]' : 'svg g');
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}×${viewport.height} 墓園完整互動`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveTitle('黑墓');
    const formBottom = await page.locator('.gate form').evaluate((element) => element.getBoundingClientRect().bottom);
    const gateHorizonTop = await page.locator('.horizon').evaluate((element) => element.getBoundingClientRect().top);
    expect(formBottom).toBeLessThanOrEqual(gateHorizonTop - 24);
    await page.getByLabel('密碼', { exact: true }).focus();
    await expect(page.getByLabel('密碼', { exact: true })).toHaveCSS('outline', 'rgb(222, 222, 217) solid 1px');
    await expect(page.getByLabel('記住此裝置 30 天')).toHaveCSS('accent-color', 'rgb(170, 170, 170)');
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await noOverflow();
    const objects = page.getByTestId('memory-object');
    await expect(objects).toHaveCount(0);
    await expect(page.getByRole('heading')).toHaveCount(0);
    await page.getByLabel('密碼', { exact: true }).fill('test-password');
    await page.getByRole('button', { name: '進入', exact: true }).click();
    await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
    await expect(objects).toHaveCount(fixtures.length);
    await expect(page.getByRole('region', { name: '依日期排列的物件', exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('測試物件文字');
    await expect(page.locator('body')).not.toContainText('只是測試');
    const horizonTop = await page.locator('.horizon').evaluate((element) => element.getBoundingClientRect().top);
    const groundTop = await page.locator('.ground').evaluate((element) => element.getBoundingClientRect().top);
    expect(Math.abs(horizonTop - groundTop)).toBeLessThanOrEqual(1);
    await noOverflow();
    await page.screenshot({ path: testInfo.outputPath(`cemetery-${viewport.width}.png`), fullPage: true });
    for (let index = 0; index < fixtures.length; index++) {
      await objects.nth(index).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('.memory-text')).toHaveText(fixtures[index].text);
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(fixtures[index].date);
      await expect(page.locator('body')).not.toContainText('測試物件文字');
      await expect(page.locator('body')).not.toContainText('只是測試');
      if (index === 0) {
        await page.getByRole('button', { name: '歷史', exact: true }).click();
        await expect(page.getByText('尚未接入', { exact: true })).toBeVisible();
        await noOverflow();
        await page.screenshot({ path: testInfo.outputPath(`panel-${viewport.width}.png`), fullPage: true });
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
    await objects.first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: '關閉文字面板' }).click();
    await expect(objects.first()).toBeFocused();
  });
}

test('不同日期同 slug 只隱去選中的物件', async ({ page }) => {
  const original = `${fixtures[0].date}-${fixtures[0].slug}.md.enc.json`;
  const other = `2026-10-16-${fixtures[0].slug}.md.enc.json`;
  await page.route('**/content/index.json', (route) => route.fulfill({ json: { epitaph: null, objects: [original, other] } }));
  await page.route(`**/content/${other}`, async (route) => {
    const response = await route.fetch({ url: new URL(`./${original}`, route.request().url()).href });
    await route.fulfill({ response });
  });
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
  const objects = page.getByTestId('memory-object');
  await objects.nth(1).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('2026-10-16');
  await expect(objects.first()).not.toHaveClass(/dissolved/);
  await expect(objects.nth(1)).toHaveClass(/dissolved/);
});

test('桌面懸停播放循環，移開回到靜止', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
  const object = page.getByTestId('memory-object').first();
  const lines = await movingPart(object);
  const initial = await lines.getAttribute('transform');
  await object.hover();
  await page.waitForTimeout(600);
  expect(await lines.getAttribute('transform')).not.toBe(initial);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await expect(lines).toHaveAttribute('transform', initial!);
});

test('觸控長按播放但不開面板，之後短按另一件物件開面板', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('密碼', { exact: true }).fill('test-password');
    await page.getByRole('button', { name: '進入', exact: true }).tap();
    await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
    const objects = page.getByTestId('memory-object');
    const object = objects.first();
    await object.scrollIntoViewIfNeeded();
    const lines = await movingPart(object);
    const initial = await lines.getAttribute('transform');
    const bounds = await object.boundingBox();
    expect(bounds).not.toBeNull();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 }],
    });
    await page.waitForTimeout(1200);
    expect(await lines.getAttribute('transform')).not.toBe(initial);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    await expect(lines).toHaveAttribute('transform', initial!);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await objects.nth(1).tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.memory-text')).toHaveText(fixtures[1].text);
  } finally {
    await context.close();
  }
});

test('減少動態時懸停不播放循環', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
  const object = page.getByTestId('memory-object').first();
  const lines = await movingPart(object);
  const initial = await lines.getAttribute('transform');
  await object.hover();
  await page.waitForTimeout(600);
  await expect(lines).toHaveAttribute('transform', initial!);
  await expect(object.locator('.draw-line').first()).toHaveCSS('animation-name', 'none');
  await expect(object.locator('.draw-line').first()).toHaveCSS('stroke-dashoffset', '0px');
});

test('出現時由底部部件往上描線，懸停不重播生長', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  const object = page.getByTestId('memory-object').first();
  const lines = object.locator('.draw-line');
  await expect(lines.first()).toHaveCSS('animation-name', 'draw-line');
  const delays = await lines.evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).animationDelay)));
  expect(delays[0]).toBe(0);
  expect(delays.at(-1)).toBeCloseTo(.35);
  expect(delays).toEqual([...delays].sort((a, b) => a - b));
  await page.waitForTimeout(1000);
  await expect(lines.last()).toHaveCSS('stroke-dashoffset', '0px');
  await object.hover();
  await expect(lines.last()).toHaveCSS('stroke-dashoffset', '0px');
});

test('六種簡筆畫同頁展示（展示頁與截圖僅存 test-results）', async ({ page }, testInfo) => {
  const drawings = shapeKinds.map((kind) => {
    const shape = shapeFor('展示用假文字。\n第二段，讓結構完整！', { kind });
    return `<figure><svg viewBox="0 0 100 100" role="img" aria-label="${kind}"><g fill="none" stroke="currentColor" stroke-width="${shape.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${shape.rotation} 50 88)">${shape.paths.map((d) => `<path d="${d}"/>`).join('')}${shape.fills.map((dot) => `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="currentColor" stroke="none"/>`).join('')}</g></svg><figcaption>${kind}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>六種簡筆畫</title><style>body{margin:0;background:#080909;color:#b5b9b2;font:18px serif}main{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;padding:50px 24px}figure{margin:0;text-align:center}svg{display:block;width:100%}figcaption{padding-top:16px}</style><main>${drawings}</main></html>`;
  await writeFile(testInfo.outputPath('six-kinds.html'), html, 'utf8');
  await page.setViewportSize({ width: 1440, height: 400 });
  await page.setContent(html);
  await expect(page.getByRole('img')).toHaveCount(6);
  await page.screenshot({ path: testInfo.outputPath('six-kinds.png'), fullPage: true });
});
