# Małe Confluence Ery Świata Legend — aktualny stan projektu

Data aktualizacji: 2026-07-12

## 1. Lokalizacja projektu

```text
~/projects/era-swiata-legend
```

Struktura:

```text
era-swiata-legend/
├── backend/
├── frontend/
└── .gitignore
```

## 2. Sposób pracy

- System: Ubuntu Server 24.04 na VM `esl-conflu`
- Edycja przez VS Code Remote SSH
- Do otwierania plików używamy `code ścieżka/do/pliku`
- Nie używamy `code .`
- Przy zmianach najlepiej pokazywać całe finalne pliki
- Użytkownik preferuje kilka kroków naraz i mało zbędnego opisu

## 3. Uruchamianie aplikacji

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

Kontrola portów:

```bash
ss -ltnp | grep -E '5173|5186'
```

Adres frontendu:

```text
http://192.168.1.63:5173
```

Adres backendu:

```text
http://192.168.1.63:5186
```

UFW ma otwarte porty:

- 5173/tcp
- 5186/tcp
- OpenSSH

## 4. Git i GitHub

Repo lokalne działa na branchu:

```text
main
```

Autor Git:

```text
Argo <kurasnataniel@gmail.com>
```

Remote:

```text
git@github.com:Argorad/era-swiata-legend.git
```

SSH do GitHub działa.

Standardowy zapis zmian:

```bash
cd ~/projects/era-swiata-legend
git add .
git commit -m "Opis zmian"
git push
```

## 5. Backend

Technologie:

- .NET 10
- Clean Architecture
- PostgreSQL 16
- EF Core
- Minimal API
- Swagger

Projekty:

```text
EraSwiataLegend.Api
EraSwiataLegend.Application
EraSwiataLegend.Domain
EraSwiataLegend.Infrastructure
```

### Endpointy światów

```text
GET  /worlds
POST /worlds
```

### Endpointy folderów

```text
GET  /worlds/{worldId}/folders
POST /worlds/{worldId}/folders
PUT  /worlds/{worldId}/folders/{folderId}
```

Działa:

- pobieranie światów
- tworzenie światów
- pobieranie folderów
- tworzenie folderów
- zmiana nazwy folderów

### CORS

W `Program.cs` jest polityka CORS dla:

```text
http://192.168.1.63:5173
```

### Encja Folder

Pola:

```text
Id
WorldId
ParentFolderId
Name
Type
CreatedAt
UpdatedAt
```

Dodany enum:

```csharp
FolderType
```

Wartości:

```text
Normal = 0
Archive = 1
Trash = 2
```

Folder ma metodę domenową:

```csharp
Rename(string name)
```

Folderów systemowych nie można zmieniać nazw.

Błąd backendu dla próby zmiany nazwy folderu systemowego:

```text
SystemFolderCannotBeRenamed
```

### Foldery systemowe

Przy tworzeniu nowego świata automatycznie powstają:

```text
Archive
Trash
```

Dla istniejących starych światów nie były automatycznie dodawane.

Migracja `AddFolderType` już istnieje i baza jest aktualna.

### DTO

`FolderDto` zawiera teraz także:

```text
Type
```

Handler `GetFoldersQueryHandler` sortuje foldery po:

1. `Type`
2. `Name`

## 6. Frontend

Technologie:

- React
- TypeScript
- Vite
- Axios

Axios:

```text
src/services/api.ts
```

Base URL:

```text
http://192.168.1.63:5186
```

Struktura istotnych plików:

```text
src/
├── components/
│   ├── FolderActions.tsx
│   ├── FolderItem.tsx
│   ├── FolderList.tsx
│   └── WorldList.tsx
├── pages/
│   └── HomePage.tsx
├── services/
│   └── api.ts
├── types/
│   ├── Folder.ts
│   └── World.ts
├── App.tsx
└── main.tsx
```

### Działające funkcje

- lista światów
- wybór świata
- podświetlenie aktywnego świata
- pobieranie folderów po wyborze świata
- tworzenie folderu z poziomu UI
- zmiana nazwy folderu z poziomu UI
- zapis zmian do PostgreSQL
- odświeżenie listy bez przeładowania strony

### Typ folderu we frontendzie

```ts
export type FolderType = 0 | 1 | 2;
```

`Folder` zawiera:

```text
id
worldId
parentFolderId
name
type
createdAt
updatedAt
```

### FolderItem

Folder zwykły:

```text
📁 Nazwa
```

Folder Archive:

```text
📦 Archive
```

Folder Trash:

```text
🗑️ Trash
```

Foldery systemowe:

- mają osobną ikonę
- mają inne tło
- nie mają menu `⋮`
- nie można ich zmieniać nazw

### Menu folderu

Komponent:

```text
FolderActions.tsx
```

Działa:

```text
✏️ Zmień nazwę
```

Widoczne, ale jeszcze wyłączone:

```text
📁 Nowy podfolder
📄 Nowa strona
📂 Przenieś
🗑️ Przenieś do kosza
```

Menu miało problem z niewidocznym tekstem przez globalne style Vite. Zostało poprawione przez jawne ustawienie koloru tekstu i stylów przycisków.

## 7. Obecne dane testowe

Główny świat:

```text
Era Świata Legend
```

ID:

```text
c564d8ab-acb5-4c93-9f71-48064280a3f0
```

Świat testowy z folderami systemowymi:

```text
Test system folders
```

ID:

```text
1cac7cac-b33e-41c8-9dbb-2f97b2228a75
```

W świecie testowym istnieją:

```text
Archive
Trash
asd
```

## 8. Ustalenia architektoniczne

Nie usuwamy danych natychmiast i bez ostrzeżenia.

Planowany model:

- `Archive` — zwykły folder systemowy na starą zawartość
- `Trash` — kosz
- przenoszenie folderów i stron między folderami
- później przywracanie z kosza
- trwałe usuwanie dopiero z kosza, najlepiej tylko dla administratora

Przy usuwaniu folderu z zawartością aplikacja ma pytać, co zrobić:

- anulować
- przenieść zawartość do innego folderu
- przenieść zawartość do Archive
- przenieść całość do Trash

`ParentFolderId` już istnieje i będzie podstawą dla:

- podfolderów
- drzewa folderów
- przenoszenia
- drag & drop

## 9. Następny krok

Najbliższa kolejność:

1. Nowy podfolder
2. Tree View folderów
3. Endpoint MoveFolder
4. UI „Przenieś...”
5. Drag & Drop
6. Przenoszenie do Archive
7. Przenoszenie do Trash
8. Strony
9. Edytor stron
10. AI i mapa później

Najbardziej bezpośredni następny krok:

```text
uruchomić opcję „📁 Nowy podfolder”
```

Powinna tworzyć folder z:

```text
ParentFolderId = id wybranego folderu
```

## 10. Ważne uwagi na przyszłe sesje

- Repozytorium GitHub jest publiczne
- Ten plik jest głównym punktem odniesienia przy kontynuacji projektu.
- Po większej funkcji należy zaktualizować ten plik, zrobić commit i push.

git@github.com:Argorad/era-swiata-legend.git

cd ~/projects/era-swiata-legend

git add .
git commit -m "Opis zmian"
git push

backend/
├── EraSwiataLegend.Api
├── EraSwiataLegend.Application
├── EraSwiataLegend.Domain
└── EraSwiataLegend.Infrastructure

5. Backend

Backend używa Clean Architecture.

Struktura:

backend/
├── EraSwiataLegend.Api
├── EraSwiataLegend.Application
├── EraSwiataLegend.Domain
└── EraSwiataLegend.Infrastructure
Technologie
ASP.NET Core Minimal API,
EF Core,
PostgreSQL,
Swagger,
dependency injection,
osobne handlery dla komend i zapytań.
Główne encje
World

Pola:

Id,
Name,
Description,
CreatedAt,
UpdatedAt.
Folder

Pola:

Id,
WorldId,
ParentFolderId,
Name,
Type,
CreatedAt,
UpdatedAt.

Relacje:

folder należy do świata,
folder może mieć folder nadrzędny,
folder może mieć podfoldery,
folder może mieć strony.
Page

Encja istnieje i jest podłączona do świata oraz folderu.

UPDATE 13.07.2026

cd ~/projects/era-swiata-legend

code PROJECT_STATE_MALE_CONFLUENCE.md

Wklej cały plik:

# Małe Confluence Ery Świata Legend — stan projektu

**Ostatnia aktualizacja:** 2026-07-13  
**Repozytorium:** https://github.com/Argorad/era-swiata-legend  
**Gałąź:** `main`

---

# 1. Cel projektu

Małe Confluence Ery Świata Legend to lekka aplikacja webowa do zarządzania wiedzą o świecie RPG.

Docelowe główne moduły:

1. wiedza przechowywana w folderach i stronach,
2. interaktywna mapa,
3. wyszukiwarka wspierana przez AI.

Aplikacja nie jest grą. Jest narzędziem dla MG, administratorów i twórców świata.

Role docelowe:

- administrator,
- MG,
- gracz tylko do odczytu.

MG i administrator mogą tworzyć oraz edytować zawartość.

---

# 2. Środowisko

## Serwer

- Ubuntu Server 24.04 LTS,
- hostname: `esl-conflu`,
- IP w sieci lokalnej: `192.168.1.63`,
- projekt znajduje się w:

```text
~/projects/era-swiata-legend
Narzędzia
.NET SDK 10,
PostgreSQL 16,
Node.js 24,
npm 12,
React,
TypeScript,
Vite,
Axios,
Git,
GitHub przez SSH.
Porty deweloperskie

Backend:

http://192.168.1.63:5186

Frontend:

http://192.168.1.63:5173

UFW ma otwarte:

SSH,
5173/tcp,
5186/tcp.
3. Uruchamianie projektu
Terminal 1 — backend
cd ~/projects/era-swiata-legend/backend

dotnet run --project EraSwiataLegend.Api --urls http://0.0.0.0:5186
Terminal 2 — frontend
cd ~/projects/era-swiata-legend/frontend

npm run dev -- --host 0.0.0.0
Kontrola portów
ss -ltnp | grep -E '5173|5186'
4. Repozytorium Git

Repozytorium GitHub:

git@github.com:Argorad/era-swiata-legend.git

Standardowy zapis zmian:

cd ~/projects/era-swiata-legend

git add .
git commit -m "Opis zmian"
git push
5. Backend

Backend używa Clean Architecture.

Struktura:

backend/
├── EraSwiataLegend.Api
├── EraSwiataLegend.Application
├── EraSwiataLegend.Domain
└── EraSwiataLegend.Infrastructure
Technologie
ASP.NET Core Minimal API,
EF Core,
PostgreSQL,
Swagger,
dependency injection,
osobne handlery dla komend i zapytań.
Główne encje
World

Pola:

Id,
Name,
Description,
CreatedAt,
UpdatedAt.
Folder

Pola:

Id,
WorldId,
ParentFolderId,
Name,
Type,
CreatedAt,
UpdatedAt.

Relacje:

folder należy do świata,
folder może mieć folder nadrzędny,
folder może mieć podfoldery,
folder może mieć strony.
Page

Encja istnieje i jest podłączona do świata oraz folderu.

6. FolderType

Dodany enum:

public enum FolderType
{
    Normal = 0,
    Archive = 1,
    Trash = 2
}

Foldery systemowe:

Archive,
Trash.

Nie można:

zmienić ich nazwy,
przenieść ich,
wyświetlać dla nich zwykłego menu akcji.

Dla nowych światów Archive i Trash tworzą się automatycznie.

Dla istniejących światów brakujące foldery systemowe są tworzone podczas pobierania folderów.

Migracja AddFolderType została utworzona i zastosowana.

7. Endpointy
Worlds
GET /worlds
POST /worlds
Folders
GET /worlds/{worldId}/folders
POST /worlds/{worldId}/folders
PUT /worlds/{worldId}/folders/{folderId}
PATCH /worlds/{worldId}/folders/{folderId}/move
Tworzenie folderu

Body:

{
  "name": "Miasta",
  "parentFolderId": null
}

parentFolderId może wskazywać folder, wewnątrz którego folder ma zostać utworzony.

Zmiana nazwy folderu

Body:

{
  "name": "Nowa nazwa"
}
Przenoszenie folderu

Body:

{
  "destinationFolderId": null
}

null oznacza główny poziom świata.

Backend zabezpiecza przed:

przeniesieniem folderu do samego siebie,
przeniesieniem folderu do własnego potomka,
przeniesieniem do folderu z innego świata,
przeniesieniem folderu systemowego.
8. Frontend

Frontend używa:

React,
TypeScript,
Vite,
Axios.

Struktura najważniejszych plików:

frontend/src/
├── components/
│   ├── FolderActions.tsx
│   ├── FolderItem.tsx
│   ├── FolderList.tsx
│   ├── FolderTreeNode.tsx
│   ├── MoveFolderDialog.tsx
│   └── WorldList.tsx
├── pages/
│   └── HomePage.tsx
├── services/
│   └── api.ts
├── types/
│   ├── Folder.ts
│   └── World.ts
├── App.tsx
└── main.tsx

Axios korzysta z:

http://192.168.1.63:5186

CORS w backendzie dopuszcza frontend:

http://192.168.1.63:5173
9. Aktualnie działające funkcje
Światy
lista światów,
wybór świata,
podświetlanie wybranego świata,
automatyczne pobieranie folderów wybranego świata.
Foldery
pobieranie folderów,
tworzenie folderu,
wybór folderu nadrzędnego podczas tworzenia,
zmiana nazwy folderu,
przenoszenie folderu,
przenoszenie na główny poziom,
archiwizowanie przez przeniesienie do Archive,
przenoszenie do Trash,
trwałość zmian po odświeżeniu strony.
Drzewo folderów
foldery są wyświetlane hierarchicznie na podstawie ParentFolderId,
widoczne są linie drzewa,
podfoldery mają wcięcia,
foldery można zwijać i rozwijać,
przycisk ▶ rozwija,
przycisk ▼ zwija.
Okno przenoszenia

Lista miejsc docelowych:

pokazuje strukturę drzewa,
nie pokazuje przenoszonego folderu,
nie pokazuje jego potomków,
nie pozwala stworzyć pętli,
nie pozwala zatwierdzić aktualnej lokalizacji.
Menu folderu

Menu ⋮ zawiera:

zmień nazwę,
przenieś,
archiwizuj,
przenieś do kosza.

Foldery systemowe nie mają tego menu.

10. Testy wykonane

Potwierdzono działanie:

dotnet build,
npm run build,
pobieranie światów,
pobieranie folderów,
tworzenie folderu,
zmiana nazwy folderu,
zapis zmiany nazwy w bazie,
przenoszenie folderów,
zapis ParentFolderId,
przenoszenie do Archive,
przenoszenie do Trash,
hierarchiczne wyświetlanie drzewa,
rozwijanie i zwijanie folderów,
tworzenie folderu od razu w wybranym folderze,
odświeżenie strony zachowuje dane.
11. Aktualne dane testowe

Główny świat:

Era Świata Legend

ID:

c564d8ab-acb5-4c93-9f71-48064280a3f0

W bazie znajdują się między innymi testowe foldery:

Królestwa,
Imperium Arkan,
Archive,
Trash,
kilka folderów testowych.

Dane testowe można później posprzątać.

12. Aktualny stan UI

Interfejs ma dwie kolumny:

światy po lewej,
foldery wybranego świata po prawej.

Drzewo działa funkcjonalnie, ale wygląd jest jeszcze roboczy.

Obecne style są zapisane głównie inline w komponentach React.

Docelowo style należy przenieść do osobnych plików CSS lub modułów CSS.

13. Następny krok

Następna sesja powinna zacząć się od uporządkowania obsługi folderów.

Najbliższe zadania
Dodać opcję Nowy podfolder bezpośrednio w menu ⋮.
Po kliknięciu Nowy podfolder otworzyć formularz z automatycznie wybranym folderem nadrzędnym.
Dodać działające otwieranie folderu po kliknięciu jego nazwy.
Pokazywać zawartość aktualnie otwartego folderu.
Zacząć obsługę stron wewnątrz folderów.
Dodać tworzenie strony.
Dodać edycję tytułu i treści strony.
Później dodać przywracanie z Trash.
Później dodać przenoszenie elementów z Archive i Trash do innych folderów.
Później dodać drag and drop.
Najbardziej logiczny następny pakiet
Nowy podfolder + kliknięcie folderu + widok jego zawartości

Po tym można przejść do stron.

14. Ustalenia dotyczące pracy

Podczas kolejnych sesji:

podawać kilka kroków jednocześnie,
dawać pełne finalne pliki,
nie kazać ręcznie dopisywać pojedynczych linii,
przed edycją podawać:
cd ~/projects/era-swiata-legend/frontend
code ścieżka/do/pliku

lub:

cd ~/projects/era-swiata-legend/backend
code ścieżka/do/pliku

Nie używać:

code .

bo otwiera nowe okno VS Code.

Po większym pakiecie zmian:

dotnet build,
npm run build,
uruchomienie backendu i frontendu,
masowy test,
commit i push.
15. Komenda na rozpoczęcie następnej sesji

W nowym czacie napisać:

Kontynuujemy projekt Małe Confluence Ery Świata Legend.

Repo:
https://github.com/Argorad/era-swiata-legend

Przeczytaj aktualny plik:
PROJECT_STATE_MALE_CONFLUENCE.md

Kontynuujemy od:
Nowy podfolder + kliknięcie folderu + widok jego zawartości.

Podawaj całe finalne pliki i kilka zmian naraz.

## 2. Zapisz wszystko do GitHuba

```bash
cd ~/projects/era-swiata-legend

git add .
git status
git commit -m "Add collapsible folder tree and update project state"
git push
3. Szybka kontrola
cd ~/projects/era-swiata-legend

git status
git log --oneline -5

git status powinien pokazać:

nothing to commit, working tree clean

Na jutro zaczynamy od Nowy podfolder + kliknięcie folderu + widok zawartości folderu.
