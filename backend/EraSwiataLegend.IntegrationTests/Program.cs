using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

var connectionString = Environment.GetEnvironmentVariable("TEST_DATABASE_CONNECTION_STRING")
    ?? throw new InvalidOperationException("Brak TEST_DATABASE_CONNECTION_STRING. Testy integracyjne nie zostały uruchomione.");
var database = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries)
    .Select(part => part.Split('=', 2, StringSplitOptions.TrimEntries))
    .Where(parts => parts.Length == 2 &&
        (parts[0].Equals("Database", StringComparison.OrdinalIgnoreCase) ||
         parts[0].Equals("Initial Catalog", StringComparison.OrdinalIgnoreCase)))
    .Select(parts => parts[1])
    .LastOrDefault();
if (string.Equals(database, "eraswiatalegend", StringComparison.OrdinalIgnoreCase) ||
    string.IsNullOrWhiteSpace(database) || !database.EndsWith("_test", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException($"ODMOWA: baza '{database}' nie jest bezpieczną bazą testową zakończoną na _test.");
}

var apiUri = new Uri(Environment.GetEnvironmentVariable("TEST_API_BASE_URL") ?? "http://127.0.0.1:5187");
if (!apiUri.IsLoopback)
{
    throw new InvalidOperationException("ODMOWA: testy integracyjne mogą łączyć się wyłącznie z API na loopback.");
}

var bootstrapLogin = Environment.GetEnvironmentVariable("TEST_ADMIN_LOGIN") ?? "integration-admin";
var bootstrapPassword = Environment.GetEnvironmentVariable("TEST_ADMIN_PASSWORD") ?? "Integration!12345";
var bootstrapDisplayName = Environment.GetEnvironmentVariable("TEST_ADMIN_DISPLAY_NAME") ?? "Administrator Integration";
var bootstrapEmail = Environment.GetEnvironmentVariable("TEST_ADMIN_EMAIL") ?? "integration-admin@example.invalid";
var playerLogin = Environment.GetEnvironmentVariable("TEST_PLAYER_LOGIN") ?? "integration-player";
var playerPassword = Environment.GetEnvironmentVariable("TEST_PLAYER_PASSWORD") ?? "Integration!Player12345";
var playerDisplayName = Environment.GetEnvironmentVariable("TEST_PLAYER_DISPLAY_NAME") ?? "Player Integration";
var playerEmail = Environment.GetEnvironmentVariable("TEST_PLAYER_EMAIL") ?? "integration-player@example.invalid";

using var adminHandler = new HttpClientHandler
{
    CookieContainer = new CookieContainer(),
    AllowAutoRedirect = false
};
using var adminClient = new HttpClient(adminHandler)
{
    BaseAddress = apiUri,
    Timeout = TimeSpan.FromSeconds(30)
};

using var anonymousClient = new HttpClient(new HttpClientHandler
{
    AllowAutoRedirect = false
})
{
    BaseAddress = apiUri,
    Timeout = TimeSpan.FromSeconds(30)
};

await ExpectStatus(
    await anonymousClient.GetAsync("/users"),
    HttpStatusCode.Unauthorized,
    "Nieautoryzowany dostęp do /users");

await ExpectStatus(
    await adminClient.PostAsJsonAsync("/auth/login", new { login = bootstrapLogin, password = "na pewno złe hasło" }),
    HttpStatusCode.Unauthorized,
    "Błędny login nie powinien zostać zaakceptowany");

await LoginAsync(adminClient, bootstrapLogin, bootstrapPassword);

var adminSession = await ReadJson(await adminClient.GetAsync("/auth/me"));
Assert(adminSession.TryGetProperty("user", out var adminUser) &&
    adminUser.ValueKind == JsonValueKind.Object &&
    adminUser.GetProperty("displayName").GetString() == bootstrapDisplayName,
    "Sesja administratora nie została odczytana poprawnie.");
Assert(adminUser.GetProperty("role").GetInt32() == 0, "Administrator ma mieć rolę 0.");

var suffix = Guid.NewGuid().ToString("N")[..10];
var worldName = $"Integration {suffix}";

var world = await PostJson(adminClient, "/worlds", new { name = worldName, description = "Automatyczny test integracyjny" });
var worldId = RequiredGuid(world, "id");
await ExpectOk(adminClient, "/worlds", "światy");

var folder = await PostJson(adminClient, $"/worlds/{worldId}/folders", new { name = $"Folder {suffix}", parentFolderId = (Guid?)null });
var folderId = RequiredGuid(folder, "id");
await ExpectOk(adminClient, $"/worlds/{worldId}/folders?playerView=false", "foldery");
await ExpectOk(adminClient, $"/worlds/{worldId}/folders/{folderId}/pages", "strony dla nowego folderu");

var page = await PostJson(adminClient, $"/worlds/{worldId}/folders/{folderId}/pages", new { title = $"Kronika {suffix}", content = "Treść testowa wiedzy" });
var pageId = RequiredGuid(page, "id");
await ExpectOk(adminClient, $"/worlds/{worldId}/folders/{folderId}/pages", "strony");

var textFile = await Upload(adminClient, $"/worlds/{worldId}/folders/{folderId}/files", "file", $"notatka-{suffix}.txt", "text/plain", "plik testowy"u8.ToArray());
var textFileId = RequiredGuid(textFile, "id");
await ExpectOk(adminClient, $"/worlds/{worldId}/folders/{folderId}/files", "pliki");
await ExpectOk(adminClient, $"/worlds/{worldId}/files/{textFileId}/download", "pobieranie pliku");

var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
var mapFile = await Upload(adminClient, $"/worlds/{worldId}/folders/{folderId}/files/map-image", "file", $"mapa-{suffix}.png", "image/png", png);
var imageFileId = RequiredGuid(mapFile, "id");
var map = await PostJson(adminClient, $"/worlds/{worldId}/maps", new { name = $"Mapa {suffix}", description = "Mapa integracyjna", type = 0, imageFileId, isPublished = true });
var mapId = RequiredGuid(map, "id");
await ExpectOk(adminClient, $"/worlds/{worldId}/maps?playerView=false", "mapa");

var searchResponse = await adminClient.GetAsync($"/search?query={Uri.EscapeDataString(suffix)}&worldId={worldId}");
await EnsureSuccess(searchResponse, "wyszukiwanie");
var searchBody = await searchResponse.Content.ReadAsStringAsync();
Assert(searchBody.Contains(suffix, StringComparison.OrdinalIgnoreCase), "Wyszukiwanie nie zwróciło danych testowych.");

await PostJson(adminClient, "/users", new
{
    displayName = playerDisplayName,
    email = playerEmail,
    password = playerPassword,
    role = 2,
    isActive = true,
    mustChangePassword = false
});

await adminClient.PostAsync("/auth/logout", null);
var signedOut = await ReadJson(await adminClient.GetAsync("/auth/me"));
Assert(signedOut.TryGetProperty("user", out var signedOutUser) &&
    signedOutUser.ValueKind == JsonValueKind.Null,
    "Wylogowanie nie wyczyściło sesji administratora.");

using var playerHandler = new HttpClientHandler
{
    CookieContainer = new CookieContainer(),
    AllowAutoRedirect = false
};
using var playerClient = new HttpClient(playerHandler)
{
    BaseAddress = apiUri,
    Timeout = TimeSpan.FromSeconds(30)
};

await LoginAsync(playerClient, playerLogin, playerPassword);

var playerSession = await ReadJson(await playerClient.GetAsync("/auth/me"));
Assert(playerSession.TryGetProperty("user", out var playerUser) &&
    playerUser.ValueKind == JsonValueKind.Object &&
    playerUser.GetProperty("displayName").GetString() == playerDisplayName,
    "Sesja gracza nie została odczytana poprawnie.");
Assert(playerUser.GetProperty("role").GetInt32() == 2, "Gracz ma mieć rolę 2.");

await ExpectStatus(
    await playerClient.PostAsJsonAsync("/worlds", new { name = "Nie powinno się udać", description = "Test 403" }),
    HttpStatusCode.Forbidden,
    "Gracz nie powinien móc tworzyć świata");

await ExpectStatus(
    await playerClient.GetAsync("/users"),
    HttpStatusCode.Forbidden,
    "Gracz nie powinien mieć dostępu do panelu użytkowników");

await ExpectOk(playerClient, "/worlds", "światy dla gracza");
await ExpectOk(playerClient, $"/worlds/{worldId}/folders/{folderId}/pages", "strony dla gracza");
await ExpectOk(playerClient, $"/worlds/{worldId}/folders", "foldery dla gracza");

Console.WriteLine("PASS: login, logout, 401, 403, role, światy, foldery, strony, pliki, wyszukiwanie i mapa.");
return 0;

static async Task LoginAsync(
    HttpClient client,
    string login,
    string password)
{
    await EnsureSuccess(
        await client.PostAsJsonAsync("/auth/login", new { login, password }),
        "logowanie");
}

static async Task<JsonElement> PostJson(
    HttpClient client,
    string path,
    object body)
{
    var response = await client.PostAsJsonAsync(path, body);
    await EnsureSuccess(response, path);
    return await ReadJson(response);
}

static async Task<JsonElement> Upload(
    HttpClient client,
    string path,
    string field,
    string name,
    string contentType,
    byte[] bytes)
{
    using var form = new MultipartFormDataContent();
    var content = new ByteArrayContent(bytes);
    content.Headers.ContentType = new(contentType);
    form.Add(content, field, name);
    var response = await client.PostAsync(path, form);
    await EnsureSuccess(response, path);
    return await ReadJson(response);
}

static async Task ExpectOk(
    HttpClient client,
    string path,
    string label) =>
    await EnsureSuccess(await client.GetAsync(path), label);

static async Task ExpectStatus(
    HttpResponseMessage response,
    HttpStatusCode expected,
    string message)
{
    if (response.StatusCode != expected)
    {
        throw new InvalidOperationException(
            $"{message}: oczekiwano HTTP {(int)expected}, otrzymano HTTP {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
    }
}

static async Task EnsureSuccess(
    HttpResponseMessage response,
    string label)
{
    if (response.IsSuccessStatusCode)
    {
        return;
    }

    throw new InvalidOperationException(
        $"{label}: HTTP {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
}

static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
    (await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync())).RootElement.Clone();

static Guid RequiredGuid(JsonElement element, string property) =>
    element.TryGetProperty(property, out var value) && value.TryGetGuid(out var id)
        ? id
        : throw new InvalidOperationException($"Odpowiedź API nie zawiera poprawnego pola {property}.");

static void Assert(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}
