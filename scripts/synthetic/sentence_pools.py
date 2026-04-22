"""Large combinatorial sentence-fragment pools per dataset type.

Pool sizes are intentionally large so that many cycles can sample fresh
tuples without exhausting the unique-combination budget. The structure is
start x subject/action x modifier x tail, and each dataset type has its
own pools that respect language, difficulty, and voice.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# flow-de-easy-neutral
# ---------------------------------------------------------------------------

DE_EASY_STARTS = [
    "Heute", "Morgen", "Am Abend", "Nach der Arbeit", "Vor dem Mittag",
    "Am Wochenende", "Später", "Gerade", "Im Bus", "Zu Hause",
    "Im Büro", "Nach dem Sport", "Nach dem Regen", "Vor der Tür", "In der Küche",
    "Im Flur", "Im Park", "Auf dem Weg", "Gegen acht", "Kurz davor",
    "In der Mittagspause", "Am Nachmittag", "Kurz nach dem Aufstehen", "Gegen Mittag",
    "Auf dem Heimweg", "Am frühen Morgen", "Vor dem Schlafengehen", "Nach dem Frühstück",
    "Im Wohnzimmer", "Beim Warten", "An der Kasse", "Am Schreibtisch",
    "In der Bahn", "Vor dem Termin", "Im Treppenhaus", "Nach dem Einkauf",
    "Beim Kochen", "Nach dem Telefonat", "Auf der Terrasse", "In der Bibliothek",
]

DE_EASY_ACTIONS = [
    "bringe ich den Müll raus", "hole ich Brot beim Bäcker", "rufe ich meine Mutter an",
    "lade ich mein Handy", "räume ich den Tisch ab", "schließe ich das Fenster",
    "gehe ich früh schlafen", "suche ich meinen Schlüssel", "trinke ich einen Tee",
    "nehme ich den nächsten Zug", "putze ich meine Schuhe", "bezahle ich die Rechnung",
    "packe ich meine Tasche", "lese ich die Nachricht", "warte ich an der Haltestelle",
    "öffne ich das Paket", "spüle ich das Geschirr", "prüfe ich den Fahrplan",
    "bringe ich das Fahrrad in den Keller", "stelle ich den Wecker",
    "schreibe ich eine kurze Notiz", "gieße ich die Pflanzen", "schneide ich Gemüse",
    "hänge ich die Wäsche auf", "sortiere ich die Post", "räume ich die Küche auf",
    "mache ich einen kurzen Spaziergang", "höre ich etwas Musik", "koche ich Nudeln",
    "lüfte ich das Zimmer", "wische ich den Boden", "schreibe ich eine Antwort",
    "hole ich den Einkauf rein", "fahre ich zum Supermarkt", "trage ich den Karton hoch",
    "mache ich das Licht aus", "lege ich das Buch zurück", "falte ich die Handtücher",
    "fülle ich die Flasche auf", "bereite ich das Abendessen vor",
]

DE_EASY_TAILS = [
    "und bleibe entspannt", "bevor es dunkel wird", "ohne Eile",
    "mit guter Laune", "für morgen", "bis alles passt",
    "für den nächsten Tag", "weil es sonst zu spät wird",
    "und spare dabei Zeit", "damit ich nichts vergesse",
    "und mache dann Feierabend", "ohne großen Aufwand",
    "wenn es gerade passt", "in Ruhe", "mit einem kurzen Lächeln",
    "bevor ich es vergesse", "solange der Tag noch ruhig ist",
    "und plane den Abend entspannt", "damit ich danach abschalten kann",
    "während draußen alles leise bleibt", "und bin dann fertig",
    "mit klarem Kopf", "ohne Stress",
]

# ---------------------------------------------------------------------------
# flow-de-medium-mixed
# ---------------------------------------------------------------------------

DE_MEDIUM_LEADS = [
    "Seit letzter Woche", "Wenn der Zug pünktlich ist", "Obwohl es morgens kalt ist",
    "Sobald ich im Büro ankomme", "Während der Mittagspause",
    "Nachdem der Unterricht endet", "Falls der Supermarkt noch offen ist",
    "Wenn der Aufzug wieder steht", "Weil heute viel los war", "Auch ohne Termin",
    "Da das Wetter umgeschlagen ist", "Sobald die Mails erledigt sind",
    "Wenn der Anruf etwas länger dauert", "Solange der Ladestand reicht",
    "Falls der Termin verschoben wird", "Nachdem der Paketbote geklingelt hat",
    "Während das Essen noch warm ist", "Wenn die Kinder gerade spielen",
    "Sobald ich den Schlüssel wiedergefunden habe", "Weil die Straße gesperrt war",
    "Obwohl die Liste schon lang genug ist", "Nachdem der Bericht abgeschickt wurde",
    "Solange das Wochenende noch nicht begonnen hat", "Während ich auf den Bus warte",
    "Sobald die Aufgabe freigegeben ist",
]

DE_MEDIUM_MIDS = [
    "plane ich den Abend genauer", "nehme ich mir Zeit für offene Mails",
    "spreche ich kurz mit der Nachbarin", "sortiere ich die Unterlagen neu",
    "bestelle ich die fehlenden Teile", "frage ich im Team nach einer Rückmeldung",
    "schreibe ich die wichtigsten Punkte auf",
    "verschiebe ich den Termin auf morgen", "gehe ich die To-do-Liste ruhig durch",
    "kläre ich den Rest telefonisch",
    "räume ich schnell den Posteingang auf", "notiere ich den Zwischenstand im Dokument",
    "markiere ich offene Punkte für das Team", "schreibe ich den Vertreter über den Stand an",
    "bereite ich die Unterlagen für morgen vor", "koordiniere ich den nächsten Anruf",
    "plane ich einen kurzen Spaziergang ein", "mache ich zehn Minuten Pause",
    "trinke ich einen zweiten Kaffee", "strukturiere ich den Nachmittag neu",
]

DE_MEDIUM_ENDS = [
    "damit der nächste Tag leichter startet", "auch wenn es später wird",
    "bevor neue Aufgaben dazukommen", "ohne den Überblick zu verlieren",
    "weil kleine Schritte heute reichen", "sodass nichts liegen bleibt",
    "wenn die Verbindung stabil bleibt", "und halte mich an den Plan",
    "während draußen schon die Lichter angehen", "obwohl ich eigentlich müde bin",
    "bevor der nächste Termin beginnt", "damit alle auf demselben Stand sind",
    "ohne den Tag zusätzlich zu überladen", "auch wenn die Lage noch unklar ist",
    "weil der Abend sonst zu voll wird", "solange die Zeit dafür reicht",
    "damit das Wochenende frei bleibt", "und lasse Kleinigkeiten bewusst liegen",
]

DE_MEDIUM_FRAME = [
    "in Ruhe", "mit kurzem Rückblick", "mit einer kleinen Pause davor",
    "eher methodisch", "ohne Umwege",
]

# ---------------------------------------------------------------------------
# flow-de-hard-mixed
# ---------------------------------------------------------------------------

DE_HARD_A = [
    "Obwohl der Kalender eng getaktet ist",
    "Während im Hintergrund noch Rückfragen eingehen",
    "Da die Lieferung verspätet eingetroffen war",
    "Wenn mehrere Themen parallel Aufmerksamkeit fordern",
    "Weil die Abstimmung erst am Abend abgeschlossen wurde",
    "Sobald die letzte Korrekturschleife dokumentiert ist",
    "Damit der Übergang in die nächste Woche ruhig gelingt",
    "Selbst wenn einzelne Details kurzfristig geändert werden",
    "Da der ursprüngliche Plan mehrfach angepasst wurde",
    "Nachdem die Prioritäten neu gesetzt worden sind",
    "Solange die offenen Rückmeldungen nicht zusammengetragen sind",
    "Wenn die Rahmenbedingungen sich erneut verschoben haben",
    "Auch dann, wenn die beteiligten Rollen nicht vollständig besetzt sind",
    "Sobald die kritischen Abhängigkeiten sauber benannt sind",
    "Obwohl die Entscheidungslage mehrfach neu bewertet wurde",
    "Während zusätzliche Stakeholder erst spät eingebunden werden konnten",
    "Falls eine frühere Annahme durch neue Daten nicht mehr trägt",
    "Sobald die Rückkopplung mit der angrenzenden Initiative gesichert ist",
]

DE_HARD_B = [
    "halte ich die Reihenfolge bewusst stabil und verteile die offenen Punkte auf klare Zeitfenster",
    "formuliere ich die Rückmeldung so präzise, dass Missverständnisse später kaum noch entstehen",
    "lege ich zuerst fest, welche Schritte zwingend heute erledigt werden müssen",
    "prüfe ich jede Abhängigkeit einzeln, bevor ich eine Zusage abgebe",
    "lasse ich genug Puffer, damit spontane Änderungen nicht den ganzen Ablauf kippen",
    "sammle ich Gegenargumente direkt mit, um in der nächsten Runde schneller entscheiden zu können",
    "arbeite ich mit kurzen Zwischenständen, damit alle Beteiligten denselben Kenntnisstand behalten",
    "dokumentiere ich den Verlauf unmittelbar, statt mich auf spätere Erinnerung zu verlassen",
    "schiebe ich nichtkritische Aufgaben bewusst nach hinten, ohne sie aus dem Blick zu verlieren",
    "kläre ich offene Verantwortlichkeiten zuerst, weil danach fast alle Fragen leichter lösbar sind",
    "ordne ich Entscheidungen nach Risiko und Reichweite, um Umbuchungen früh sichtbar zu machen",
    "trenne ich inhaltliche von prozessualen Rückmeldungen, damit beides fair behandelt wird",
    "bündele ich ähnliche Rückfragen, um unnötige Kontextwechsel zu reduzieren",
]

DE_HARD_C = [
    "was den Aufwand trotz hoher Dichte beherrschbar macht",
    "wodurch der Rest des Teams verlässlich weiterarbeiten kann",
    "auch wenn die Entscheidungslage lange unübersichtlich blieb",
    "sodass die Umsetzung nicht an Kleinigkeiten scheitert",
    "während parallel bereits die nächste Frist näher rückt",
    "ohne zusätzliche Hektik in den Ablauf zu bringen",
    "damit spätere Korrekturen kleiner und planbarer bleiben",
    "und die Entscheidung auch rückblickend nachvollziehbar bleibt",
    "ohne dass Qualität für kurzfristige Entlastung geopfert wird",
    "sodass Rückfragen gezielt und nicht reflexhaft beantwortet werden",
    "auch dann, wenn der Zeitdruck spürbar zunimmt",
    "ohne dass der Gesamtblick auf das Ziel verloren geht",
    "damit die angrenzenden Arbeitsstränge stabil bleiben",
    "sodass keine Einzelentscheidung das Gesamtbild kippen kann",
]

DE_HARD_FRAME = [
    "in der aktuellen Woche", "unter den gegebenen Bedingungen",
    "im Rahmen der bisherigen Absprachen", "mit Blick auf die kommende Freigabe",
    "auch ohne zusätzliche Eskalationsstufe", "trotz kurzfristiger Änderungen",
    "angesichts der verschobenen Zeitleiste", "bei ansonsten stabiler Ausgangslage",
    "mit vertretbarem organisatorischem Aufwand", "auf Basis der geklärten Verantwortlichkeiten",
]

# ---------------------------------------------------------------------------
# flow-en-easy-neutral
# ---------------------------------------------------------------------------

EN_EASY_STARTS = [
    "Today", "Tomorrow", "After work", "Before lunch", "In the evening",
    "At home", "On the bus", "At the office", "This weekend", "Right now",
    "After the rain", "Near the station", "In the hallway", "In the kitchen",
    "On my break", "Around eight", "Later", "Early in the morning",
    "Before bed", "On the way",
    "After class", "Around noon", "In the afternoon", "After dinner",
    "While waiting", "At the counter", "In the living room", "By the window",
    "On the train", "Before the call", "Right after lunch", "Near the park",
    "In the elevator", "At the desk", "On the porch", "In the library",
    "After the meeting", "Just before eight", "Just after seven", "In the garage",
]

EN_EASY_ACTIONS = [
    "I charge my phone", "I call my sister", "I check the train app",
    "I clean the table", "I fold the laundry", "I water the plants",
    "I lock the door", "I pack my bag", "I answer a message", "I buy bread",
    "I take a short walk", "I wash the dishes",
    "I set an alarm", "I open the parcel", "I pay the bill", "I find my keys",
    "I refill my bottle", "I print the ticket", "I move my bike", "I make tea",
    "I sort the mail", "I write a short note", "I cook some pasta",
    "I air out the room", "I wipe the counter", "I reply to an email",
    "I bring in the groceries", "I take the trash out", "I turn off the lights",
    "I put the book back", "I fold the towels", "I refill the kettle",
    "I start the dishwasher", "I rinse a glass", "I tidy my desk",
    "I put on a podcast", "I check the mailbox", "I heat up my dinner",
    "I close the curtains", "I prep my lunch",
]

EN_EASY_TAILS = [
    "before it gets late", "without rushing", "to save time tomorrow",
    "so I do not forget", "and then I relax", "while the room is quiet",
    "with a clear head", "after a long day", "for the next morning",
    "and keep things simple", "before my next call", "with no stress",
    "while the light is still good", "so the evening stays calm",
    "before the kitchen gets busy", "and then I take a break",
    "so I can focus later", "while my tea steeps",
    "with a steady pace", "before I sit down",
]

# ---------------------------------------------------------------------------
# flow-en-medium-teen
# ---------------------------------------------------------------------------

EN_MED_LEADS = [
    "Before first period", "After math class", "When the bell rings",
    "If the lab is open", "During lunch", "On the way to practice",
    "Right after school", "When the group chat is quiet",
    "Before the quiz starts", "Since our project got moved",
    "After English class", "Before the bus comes", "When my teacher emails back",
    "If the library stays open late", "During study hall", "After practice ends",
    "Before homeroom", "When the hallway clears out", "Before the next test",
    "When my group finally replies", "If we finish early", "After the assembly",
    "Before our next meet", "When the wifi cooperates", "Once I grab a snack",
]

EN_MED_MIDS = [
    "I review my notes for ten minutes", "I ask my friend to check my outline",
    "I finish the missing homework section",
    "I send the slide draft to my partner", "I fix the code example in our report",
    "I rewrite the opening paragraph",
    "I organize my locker for tomorrow", "I compare answers with Maya",
    "I message the teacher about the deadline", "I plan my study blocks",
    "I finally update my study sheet", "I ask my sister to quiz me",
    "I rewrite three lines of my essay", "I clean up the shared doc",
    "I make a small checklist for tomorrow", "I reread the last chapter quickly",
    "I copy the new formulas into my notebook", "I fix the broken citation",
]

EN_MED_ENDS = [
    "so I am not scrambling at night", "because practice runs late",
    "even if my bus is crowded", "before the next assignment drops",
    "and it keeps my week manageable", "since we present on Friday",
    "without skipping dinner", "while my phone stays on silent",
    "and I can actually sleep on time", "so the weekend is less stressful",
    "while the hallway is still calm", "before everyone floods the chat",
    "so I do not lose track", "since the deadline quietly shifted",
    "so nothing piles up later", "while my battery still holds",
]

EN_MED_FRAME = [
    "just to be safe", "without making a big deal of it",
    "as a quick reset", "step by step", "just in case",
]

# ---------------------------------------------------------------------------
# flow-en-hard-mixed
# ---------------------------------------------------------------------------

EN_HARD_A = [
    "Although the timeline shifted twice this week",
    "While new requests keep arriving in parallel",
    "Because the first draft exposed several gaps",
    "When priorities conflict across the same afternoon",
    "Since the final review starts earlier than expected",
    "After we mapped the dependencies in detail",
    "Even if the plan looks stable on paper",
    "As soon as the latest feedback is logged",
    "Given that the handoff window is unusually narrow",
    "Once the outstanding blockers are clearly tagged",
    "While two reviewers are still catching up on context",
    "Because the scope grew after the last alignment call",
    "Since the rollout window narrowed again overnight",
    "When several stakeholders push back at the same time",
    "After the third round of revisions stabilized the spec",
    "Although the metrics we agreed on only land on Friday",
    "Once the validation environment is finally stable",
    "While the partner team is still finalizing their piece",
]

EN_HARD_B = [
    "I separate urgent tasks from noisy ones and assign fixed windows to each stream",
    "we document assumptions immediately so later decisions are traceable",
    "I keep a short decision log to prevent the same debate from restarting",
    "the team aligns on one fallback path before committing to the optimistic route",
    "I bundle related updates so stakeholders can react without context switching",
    "we verify every external dependency before promising a delivery date",
    "I reserve buffer time specifically for issues that only appear at integration",
    "the next checkpoint focuses on risks that would otherwise stay implicit",
    "I defer low-impact polish until the core flow is demonstrably reliable",
    "we close open ownership questions first, because execution speed depends on that",
    "I route feedback through a single channel to keep the signal clean",
    "we lock the interface contract before touching downstream behavior",
    "I frame open questions as explicit choices rather than vague concerns",
]

EN_HARD_C = [
    "which keeps momentum intact under pressure",
    "so downstream work remains predictable",
    "even when the room is split on tradeoffs",
    "and the final pass requires fewer corrections",
    "without burning extra time on avoidable rework",
    "while deadlines continue to tighten",
    "so reviewers can react quickly when it matters",
    "and the rollback story stays believable",
    "even if the environment shifts again mid-week",
    "without letting uncertainty leak into the plan",
    "so the team avoids last-minute reshuffles",
    "and the later review stays focused on substance",
    "without dragging unrelated workstreams into the debate",
    "so the cost of a late change stays bounded",
]

EN_HARD_FRAME = [
    "for this iteration", "within the current scope",
    "under the agreed guardrails", "ahead of the next review",
    "without adding another escalation path", "given the recent schedule shift",
    "with the existing staffing", "against the revised milestone",
    "at a manageable coordination cost", "based on the clarified ownership",
]

POOLS = {
    "flow-de-easy-neutral": {
        "language": "de", "difficulty": "easy", "voice": "neutral",
        "theme": "everyday", "form": "mixed",
        "structure": "start_action_tail",
        "slots": [DE_EASY_STARTS, DE_EASY_ACTIONS, DE_EASY_TAILS],
        "joiner": " ", "tail_sep": " ", "suffix": ".",
    },
    "flow-de-medium-mixed": {
        "language": "de", "difficulty": "medium", "voice": "mixed",
        "theme": "everyday", "form": "mixed",
        "structure": "lead_mid_frame_end",
        "slots": [DE_MEDIUM_LEADS, DE_MEDIUM_MIDS, DE_MEDIUM_FRAME, DE_MEDIUM_ENDS],
        "joiner": " ", "tail_sep": ", ", "suffix": ".",
    },
    "flow-de-hard-mixed": {
        "language": "de", "difficulty": "hard", "voice": "mixed",
        "theme": "mixed", "form": "mixed",
        "structure": "lead_mid_frame_end",
        "slots": [DE_HARD_A, DE_HARD_B, DE_HARD_FRAME, DE_HARD_C],
        "joiner": ", ", "tail_sep": ", ", "suffix": ".",
    },
    "flow-en-easy-neutral": {
        "language": "en", "difficulty": "easy", "voice": "neutral",
        "theme": "everyday", "form": "mixed",
        "structure": "start_action_tail",
        "slots": [EN_EASY_STARTS, EN_EASY_ACTIONS, EN_EASY_TAILS],
        "joiner": " ", "tail_sep": " ", "suffix": ".",
    },
    "flow-en-medium-teen": {
        "language": "en", "difficulty": "medium", "voice": "teen",
        "theme": "school", "form": "mixed",
        "structure": "lead_mid_frame_end",
        "slots": [EN_MED_LEADS, EN_MED_MIDS, EN_MED_FRAME, EN_MED_ENDS],
        "joiner": ", ", "tail_sep": ", ", "suffix": ".",
    },
    "flow-en-hard-mixed": {
        "language": "en", "difficulty": "hard", "voice": "mixed",
        "theme": "mixed", "form": "mixed",
        "structure": "lead_mid_frame_end",
        "slots": [EN_HARD_A, EN_HARD_B, EN_HARD_FRAME, EN_HARD_C],
        "joiner": ", ", "tail_sep": ", ", "suffix": ".",
    },
}


def combinatorial_budget(ptype: str) -> int:
    slots = POOLS[ptype]["slots"]
    n = 1
    for s in slots:
        n *= len(s)
    return n


def profile_order() -> list[str]:
    return list(POOLS.keys())
