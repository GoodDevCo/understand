# How to update UnderSTAND

Written for whoever — person or agent — runs the monthly refresh. It exists
because the September 2026 build burned most of its research budget rediscovering
which sources are actually reachable and which quietly serve stale pages. Read
this before searching. It should turn a two-hour refresh into twenty minutes.

## The cadence

Monthly. The run produces a **proposed diff**, not a commit. It goes to
`Claude/00 Inbox` for review, and only then does it land in the repo. Nothing
publishes without a human looking at it.

## Source of truth, by field

The rule: **the Federal Register is the source of truth for what the government
did. USCIS is the source of truth for what to do about it. Neither is the source
of truth for what a court has done.**

| What you need | Go here first | Not here |
|---|---|---|
| Whether a TPS designation exists, was extended, or terminated | **federalregister.gov API** (below) | USCIS country pages — they cache badly |
| Effective dates, population counts, DHS's stated rationale | The termination/extension notice itself | Press releases, which paraphrase |
| Whether a court has paused any of it | **clearinghouse.net** case pages; the SCOTUS docket | Law-firm blog posts — one misattributed the July 27 date to Syria |
| What a status confers | **USCIS Policy Manual** and **eCFR** | USCIS topic landing pages |
| Practical instructions for holders (EAD auto-extensions, I-9) | USCIS I-9 Central news items | anywhere else |
| Violence, displacement, kidnapping figures | **BINUH quarterly reports** | news aggregation of them |
| Food insecurity | **ipcinfo.org** country analysis | |
| Visa wait times | **travel.state.gov** Visa Bulletin for the month | |
| Travel advisory | travel.state.gov advisory page | |

## The one query that does most of the work

The Federal Register has an open JSON API with no rate limiting and no bot
blocking. This single call answers "did anything change?" for every country at
once:

```
https://www.federalregister.gov/api/v1/documents.json
  ?conditions[term]=Temporary%20Protected%20Status
  &conditions[publication_date][gte]=YYYY-MM-DD
  &order=newest
  &per_page=50
  &fields[]=title&fields[]=publication_date&fields[]=citation
  &fields[]=html_url&fields[]=abstract
```

Set `gte` to the date of the last run. An empty result means no TPS action
anywhere in that window — which is a real and useful answer, and takes one
request. **Start every monthly run with this.** In the September 2026 build it
was the query that proved no 2026 Haiti notice exists, which corrected a wrong
assumption the project had been carrying.

## Sites that block automated fetching

These returned HTTP 403 to every attempt in September 2026. Do not spend the
budget retrying them — go straight to the substitute.

| Blocked | Use instead |
|---|---|
| `uscis.gov` (most `/humanitarian/*` paths) | USCIS **Policy Manual** chapters (`/policy-manual/volume-N-part-X-chapter-N`) and **policy alert PDFs** under `/sites/default/files/document/` — both are equal or higher authority and both load fine |
| `dhs.gov` press releases | The Federal Register notice the release describes |
| `cbp.gov` | Cite the DHS figure, or label the relay honestly |
| `dtm.iom.int`, `iom.int` | UN documents citing DTM — OHCHR reports, BINUH quarterlies, UNICEF situation reports all carry the same round numbers |
| `congress.gov` (robots.txt) | `everycrsreport.com` — same CRS text, different host |

## Sites that serve stale pages without saying so

**This is the more dangerous category**, because it fails silently.

- The **USCIS Haiti TPS country page** served a 2015-era version referencing a
  2017 expiration. Anything retrieved from a USCIS topic page must be
  cross-checked against a dated document before it is used.
- The **USCIS DED page** listed country designations that expired in 2022 and
  2023 as though current.

Rule: if a page does not carry a publication or revision date, it is not a
citable source. Find the dated document behind it.

## Quarterly rhythm of the underlying data

Knowing when a source actually refreshes prevents pointless checking:

- **BINUH quarterly human-rights reports** — roughly 5–8 weeks after the quarter
  closes. Q2 2026 (April–June) published August 25, 2026. So a September run gets
  Q2; Q3 will not appear until roughly November.
- **IOM DTM rounds** — irregular, roughly quarterly. Round 13 covered May 2026.
- **IPC analyses** — twice yearly, with a projection update in between.
- **EOIR pro bono provider list** — quarterly, in January, April, July, October.
- **Visa Bulletin** — monthly, published mid-month for the following month.
- **WHO cholera epi updates** — monthly.

## Traps this project has already fallen into

1. **July 27, 2026 is not a Federal Register date.** It is the date the Supreme
   Court's judgment issued in *Mullin v. Doe*. The operative notice is 90 FR
   54733, published November 28, 2025, effective February 3, 2026. An earlier
   draft of this project treated the July date as the termination announcement.
2. **The "613 killed" figure covers two neighbourhoods over 4.5 months**, not the
   country over a year. It circulated widely in headlines in a form that invites
   exactly that misreading.
3. **2023 has two different death figures** — 4,451 gang-violence killings and
   4,789 registered homicides. Different metrics. Pick one, footnote the other.
4. **Most recent casualties were not caused by gangs.** In Q1 2026 BINUH
   attributed 69 percent to security-force operations. Reporting the total
   without the attribution materially misrepresents the source.
5. **DHS's 352,959 and the advocacy 330,000 are not the same measurement.** One
   counts grants at a point in time; the other estimates people currently
   present. Never present them as a discrepancy to be resolved.
6. **No government source publishes TPS holders by state.** If a state figure is
   needed it will be modeled advocacy data, and must be labeled as such.

## The checklist for a monthly run

1. Federal Register API query, `gte` = last run date. Any TPS document for a
   published country?
2. For each published country, check the litigation entries: clearinghouse.net
   case page, plus the SCOTUS docket if a case is there.
3. New BINUH quarterly out? New DTM round? New IPC analysis?
4. Current month's Visa Bulletin — update `data/shared/waittimes.json`.
5. Travel advisory date changed?
6. Re-verify every `orgs.json` URL resolves. Contact details for help
   organizations are the field where staleness does the most damage.
7. Bump `updated` on every file you touched. Append to the country's `changes`
   array — never rewrite an existing entry.
8. Write the proposed diff to `Claude/00 Inbox` and stop. Do not commit.

## Adding a country

Copy `data/countries/haiti.json`, follow `data/countries/_schema.md`, add the
slug to `data/countries/index.json` with `"published": true`. No build step, no
code change.
