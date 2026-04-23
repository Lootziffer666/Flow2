from __future__ import annotations

import json
import random
from collections import Counter
from dataclasses import dataclass
from itertools import product
from pathlib import Path

OUT_PATH = Path("data/benchmark/flow_synthetic_sentence_producer.jsonl")
TARGET_COUNT = 300


@dataclass(frozen=True)
class Profile:
    name: str
    language: str
    difficulty: str
    voice: str
    realism: str
    theme: str
    form: str


PROFILES = [
    Profile("flow-de-easy-neutral", "de", "easy", "neutral", "high", "everyday", "mixed"),
    Profile("flow-de-medium-mixed", "de", "medium", "mixed", "high", "everyday", "mixed"),
    Profile("flow-de-hard-mixed", "de", "hard", "mixed", "high", "mixed", "mixed"),
    Profile("flow-en-easy-neutral", "en", "easy", "neutral", "high", "everyday", "mixed"),
    Profile("flow-en-medium-teen", "en", "medium", "teen", "high", "school", "mixed"),
    Profile("flow-en-hard-mixed", "en", "hard", "mixed", "high", "mixed", "mixed"),
]


def _cap_by_opening(sentences: list[str], limit: int) -> list[str]:
    kept: list[str] = []
    openings: Counter[str] = Counter()
    for sentence in sentences:
        opening = sentence.split(maxsplit=1)[0].lower()
        if openings[opening] >= limit:
            continue
        openings[opening] += 1
        kept.append(sentence)
    return kept


def _materialize(templates: list[tuple[str, tuple[list[str], ...]]], *, seed: int) -> list[str]:
    rng = random.Random(seed)
    rows: list[tuple[str, int]] = []
    for index, (template, groups) in enumerate(templates):
        for values in product(*groups):
            rows.append((template.format(*values), index))

    rng.shuffle(rows)
    used_sentences: set[str] = set()
    frame_counts: Counter[int] = Counter()
    selected: list[str] = []
    for sentence, frame in rows:
        cleaned = " ".join(sentence.split())
        if cleaned in used_sentences:
            continue
        if frame_counts[frame] >= 180:
            continue
        used_sentences.add(cleaned)
        frame_counts[frame] += 1
        selected.append(cleaned)

    selected = _cap_by_opening(selected, limit=40)
    return selected


def _build_records(profile: Profile, sentences: list[str]) -> list[dict[str, str]]:
    if len(sentences) < TARGET_COUNT:
        raise RuntimeError(
            f"candidate pool too small for {profile.name}: {len(sentences)} < {TARGET_COUNT}"
        )

    records: list[dict[str, str]] = []
    for i in range(TARGET_COUNT):
        records.append(
            {
                "id": f"{profile.name}-{i + 1:06d}",
                "profile": profile.name,
                "language": profile.language,
                "difficulty": profile.difficulty,
                "voice": profile.voice,
                "realism": profile.realism,
                "theme": profile.theme,
                "form": profile.form,
                "source": sentences[i],
            }
        )
    return records


def make_de_easy() -> list[str]:
    templates = [
        ("{0} {1} {2}.", (
            ["Heute", "Morgen", "Später", "Gleich", "Nach der Arbeit", "Vor dem Mittag", "Am Wochenende", "Zu Hause", "Im Bus", "Im Büro", "Nach dem Sport", "Auf dem Weg"],
            ["kaufe ich Brot", "rufe ich meine Mutter an", "lade ich mein Handy", "räume ich den Tisch ab", "suche ich meinen Schlüssel", "trinke ich einen Tee", "stelle ich den Wecker", "bezahle ich die Rechnung", "packe ich meine Tasche", "prüfe ich den Fahrplan", "spüle ich das Geschirr", "bringe ich das Fahrrad in den Keller"],
            ["ohne Eile", "bevor es dunkel wird", "damit ich nichts vergesse", "und bleibe ruhig", "für morgen", "mit guter Laune", "ohne Stress", "bis alles passt", "weil ich später keine Zeit habe", "und spare Zeit"]
        )),
        ("{0} {1}, {2}.", (
            ["Wenn der Bus pünktlich kommt", "Sobald ich zu Hause bin", "Nachdem ich gegessen habe", "Falls es nicht regnet", "Während die Wäsche läuft", "Wenn die Pause beginnt", "Bevor der Laden schließt", "Sobald das Handy klingelt"],
            ["bringe ich schnell den Müll raus", "hole ich das Paket ab", "gehe ich kurz zur Apotheke", "schreibe ich die Einkaufsliste", "wische ich den Flur", "fahre ich noch zum Markt", "räume ich den Schreibtisch auf", "fülle ich meine Wasserflasche"],
            ["damit der Abend entspannt bleibt", "und dann mache ich Feierabend", "ohne etwas zu vergessen", "bevor Besuch kommt", "weil morgen viel los ist", "und alles ist vorbereitet", "damit ich später frei habe", "ohne Hektik"]
        )),
    ]
    return _materialize(templates, seed=11)


def make_de_medium() -> list[str]:
    templates = [
        ("{0} {1}, {2}.", (
            ["Seit letzter Woche", "Wenn der Zug pünktlich ist", "Obwohl es morgens kalt ist", "Sobald ich im Büro ankomme", "Während der Mittagspause", "Nachdem der Unterricht endet", "Falls der Supermarkt noch offen ist", "Auch ohne festen Termin", "Wenn der Aufzug wieder läuft", "Weil heute viel los war"],
            ["plane ich den Abend genauer", "nehme ich mir Zeit für offene Mails", "spreche ich kurz mit der Nachbarin", "sortiere ich die Unterlagen neu", "bestelle ich die fehlenden Teile", "frage ich im Team nach Rückmeldung", "schreibe ich die wichtigsten Punkte auf", "verschiebe ich den Termin auf morgen", "gehe ich die To-do-Liste ruhig durch", "kläre ich den Rest telefonisch"],
            ["damit der nächste Tag leichter startet", "auch wenn es später wird", "bevor neue Aufgaben dazukommen", "ohne den Überblick zu verlieren", "weil kleine Schritte heute reichen", "sodass nichts liegen bleibt", "während draußen schon die Lichter angehen", "obwohl ich eigentlich müde bin"]
        )),
        ("{0}, {1}, und {2}.", (
            ["Im Team-Chat", "Auf dem Heimweg", "Im Treppenhaus", "Vor dem Feierabend", "Zwischen zwei Terminen", "Beim Warten auf den Zug", "Im Pausenraum", "Vor dem Abendessen"],
            ["halte ich offene Fragen knapp fest", "gleiche ich meinen Plan mit dem Kalender ab", "schicke ich eine kurze Rückfrage", "ordne ich Prioritäten neu", "markiere ich erledigte Punkte", "prüfe ich die nächsten Fristen", "spreche ich eine Abholung ab", "notiere ich die wichtigsten Entscheidungen"],
            ["damit später nichts doppelt passiert", "bevor der Rest untergeht", "sodass alle denselben Stand haben", "ohne die Routine zu unterbrechen", "während der Kopf noch frei ist", "weil der Abend dann ruhiger läuft", "damit ich morgen direkt starten kann", "ohne unnötige Schleifen"]
        )),
    ]
    return _materialize(templates, seed=22)


def make_de_hard() -> list[str]:
    templates = [
        ("{0}, {1}, {2}.", (
            ["Obwohl der Kalender eng getaktet ist", "Während im Hintergrund noch Rückfragen eingehen", "Da die Lieferung verspätet eingetroffen war", "Wenn mehrere Themen parallel Aufmerksamkeit fordern", "Weil die Abstimmung erst am Abend abgeschlossen wurde", "Sobald die letzte Korrekturschleife dokumentiert ist", "Selbst wenn einzelne Details kurzfristig geändert werden", "Nachdem die Prioritäten neu gesetzt worden sind"],
            ["halte ich die Reihenfolge bewusst stabil und verteile offene Punkte auf klare Zeitfenster", "formuliere ich Rückmeldungen so präzise, dass Missverständnisse später kaum noch entstehen", "lege ich zuerst fest, welche Schritte zwingend heute abgeschlossen werden müssen", "prüfe ich jede Abhängigkeit einzeln, bevor ich eine Zusage abgebe", "lasse ich genug Puffer, damit spontane Änderungen nicht den ganzen Ablauf kippen", "arbeite ich mit kurzen Zwischenständen, damit alle Beteiligten denselben Kenntnisstand behalten", "dokumentiere ich den Verlauf unmittelbar, statt mich auf spätere Erinnerung zu verlassen", "schiebe ich nichtkritische Aufgaben bewusst nach hinten, ohne sie aus dem Blick zu verlieren"],
            ["wodurch der Rest des Teams verlässlich weiterarbeiten kann", "auch wenn die Entscheidungslage lange unübersichtlich bleibt", "sodass die Umsetzung nicht an Kleinigkeiten scheitert", "ohne zusätzliche Hektik in den Ablauf zu bringen", "während parallel bereits die nächste Frist näher rückt", "was den Aufwand trotz hoher Dichte beherrschbar macht"]
        )),
        ("{0} {1}; {2}.", (
            ["Sobald neue Informationen eintreffen", "Wenn ein Teil der Annahmen wegfällt", "Falls die Übergabe in ein engeres Zeitfenster rutscht", "Da mehrere Schnittstellen gleichzeitig betroffen sind", "Wenn aus einer Kleinigkeit eine Kettenreaktion wird", "Sobald die letzte externe Freigabe vorliegt", "Auch bei stabiler Grundplanung", "Nach jedem Zwischenstand"],
            ["priorisiere ich Risiken nach Folgekosten", "trenne ich Signal von Nebengeräusch", "prüfe ich die Konsequenzen für nachgelagerte Teams", "halte ich Rückfragen im selben Dokument fest", "sichere ich zuerst die kritischen Pfade", "bewerte ich Auswirkungen auf Termin und Qualität gemeinsam", "ziehe ich offene Entscheidungen zeitnah nach", "schließe ich Zuständigkeiten verbindlich"],
            ["damit spätere Korrekturen nicht das Gesamtbild verzerren", "sodass Entscheidungen auch unter Druck nachvollziehbar bleiben", "weil fehlende Klarheit sonst doppelte Arbeit erzeugt", "ohne dass operative Ruhe verloren geht", "womit der nächste Übergabeschritt belastbar vorbereitet ist", "damit die Umsetzung trotz enger Takte steuerbar bleibt"]
        )),
    ]
    return _materialize(templates, seed=33)


def make_en_easy() -> list[str]:
    templates = [
        ("{0} {1} {2}.", (
            ["Today", "Tomorrow", "Later", "Right now", "After work", "Before lunch", "In the evening", "At home", "On the bus", "At the office", "This weekend", "On my break"],
            ["I charge my phone", "I call my sister", "I check the train app", "I clean the table", "I fold the laundry", "I water the plants", "I lock the door", "I pack my bag", "I answer a message", "I buy bread", "I wash the dishes", "I set an alarm"],
            ["before it gets late", "without rushing", "so I do not forget", "and then I relax", "with a clear head", "for the next morning", "with no stress", "because I will be busy later", "while the room is quiet", "and keep things simple"]
        )),
        ("{0} {1}, {2}.", (
            ["When the bus is on time", "As soon as I get home", "After I finish dinner", "If it does not rain", "While the washer is running", "Before the store closes", "When my break starts", "As soon as my phone rings"],
            ["I take out the trash", "I pick up a parcel", "I stop by the pharmacy", "I write my grocery list", "I tidy the hallway", "I refill my bottle", "I print the ticket", "I move my bike downstairs"],
            ["so the evening stays calm", "and then I can rest", "before I forget anything", "because tomorrow is packed", "and everything is ready", "without any hurry", "so I have time later", "before guests arrive"]
        )),
    ]
    return _materialize(templates, seed=44)


def make_en_medium_teen() -> list[str]:
    templates = [
        ("{0}, {1}, {2}.", (
            ["Before first period", "After math class", "When the bell rings", "If the lab is open", "During lunch", "On the way to practice", "Right after school", "Before the quiz starts", "Since our project got moved", "When the group chat is quiet"],
            ["I review my notes for ten minutes", "I ask my friend to check my outline", "I finish the missing homework section", "I send the slide draft to my partner", "I fix the code example in our report", "I rewrite the opening paragraph", "I organize my locker for tomorrow", "I compare answers with Maya", "I message the teacher about the deadline", "I plan my study blocks"],
            ["so I am not scrambling at night", "because practice runs late", "even if my bus is crowded", "before the next assignment drops", "and it keeps my week manageable", "since we present on Friday", "without skipping dinner", "while my phone stays on silent"]
        )),
        ("{0} {1}, {2}.", (
            ["At the library", "Between classes", "In study hall", "After robotics", "Before rehearsal", "On the ride home", "At my desk", "Before dinner"],
            ["I split the project into short tasks", "I check what is still missing", "I clean up my notes", "I sync deadlines with my calendar", "I ask for quick feedback", "I update our shared doc", "I draft two practice answers", "I list questions for tomorrow"],
            ["that way my evening stays manageable", "so group work does not stall", "because last-minute fixes stress me out", "which makes test prep less chaotic", "so I can still sleep on time", "and I do not lose track of priorities", "before another assignment lands", "while I still remember class details"]
        )),
    ]
    return _materialize(templates, seed=55)


def make_en_hard() -> list[str]:
    templates = [
        ("{0}, {1}, {2}.", (
            ["Although the timeline shifted twice this week", "While new requests keep arriving in parallel", "Because the first draft exposed several gaps", "When priorities conflict across the same afternoon", "Since the final review starts earlier than expected", "After we mapped the dependencies in detail", "Even if the plan looks stable on paper", "As soon as the latest feedback is logged"],
            ["I separate urgent tasks from noisy ones and assign fixed windows to each stream", "we document assumptions immediately so later decisions stay traceable", "I keep a short decision log to prevent the same debate from restarting", "the team aligns on one fallback path before committing to the optimistic route", "I bundle related updates so stakeholders can react without context switching", "we verify every external dependency before promising a delivery date", "I reserve buffer time for issues that only appear during integration", "the next checkpoint focuses on risks that would otherwise stay implicit"],
            ["which keeps momentum intact under pressure", "so downstream work remains predictable", "even when the room is split on tradeoffs", "and the final pass requires fewer corrections", "without burning extra time on avoidable rework", "while deadlines continue to tighten"]
        )),
        ("{0} {1}; {2}.", (
            ["Once blockers are clearly tagged", "If a key assumption changes", "When handoff windows get tighter", "Because multiple interfaces move at once", "After each checkpoint", "As soon as external feedback lands", "Even with a stable baseline", "When small defects begin to cascade"],
            ["we rank risks by downstream impact", "I separate signal from noise before drafting updates", "the team confirms ownership before adding new scope", "I lock critical paths first", "we align tradeoffs in writing", "I defer low-impact polish until core reliability is proven", "we capture unresolved questions in one place", "I recalculate sequence dependencies before committing dates"],
            ["so later corrections do not erase current progress", "which keeps execution coherent under pressure", "because unclear ownership quickly slows delivery", "without adding avoidable churn", "so integration remains testable instead of hopeful", "and stakeholders can make fast, informed decisions"]
        )),
    ]
    return _materialize(templates, seed=66)


def generate_all_records() -> list[dict[str, str]]:
    builders = {
        "flow-de-easy-neutral": make_de_easy,
        "flow-de-medium-mixed": make_de_medium,
        "flow-de-hard-mixed": make_de_hard,
        "flow-en-easy-neutral": make_en_easy,
        "flow-en-medium-teen": make_en_medium_teen,
        "flow-en-hard-mixed": make_en_hard,
    }

    all_records: list[dict[str, str]] = []
    for profile in PROFILES:
        sentences = builders[profile.name]()
        all_records.extend(_build_records(profile, sentences))
    return all_records


def main() -> None:
    records = generate_all_records()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"wrote {len(records)} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
