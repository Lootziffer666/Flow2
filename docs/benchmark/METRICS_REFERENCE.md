# FLOW Metrics Reference (v1)

## Öffentliche Metriken (extern berichtet)

| Metrik | Formel | Ziel |
|---|---|---:|
| Edit Precision | `correct_edits / all_edits` | `>= 0.95` |
| Edit Recall | `correct_edits / gold_edits` | `>= 0.80` |
| F0.5 | `(1.25 * P * R) / (0.25 * P + R)` | maximieren |
| No-op Accuracy | `unchanged_correct / total_correct` | `>= 0.95` |
| Overcorrection Rate | `harmful_or_unneeded_edits / all_edits` | `<= 0.05` |

Diese Schicht ist die externe Qualitätsaussage: korrekt reparieren, selten zu viel ändern, gute Sätze in Ruhe lassen.

## Private Strukturmetriken (intern, FLOW-spezifisch)

| Metrik | Formel | Ziel |
|---|---|---:|
| Node Preservation | `preserved_bindings / expected_bindings` | `>= 0.90` |
| Graph Repair Success | `improved_graphs / repairable_graphs` | `>= 0.80` |
| Idempotence | `unchanged_second_pass / total_cases` | `>= 0.99` |
| Minimality | `needed_edit_count / total_edit_count` | `>= 0.85` |
| False Shift Rate | `wrong_target_hypotheses / total_cases` | `<= 0.05` |

## Disambiguation notes

- **No-op Accuracy vs Idempotence**: No-op Accuracy misst korrekte Nicht-Intervention auf `no_touch`; Idempotence misst Zweitlauf-Stabilität auf allen Fällen.
- **Overcorrection vs Minimality**: Overcorrection zählt schädliche/unnötige Edits; Minimality bewertet den Anteil notwendiger Edits in allen Edits.
- **False Shift Rate** ist cases-basiert (nicht edit-basiert), damit Grenzverletzungen als harte Boundary-Verstöße sichtbar bleiben.

## Gating recommendation

- Release-Gate nur bestanden, wenn **alle öffentlichen Zielwerte** erreicht sind.
- Private Strukturmetriken als zweiter Gate-Block verwenden, um Architekturdrift früh zu erkennen.
