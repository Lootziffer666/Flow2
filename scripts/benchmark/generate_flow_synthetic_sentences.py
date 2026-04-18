from __future__ import annotations

import json
from pathlib import Path

OUT_PATH = Path("data/benchmark/flow_synthetic_sentence_producer.jsonl")


def build_records(profile: str, language: str, difficulty: str, voice: str, realism: str, theme: str, form: str, count: int, sentences: list[str]) -> list[dict]:
    if len(sentences) < count:
        raise ValueError(f"not enough sentences for {profile}: need {count}, got {len(sentences)}")
    records = []
    for i in range(count):
        idx = i + 1
        records.append(
            {
                "id": f"{profile}-{idx:06d}",
                "profile": profile,
                "language": language,
                "difficulty": difficulty,
                "voice": voice,
                "realism": realism,
                "theme": theme,
                "form": form,
                "source": sentences[i],
            }
        )
    return records


def make_de_easy() -> list[str]:
    starts = [
        "Heute", "Morgen", "Am Abend", "Nach der Arbeit", "Vor dem Mittag", "Am Wochenende", "Später", "Gerade", "Im Bus", "Zu Hause",
        "Im Büro", "Nach dem Sport", "Nach dem Regen", "Vor der Tür", "In der Küche", "Im Flur", "Im Park", "Auf dem Weg", "Gegen acht", "Kurz davor",
    ]
    actions = [
        "bringe ich den Müll raus", "hole ich Brot beim Bäcker", "rufe ich meine Mutter an", "lade ich mein Handy", "räume ich den Tisch ab",
        "schließe ich das Fenster", "gehe ich früh schlafen", "suche ich meinen Schlüssel", "trinke ich einen Tee", "nehme ich den nächsten Zug",
        "putze ich meine Schuhe", "bezahle ich die Rechnung", "packe ich meine Tasche", "lese ich die Nachricht", "warte ich an der Haltestelle",
        "öffne ich das Paket", "spüle ich das Geschirr", "prüfe ich den Fahrplan", "bringe ich das Fahrrad in den Keller", "stelle ich den Wecker",
    ]
    tails = [
        "und bleibe entspannt", "bevor es dunkel wird", "ohne Eile", "mit guter Laune", "für morgen", "bis alles passt", "für den nächsten Tag",
        "weil es sonst zu spät wird", "und spare dabei Zeit", "damit ich nichts vergesse", "und mache dann Feierabend", "ohne großen Aufwand",
    ]
    out = []
    for a in starts:
        for b in actions:
            for c in tails:
                out.append(f"{a} {b} {c}.")
    return out


def make_de_medium() -> list[str]:
    leads = [
        "Seit letzter Woche", "Wenn der Zug pünktlich ist", "Obwohl es morgens kalt ist", "Sobald ich im Büro ankomme", "Während der Mittagspause",
        "Nachdem der Unterricht endet", "Falls der Supermarkt noch offen ist", "Wenn der Aufzug wieder steht", "Weil heute viel los war", "Auch ohne Termin",
    ]
    mids = [
        "plane ich den Abend genauer", "nehme ich mir Zeit für offene Mails", "spreche ich kurz mit der Nachbarin", "sortiere ich die Unterlagen neu",
        "bestelle ich die fehlenden Teile", "frage ich im Team nach einer Rückmeldung", "schreibe ich die wichtigsten Punkte auf",
        "verschiebe ich den Termin auf morgen", "gehe ich die To-do-Liste ruhig durch", "kläre ich den Rest telefonisch",
    ]
    ends = [
        "damit der nächste Tag leichter startet", "auch wenn es später wird", "bevor neue Aufgaben dazukommen", "ohne den Überblick zu verlieren",
        "weil kleine Schritte heute reichen", "sodass nichts liegen bleibt", "wenn die Verbindung stabil bleibt", "und halte mich an den Plan",
        "während draußen schon die Lichter angehen", "obwohl ich eigentlich müde bin",
    ]
    out = []
    for a in leads:
        for b in mids:
            for c in ends:
                out.append(f"{a} {b}, {c}.")
    return out


def make_de_hard() -> list[str]:
    a = [
        "Obwohl der Kalender eng getaktet ist", "Während im Hintergrund noch Rückfragen eingehen", "Da die Lieferung verspätet eingetroffen war",
        "Wenn mehrere Themen parallel Aufmerksamkeit fordern", "Weil die Abstimmung erst am Abend abgeschlossen wurde",
        "Sobald die letzte Korrekturschleife dokumentiert ist", "Damit der Übergang in die nächste Woche ruhig gelingt",
        "Selbst wenn einzelne Details kurzfristig geändert werden", "Da der ursprüngliche Plan mehrfach angepasst wurde", "Nachdem die Prioritäten neu gesetzt worden sind",
    ]
    b = [
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
    ]
    c = [
        "was den Aufwand trotz hoher Dichte beherrschbar macht", "wodurch der Rest des Teams verlässlich weiterarbeiten kann",
        "auch wenn die Entscheidungslage lange unübersichtlich blieb", "sodass die Umsetzung nicht an Kleinigkeiten scheitert",
        "während parallel bereits die nächste Frist näher rückt", "ohne zusätzliche Hektik in den Ablauf zu bringen",
    ]
    out = []
    for x in a:
        for y in b:
            for z in c:
                out.append(f"{x}, {y}, {z}.")
    return out


def make_en_easy() -> list[str]:
    starts = [
        "Today", "Tomorrow", "After work", "Before lunch", "In the evening", "At home", "On the bus", "At the office", "This weekend", "Right now",
        "After the rain", "Near the station", "In the hallway", "In the kitchen", "On my break", "Around eight", "Later", "Early in the morning", "Before bed", "On the way",
    ]
    actions = [
        "I charge my phone", "I call my sister", "I check the train app", "I clean the table", "I fold the laundry", "I water the plants",
        "I lock the door", "I pack my bag", "I answer a message", "I buy bread", "I take a short walk", "I wash the dishes",
        "I set an alarm", "I open the parcel", "I pay the bill", "I find my keys", "I refill my bottle", "I print the ticket", "I move my bike", "I make tea",
    ]
    tails = [
        "before it gets late", "without rushing", "to save time tomorrow", "so I do not forget", "and then I relax", "while the room is quiet",
        "with a clear head", "after a long day", "for the next morning", "and keep things simple", "before my next call", "with no stress",
    ]
    out = []
    for s in starts:
        for a in actions:
            for t in tails:
                out.append(f"{s} {a} {t}.")
    return out


def make_en_medium_teen() -> list[str]:
    leads = [
        "Before first period", "After math class", "When the bell rings", "If the lab is open", "During lunch", "On the way to practice",
        "Right after school", "When the group chat is quiet", "Before the quiz starts", "Since our project got moved",
    ]
    mids = [
        "I review my notes for ten minutes", "I ask my friend to check my outline", "I finish the missing homework section",
        "I send the slide draft to my partner", "I fix the code example in our report", "I rewrite the opening paragraph",
        "I organize my locker for tomorrow", "I compare answers with Maya", "I message the teacher about the deadline", "I plan my study blocks",
    ]
    ends = [
        "so I am not scrambling at night", "because practice runs late", "even if my bus is crowded", "before the next assignment drops",
        "and it keeps my week manageable", "since we present on Friday", "without skipping dinner", "while my phone stays on silent",
        "and I can actually sleep on time", "so the weekend is less stressful",
    ]
    out = []
    for a in leads:
        for b in mids:
            for c in ends:
                out.append(f"{a}, {b}, {c}.")
    return out


def make_en_hard() -> list[str]:
    a = [
        "Although the timeline shifted twice this week", "While new requests keep arriving in parallel", "Because the first draft exposed several gaps",
        "When priorities conflict across the same afternoon", "Since the final review starts earlier than expected",
        "After we mapped the dependencies in detail", "Even if the plan looks stable on paper", "As soon as the latest feedback is logged",
        "Given that the handoff window is unusually narrow", "Once the outstanding blockers are clearly tagged",
    ]
    b = [
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
    ]
    c = [
        "which keeps momentum intact under pressure", "so downstream work remains predictable", "even when the room is split on tradeoffs",
        "and the final pass requires fewer corrections", "without burning extra time on avoidable rework", "while deadlines continue to tighten",
    ]
    out = []
    for x in a:
        for y in b:
            for z in c:
                out.append(f"{x}, {y}, {z}.")
    return out


def main() -> None:
    all_records: list[dict] = []
    all_records += build_records("flow-de-easy-neutral", "de", "easy", "neutral", "high", "everyday", "mixed", 300, make_de_easy())
    all_records += build_records("flow-de-medium-mixed", "de", "medium", "mixed", "high", "everyday", "mixed", 300, make_de_medium())
    all_records += build_records("flow-de-hard-mixed", "de", "hard", "mixed", "high", "mixed", "mixed", 300, make_de_hard())
    all_records += build_records("flow-en-easy-neutral", "en", "easy", "neutral", "high", "everyday", "mixed", 300, make_en_easy())
    all_records += build_records("flow-en-medium-teen", "en", "medium", "teen", "high", "school", "mixed", 300, make_en_medium_teen())
    all_records += build_records("flow-en-hard-mixed", "en", "hard", "mixed", "high", "mixed", "mixed", 300, make_en_hard())

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"wrote {len(all_records)} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
