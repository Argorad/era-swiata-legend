# Powtarzalne testy aplikacji

Testy integracyjne i E2E zapisują dane wyłącznie do osobnej bazy PostgreSQL.
Oba uruchamiacze odmawiają pracy, gdy nazwa bazy to `eraswiatalegend`, gdy
brakuje nazwy bazy albo gdy nazwa nie kończy się na `_test`.

## Jednorazowe przygotowanie

Poniższe polecenia administrator wykonuje ręcznie poza Codexem. Hasło nie
powinno trafić do repozytorium ani historii powłoki.

```bash
sudo -u postgres createuser --pwprompt eraswiatalegend_test
sudo -u postgres createdb --owner=eraswiatalegend_test --encoding=UTF8 eraswiatalegend_test
read -rsp 'Hasło testowej bazy: ' ESL_TEST_DB_PASSWORD; echo
export TEST_DATABASE_CONNECTION_STRING="Host=127.0.0.1;Port=5432;Database=eraswiatalegend_test;Username=eraswiatalegend_test;Password=${ESL_TEST_DB_PASSWORD}"
unset ESL_TEST_DB_PASSWORD
cd ~/projects/era-swiata-legend/backend
dotnet ef database update --project EraSwiataLegend.Infrastructure --startup-project EraSwiataLegend.Api --connection "$TEST_DATABASE_CONNECTION_STRING"
cd ../frontend
npm install
npx playwright install chromium
```

`dotnet ef database update` w tym przykładzie wskazuje jawnie bazę testową.
Przed wykonaniem warto jeszcze sprawdzić wartość zmiennej bez wypisywania
hasła, np. `printf '%s\n' "$TEST_DATABASE_CONNECTION_STRING" | sed 's/Password=[^;]*/Password=***/'`.

## Backend

Istniejące testy domenowe i reguł aplikacyjnych nie potrzebują PostgreSQL:

```bash
cd ~/projects/era-swiata-legend/backend
dotnet run --project EraSwiataLegend.Tests
```

Test integracyjny uruchamia API tylko na `127.0.0.1:5187`, używa tymczasowego
katalogu uploadów i sprawdza endpointy światów, folderów, stron, plików,
wyszukiwania i mapy:

```bash
cd ~/projects/era-swiata-legend/backend
dotnet build EraSwiataLegend.slnx
TEST_DATABASE_CONNECTION_STRING="$TEST_DATABASE_CONNECTION_STRING" ./run-integration-tests.sh
```

## Frontend E2E

Playwright uruchamia osobne API na `127.0.0.1:5187`, Vite na
`127.0.0.1:5174` i przekazuje frontendowi właściwy adres API. Testy działają
seryjnie w Chromium i zapisują raport/screenshot/trace wyłącznie przy błędzie.
Przy problemie ze startem sprawdź logi tymczasowe wypisane przez skrypty:
`api.log`, `frontend.log` oraz `integration.log`.

```bash
cd ~/projects/era-swiata-legend/frontend
TEST_DATABASE_CONNECTION_STRING="$TEST_DATABASE_CONNECTION_STRING" npm run test:e2e
```

Wariant z widoczną przeglądarką:

```bash
TEST_DATABASE_CONNECTION_STRING="$TEST_DATABASE_CONNECTION_STRING" npm run test:e2e:headed
```

Testy tworzą unikalne dane robocze w `eraswiatalegend_test`. Baza testowa jest
przeznaczona do okresowego odtwarzania przez administratora; testy nigdy nie
sprzątają ani nie dotykają bazy deweloperskiej.
