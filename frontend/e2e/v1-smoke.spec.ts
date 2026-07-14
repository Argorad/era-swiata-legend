import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:5187";
const adminLogin = process.env.E2E_ADMIN_LOGIN ?? "integration-admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Integration!12345";
const playerLogin = process.env.E2E_PLAYER_LOGIN ?? "integration-player";
const playerPassword = process.env.E2E_PLAYER_PASSWORD ?? "Integration!Player12345";
let worldId = "";
let folderId = "";
const failures: string[] = [];

function watchFailures(page: Page) {
  failures.length = 0;
  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
}

async function loginThroughUi(page: Page, login: string, password: string) {
  await page.goto("/");
  await expect(page.getByTestId("auth-screen")).toBeVisible();
  await page.getByTestId("auth-login").fill(login);
  await page.getByTestId("auth-password").fill(password);
  await page.getByRole("button", { name: "Zaloguj" }).click();
}

async function loginThroughApi(request: APIRequestContext, login: string, password: string) {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: { login, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

test.beforeAll(async ({ request }) => {
  await loginThroughApi(request, adminLogin, adminPassword);

  const suffix = Date.now().toString(36);
  const worldResponse = await request.post(`${apiBaseUrl}/worlds`, {
    data: { name: `E2E ${suffix}`, description: "Automatyczny test Playwright" },
  });
  expect(worldResponse.ok(), await worldResponse.text()).toBeTruthy();
  worldId = (await worldResponse.json()).id;

  const folderResponse = await request.post(`${apiBaseUrl}/worlds/${worldId}/folders`, {
    data: { name: `Folder E2E ${suffix}`, parentFolderId: null },
  });
  expect(folderResponse.ok(), await folderResponse.text()).toBeTruthy();
  folderId = (await folderResponse.json()).id;

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const imageResponse = await request.post(
    `${apiBaseUrl}/worlds/${worldId}/folders/${folderId}/files/map-image`,
    {
      multipart: {
        file: {
          name: `mapa-${suffix}.png`,
          mimeType: "image/png",
          buffer: png,
        },
      },
    },
  );
  expect(imageResponse.ok(), await imageResponse.text()).toBeTruthy();
  const imageFileId = (await imageResponse.json()).id;

  const mapResponse = await request.post(`${apiBaseUrl}/worlds/${worldId}/maps`, {
    data: {
      name: `Mapa E2E ${suffix}`,
      description: "Mapa do testów interakcji",
      type: 0,
      imageFileId,
      isPublished: true,
    },
  });
  expect(mapResponse.ok(), await mapResponse.text()).toBeTruthy();

  const playerResponse = await request.post(`${apiBaseUrl}/users`, {
    data: {
      displayName: "Player Playwright",
      email: "playwright-player@example.invalid",
      password: playerPassword,
      role: 2,
      isActive: true,
      mustChangePassword: false,
    },
  });
  expect(playerResponse.ok(), await playerResponse.text()).toBeTruthy();

  const foldersResponse = await request.get(`${apiBaseUrl}/worlds/${worldId}/folders`, {
    params: { playerView: false },
  });
  expect(
    foldersResponse.ok(),
    `GET folders failed with HTTP ${foldersResponse.status()}: ${await foldersResponse.text()}`,
  ).toBeTruthy();
  const folders = await foldersResponse.json();
  expect(Array.isArray(folders)).toBeTruthy();
  expect(folders.some((folder: { id: string }) => folder.id === folderId)).toBeTruthy();
});

test.afterEach(async ({ page }) => {
  expect(failures, failures.join("\n")).toEqual([]);
  await page.close().catch(() => undefined);
});

test("ekran logowania i poprawne logowanie administratora", async ({ page }) => {
  watchFailures(page);
  await page.goto("/");
  await expect(page.getByTestId("auth-screen")).toBeVisible();

  await page.getByTestId("auth-login").fill(adminLogin);
  await page.getByTestId("auth-password").fill(adminPassword);
  await page.getByRole("button", { name: "Zaloguj" }).click();

  await expect(page.getByTestId("auth-user")).toContainText("Administrator");
  await expect(page.getByTestId(`world-${worldId}`)).toBeVisible();
});

test("ładuje świat i folder", async ({ page }) => {
  watchFailures(page);
  await loginThroughUi(page, adminLogin, adminPassword);
  await expect(page.getByTestId(`world-${worldId}`)).toBeVisible();
  await page.getByTestId(`world-${worldId}`).click();
  await expect(page.getByTestId("active-world")).toContainText("E2E");
  await expect(page.getByTestId(`folder-${folderId}`)).toBeVisible();
  await page.getByTestId(`folder-${folderId}`).click();
});

test("otwiera mapę i rzeczywisty albo awaryjny pełny ekran", async ({ page }) => {
  watchFailures(page);
  await loginThroughUi(page, adminLogin, adminPassword);
  await page.getByTestId(`world-${worldId}`).click();
  await page.getByTestId("module-map").click();
  await expect(page.getByTestId("map-module")).toBeVisible();
  await page.getByTestId("map-fullscreen").click();
  await expect.poll(async () =>
    page.evaluate(() =>
      Boolean(document.fullscreenElement) ||
      document.querySelector('[data-testid="map-module"]')?.classList.contains("is-workspace-fullscreen"),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
});

test("rysuje linię i tekst we współrzędnych mapy bez ghost rectangle", async ({ page }) => {
  watchFailures(page);
  await loginThroughUi(page, adminLogin, adminPassword);
  await page.getByTestId(`world-${worldId}`).click();
  await page.getByTestId("module-map").click();
  await page.getByTestId("map-edit-mode").locator("input").check();
  await page.getByTestId("map-tool-line").click();

  const input = page.getByTestId("map-drawing-input");
  const box = await input.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.45, box!.y + box!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.65, box!.y + box!.height * 0.6, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("map-annotation")).toHaveCount(1);

  await page.getByTestId("map-tool-text").click();
  await page.getByTestId("map-drawing-input").click({ position: { x: box!.width * 0.55, y: box!.height * 0.35 } });
  await page.getByTestId("map-text-content").fill("Tekst E2E");
  await page.getByTestId("map-text-dialog").getByRole("button", { name: "Dodaj tekst" }).click();
  await expect(page.getByTestId("map-annotation")).toHaveCount(2);

  await page.getByTestId("map-tool-pan").click();
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.6, box!.y + box!.height * 0.55, { steps: 5 });
  await page.mouse.up();
  await page.getByTestId("map-zoom-in").click();
  await page.getByTestId("map-zoom-out").click();
  await page.getByTestId("map-fit-view").click();
  await expect(page.getByTestId("annotation-transformer")).toHaveCount(0);
});

test("gracz nie ma akcji MG", async ({ page }) => {
  watchFailures(page);
  await loginThroughUi(page, playerLogin, playerPassword);
  await expect(page.getByTestId("auth-user")).toContainText("Gracz");
  await page.getByTestId(`world-${worldId}`).click();
  await page.getByTestId("module-map").click();

  await expect(page.getByTestId("map-edit-mode")).toHaveCount(0);
  await expect(page.getByTestId("admin-users-panel")).toHaveCount(0);
  await expect(page.getByTestId("folder-create-button")).toHaveCount(0);
  await expect(page.getByTestId("world-create-button")).toHaveCount(0);
  await expect(page.getByTestId(`folder-${folderId}`)).toBeVisible();
  await expect(page.getByTestId("map-fullscreen")).toBeVisible();

  await page.getByTestId("map-fullscreen").click();
  await expect(
    page.getByTestId("map-edit-mode"),
  ).toHaveCount(0);
});
