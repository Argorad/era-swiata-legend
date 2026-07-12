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

- Repozytorium GitHub jest prywatne.
- Sam link do prywatnego repo nie gwarantuje automatycznego dostępu do kodu.
- Ten plik jest głównym punktem odniesienia przy kontynuacji projektu.
- Po większej funkcji należy zaktualizować ten plik, zrobić commit i push.
