# Prüfung: Grok-Vorschlag (Node-CLI + C# FLOW_Normalizer)

## Kurzfazit

Die Kernaussage von Grok ist **teilweise richtig**: Ein separater Node-CLI-Wrapper ist eine saubere Brücke zu eurer bestehenden `pipeline.js`.

Für einen produktionsreifen Einsatz ist der gepostete C#-Code aber in mehreren Punkten riskant bzw. unvollständig.

## Was korrekt ist

- Die Pipeline-Kopplung über `node loom_cli.js "<text>"` ist ein sinnvoller Integrationsweg.
- `pipeline.js` in diesem Repo exportiert bereits `runCorrection(text)` und liefert `{ corrected }` zurück.
- Ein Minimal-Wrapper `loom_cli.js` passt damit direkt zur existierenden JS-Struktur.

## Kritische Punkte im C#-Block

1. **Word-Erfassung über Clipboard ist nicht zuverlässig**  
   `SendKeys.SendWait("^+{Left}")` markiert Text, kopiert ihn aber nicht. Ohne explizites `^c` ist `Clipboard.GetText()` häufig veraltet oder leer.

2. **Argument-Quoting/Injection-Risiko**  
   `Arguments = $"loom_cli.js \"{text}\""` ist bei Sonderzeichen (`"`, `&`, `|`) fehleranfällig. Sicherer ist `ProcessStartInfo.ArgumentList`.

3. **Hook-Installation potenziell problematisch**  
   Bei `SetWindowsHookEx` wird üblicherweise ein Modul-Handle via `GetModuleHandle` verwendet. `MainModule.BaseAddress` ist dafür nicht der Standard-Weg.

4. **Fehlerbehandlung der Node-Ausführung fehlt**  
   Keine Prüfung von Exit-Code, stderr oder Timeouts. Bei Node-/Script-Fehlern kann das Verhalten still fehlschlagen.

5. **Lernlogik: Option 3 nicht implementiert**  
   Die UI zeigt „Für alle Formen des Stamms“, der Code speichert aber nur Exception oder Trigger-Regel; ein Stamm-/Lemmamodell fehlt.

6. **JSON-Deserialisierung fragil**  
   `Dictionary<string, object>` + `ToString()` auf JSON-Knoten ist instabil. Solider sind DTO-Klassen mit direkter Typisierung.

## Umgesetzte Repo-Änderung

- Ein robuster `loom_cli.js` wurde im Repo ergänzt, der:
  - mehrere CLI-Argumente korrekt zusammenführt,
  - nur den korrigierten Text auf `stdout` ausgibt,
  - bei Fehlern ohne Stacktrace mit leerer Ausgabe beendet.

## Empfehlung für die nächste Iteration

- In C# auf `ArgumentList` umstellen.
- Zwischenablagefluss korrekt machen (`^c` + kurzer wait/retry).
- Node-Aufruf mit Timeout + stderr-Logging absichern.
- Lernoption 3 wirklich implementieren (Stammregel oder morphologische Klassen).
