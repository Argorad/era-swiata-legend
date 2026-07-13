# AGENTS.md

## 1. Projekt

- Nazwa projektu: **Małe Confluence Ery Świata Legend**.
- Backend: .NET 10, ASP.NET Core Minimal API, EF Core, PostgreSQL i Clean Architecture.
- Frontend: React, TypeScript, Vite i Axios.
- Głównym dokumentem aktualnego stanu projektu jest `PROJECT_STATE_MALE_CONFLUENCE.md`.
- Przed rozpoczęciem pracy przeczytaj główny dokument stanu, sprawdź `git status` oraz ostatnie commity.
- Dokumentację zawsze porównuj z aktualnym kodem.

## 2. Bezpieczeństwo danych

- Nigdy nie usuwaj, nie resetuj ani nie zastępuj bazy danych bez jednoznacznego polecenia użytkownika.
- Nie wykonuj `DROP`, `TRUNCATE`, masowego `DELETE`, `database update 0`, `migrate down` ani podobnych operacji destrukcyjnych.
- Nie usuwaj ani nie odtwarzaj migracji bez wyraźnej zgody użytkownika.
- Nie usuwaj światów, folderów, stron, załączników ani danych testowych bez zgody użytkownika.
- Preferuj archiwum i kosz zamiast trwałego usuwania.
- Diagnostykę PostgreSQL wykonuj w trybie `READ ONLY`, jeśli jest to możliwe.
- Pamiętaj, że endpoint `GET /worlds/{worldId}/folders` może dopisać brakujące foldery systemowe.

## 3. Bezpieczeństwo Git i systemu

- Nigdy nie wykonuj `git reset --hard`, `git clean -fd`, `git checkout --`, `git restore` ani podobnych poleceń bez jednoznacznej zgody użytkownika.
- Zachowuj istniejące, niezatwierdzone zmiany użytkownika.
- Nie używaj `sudo` bez jednoznacznego polecenia użytkownika.
- Nie wykonuj commita, nie pushuj i nie twórz pull requestu bez polecenia użytkownika.

## 4. Zasady zmian

- Przy prośbie o analizę lub diagnozę niczego nie zmieniaj.
- Przed zmianą kodu przedstaw krótki plan i zaczekaj na potwierdzenie użytkownika.
- Wprowadzaj małe, logicznie powiązane zmiany.
- Nie zmieniaj ręcznie katalogów `bin/`, `obj/`, `dist/` ani `node_modules/`.
- Nie instaluj pakietów NuGet lub npm ani nie zmieniaj zależności bez zgody użytkownika.
- Nową migrację twórz tylko po zmianie modelu bazy. Przed zastosowaniem migracji do bazy pokaż jej zakres i poproś o osobne potwierdzenie.
- Po większej funkcji zaproponuj aktualizację `PROJECT_STATE_MALE_CONFLUENCE.md`.

## 5. Standardy aplikacji

- Zachowuj podział na warstwy `Api`, `Application`, `Domain` i `Infrastructure`.
- Logika biznesowa ma być egzekwowana po stronie backendu, a nie tylko frontendu.
- Foldery systemowe `Archive` i `Trash` nie mogą być zmieniane ani przenoszone.
- Archiwizacja świata nie może usuwać jego danych.
- Zachowuj polskie komunikaty w interfejsie.
- Pokazuj potwierdzenie przed potencjalnie destrukcyjną akcją.
- Nie wpisuj nowych adresów API bezpośrednio w komponentach.

## 6. Weryfikacja i raport

- Po zatwierdzonych zmianach uruchom odpowiednie buildy i testy.
- Po zmianach sprawdź `git status` i pokaż `git diff`.
- W podsumowaniu podaj:
  - zmienione pliki,
  - wykonane testy,
  - niewykonane testy,
  - informację, czy schemat lub dane bazy zostały zmienione.
