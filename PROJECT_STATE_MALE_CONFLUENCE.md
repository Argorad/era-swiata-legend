# Małe Confluence Ery Świata Legend — stan projektu

**Ostatnia aktualizacja:** 2026-07-13
**Repozytorium:** `git@github.com:Argorad/era-swiata-legend.git`
**Gałąź:** `main`
**Ostatni opisany commit:** `53ade7e feat: add world management and archiving`

## 1. Cel projektu

Małe Confluence Ery Świata Legend to lekka aplikacja webowa do zarządzania
wiedzą o świecie RPG. Nie jest grą — ma być narzędziem dla administratorów,
Mistrzów Gry i graczy.

Docelowe moduły:

1. wiedza uporządkowana w światach, folderach i stronach,
2. interaktywna mapa,
3. wyszukiwarka wspierana przez AI,
4. role i uprawnienia: administrator, MG i gracz tylko do odczytu.

Aktualna implementacja skupia się na światach i folderach. Backend stron
istnieje, ale frontend stron nie został jeszcze podłączony.

## 2. Środowisko i struktura

- Ubuntu Server 24.04 LTS,
- hostname: `esl-conflu`,
- adres w sieci lokalnej: `192.168.1.63`,
- .NET SDK 10 i PostgreSQL 16,
- Node.js 24 i npm 12,
- React 19, TypeScript 6, Vite 8 i Axios,
- GitHub przez SSH.

Projekt:

```text
~/projects/era-swiata-legend
```

Struktura:

```text
era-swiata-legend/
├── backend/
│   ├── EraSwiataLegend.Api/
│   ├── EraSwiataLegend.Application/
│   ├── EraSwiataLegend.Domain/
│   ├── EraSwiataLegend.Infrastructure/
│   └── EraSwiataLegend.slnx
├── frontend/
├── docs/
└── PROJECT_STATE_MALE_CONFLUENCE.md
```

## 3. Uruchamianie

Backend:

```bash
cd ~/projects/era-swiata-legend/backend
dotnet run --project EraSwiataLegend.Api --urls http://0.0.0.0:5186
```

Frontend:

```bash
cd ~/projects/era-swiata-legend/frontend
npm run dev -- --host 0.0.0.0
```

Adresy:

```text
Frontend: http://192.168.1.63:5173
Backend:  http://192.168.1.63:5186
Swagger:  http://192.168.1.63:5186/swagger
```

Kontrola usług:

```bash
ss -ltnp | grep -E '5173|5186|5432'
```

## 4. Git

Remote:

```text
git@github.com:Argorad/era-swiata-legend.git
```

Przed pracą:

```bash
cd ~/projects/era-swiata-legend
git status
git log --oneline -5
```

Nie należy automatycznie wykonywać commita ani pushowania bez potwierdzenia
użytkownika. Nie wolno resetować ani usuwać cudzych lokalnych zmian.

## 5. Backend

Backend używa ASP.NET Core Minimal API, EF Core, PostgreSQL, Swagger i
wstrzykiwania zależności. Podział warstw:

- `Api` — konfiguracja aplikacji i endpointy,
- `Application` — handlery, komendy, zapytania i DTO,
- `Domain` — encje i reguły domenowe,
- `Infrastructure` — EF Core, PostgreSQL i migracje.

### Endpointy

```text
GET   /

GET   /worlds
POST  /worlds
PATCH /worlds/{worldId}/archive
PATCH /worlds/{worldId}/restore

GET   /worlds/{worldId}/folders
POST  /worlds/{worldId}/folders
PUT   /worlds/{worldId}/folders/{folderId}
PATCH /worlds/{worldId}/folders/{folderId}/move

GET   /worlds/{worldId}/folders/{folderId}/pages
POST  /worlds/{worldId}/folders/{folderId}/pages
```

### Encje

```text
World:  Id, Name, Description, Status, CreatedAt, UpdatedAt
Folder: Id, WorldId, ParentFolderId, Name, Type, CreatedAt, UpdatedAt
Page:   Id, WorldId, FolderId, Title, Content, CreatedAt, UpdatedAt
```

Status świata:

```csharp
public enum WorldStatus
{
    Active = 0,
    Archived = 1
}
```

Archiwizowanie świata zmienia jego status, ale nie usuwa folderów ani stron.
Świat można później przywrócić.

Typ folderu:

```csharp
public enum FolderType
{
    Normal = 0,
    Archive = 1,
    Trash = 2
}
```

Nowy świat automatycznie otrzymuje foldery systemowe `Archive` i `Trash`.
Podczas pobierania folderów backend uzupełnia brakujące foldery systemowe w
starszych światach. Dlatego `GET /worlds/{worldId}/folders` może zapisać dane
i nie jest całkowicie odczytowy.

Folderów systemowych nie można zmieniać ani przenosić. Backend blokuje również:

- przeniesienie folderu do samego siebie,
- przeniesienie folderu do jego potomka,
- przeniesienie do folderu z innego świata,
- utworzenie folderu pod nieistniejącym folderem nadrzędnym.

## 6. Frontend

Główne pliki:

```text
frontend/src/
├── components/
│   ├── FolderActions.tsx
│   ├── FolderContent.tsx
│   ├── FolderCreateDialog.tsx
│   ├── FolderItem.tsx
│   ├── FolderList.tsx
│   ├── FolderTreeNode.tsx
│   ├── MoveFolderDialog.tsx
│   ├── WorldArchiveDialog.tsx
│   ├── WorldCreateDialog.tsx
│   └── WorldList.tsx
├── pages/HomePage.tsx
├── services/api.ts
├── types/
│   ├── Folder.ts
│   └── World.ts
├── App.tsx
└── main.tsx
```

Axios używa wpisanego na stałe adresu:

```text
http://192.168.1.63:5186
```

CORS backendu dopuszcza:

```text
http://192.168.1.63:5173
```

Interfejs ma nagłówek, lewy panel z listą światów i drzewem folderów oraz
główny panel zawartości wybranego folderu.

## 7. Działające i zaimplementowane funkcje

### Światy

- pobieranie listy,
- rozdzielenie aktywnych i zarchiwizowanych światów,
- tworzenie świata z nazwą i opisem,
- automatyczne tworzenie `Archive` i `Trash`,
- wybór świata i pobieranie jego folderów,
- archiwizacja z potwierdzeniem,
- przywracanie świata,
- zachowanie danych podczas archiwizacji.

### Foldery

- pobieranie folderów,
- tworzenie folderów i podfolderów,
- wybór folderu nadrzędnego w formularzu,
- hierarchiczne drzewo,
- zwijanie i rozwijanie gałęzi,
- wybór i podświetlanie folderu,
- breadcrumbs,
- wyświetlanie podfolderów w głównym panelu,
- zmiana nazwy,
- przenoszenie na główny poziom lub do innego folderu,
- blokowanie pętli,
- archiwizowanie przez przeniesienie do `Archive`,
- przenoszenie do `Trash` z potwierdzeniem,
- trwałość zmian po odświeżeniu.

### Strony

Backend obsługuje pobieranie i tworzenie stron oraz sprawdza, czy folder należy
do wskazanego świata. Frontend stron nie jest podłączony. Widok folderu pokazuje
obecnie statyczny pusty stan sekcji stron.

## 8. Stan bazy danych

Stan potwierdzony 2026-07-13 zapytaniami w transakcji `READ ONLY`:

```text
Światy:                 5
Aktywne światy:         1
Zarchiwizowane światy:  4
Foldery:               21
Foldery Normal:        11
Foldery Archive:        5
Foldery Trash:          5
Strony:                  0
```

Główny aktywny świat:

```text
Nazwa: Era Świata Legend
ID:    c564d8ab-acb5-4c93-9f71-48064280a3f0
```

Każdy świat ma jeden folder `Archive` i jeden `Trash`. Nie wykryto relacji
folderów nadrzędnych pomiędzy różnymi światami.

Zastosowane migracje:

```text
20260712003350_InitialCreate
20260712131904_AddFolders
20260712134714_AddPages
20260712193758_AddFolderType
20260713124855_AddWorldStatus
```

Nie wolno resetować ani usuwać bazy, migracji, światów, folderów ani innych
danych bez jednoznacznego polecenia użytkownika. Diagnostykę bazy należy w
miarę możliwości wykonywać w transakcji `READ ONLY`.

## 9. Rzeczy jeszcze niezrobione

Braki funkcjonalne:

- wyświetlanie i tworzenie stron we frontendzie,
- otwieranie i edycja tytułu oraz treści strony,
- przenoszenie, archiwizowanie i usuwanie stron,
- osobne przywracanie folderu z archiwum lub kosza,
- trwałe usuwanie z kosza,
- drag and drop folderów,
- edycja nazwy i opisu świata,
- wyszukiwarka,
- interaktywna mapa,
- funkcje AI,
- logowanie, role i uprawnienia,
- załączniki i pliki.

Braki techniczne:

- brak testów automatycznych i CI,
- adres API i origin CORS wpisane na stałe,
- dane dostępowe bazy znajdują się w śledzonym `appsettings.json`,
- Swagger jest włączony dla każdego środowiska,
- brak centralnej obsługi wyjątków i wspólnego formatu błędów,
- brak ograniczeń unikalności nazw,
- część dialogów folderów używa stylów inline,
- `frontend/README.md` i plik `.http` są pozostałościami szablonu,
- `App.css`, `MainLayout.tsx` i część zasobów Vite nie są używane.

## 10. Najbliższy logiczny etap

1. Podłączyć pobieranie stron po wybraniu folderu.
2. Wyświetlić listę stron w `FolderContent`.
3. Dodać formularz tworzenia strony.
4. Dodać widok i edycję treści strony.
5. Dodać testy backendowych reguł folderów i światów.

Następnie można przejść do przenoszenia i archiwizowania stron, wyszukiwarki,
uprawnień, mapy i funkcji AI.

## 11. Weryfikacja zmian

Backend:

```bash
cd ~/projects/era-swiata-legend/backend
dotnet build EraSwiataLegend.slnx
```

Frontend:

```bash
cd ~/projects/era-swiata-legend/frontend
npm run lint
npm run build
```

Zmiana schematu bazy wymaga osobnej migracji i sprawdzenia jej treści przed
zastosowaniem. Operacji mogących zmienić lub usunąć dane nie należy wykonywać
bez potwierdzenia.

## 12. Zasady kolejnych sesji

- Najpierw przeczytać ten dokument, sprawdzić `git status` i ostatnie commity.
- Porównać dokumentację z kodem; kod i migracje są źródłem prawdy technicznej.
- Nie zmieniać kodu ani danych, jeśli użytkownik poprosił tylko o analizę.
- Nie usuwać i nie resetować danych, migracji ani lokalnych zmian.
- Przed operacją potencjalnie destrukcyjną poprosić o potwierdzenie.
- Po większym pakiecie uruchomić odpowiednie buildy i testy.
- Po zmianie funkcjonalności zaktualizować ten dokument.
- Commit i push wykonywać tylko na wyraźne polecenie użytkownika.
