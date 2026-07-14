import { defineConfig, devices } from "@playwright/test";

const e2eApiBaseUrl = "http://127.0.0.1:5187";
const e2eFrontendBaseUrl = "http://127.0.0.1:5174";
const e2eAdminLogin = "integration-admin";
const e2eAdminPassword = "Integration!12345";
const e2eAdminDisplayName = "Administrator Integration";
const e2eAdminEmail = "integration-admin@example.invalid";
const e2ePlayerLogin = "integration-player";
const e2ePlayerPassword = "Integration!Player12345";
const e2ePlayerDisplayName = "Player Integration";
const e2ePlayerEmail = "integration-player@example.invalid";

function requireSafeTestDatabase(): string {
  const connectionString = process.env.TEST_DATABASE_CONNECTION_STRING;
  if (!connectionString) throw new Error("ODMOWA: ustaw TEST_DATABASE_CONNECTION_STRING dla osobnej bazy *_test.");
  const database = connectionString.split(";").map((item) => item.split("=", 2)).find(([key]) => /^(database|initial catalog)$/i.test(key.trim()))?.[1]?.trim();
  if (!database || database.toLowerCase() === "eraswiatalegend" || !database.toLowerCase().endsWith("_test")) {
    throw new Error(`ODMOWA: baza '${database ?? "brak"}' nie jest bezpieczną bazą testową zakończoną na _test.`);
  }
  return connectionString;
}

const testConnectionString = requireSafeTestDatabase();
process.env.E2E_API_BASE_URL = e2eApiBaseUrl;
process.env.E2E_ADMIN_LOGIN = e2eAdminLogin;
process.env.E2E_ADMIN_PASSWORD = e2eAdminPassword;
process.env.E2E_ADMIN_DISPLAY_NAME = e2eAdminDisplayName;
process.env.E2E_ADMIN_EMAIL = e2eAdminEmail;
process.env.E2E_PLAYER_LOGIN = e2ePlayerLogin;
process.env.E2E_PLAYER_PASSWORD = e2ePlayerPassword;
process.env.E2E_PLAYER_DISPLAY_NAME = e2ePlayerDisplayName;
process.env.E2E_PLAYER_EMAIL = e2ePlayerEmail;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: e2eFrontendBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bash ../backend/run-e2e-api.sh",
      url: `${e2eApiBaseUrl}/auth/status`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: "Testing",
        Authentication__Enabled: "true",
        BootstrapAdmin__Login: e2eAdminLogin,
        BootstrapAdmin__Password: e2eAdminPassword,
        BootstrapAdmin__DisplayName: e2eAdminDisplayName,
        BootstrapAdmin__Email: e2eAdminEmail,
        BootstrapAdmin__MustChangePassword: "false",
        Frontend__Origins: "http://127.0.0.1:5174;http://localhost:5174",
        TEST_DATABASE_CONNECTION_STRING: testConnectionString,
        TEST_API_PORT: "5187",
        TEST_ADMIN_LOGIN: e2eAdminLogin,
        TEST_ADMIN_PASSWORD: e2eAdminPassword,
        TEST_ADMIN_DISPLAY_NAME: e2eAdminDisplayName,
        TEST_ADMIN_EMAIL: e2eAdminEmail,
        TEST_PLAYER_LOGIN: e2ePlayerLogin,
        TEST_PLAYER_PASSWORD: e2ePlayerPassword,
        TEST_PLAYER_DISPLAY_NAME: e2ePlayerDisplayName,
        TEST_PLAYER_EMAIL: e2ePlayerEmail,
      },
    },
    {
      command: "bash ./run-e2e-frontend.sh",
      url: e2eFrontendBaseUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: e2eApiBaseUrl,
        TEST_API_BASE_URL: e2eApiBaseUrl,
        TEST_FRONTEND_PORT: "5174",
      },
    },
  ],
});
