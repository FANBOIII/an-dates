# A+N Dates – Einrichtung

Dauer: ca. 20 Minuten. Am PC geht es am einfachsten.

## 1. Supabase-Projekt anlegen
1. Auf supabase.com einen kostenlosen Account anlegen.
2. „New project“: Name `an-dates`, ein Datenbank-Passwort vergeben (irgendwo notieren), Region **Frankfurt (Central EU)**. Erstellen und 1–2 Minuten warten.

## 2. Datenbank einrichten
1. Die Datei `setup.sql` öffnen und oben eure **zwei E-Mail-Adressen** eintragen (statt `DEINE_EMAIL@example.com` und `IHRE_EMAIL@example.com`).
2. In Supabase links **SQL Editor** → „New query“ → den kompletten Inhalt von `setup.sql` einfügen → **Run**.
3. Es muss „Success“ erscheinen.

## 3. E-Mail-Bestätigung ausschalten
Ihr meldet euch mit E-Mail und Passwort an, ohne Bestätigungsmail.
1. Links **Authentication** (Schloss-Symbol) → **Sign In / Providers** → **Email**.
2. **Confirm email** ausschalten → Save.
Fremde könnten sich dadurch zwar ein Konto anlegen, sehen aber nichts: Daten gibt es nur für E-Mails aus der Tabelle `members`.

## 4. Schlüssel in config.js eintragen
1. In Supabase oben auf **Connect** klicken (oder Project Settings → API Keys).
2. Die **Project URL** und den **anon public**-Key kopieren. Wenn es den nicht gibt: den **Publishable key**.
3. Beides in `config.js` an die markierten Stellen einfügen und speichern.

## 5. Auf GitHub Pages veröffentlichen
1. Auf github.com einen Account anlegen.
2. Oben rechts „+“ → **New repository** → Name `an-dates`, **Public** → Create.
3. „uploading an existing file“ anklicken und diese Dateien hochladen:
   `index.html`, `app.js`, `config.js`, `manifest.webmanifest`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
   **Nicht hochladen:** `setup.sql`, da stehen eure E-Mails drin.
4. „Commit changes“.
5. Im Repository **Settings** → **Pages** → Source „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.
6. Nach 1–2 Minuten ist die App erreichbar unter `https://DEIN-GITHUB-NAME.github.io/an-dates/`.

## 6. Auf die iPhones holen
1. Den Link in **Safari** öffnen.
2. E-Mail und ein Passwort eingeben → beim ersten Mal **Konto erstellen**, später **Anmelden** → Vornamen eintragen.
3. Teilen-Symbol → **Zum Home-Bildschirm**. Jetzt erscheint das A+N-Icon und die App öffnet im Vollbild.
4. Deine Freundin macht dasselbe auf ihrem iPhone mit ihrer E-Mail. Danach seht ihr beide dieselben Dates.

Wichtig: Anmelden in der App auf dem Home-Bildschirm, nicht nur in Safari. Beide speichern den Login getrennt.

## Gut zu wissen
- **Pause nach 7 Tagen:** Wenn eine Woche niemand die App öffnet, pausiert Supabase das Projekt. Dann auf supabase.com einloggen und beim Projekt auf „Restore“ klicken. Die Daten bleiben erhalten.
- **Weitere Person freischalten:** In Supabase → Table Editor → Tabelle `members` → E-Mail hinzufügen.
- **Änderungen an der App:** Datei auf GitHub ersetzen, nach 1–2 Minuten ist sie live. Auf dem iPhone die App einmal ganz schließen und neu öffnen.
- **Wetter** kommt automatisch von Open-Meteo, sobald das Date weniger als ca. 2 Wochen entfernt ist. Der Sonnenuntergang wird immer angezeigt.
