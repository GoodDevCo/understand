# UnderSTAND

A nonpartisan reference on where immigrants, asylum seekers and TPS holders stand
under U.S. law, organized by country of origin. Every figure carries a source and
a date.

**Live:** https://gooddevco.github.io/understand/

## Why it exists

Most public confusion about immigration comes from treating *refugee*, *asylum*,
*TPS* and *parole* as interchangeable words for the same thing. They are four
different legal categories with different grantors, different durations, and —
critically — different answers to "does this lead to a green card?" Two of them
do. The others do not, by design.

The TPS termination for Haiti made that distinction concrete for roughly 353,000
people, most of them in Florida. No neutral, current, plain-language reference
existed. This is that reference.

## How it is built

Static HTML, no build step, no dependencies, no tracking. `index.html` renders
any country from a JSON file in `data/countries/`. Adding a country is adding a
JSON file and one line to an index — no code changes.

```
index.html               the page
assets/style.css         screen
assets/print.css         the handout — same content, laid out for paper
assets/app.js            renders a country file
data/countries/          one file per country, plus index.json and _schema.md
data/shared/             status definitions, paths forward, glossary, orgs, visa wait times
UPDATING.md              how to run the monthly refresh — read this first
```

The printable handout is the same page under a print stylesheet, not a separate
document that can drift out of sync. Print from the browser.

## Editorial standard

Borrowed from GovAgenda, and not negotiable:

- **Primary sources.** Federal Register notices, court dockets, UN and WHO
  reporting, U.S. government data. Not press coverage of those things.
- **Both positions in their own terms.** Where a government and its challengers
  disagree, each side's argument is stated as that side states it, with its own
  citation. Where a court has resolved the question, that is noted separately
  rather than folded into either side.
- **Advocacy figures are labeled.** They are often the only figures available —
  no government agency publishes TPS holders by state, for instance — but they
  are marked, and the reader is told how they were derived.
- **Partial periods are never compared to full ones.** A half-year figure is
  drawn hatched and flagged. Charts do not annualize.
- **Corrections are appended, not rewritten.** Each country file carries a
  `changes` log.

## Contributing

Corrections and source disputes are welcome as issues. A correction that comes
with a primary source will be acted on quickly; one that comes with an argument
will be discussed.

## Updating

See [UPDATING.md](UPDATING.md). It records which sources are reachable, which
silently serve stale pages, when each underlying dataset actually refreshes, and
the specific errors this project has already made once. Read it before
researching anything.

## License

Content is published under [CC BY 4.0](LICENSE-CONTENT). Code is MIT.
