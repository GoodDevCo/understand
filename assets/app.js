(function () {
  'use strict';

  var D = {};

  function el(t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(n) { return n.toLocaleString('en-US'); }
  function shortNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1).replace(/\.0$/, '') + ' million';
    if (n >= 1000) return Math.round(n / 1000) + ',000';
    return num(n);
  }
  function date(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    var M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (p.length === 1) return p[0];
    if (p.length === 2) return M[+p[1] - 1] + ' ' + p[0];
    return M[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function src(s, prefix) {
    if (!s) return '';
    var adv = s.kind === 'advocacy' ? '<span class="badge adv">advocacy estimate</span>' : '';
    var org = s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.org) + '</a>' : esc(s.org);
    return '<p class="src">' + (prefix || 'Source:') + ' ' + org +
      (s.as_of ? ' &middot; checked ' + esc(date(s.as_of)) : '') + adv + '</p>';
  }
  function srcList(list, label) {
    return '<p class="src">' + (label || 'Sources:') + ' ' + list.map(function (s) {
      return '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.org) + '</a>';
    }).join(' &middot; ') + '</p>';
  }
  function flag(t) { return t ? '<p class="flag">' + esc(t) + '</p>' : ''; }

  function section(id, kicker, title, body, cls) {
    var s = el('section', cls || null);
    s.id = id;
    s.innerHTML = '<div class="head"><p class="kicker">' + esc(kicker) + '</p>' +
      '<h2>' + esc(title) + '</h2></div>' + body;
    return s;
  }

  function toc(items, printable) {
    var d = el('nav', 'toc');
    d.setAttribute('aria-label', 'Contents');
    d.innerHTML = '<p class="kicker">On this page</p><ol>' + items.map(function (t) {
      return '<li><a href="#' + t[0] + '">' + esc(t[1]) + '</a></li>';
    }).join('') + '</ol>' + (printable ? '<button class="print" type="button">Print this page</button>' : '');
    var b = d.querySelector('.print');
    if (b) b.onclick = function () { window.print(); };
    return d;
  }

  function orgCard(g) {
    return '<div class="org"><h4><a href="' + esc(g.url) + '" rel="noopener">' + esc(g.name) + '</a></h4>' +
      '<div class="where">' + esc(g.region || g.org) + '</div>' +
      '<p>' + esc(g.what) + '</p>' +
      '<div class="cost">' + esc(g.cost) + '</div>' + flag(g.flag) + '</div>';
  }

  function chart(m) {
    var max = Math.max.apply(null, m.series.map(function (x) { return x.value; }));
    var anyPartial = m.series.some(function (x) { return x.comparable === false; });
    var seen = {}, srcs = [];
    m.series.forEach(function (x) {
      if (x.source && !seen[x.source.url]) { seen[x.source.url] = 1; srcs.push(x.source); }
    });
    var bars = m.series.map(function (x) {
      var pct = Math.max(3, (x.value / max) * 100), inside = pct > 34;
      return '<div class="bar' + (x.comparable === false ? ' partial' : '') + '">' +
        '<div class="lab">' + esc(x.period) + '</div>' +
        '<div class="track"><div class="fill" style="width:' + pct.toFixed(1) + '%"></div>' +
        '<span class="val' + (inside ? ' inside' : '') + '">' + num(x.value) + '</span></div></div>';
    }).join('');
    return '<div class="metric"><h3>' + esc(m.label) + '</h3>' +
      (m.note ? '<p class="note">' + esc(m.note) + '</p>' : '') +
      '<div class="bars">' + bars + '</div>' +
      (anyPartial ? '<p class="stripe-note">Striped bars cover only part of a year. They are here so the page is current — do not compare them to the full years above them.</p>' : '') +
      srcList(srcs) + '</div>';
  }

  // ================= THE GUIDE (general to everyone) =================

  var GUIDE_TOC = [
    ['line', 'What you can and cannot do'],
    ['words', 'The four words people mix up'],
    ['relief', 'What relief exists'],
    ['wait', 'How long the line really is'],
    ['scams', 'Notarios and scams'],
    ['send', 'Where to send someone'],
    ['accredit', 'Doing this properly'],
    ['terms', 'Words you will hear']
  ];

  function gLine() {
    var L = D.helping.line;
    var body =
      '<p class="lede">' + esc(L.lede) + '</p>' +
      '<div class="rule"><p>' + esc(L.rule) + '</p>' + src(L.rule_source) + '</div>' +
      '<p class="lede">' + esc(L.test) + '</p>' + src(L.test_source) +
      '<div class="two-col">' +
        '<div class="col can"><h3><span class="mark">Yes</span> You can</h3><ul>' +
          L.can.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="col cannot"><h3><span class="mark">No</span> You cannot</h3><ul>' +
          L.cannot.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
      '</div>' +
      '<div class="aside"><h4>One narrow exception, and it names clergy</h4>' +
        '<p>' + esc(L.clergy_note.text) + '</p>' + src(L.clergy_note.source) + '</div>';
    return section('line', 'Before anything else', L.heading, body, 'line');
  }

  function statusRow(st) {
    function cell(v, note) {
      var cls = /^Yes|^It is/i.test(v) ? 'yes' : (/^No|^Not/i.test(v) ? 'no' : 'maybe');
      return '<td class="ans ' + cls + '"><b>' + esc(v) + '</b>' +
        (note ? '<span>' + esc(note) + '</span>' : '') + '</td>';
    }
    return '<tr><td class="who"><b>' + esc(st.name) + '</b><span>' + esc(st.plain) + '</span></td>' +
      cell(st.green_card, st.green_card_note) + cell(st.work, st.work_note) +
      '<td class="lasts">' + esc(st.lasts) + '</td></tr>';
  }

  function gWords() {
    var S = D.statuses;
    var core = S.statuses.filter(function (s) { return S.core.indexOf(s.id) > -1; });
    var rest = S.statuses.filter(function (s) { return S.core.indexOf(s.id) < 0; });
    var head = '<thead><tr><th>Status</th><th>Leads to a green card?</th><th>Can they work?</th>' +
      '<th>How long it lasts</th></tr></thead>';
    function cards(list) {
      return '<div class="cards">' + list.map(function (st) {
        return '<div class="card"><h4>' + esc(st.name) + '</h4><p>' + esc(st.what) + '</p>' +
          src(st.source) + '</div>';
      }).join('') + '</div>';
    }
    var body = '<p class="lede">' + esc(S.lede) + '</p>' +
      '<div class="tw"><table class="cmp">' + head + '<tbody>' + core.map(statusRow).join('') +
      '</tbody></table></div>' + cards(core) +
      '<h3>' + esc(S.more_label) + '</h3>' +
      '<div class="tw"><table class="cmp">' + head + '<tbody>' + rest.map(statusRow).join('') +
      '</tbody></table></div>' + cards(rest);
    return section('words', 'The thing people get wrong', S.heading, body);
  }

  function gRelief() {
    var P = D.paths;
    var body = '<p class="lede">' + esc(P.lede) + '</p>' +
      '<ul class="pts">' + P.paths.map(function (p) {
        return '<li><b>' + esc(p.name) + '</b><span>' + esc(p.plain) + '</span>' + src(p.source) + '</li>';
      }).join('') + '</ul>';
    return section('relief', 'Doors that exist', P.heading, body);
  }

  function gWait() {
    var w = D.wait;
    var head = '<tr><th class="first">Who is waiting</th>' + w.columns.map(function (c) {
      return '<th' + (c.highlight ? ' class="hl"' : '') + '>' + esc(c.label) + '</th>';
    }).join('') + '</tr>';
    var rows = w.categories.map(function (cat) {
      var r = w.final_action_dates[cat.id];
      return '<tr><td class="first">' + esc(cat.label) + '</td>' + w.columns.map(function (c) {
        return '<td class="num' + (c.highlight ? ' hl' : '') + '">' + esc(date(r[c.id])) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var body = '<p class="lede">' + esc(w.how_it_works) + '</p>' +
      '<div class="tw"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="src">Each date is the day the government is currently working on. ' +
      esc(w.bulletin.month) + ' Visa Bulletin, <a href="' + esc(w.bulletin.url) +
      '" rel="noopener">U.S. Department of State</a>.</p>';
    return section('wait', 'When someone says get in line', w.heading, body);
  }

  function gScams() {
    var S = D.helping.scams;
    var body = '<p class="lede">' + esc(S.lede) + '</p>' + src(S.lede_source) +
      '<div class="rule"><p>' + esc(S.official_line) + '</p>' + src(S.official_source) + '</div>' +
      '<h3>Teach them these warning signs</h3>' +
      '<ul class="signs">' + S.signs.map(function (s) {
        return '<li><b>' + esc(s.sign) + '</b><span>' + esc(s.why) + '</span></li>';
      }).join('') + '</ul>' + srcList(S.signs_sources) +
      '<h3>If it already happened</h3>' +
      '<div class="cards">' + S.reporting.map(function (r) {
        return '<div class="card"><h4><a href="' + esc(r.url) + '" rel="noopener">' + esc(r.name) +
          '</a></h4><p>' + esc(r.what) + '</p></div>';
      }).join('') + '</div>';
    return section('scams', 'The most common way people get hurt', S.heading, body, 'scams');
  }

  function gSend() {
    var d = D.directories;
    var body = '<p class="lede">' + esc(d.note) + '</p>' + d.directories.map(orgCard).join('') +
      '<p class="src">Organizations serving a specific community are listed on that country&rsquo;s page.</p>';
    return section('send', 'The most useful thing you can do', d.heading, body, 'help');
  }

  function gAccredit() {
    var A = D.helping.accreditation;
    var body = '<p class="lede">' + esc(A.lede) + '</p>' +
      '<dl class="gloss">' + A.steps.map(function (s) {
        return '<div><dt>' + esc(s.term) + '</dt><dd>' + esc(s.def) + '</dd></div>';
      }).join('') + '</dl>' +
      '<p>' + esc(A.how) + ' <a href="' + esc(A.program_url) + '" rel="noopener">The program page</a> ' +
      'has the forms. <a href="' + esc(A.roster_url) + '" rel="noopener">The public roster</a> lists ' +
      'who is already approved.</p>' + flag(A.roster_note) + src(A.source);
    return section('accredit', 'The longer road', A.heading, body);
  }

  function gTerms() {
    var G = D.glossary;
    var body = '<p class="lede">' + esc(G.lede) + '</p><dl class="gloss">' +
      G.terms.map(function (t) {
        return '<div><dt>' + esc(t.term) + '</dt><dd>' + esc(t.def) + '</dd></div>';
      }).join('') + '</dl>';
    return section('terms', 'Quick reference', G.heading, body);
  }

  function renderGuide() {
    var app = document.getElementById('app');
    app.innerHTML = '';
    var intro = el('section', 'now');
    intro.innerHTML = '<div class="banner">' +
      '<p class="headline">This page is the same whoever you are helping.</p>' +
      '<p class="sub">What a volunteer may legally do, what the words mean, what relief exists, ' +
      'and how to spot a scam. None of it changes with the country. Pick a country tab above for ' +
      'what is true for that community right now.</p>' +
      '<p class="asof">Checked ' + esc(date(D.helping.updated)) + '</p></div>';
    app.appendChild(intro);
    app.appendChild(toc(GUIDE_TOC, true));
    [gLine(), gWords(), gRelief(), gWait(), gScams(), gSend(), gAccredit(), gTerms()]
      .forEach(function (n) { app.appendChild(n); });
    document.title = 'UnderSTAND — how to help';
  }

  // ================= A COUNTRY =================

  var COUNTRY_TOC = [
    ['means', 'What changed for them'],
    ['ask', 'Two questions worth asking'],
    ['orgs', 'Organizations that serve them'],
    ['conditions', 'Why going back is not simple'],
    ['affected', 'How many people'],
    ['story', 'What happened'],
    ['changes', 'Where this comes from']
  ];

  function cNow(c) {
    var s = el('section', 'now');
    s.innerHTML = '<div class="banner">' +
      '<p class="headline">' + esc(c.status_headline) + '</p>' +
      (c.status_sub ? '<p class="sub">' + esc(c.status_sub) + '</p>' : '') +
      '<p class="asof">Checked ' + esc(date(c.updated)) + '</p></div>' +
      '<p class="crosslink">New to this? <a href="#how-to-help">Read How to help first</a> — ' +
      'what you may legally do, what the words mean, and how to spot a scam.</p>' +
      '<ol class="sixty">' + c.in_sixty_seconds.map(function (t) {
        return '<li>' + esc(t) + '</li>';
      }).join('') + '</ol>';
    return s;
  }

  function cMeans(c) {
    var body = '<ul class="pts">' + c.what_termination_means.map(function (p) {
      return '<li><b>' + esc(p.point) + '</b><span>' + esc(p.detail) + '</span></li>';
    }).join('') + '</ul>' +
      (c.also_ask ? '<div class="aside"><h4>' + esc(c.also_ask.heading) + '</h4><p>' +
        esc(c.also_ask.body) + '</p>' + src(c.also_ask.source) + '</div>' : '');
    return section('means', 'If someone says they had TPS', 'What changed for them', body);
  }

  function cAsk(c) {
    var q = c.critical_questions;
    var body = '<p class="lede">' + esc(q.lede) + '</p>' +
      q.items.map(function (k) {
        return '<div class="key"><h3>' + esc(k.title) + '</h3><p>' + esc(k.body) + '</p>' +
          '<p class="do">' + esc(k.why) + '</p>' + src(k.source) + '</div>';
      }).join('') +
      (c.relief_note ? '<p class="crosslink">' + esc(c.relief_note) + ' ' +
        '<a href="#how-to-help">Open How to help</a>.</p>' : '');
    return section('ask', 'Where the opportunity is', q.heading, body);
  }

  function cOrgs(c) {
    var o = c.orgs;
    var body = '<p class="lede">' + esc(o.note) + '</p>' + o.list.map(orgCard).join('') +
      '<p class="crosslink">National directories are on the ' +
      '<a href="#how-to-help">How to help</a> page.</p>';
    return section('orgs', 'Local and community help', o.heading, body, 'help');
  }

  function cConditions(c) {
    var k = c.conditions, adv = k.advisory;
    var body = '<p class="lede">' + esc(k.intro) + '</p>' + k.metrics.map(chart).join('') +
      '<h3>' + esc(k.health.label) + '</h3><ul class="pts">' +
        k.health.points.map(function (p) {
          return '<li><span>' + esc(p.text) + '</span>' + src(p.source) + '</li>';
        }).join('') + '</ul>' +
      '<h3>' + esc(k.political.label) + '</h3><ul class="tl">' +
        k.political.events.map(function (e) {
          return '<li><div class="d">' + esc(date(e.date)) + '</div><p class="e">' + esc(e.text) + '</p>' +
            (e.url ? '<div class="c"><a href="' + esc(e.url) + '" rel="noopener">Source</a></div>' : '') +
            '</li>';
        }).join('') + '</ul>' +
      '<div class="advisory"><h4>' + esc(adv.label) + '</h4><p>' + esc(adv.reasons) +
        ' The State Department issued this on ' + esc(date(adv.issued)) + '.</p>' +
        src({ org: adv.source.org, url: adv.url, as_of: adv.source.as_of }) + '</div>';
    return section('conditions', 'When someone asks why they will not just go home', k.heading, body);
  }

  function cAffected(c) {
    var a = c.who_is_affected, b = a.by_state;
    var max = Math.max.apply(null, b.series.map(function (x) { return x.value; }));
    var body = '<div class="figure"><div class="big-num">' + esc(a.headline) + '</div>' +
      '<p>' + esc(a.headline_label) + '</p>' + src(a.headline_source) + '</div>' +
      '<ul class="pts">' + a.notes.map(function (n) {
        return '<li><span>' + esc(n.text) + '</span>' + src(n.source) + '</li>';
      }).join('') + '</ul>' +
      '<div class="metric"><h3>' + esc(b.label) + '<span class="badge adv">advocacy estimate</span></h3>' +
      '<p class="note">' + esc(b.caveat) + '</p><div class="bars">' +
      b.series.map(function (x) {
        var pct = Math.max(3, (x.value / max) * 100), inside = pct > 34;
        return '<div class="bar"><div class="lab">' + esc(x.label) + '</div>' +
          '<div class="track"><div class="fill" style="width:' + pct.toFixed(1) + '%"></div>' +
          '<span class="val' + (inside ? ' inside' : '') + '">' + shortNum(x.value) + '</span></div></div>';
      }).join('') + '</div>' + src(b.source) + '</div>';
    return section('affected', 'The scale of it', a.heading, body);
  }

  function cStory(c) {
    var w = c.what_happened;
    var body = w.paragraphs.map(function (p) { return '<p class="story">' + esc(p) + '</p>'; }).join('') +
      srcList(w.sources) +
      '<details class="tl-toggle"><summary>See the full dated timeline</summary><ul class="tl">' +
      c.timeline.map(function (t) {
        var cite = t.url ? '<a href="' + esc(t.url) + '" rel="noopener">' + esc(t.cite) + '</a>' : esc(t.cite);
        return '<li' + (t.key ? ' class="key"' : '') + '><div class="d">' + esc(date(t.date)) + '</div>' +
          '<p class="e">' + esc(t.event) + '</p><div class="c">' + cite + '</div></li>';
      }).join('') + '</ul></details>';
    return section('story', 'For when you need the background', w.heading, body);
  }

  function cChanges(c) {
    var body = '<p class="lede">Every number on this page links to where it came from. The page is ' +
      'reviewed monthly, and what changed is recorded here rather than quietly edited.</p>' +
      '<ul class="changes">' + c.changes.map(function (ch) {
        return '<li><b>' + esc(date(ch.date)) + '.</b> ' + esc(ch.text) + '</li>';
      }).join('') + '</ul>' +
      '<p class="src">Last checked ' + esc(date(c.updated)) + '. Something wrong? Tell us at ' +
      '<a href="https://github.com/GoodDevCo/understand" rel="noopener">github.com/GoodDevCo/understand</a>.</p>';
    return section('changes', 'Keeping it honest', 'Where this comes from', body);
  }

  function renderCountry(c) {
    var app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(cNow(c));
    app.appendChild(toc(COUNTRY_TOC, true));
    [cMeans(c), cAsk(c), cOrgs(c), cConditions(c), cAffected(c), cStory(c), cChanges(c)]
      .forEach(function (n) { app.appendChild(n); });
    document.title = 'UnderSTAND — ' + c.name;
  }

  // ================= nav + routing =================

  function nav(cur) {
    var n = document.getElementById('country-nav');
    n.innerHTML = '';
    var g = el('button', 'guide-tab', 'How to help');
    g.setAttribute('aria-current', cur === 'how-to-help' ? 'true' : 'false');
    g.onclick = function () { go('how-to-help'); };
    n.appendChild(g);
    n.appendChild(el('span', 'nav-div', '&nbsp;'));
    D.index.countries.forEach(function (c) {
      var b = el('button', null, esc(c.name));
      if (!c.published) { b.disabled = true; b.title = 'Not yet published'; }
      else {
        b.setAttribute('aria-current', c.slug === cur ? 'true' : 'false');
        b.onclick = function () { go(c.slug); };
      }
      n.appendChild(b);
    });
  }

  function get(p) {
    return fetch(p, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(p + ' → ' + r.status);
      return r.json();
    });
  }

  function go(slug) {
    if (slug === 'how-to-help') {
      renderGuide(); nav(slug);
      if (history.replaceState) history.replaceState(null, '', '#how-to-help');
      window.scrollTo(0, 0);
      return;
    }
    get('data/countries/' + slug + '.json').then(function (c) {
      renderCountry(c); nav(slug);
      if (history.replaceState) history.replaceState(null, '', '#' + slug);
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  function fail(e) {
    document.getElementById('app').innerHTML =
      '<p class="loading">Could not load the data files. If you opened this from your own computer, ' +
      'browsers block that — run <code>python3 -m http.server</code> or use the published site.' +
      '<br><br><small>' + esc(e.message) + '</small></p>';
  }

  window.addEventListener('hashchange', function () {
    var w = location.hash.replace('#', '');
    if (w === 'how-to-help' || D.index.countries.some(function (c) {
      return c.slug === w && c.published;
    })) go(w);
  });

  Promise.all([
    get('data/countries/index.json'),
    get('data/shared/statuses.json'),
    get('data/shared/paths.json'),
    get('data/shared/glossary.json'),
    get('data/shared/directories.json'),
    get('data/shared/waittimes.json'),
    get('data/shared/helping.json')
  ]).then(function (r) {
    D.index = r[0]; D.statuses = r[1]; D.paths = r[2]; D.glossary = r[3];
    D.directories = r[4]; D.wait = r[5]; D.helping = r[6];
    var want = location.hash.replace('#', '');
    var ok = want === 'how-to-help' ||
      D.index.countries.some(function (c) { return c.slug === want && c.published; });
    go(ok ? want : D.index.default);
  }).catch(fail);
})();
