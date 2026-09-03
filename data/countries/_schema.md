# Country file schema (v1)

One JSON file per country at `data/countries/<slug>.json`. Add the slug to
`data/countries/index.json` with `"published": true` to make it appear. Nothing
else needs to change — `index.html` renders any file that follows this shape.

## Rules that are not negotiable

1. **Every number carries a source.** A figure without `source.org`, `source.url`
   and `source.as_of` does not go in the file.
2. **Government and challenger positions are stated in their own terms.** The
   `contested` section has separate `government` and `challengers` fields with
   separate sources. Neither is summarised into a conclusion.
3. **Advocacy figures are labeled.** Set `source.kind: "advocacy"`. The renderer
   marks them visibly.
4. **Partial periods are flagged.** Any series entry covering less than the
   period its neighbours cover sets `"comparable": false` and explains why in
   `note`. The renderer draws these in a hatched style, outside the comparison.
5. **Changes are appended, never rewritten.** The `changes` array is the public
   record of what moved and when.

## Top-level fields

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Must match the filename |
| `schema_version` | number | Currently `1` |
| `name`, `demonym` | string | |
| `updated` | `YYYY-MM-DD` | Date of last verification, not last edit |
| `status_headline` | string | One sentence, current as of `updated` |
| `in_sixty_seconds` | string[] | 4–8 sentences, each independently true |
| `timeline` | object[] | `date`, `event`, `cite`, optional `url`, optional `key: true` to emphasise |
| `who_is_affected` | object | `headline`, `headline_label`, `headline_source`, `notes[]`, optional `by_state` |
| `what_termination_means` | object[] | `point` + `detail` |
| `contested` | object[] | `question`, `government`, `government_source`, `challengers`, `challengers_source`, optional `resolution` |
| `litigation` | object[] | `case`, `court`, `docket`, `status`, `summary`, `url` |
| `related_programs` | object[] | Parallel programs — CHNV parole, DED, etc. |
| `conditions` | object | `intro`, `metrics[]`, `health`, `political`, `advisory` |
| `changes` | object[] | `date` + `text`, newest first |

## `source` object

```json
{ "org": "OHCHR", "url": "https://…", "as_of": "2026-01-07", "kind": "advocacy" }
```

`kind` is optional and currently only takes `"advocacy"`. Omit it for government,
UN, and intergovernmental sources.

## `conditions.metrics[].series[]`

```json
{
  "period": "2026 (Jan-Jun)",
  "value": 3050,
  "comparable": false,
  "note": "Half a year only. Do not annualize.",
  "flag": "Optional — a verification caveat shown as a warning.",
  "source": { "org": "BINUH", "url": "https://…", "as_of": "2026-08-25" }
}
```

`period` is a label, not a parsed date — it may be a year, a month, or a range.
Series are drawn in file order.
