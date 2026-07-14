# Małe Confluence Ery Świata Legend — aktualny stan projektu

**Ostatnia aktualizacja:** 2026-07-14

**Repozytorium:** `git@github.com:Argorad/era-swiata-legend.git`

**Gałąź:** `main`
**Bazowy commit:** `05dd9c0 wip: save v1 and full map editor progress`

## 1. Cel i technologie

„Małe Confluence Ery Świata Legend” jest aplikacją do zarządzania wiedzą o
światach RPG. V1 obejmuje światy, foldery, strony, lokalne pliki,
wyszukiwarkę i rozbudowywany moduł map. Docelowo aplikacja ma rozróżniać
Administratora, MG i Gracza oraz opcjonalnie udostępniać wyszukiwanie AI.

Technologie:

- backend: .NET 10, ASP.NET Core Minimal API, EF Core i PostgreSQL,
- architektura backendu: `Api`, `Application`, `Domain`, `Infrastructure`,
- frontend: React 19, TypeScript, Vite, Axios,
- magazyn plików: lokalny katalog serwera poza frontendem,
- interfejs i komunikaty: język polski.

Główny katalog:

```text
~/projects/era-swiata-legend
```

## 2. Uruchamianie w LAN

API należy uruchamiać na wszystkich interfejsach sieciowych na porcie 5186:

```bash
cd ~/projects/era-swiata-legend/backend
dotnet run --project EraSwiataLegend.Api --urls http://0.0.0.0:5186
```

Frontend:

```bash
cd ~/projects/era-swiata-legend/frontend
npm run dev -- --host 0.0.0.0
```

Adresy na aktualnym serwerze LAN:

```text
Frontend: http://192.168.1.63:5173
API:      http://192.168.1.63:5186
Swagger:  http://192.168.1.63:5186/swagger
```

Wspólny klient Axios odczytuje `VITE_API_BASE_URL`. Jeśli zmienna nie jest
ustawiona, używa `http://<hostname aktualnie otwartej strony>:5186`, a nie
browserowego `localhost`. Dzięki temu frontend otwarty z innego urządzenia w
LAN kieruje żądania do hosta serwera. Przykład:

```env
VITE_API_BASE_URL=http://192.168.1.63:5186
```

Konfiguracja CORS dopuszcza obecnie frontend LAN i lokalny frontend Vite.
`launchSettings.json` nadal zawiera lokalny profil `localhost`; nie zastępuje
to wymaganego parametru `--urls http://0.0.0.0:5186` przy uruchamianiu w LAN.

## 3. Stan V1

### 3.1. Światy

Działa:

- pobieranie i wybór świata,
- rozdzielenie światów aktywnych i zarchiwizowanych,
- tworzenie świata z nazwą i opisem,
- pełne wyświetlanie opisu aktywnego świata pod nagłówkiem,
- archiwizacja z potwierdzeniem i późniejsze przywrócenie,
- zachowanie folderów, stron i pozostałych danych podczas archiwizacji,
- automatyczne utworzenie folderów systemowych `Archive` i `Trash`.

Uwaga: `GET /worlds/{worldId}/folders` może uzupełnić brakujące foldery
systemowe w starszym świecie, więc ten konkretny GET nie jest czysto
odczytowy.

Nie ma jeszcze edycji nazwy i opisu istniejącego świata.

### 3.2. Foldery

Działa:

- drzewo folderów i podfolderów, zwijanie gałęzi oraz breadcrumbs,
- tworzenie folderów na poziomie głównym i pod wybranym folderem,
- zmiana nazwy i przenoszenie folderu,
- blokada przeniesienia do siebie, potomka lub innego świata,
- blokada zmiany i przenoszenia systemowych `Archive` i `Trash`,
- archiwizowanie i przenoszenie do kosza bez trwałego usuwania,
- wydzielone sekcje „Podfoldery”, „Strony” i „Pliki” wraz z licznikami,
- responsywny panel boczny bez naruszenia drzewa.

W kodzie przygotowano trwałe `IsVisibleToPlayers`; nowe zwykłe foldery mają
być domyślnie prywatne. Egzekwowanie prywatności względem rzeczywistego gracza
nie jest jednak ukończone bez logowania, a odpowiednia kolumna znajduje się w
niezastosowanej migracji Full MapGenie.

Nie ma jeszcze osobnego, kompletnego przepływu przywracania całych folderów z
`Archive` i `Trash`.

### 3.3. Strony wiedzy

Działa:

- pobieranie stron wybranego folderu,
- loading, obsługa błędu, ponowienie oraz dopracowany pusty stan,
- tworzenie strony z walidacją tytułu i blokadą wielokrotnego zapisu,
- automatyczne odświeżenie listy i otwarcie nowej strony bez reloadu,
- czytelny widok tytułu i treści oraz powrót do folderu,
- edycja tytułu i treści,
- przenoszenie między zwykłymi folderami tego samego świata,
- przenoszenie do `Archive` i `Trash`, zapamiętanie poprzedniego folderu i
  przywracanie,
- trwałe usunięcie wyłącznie z `Trash`, po wpisaniu `USUŃ`,
- backendowa kontrola zgodności świata, strony i folderu.

### 3.4. Biblioteka plików

Działa:

- upload do folderu, lista metadanych i pobieranie strumieniowe,
- lokalny magazyn poza frontendem, domyślnie `../data/uploads`,
- konfiguracja katalogu przez `FileStorage__RootPath`,
- bezpieczna, losowa nazwa fizyczna i brak dowolnych ścieżek użytkownika,
- standardowy limit 20 MB oraz allowlista rozszerzeń i MIME,
- dedykowany upload obrazów map do 50 MB,
- weryfikacja sygnatur PNG, JPG/JPEG, WebP i AVIF dla obrazów map,
- brak renderowania SVG, TIFF, PDF i plików projektowych jako tła mapy,
- przenoszenie metadanych pliku do `Trash` bez usuwania pliku fizycznego,
- przywracanie pliku do poprzedniego zwykłego folderu.

W kodzie przygotowano `IsVisibleToPlayers`, domyślnie `false`. Ochrona
bezpośredniego pobrania prywatnego pliku ma znaczenie dopiero po włączeniu
prawdziwej autentykacji. Trwałe usuwanie plików i ich fizycznej zawartości nie
jest udostępnione.

### 3.5. Wyszukiwarka

Działa lokalne wyszukiwanie PostgreSQL po:

- światach,
- folderach,
- tytułach i treści stron,
- nazwach plików.

Wynik zawiera typ, nazwę, breadcrumb i fragment treści strony. Kliknięcie
prowadzi do odpowiedniego świata, folderu albo strony. Wyszukiwanie nie wymaga
AI i wszystkie żądania używają wspólnego klienta Axios.

Ważny brak: obecna implementacja wyszukiwarki nie filtruje jeszcze wyników po
prywatnych folderach i plikach. Należy to dokończyć razem z prawdziwą
tożsamością i rolami, zanim wyszukiwarka zostanie udostępniona Graczom.

## 4. Full MapGenie — aktualny stan

Zakładka „Mapa” jest dużym modułem zajmującym prawie całą prawą przestrzeń
roboczą pod globalnym nagłówkiem. Nie korzysta z wąskiego kontenera widoku
wiedzy. Panel mapy na desktopie jest zwijany, a na mobile zachowuje się jak
wysuwana szuflada.

### 4.1. Mapy i obrazy

Działa:

- wiele niezależnych map w jednym świecie: świat, region, miasto i loch,
- nazwa, opis, typ, obraz bazowy, publikacja, archiwizacja i przywracanie,
- wybór aktywnej mapy i link z markera do innej mapy,
- jednoznaczne rozdzielenie:
  - „Nowa mapa” tworzy nowy projekt mapy,
  - „Dodaj obraz z Biblioteki” dodaje warstwę do aktualnej mapy,
- wiele PNG/JPG/JPEG/WebP/AVIF na jednej mapie,
- wirtualne płótno pozwalające układać obrazy obok siebie, na sobie i poza
  granicą obrazu bazowego,
- oryginalne pliki Biblioteki pozostają nietknięte,
- zaznaczanie i przeciąganie warstwy obrazu,
- skala, obrót, kolejność, krycie, widoczność dla MG/graczy i indywidualna
  blokada,
- duplikowanie oraz usuwanie wyłącznie powiązania z kompozycji,
- panel warstw z nazwami i ustawieniami,
- obraz wyświetlany w naturalnej rozdzielczości, bez generowania miniatury
  jako właściwego tła mapy.

Obraz bazowy jest domyślnie zablokowany. Po świadomym odblokowaniu można go
przesuwać, skalować, obracać uchwytem lub liczbowo, zmieniać krycie oraz ukryć
z kompozycji po wpisaniu mocnego potwierdzenia. Każdy dodatkowy obraz ma ten
sam mechanizm obrotu, w tym przyciski `-90°`, `+90°`, reset oraz przyciąganie
uchwytu co 15° z klawiszem `Shift`. Transformacje uczestniczą w sesyjnym
undo/redo.

Obraz bazowy nadal jest technicznie specjalnym polem `WorldMap.ImageFileId`,
a dodatkowe obrazy są rekordami `MapImageLayer`. Dlatego ustawienia
transformacji i blokady obrazu bazowego są obecnie zachowywane w
`localStorage` osobno dla mapy i przeglądarki, bez zmiany schematu bazy;
dodatkowe warstwy pozostają zapisywane przez API. Pełne, serwerowe
ujednolicenie obrazu bazowego z `MapImageLayer` jest etapem porządkowym na
przyszłość.

### 4.2. Nawigacja i płótno

Działa:

- pan myszą i dotykiem,
- zoom kółkiem, gestem szczypania i przyciskami w zakresie 5–800%,
- dopasowanie mapy do widoku,
- Fullscreen API z wyjściem przez `Esc`,
- fallback pełnego ekranu zakrywający chrome aplikacji, gdy przeglądarka
  odrzuci Fullscreen API,
- portalowe dialogi widoczne ponad mapą również w natywnym fullscreenie,
- domyślne oceaniczne tło wirtualnej przestrzeni,
- warianty tła: ocean, pergamin, ciemne i jednolite,
- spokojna, niekafelkowana animacja oceanu z obsługą
  `prefers-reduced-motion`,
- brak blokowania kliknięć przez tło.

Lewy panel mapy ma własny pionowy scroll i nie ucina dalszych ustawień nawet
przy niższym ekranie.

### 4.3. Wirtualne płótno i współrzędne

Funkcja siatki pomocniczej została całkowicie wycofana z interfejsu i API.
Nie są renderowane linie, kropki ani heksy, nie ma snapowania ani ustawień
siatki. Istniejące kolumny PostgreSQL pozostają wyłącznie jako legacy, aby ich
usunięcie nie wymagało destrukcyjnej migracji.

Narzędzia rysujące korzystają z osobnej warstwy wejściowej ponad obrazami.
Współrzędne ekranu są przeliczane przez odwrotność aktualnego pan/zoom do
współrzędnych świata mapy, również poza granicami obrazu bazowego. Pointer
capture utrzymuje gest od `pointerdown` do `pointerup` przy przechodzeniu
między JPG a oceanem.

### 4.4. Markery

Działa:

- względna pozycja X/Y w zakresie 0–1 względem obrazu bazowego,
- tworzenie prawym przyciskiem oraz alternatywny przycisk dla dotyku,
- nazwa, opis, ikona, kolor, kategoria i widoczność dla graczy,
- powiązanie z folderem, stroną albo inną mapą,
- przeciąganie, edycja i blokada pozycji,
- publikacja/ukrycie, Archive, Trash, przywracanie,
- trwałe usuwanie wyłącznie z `Trash` po wyraźnym potwierdzeniu,
- zarządzalne kategorie i dziesięć kategorii startowych,
- wyszukiwarka markerów i lokalne ukrywanie kategorii,
- panel szczegółów markera,
- backendowe sprawdzanie zgodności świata, mapy, kategorii i powiązań.

Model markerów graczy, autora i prywatnego/udostępnionego statusu jest
przygotowany w kodzie i migracji, ale endpointy dla prawdziwego użytkownika
nie powinny być uznawane za gotową funkcję do czasu wdrożenia logowania.

### 4.5. Edytor rysunków i adnotacji

Działa:

- domyślnie wyłączony globalny „Tryb edycji”,
- osobne narzędzie „Rączka” do panowania,
- zaznaczanie i przesuwanie adnotacji,
- pióro i gumka,
- linia i strzałka tworzone wyłącznie gestem naciśnięcie–przeciągnięcie–puszczenie,
- tekst z rozmiarem, kolorem, tłem i opcjonalną ramką,
- kolor obrysu i wypełnienia, krycie, grubość oraz kreska
  ciągła/kreskowana/kropkowana,
- uchwyty zmiany rozmiaru i obrotu,
- usuwanie i duplikowanie pojedynczej adnotacji,
- widoczność, kolejność i widoczność dla graczy,
- optymistyczne pozostawienie nowej adnotacji w UI po błędzie API,
- stan „Zapisywanie…”, „Zapisano”, „Nie zapisano” oraz ponawianie,
- ostrzeżenie przed przeładowaniem lub zmianą mapy przy niezapisanym stanie,
- osobny edytor tekstu otwierany kliknięciem w mapę: `Ctrl+Enter` zapisuje,
  `Escape` anuluje,
- automatyczny powrót do narzędzia „Zaznacz” po dodaniu linii, strzałki lub
  tekstu, z opcją „Twórz wiele” dla pracy seryjnej.

Krytyczna regresja zapisu w przeglądarce otwartej przez HTTP w LAN wynikała z
użycia `crypto.randomUUID()`, które nie jest dostępne w każdym niezabezpieczonym
kontekście. Lokalny identyfikator optymistycznej adnotacji ma teraz bezpieczny
fallback; tekst i rysunek pozostają widoczne przy błędzie API, a toolbar
udostępnia „Ponów zapis”. Gesty linii, strzałki i pióra wymagają trzymania
lewego przycisku, pojedynczy klik niczego nie tworzy, a `Escape` anuluje
podgląd.

Narzędzia Prostokąt, Elipsa i Wielokąt zostały celowo usunięte z UI zgodnie z
aktualnym zakresem dopracowania; wcześniej zapisane adnotacje tych typów nadal
są renderowane i nie są usuwane. Edytor wymaga jeszcze przeglądarkowych testów
akceptacyjnych na dużych rzeczywistych mapach i dalszego dopracowania
ergonomii inspektora stylu.

### 4.6. Blokady, menu i historia

Działa:

- niezależna blokada warstwy obrazu,
- blokada całej warstwy rysunków,
- niezależna blokada pojedynczej adnotacji,
- blokada pozycji markera,
- komunikat „Element jest zablokowany”,
- backendowa odmowa transformacji lub usunięcia zablokowanego obiektu,
- gumka usuwająca wyłącznie odblokowaną adnotację aktywnej warstwy,
- potwierdzenie czyszczenia warstwy rysunków i usunięcia warstwy obrazu,
- kontekstowe menu pustego obszaru, obrazu, markera i adnotacji,
- menu dostępne klawiaturą, zamykane przez `Escape` i klik poza nim,
- brak operacji zapisujących w menu trybu gracza,
- sesyjne undo/redo dla tworzenia, edycji, transformacji, widoczności,
  blokad, kolejności, duplikowania i usuwania obrazów, markerów i adnotacji,
- skróty `Ctrl+Z`, `Ctrl+Shift+Z` oraz `Ctrl+Y`,
- przyciski Cofnij/Ponów z liczbą kroków i poprawnym stanem disabled.

Historia jest celowo historią bieżącej sesji i nie przetrwa odświeżenia.
Zapisane obiekty i blokady mają przetrwać odświeżenie po zastosowaniu
wymaganych migracji.

## 5. Role, prywatność i AI

W kodzie istnieją:

- role `Administrator`, `GameMaster` i `Player`,
- encja `UserAccount` oparta na zewnętrznym identyfikatorze,
- polityki autoryzacji ASP.NET Core,
- cookie-auth, `/auth/login`, `/auth/me`, `/auth/logout` i zmiana hasła,
- bootstrap pierwszego Administratora przez `BootstrapAdmin__...`,
- login przez e-mail albo unikalny nick z bezpiecznym hashowaniem hasła,
- rate limit dla logowania,
- warunkowa ochrona endpointów zapisujących mapę, wiedzę i pliki dla
  Administratora/MG,
- pola widoczności folderów, plików, map, warstw, rysunków i markerów,
- abstrakcja `IAiSearchProvider`, endpointy statusu i provider wyłączony.

Kod logowania jest już zaimplementowany, ale działa tylko po włączeniu
`Authentication:Enabled=true` i podaniu bootstrapowych zmiennych środowiskowych
pierwszego administratora. Wtedy backend egzekwuje cookie-based sesję HttpOnly,
`/auth/me`, logout, wymuszenie zmiany hasła, role oraz odrębny dostęp gracza.
Frontend pokazuje ekran logowania, nick/rolę w nagłówku i panel administracji
użytkowników dla Administratora. Dopóki auth nie jest włączony w danym
środowisku:

- aplikacja działa w trybie bezlogowania i używa wyłącznie filtrów UI,
- prywatność folderów, plików i wyników wyszukiwania nie jest wtedy pełną
  ochroną bezpieczeństwa,
- markery graczy są przygotowane, ale ich pełne wykorzystanie wymaga
  rzeczywistego konta zalogowanego użytkownika.

AI jest bezpiecznie wyłączone. Nie ma realnych wywołań zewnętrznych. Przyszły
klucz ma pochodzić z `Ai__ApiKey` lub bezpiecznego magazynu środowiska i nie
może trafić do repozytorium. Brak konfiguracji AI nie blokuje pozostałych
modułów.

## 6. Migracje i stan bazy

### 6.1. Migracje zastosowane

Według dotychczasowego stanu projektu oraz potwierdzenia właściciela zastosowane
są kolejno:

```text
20260712003350_InitialCreate
20260712131904_AddFolders
20260712134714_AddPages
20260712193758_AddFolderType
20260713124855_AddWorldStatus
20260713173523_AddV1KnowledgeModules
20260713181531_AddMiniMapGenie
20260713201320_AddMapCompositionLayers
```

`AddV1KnowledgeModules` wprowadziła m.in. poprzedni folder strony, pliki,
podstawowe markery i konta. `AddMiniMapGenie` dodała mapy i kategorie.
`AddMapCompositionLayers` dodała warstwy obrazów, wektorowe rysunki, podstawową
siatkę i blokadę pozycji markera. Zastosowanie ostatniej migracji zostało
potwierdzone ręcznie przez właściciela projektu.

### 6.2. Migracje wygenerowane, ale niezastosowane

```text
20260713210417_AddFullMapEditorVisibilityAndPlayerMarkers
20260713215422_AddAnnotationTextBorder
20260714000000_AddLocalUserAuthentication
```

Pierwsza dodaje wyłącznie nowe kolumny rozszerzonego gridu, płótna, rysunków,
krycia warstw, prywatności folderów i plików oraz modelu markerów graczy, a
także indeks i opcjonalny klucz obcy autora. Druga dodaje wyłącznie:

```sql
ALTER TABLE "MapDrawingStrokes"
ADD "HasTextBorder" boolean NOT NULL DEFAULT TRUE;
```

Trzecia dodaje wyłącznie kolumny logowania lokalnego:

- `UserAccounts.Email`
- `UserAccounts.NormalizedEmail`
- `UserAccounts.NormalizedDisplayName`
- `UserAccounts.PasswordHash`
- `UserAccounts.SecurityStamp`

oraz unikalne indeksy na `NormalizedDisplayName` i `NormalizedEmail`.

Zweryfikowane sekcje `Up` obu migracji nie zawierają `DROP`, `TRUNCATE`,
`DELETE`, `UPDATE`, zmiany typu ani nadpisywania istniejących danych. Migracji
nie zastosowano w bieżącej pracy i nie zmieniono danych bazy.

Nowy backend map oczekuje kolumn obu migracji. Nie należy wdrażać tej wersji
backendu przeciw bazie posiadającej wyłącznie `AddMapCompositionLayers`.

### 6.3. Obowiązkowy backup przed migracją

Przed jakąkolwiek kolejną migracją wymagany jest świeży, poprawnie
zweryfikowany `pg_dump` PostgreSQL do katalogu poza repozytorium. Poprzednia
próba backupu w sandboxie nie powiodła się z powodu blokady lokalnego socketu;
nie jest ważną kopią i nie wolno na niej polegać.

Przykład wykonywany poza sandboxem:

```bash
install -d -m 700 "$HOME/backups/era-swiata-legend"
backup="$HOME/backups/era-swiata-legend/pre-full-mapgenie-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --file="$backup" \
  --host=/var/run/postgresql --dbname=eraswiatalegend --username=esl
pg_restore --list "$backup" >/dev/null
test -s "$backup"
```

Jeżeli dowolny z trzech kroków zakończy się błędem, migracji nie wolno
stosować. Po poprawnym backupie kolejność jest następująca:

```bash
cd ~/projects/era-swiata-legend/backend

dotnet ef database update 20260713210417_AddFullMapEditorVisibilityAndPlayerMarkers \
  --project EraSwiataLegend.Infrastructure/EraSwiataLegend.Infrastructure.csproj \
  --startup-project EraSwiataLegend.Api/EraSwiataLegend.Api.csproj

dotnet ef database update 20260713215422_AddAnnotationTextBorder \
  --project EraSwiataLegend.Infrastructure/EraSwiataLegend.Infrastructure.csproj \
  --startup-project EraSwiataLegend.Api/EraSwiataLegend.Api.csproj

dotnet ef database update 20260714000000_AddLocalUserAuthentication \
  --project EraSwiataLegend.Infrastructure/EraSwiataLegend.Infrastructure.csproj \
  --startup-project EraSwiataLegend.Api/EraSwiataLegend.Api.csproj
```

Nigdy nie należy wykonywać resetu bazy, `database update 0`, migrate down,
`DROP`, `TRUNCATE` ani odtwarzania migracji bez osobnej zgody właściciela.

## 7. Weryfikacja techniczna

Ostatni pełny zestaw wykonany 2026-07-14:

```text
npm run lint
  sukces

npm run build
  sukces

git diff --check
  sukces
```

Backendowy build i testy integracyjne są obecnie blokowane przez lokalny obraz
SDK/MSBuild w tym sandboxie, a nie przez repozytorium. Frontendowy lint i build
przechodzą. Testy obejmują m.in. cykle folderów, Archive/Trash, integralność
markerów, zmianę obrazu mapy bez utraty markerów, blokady, prywatne wartości
domyślne i ustawienia adnotacji. Nie zastępują one ręcznego testu wizualnego,
logowania ani testów integracyjnych z PostgreSQL po backupie i migracji.

## 8. Znane ryzyka i niedokończone elementy

- trzy ostatnie migracje funkcjonalne nie są zastosowane,
- pełny przeglądarkowy test akceptacyjny mapy na rzeczywistych dużych plikach
  pozostaje do wykonania po migracji,
- transformacje obrazu bazowego są na razie lokalne dla przeglądarki, a nie
  synchronizowane przez backend,
- zapis nowych adnotacji przez aktualny model EF wymaga kolumn z obu
  niezastosowanych migracji Full MapGenie; bez nich API zwróci błąd mimo
  poprawnego kontraktu frontendowego,
- planowana migracja renderera adnotacji do React Konva jest zablokowana w
  bieżącym środowisku przez brak dostępu DNS do registry npm (`EAI_AGAIN`);
  zależności nie zostały dopisane,
- historia undo/redo jest sesyjna,
- logowanie lokalne, bootstrap pierwszego administratora i cookie-based sesje
  są wdrożone w kodzie, ale nadal wymagają włączenia `Authentication:Enabled`
  i podania env bootstrapu w danym środowisku,
- filtrowanie prywatności w wyszukiwarce i wszystkich endpointach egzekwuje
  backend dopiero po włączeniu auth,
- markery graczy są przygotowane i egzekwowane po stronie backendu, ale pełny
  scenariusz produkcyjny nadal wymaga prawdziwego użytkownika i właściwego
  bootstrapu,
- adapter AI i klucz nie są skonfigurowane,
- brak CI i szerszych testów integracyjnych/API,
- Swagger jest włączony w każdym środowisku,
- brak wspólnego formatu błędów i centralnej obsługi wyjątków,
- śledzony `appsettings.json` zawiera dane dostępowe deweloperskiej bazy;
  należy je przenieść do bezpiecznej konfiguracji środowiska przed wdrożeniem,
- w repozytorium pozostają nieużywane elementy szablonu Vite.

Katalog `backend/data/uploads/` jest katalogiem runtime i został dodany do
`.gitignore`; istniejące pliki fizyczne mają pozostać na serwerze. Usunięcie
wcześniej śledzonych binariów wyłącznie z indeksu Git wymaga wykonania
`git rm --cached` w środowisku z zapisywalnym `.git` — bieżący sandbox blokuje
zapis pliku `.git/index.lock`.

## 9. Plan dalszej pracy

Kolejność dalszego rozwoju:

1. **Dokończenie i stabilizacja mapy**
   - świeży backup PostgreSQL poza repozytorium,
   - zastosowanie dwóch addytywnych migracji w podanej kolejności,
   - ręczne testy wielu obrazów, transformacji, adnotacji, blokad,
     fullscreen, undo/redo, zapisu po odświeżeniu i mobile,
   - naprawa wykrytych regresji oraz dopracowanie ergonomii bez rozszerzania
     zakresu innych modułów.
2. **Logowanie, role i prywatność**
   - wybór dostawcy tożsamości,
   - bezpieczna inicjalizacja pierwszego administratora,
   - rzeczywiste role Administrator/MG/Gracz,
   - backendowe egzekwowanie prywatnych przodków folderów, plików, stron,
     wyników wyszukiwania, map, warstw, rysunków i markerów,
   - bezpieczne uruchomienie markerów graczy.
3. **AI**
   - wybór dostawcy,
   - konfiguracja klucza poza repozytorium,
   - implementacja adaptera bez blokowania aplikacji przy braku AI.
4. **Testy końcowe i stabilizacja V1**
   - testy integracyjne API/PostgreSQL i regresja frontendowa,
   - testy LAN, mobile, uprawnień i bezpieczeństwa pobierania plików,
   - uporządkowanie konfiguracji, Swaggera, błędów i pozostałości szablonu,
   - dopiero potem commit, push i wdrożenie na polecenie właściciela.

## 10. Zasady bezpieczeństwa kolejnych prac

- przed pracą przeczytać ten dokument, sprawdzić `git status` i ostatnie
  commity,
- porównywać dokumentację z kodem i migracjami,
- zachować wszystkie niezatwierdzone zmiany użytkownika,
- nie usuwać ani nie resetować bazy, migracji, plików, światów, folderów,
  stron ani załączników,
- przed migracją wykonać i zweryfikować świeży backup,
- nie stosować migracji bez osobnego polecenia,
- nie commitować i nie pushować bez jednoznacznego polecenia właściciela.
