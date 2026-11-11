# Warehouse Barcode Studio — raport projektu

## Cel

Stworzyć publiczną, statyczną aplikację do zamiany tekstowych identyfikatorów na etykiety z kodami kreskowymi/QR. Aplikacja ma działać po stronie przeglądarki, aby żadne dane magazynowe nie były wysyłane na serwer, zapisywane w logach ani umieszczane w repozytorium.

## Co zostało stworzone

- Projekt React + TypeScript + Vite o nazwie **Warehouse Barcode Studio**.
- Generator `Code 128`, `Code 39`, `Code 93` i `QR` oparty o sprawdzone biblioteki klienckie.
- Pole wielu wierszy: każdy niepusty wiersz jest jednym kodem. Białe znaki na brzegach są usuwane, puste wiersze są pomijane.
- Import `.xlsx`, `.xls`, `.docx`, `.md` i `.txt`:
  - Excel: każda niepusta komórka, we wszystkich arkuszach i w kolejności skoroszytu, staje się jedną pozycją;
  - Word/TXT: każdy niepusty wiersz tekstu;
  - Markdown: tekstowe wiersze, z usuniętym podstawowym znacznikiem listy/nagłówka.
- Walidacja wejścia, w tym ograniczenia Code 39 i Code 93, oraz widoczne komunikaty przy błędnych pozycjach.
- Podgląd kolejki etykiet i wybranej pojedynczej etykiety.
- Eksport pojedynczy do PNG/SVG i eksport całej prawidłowej kolejki do PDF/ZIP (ZIP zawiera PNG i SVG).
- Drukowanie przez natywne okno przeglądarki z profilami: Zebra ZD220 4 × 6 cali, 100 × 50 mm, 70 × 32 mm, 50 × 25 mm i format własny.
- Responsywny interfejs w stylistyce portfolio: głęboki granat/fiolet, transparentne zaokrąglone karty, kapsuły, animowane logo i subtelne ruchy tła. Jest też tryb jasny jako gradient szarości i złamanej bieli — bez czystego białego tła interfejsu.
- Testy jednostkowe parsera linii, walidacji plików i formatów kodów.
- GitHub Actions do testowania, budowania i wdrożenia na GitHub Pages z poprawnym `base` dla `/Warehouse-Barcode-Studio/`.

## Jak i dlaczego

Projekt jest statyczny, bo generator nie potrzebuje konta, bazy danych ani serwera. To ogranicza ryzyko ujawnienia danych magazynowych i pozwala hostować narzędzie na GitHub Pages. Import oraz generowanie odbywają się w pamięci przeglądarki. Eksport tworzy pliki dopiero na żądanie użytkownika.

Do generowania liniowych kodów użyto `JsBarcode`, QR tworzy `qrcode`, Excel czyta `SheetJS`, dokumenty Word — `Mammoth`, PDF — `jsPDF`, a paczki — `JSZip`. Takie rozdzielenie pozwala obsłużyć wskazane formaty bez backendu.

## Zasada aktualizacji raportu

**Po każdej materialnej zmianie projektu należy zaktualizować ten plik**: dodać wpis do dziennika, opisać co zmieniono, jak zostało sprawdzone i ewentualne ograniczenia. Nie wpisujemy tu prawdziwych wartości magazynowych, danych z importów, plików użytkownika, kluczy ani logów.

## Dziennik zmian

### 2026-11-11 — wersja początkowa

- Utworzono projekt, strukturę raportowania i konfigurację Vite/GitHub Actions.
- Zaimplementowano interfejs, import plików, generatory kodów, walidację, eksporty i profile drukowania.
- Dodano politykę lokalnego przetwarzania: brak backendu, brak trwałego zapisu wartości i wykluczenie logów/sekretów z Git.
- Dodano testy parsera i walidacji. Stan wdrożenia GitHub Pages zostanie dopisany dopiero po rzeczywistym utworzeniu repozytorium, wypchnięciu zmian i zakończeniu CI.
- Poprawiono zgodność importu typu React z rygorystyczną kompilacją TypeScript przed końcową walidacją builda.
- Zoptymalizowano pierwszy pakiet: duże moduły importu Excel/Word i eksportu PDF/ZIP są ładowane dopiero przy użyciu danej funkcji.
- Rzeczywiście utworzono publiczne repozytorium `AndrewDul/Warehouse-Barcode-Studio` i wypchnięto pierwszy commit (`747641e`). GitHub Actions rozpoczęło workflow, lecz konto zgłosiło blokadę rozliczeniową: job nie mógł wystartować. Nie zmieniano danych płatniczych. Wprowadzono bezpieczny fallback GitHub Pages z wersją statyczną w śledzonym folderze `docs/` na `main`; workflow CI pozostaje przygotowany na czas po usunięciu blokady.
- GitHub Pages skonfigurowano jako `main` → `/docs`. Zostało zweryfikowane faktyczne publiczne działanie strony pod adresem `https://andrewdul.github.io/Warehouse-Barcode-Studio/` (HTTP 200 oraz widoczny interfejs aplikacji). Workflow CI nadal ma status failed wyłącznie z powodu blokady rozliczeniowej konta GitHub Actions; hosting statyczny działa niezależnie od tej blokady.

### 2026-11-11 — tryb pojedynczego skanowania i arkusze drukarki biurowej

- Przeniesiono ustawienia druku i eksportu do lewej kolumny, pod polem importu/generowania.
- Dodano profile zwykłej drukarki: A4 3 × 7 (21 etykiet), A4 2 × 5 (10 dużych etykiet), A5 2 × 4 oraz US Letter 3 × 10. Profile urządzeń etykietowych pozostały dostępne.
- Druk w przeglądarce i eksport PDF wykorzystują teraz wymiary strony, wymiary pojedynczej etykiety oraz układ kolumn/wierszy. Dla arkuszy biurowych PDF umieszcza wiele etykiet na jednej stronie.
- Dodano duży panel „Scan one label” nad kolejką: wyświetla pojedynczy kod, licznik pozycji, przyciski poprzedni/następny oraz wyszukiwanie fragmentu wartości kodu bez rozróżniania wielkości liter.
- Kolejka pod panelem skanowania jest przewijana pionowo i nie wydłuża strony bez końca przy dużych importach. Kliknięcie miniatury wybiera ją również w panelu pojedynczego skanowania.
- Przed drukiem aktywne wyszukiwanie jest automatycznie czyszczone, aby do drukarki zawsze trafił pełny zestaw prawidłowych etykiet, a nie przypadkowo tylko wyniki filtrowania.
