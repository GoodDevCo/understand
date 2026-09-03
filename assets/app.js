(function () {
  'use strict';

  var D = {}; // loaded shared data

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function num(n) { return n.toLocaleString('en-US'); }
  function shortNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
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
  function srcLine(s, prefix) {
    if (!s) return '';
    var adv = s.kind === 'advocacy' ? '<span class="badge adv">advocacy source</span>' : '';
    var org = s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.org) + '</a>' : esc(s.org);
    return '<p class="src">' + (prefix || 'Source:') + ' ' + org +
      (s.as_of ? ', as of ' + esc(date(s.as_of)) : '') + adv + '</p>';
  }
  function flag(text) {
    return text ? '<p class="flag"><b>Caveat.</b> ' + esc(text) + '</p>' : '';
  }
  function h2(n, title) {
    return '<h2><span class="num">' + n + '</span>' + esc(title) + '</h2>';
  }

  // ---------- sections ----------

  function secSixty(c) {
    var s = el('section');
    s.innerHTML = h2('01', 'In sixty seconds') +
      '<ol class="sixty">' + c.in_sixty_seconds.map(function (t) {
        return '<li>' + esc(t) + '</li>';
      }).join('') + '</ol>';
    return s;
  }

  function secStatuses() {
    var s = el('section');
    s.innerHTML = h2('02', 'Status types, and what each one actually gives you') +
      '<p class="lede">' + esc(D.statuses.note) + ' Most public confusion comes from treating these as interchangeable. They are not: two of them lead to a green card, and several lead nowhere by design.</p>' +
      '<div class="grid">' + D.statuses.statuses.map(function (st) {
        function fact(k, v, cls) {
          return '<dt>' + k + '</dt><dd' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(v) + '</dd>';
        }
        var gc = /^No/i.test(st.green_card) ? 'no' : (/^Yes|^This is it/i.test(st.green_card) ? 'yes' : '');
        var wk = /^Yes/i.test(st.work) ? 'yes' : (/^No/i.test(st.work) ? 'no' : '');
        return '<div class="card">' +
          '<h4>' + esc(st.name) + '</h4>' +
          '<p class="short">' + esc(st.short) + '</p>' +
          '<p class="what">' + esc(st.what) + '</p>' +
          '<dl class="facts">' +
            fact('Granted by', st.granted_by) +
            fact('Can work', st.work, wk) +
            fact('Green card', st.green_card, gc) +
            fact('Lasts', st.duration) +
          '</dl>' + srcLine(st.source) + '</div>';
      }).join('') + '</div>';
    return s;
  }

  function secTimeline(c) {
    var s = el('section');
    s.innerHTML = h2('03', 'Timeline') +
      '<p class="lede">Every entry cites the Federal Register notice or court order it comes from. Highlighted entries are the ones that changed people’s legal position.</p>' +
      '<ul class="tl">' + c.timeline.map(function (t) {
        var cite = t.url
          ? '<a href="' + esc(t.url) + '" rel="noopener">' + esc(t.cite) + '</a>'
          : esc(t.cite);
        return '<li' + (t.key ? ' class="key"' : '') + '>' +
          '<div class="d">' + esc(date(t.date)) + '</div>' +
          '<p class="e">' + esc(t.event) + '</p>' +
          '<div class="c">' + cite + '</div></li>';
      }).join('') + '</ul>';
    return s;
  }

  function chart(m) {
    var vals = m.series.filter(function (x) { return x.comparable !== false; })
                       .map(function (x) { return x.value; });
    var max = Math.max.apply(null, m.series.map(function (x) { return x.value; }));
    var anyPartial = m.series.some(function (x) { return x.comparable === false; });
    var seen = {}, srcs = [];
    m.series.forEach(function (x) {
      if (x.source && !seen[x.source.url]) { seen[x.source.url] = 1; srcs.push(x.source); }
    });
    var bars = m.series.map(function (x) {
      var pct = Math.max(2, (x.value / max) * 100);
      var inside = pct > 30;
      return '<div class="bar' + (x.comparable === false ? ' partial' : '') + '">' +
        '<div class="lab">' + esc(x.period) +
          (x.comparable === false ? '<span class="badge partial">part</span>' : '') + '</div>' +
        '<div class="track"><div class="fill" style="width:' + pct.toFixed(1) + '%"></div>' +
          '<span class="val' + (inside ? ' inside' : '') + '">' + num(x.value) + '</span></div>' +
      '</div>';
    }).join('');
    var notes = m.series.filter(function (x) { return x.note || x.flag; }).map(function (x) {
      return '<p class="partial-note"><b>' + esc(x.period) + '.</b> ' +
        esc(x.note || '') + (x.flag ? ' ' + esc(x.flag) : '') + '</p>';
    }).join('');
    return '<div class="metric">' +
      '<h3>' + esc(m.label) + '</h3>' +
      (m.note ? '<p class="note">' + esc(m.note) + '</p>' : '') +
      '<div class="bars">' + bars + '</div>' +
      (anyPartial ? '<p class="partial-note"><b>Hatched bars cover a partial period.</b> They are shown for currency, not comparison. Do not read them against the full periods above, and do not annualize them.</p>' : '') +
      notes +
      '<p class="series-src">Sources: ' + srcs.map(function (s) {
        return '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.org) + '</a>';
      }).join(' · ') + '</p>' +
    '</div>';
  }

  function secConditions(c) {
    var k = c.conditions, s = el('section');
    var adv = k.advisory;
    var html = h2('04', 'Conditions in ' + c.name) +
      '<p class="lede">' + esc(k.intro) + '</p>' +
      k.metrics.map(chart).join('');

    html += '<h3>' + esc(k.health.label) + '</h3><ul class="pts">' +
      k.health.points.map(function (p) {
        return '<li><span>' + esc(p.text) + '</span>' + srcLine(p.source) + '</li>';
      }).join('') + '</ul>';

    html += '<h3>' + esc(k.political.label) + '</h3><ul class="tl">' +
      k.political.events.map(function (e) {
        return '<li><div class="d">' + esc(date(e.date)) + '</div>' +
          '<p class="e">' + esc(e.text) + '</p>' +
          (e.url ? '<div class="c"><a href="' + esc(e.url) + '" rel="noopener">Source</a></div>' : '') +
          (e.flag ? flag(e.flag) : '') + '</li>';
      }).join('') + '</ul>';

    html += '<h3>U.S. travel advisory</h3>' +
      '<div class="metric"><h3 style="margin:0">' + esc(adv.label) + '</h3>' +
      '<p class="note" style="margin-top:.4rem">' + esc(adv.reasons) + ' Issued ' + esc(date(adv.issued)) + '.</p>' +
      srcLine({ org: adv.source.org, url: adv.url, as_of: adv.source.as_of }) + '</div>';

    s.innerHTML = html;
    return s;
  }

  function secAffected(c) {
    var a = c.who_is_affected, s = el('section');
    var html = h2('05', 'Who is affected in the United States') +
      '<div class="metric"><div class="headline-fig">' + esc(a.headline) + '</div>' +
      '<p class="headline-lab">' + esc(a.headline_label) + '</p>' + srcLine(a.headline_source) + '</div>' +
      '<ul class="pts">' + a.notes.map(function (n) {
        return '<li><span>' + esc(n.text) + '</span>' + srcLine(n.source) + '</li>';
      }).join('') + '</ul>';

    if (a.by_state) {
      var b = a.by_state, max = Math.max.apply(null, b.series.map(function (x) { return x.value; }));
      html += '<div class="metric"><h3>' + esc(b.label) +
        '<span class="badge adv">advocacy estimate</span></h3>' +
        '<p class="note">' + esc(b.caveat) + '</p><div class="bars">' +
        b.series.map(function (x) {
          var pct = Math.max(2, (x.value / max) * 100), inside = pct > 30;
          return '<div class="bar"><div class="lab">' + esc(x.label) + '</div>' +
            '<div class="track"><div class="fill" style="width:' + pct.toFixed(1) + '%"></div>' +
            '<span class="val' + (inside ? ' inside' : '') + '">' + shortNum(x.value) + '</span></div></div>';
        }).join('') + '</div>' + srcLine(b.source) + '</div>';
    }
    s.innerHTML = html;
    return s;
  }

  function secMeans(c) {
    var s = el('section');
    s.innerHTML = h2('06', 'What termination means') +
      '<p class="lede">The practical consequences, separated from the political argument about whether it should have happened.</p>' +
      '<ul class="pts">' + c.what_termination_means.map(function (p) {
        return '<li><b>' + esc(p.point) + '</b><span>' + esc(p.detail) + '</span></li>';
      }).join('') + '</ul>';
    return s;
  }

  function secPaths() {
    var s = el('section');
    s.innerHTML = h2('07', 'Paths forward') +
      '<p class="lede">' + esc(D.paths.note) + '</p>' +
      '<ul class="pts">' + D.paths.paths.map(function (p) {
        return '<li><b>' + esc(p.name) + '</b><span>' + esc(p.constraint) + '</span>' +
          '<p style="font-size:.9rem;color:var(--ink-2);margin:.5rem 0 0;max-width:none">' + esc(p.detail) + '</p>' +
          srcLine(p.source) + '</li>';
      }).join('') + '</ul>' + waitTable();
    return s;
  }

  function waitTable() {
    var w = D.wait;
    var head = '<tr><th class="first">Category</th>' + w.columns.map(function (col) {
      return '<th' + (col.highlight ? ' class="hl"' : '') + '>' + esc(col.label) + '</th>';
    }).join('') + '</tr>';
    var rows = w.categories.map(function (cat) {
      var r = w.final_action_dates[cat.id];
      return '<tr><td class="first"><b>' + esc(cat.id) + '</b> — ' + esc(cat.label) + '</td>' +
        w.columns.map(function (col) {
          return '<td class="num' + (col.highlight ? ' hl' : '') + '">' + esc(date(r[col.id])) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<h3>How long the line is</h3>' +
      '<p class="lede">' + esc(w.how_it_works) + '</p>' +
      '<div class="tw"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="src">Final action dates, ' + esc(w.bulletin.month) + ' Visa Bulletin (' + esc(w.bulletin.issue) + '). ' +
      '<a href="' + esc(w.bulletin.url) + '" rel="noopener">U.S. Department of State</a>, retrieved ' +
      esc(date(w.bulletin.retrieved)) + '. A date shown is the priority date now being processed — a petition filed after it is still waiting.</p>';
  }

  function secContested(c) {
    var s = el('section');
    s.innerHTML = h2('08', 'What is contested') +
      '<p class="lede">Each side’s position is stated as that side states it, with its own source. Where a court has since resolved the question, the resolution is noted separately.</p>' +
      c.contested.map(function (q) {
        return '<div class="contested"><h3>' + esc(q.question) + '</h3><div class="two">' +
          '<div class="side gov"><h5>' + esc(q.government_label || "The government’s position") + '</h5><p>' + esc(q.government) + '</p>' +
            srcLine(q.government_source) + '</div>' +
          '<div class="side chal"><h5>' + esc(q.challengers_label || "The challengers’ position") + '</h5><p>' + esc(q.challengers) + '</p>' +
            srcLine(q.challengers_source) + '</div></div>' +
          (q.resolution ? '<p class="resolution"><b>Where it stands.</b> ' + esc(q.resolution) + '</p>' : '') +
        '</div>';
      }).join('');
    return s;
  }

  function secLitigation(c) {
    var s = el('section');
    var extra = (c.related_programs || []).map(function (p) {
      return '<div class="metric"><h3>' + esc(p.name) + '</h3>' +
        '<p class="note">' + esc(p.summary) + '</p>' +
        '<div class="bars">' + p.figures.map(function (f) {
          return '<div class="bar"><div class="lab">' + esc(f.value) + '</div>' +
            '<div class="track" style="background:none"><span class="val inside" style="color:var(--ink);left:0;font-weight:400">' +
            esc(f.label) + (f.source.kind === 'advocacy' ? '<span class="badge adv">advocacy</span>' : '') +
            '</span></div></div>';
        }).join('') + '</div>' + flag(p.flag) +
        '<p class="src"><a href="' + esc(p.url) + '" rel="noopener">' + esc(p.cite) + '</a></p></div>';
    }).join('');
    s.innerHTML = h2('09', 'Litigation') +
      '<p class="lede">Cases are listed with their court and docket so anyone can check the record directly.</p>' +
      c.litigation.map(function (l) {
        return '<div class="case"><h4><a href="' + esc(l.url) + '" rel="noopener">' + esc(l.case) + '</a></h4>' +
          '<p class="court">' + esc(l.court) + ' · ' + esc(l.docket) + '</p>' +
          '<span class="st">' + esc(l.status) + '</span>' +
          '<p class="sum">' + esc(l.summary) + '</p></div>';
      }).join('') +
      (extra ? '<h3>Related programs</h3>' + extra : '');
    return s;
  }

  function secHelp() {
    var o = D.orgs, s = el('section');
    s.innerHTML = h2('10', 'Where to get help') +
      '<p class="lede">' + esc(o.note) + '</p>' +
      '<h3>Start with a directory</h3>' +
      o.directories.map(orgCard).join('') +
      '<h3>Organizations</h3>' +
      o.organizations.map(orgCard).join('');
    return s;
  }
  function orgCard(g) {
    return '<div class="org"><h4><a href="' + esc(g.url) + '" rel="noopener">' + esc(g.name) + '</a></h4>' +
      '<div class="where">' + esc(g.region || g.org) + '</div>' +
      '<p>' + esc(g.what) + '</p>' +
      '<div class="cost">' + esc(g.cost) + '</div>' +
      (g.flag ? flag(g.flag) : '') + '</div>';
  }

  function secTerms() {
    var s = el('section');
    s.innerHTML = h2('11', 'Terms') +
      '<dl class="gloss">' + D.glossary.terms.map(function (t) {
        return '<div><dt>' + esc(t.term) + '</dt><dd>' + esc(t.def) + '</dd></div>';
      }).join('') + '</dl>';
    return s;
  }

  function secChanges(c) {
    var s = el('section');
    s.innerHTML = h2('12', 'Sources and changes') +
      '<p class="lede">Every figure on this page links to its source. This page is reviewed monthly; the log below records what changed and when. Entries are appended, never rewritten.</p>' +
      '<ul class="changes">' + c.changes.map(function (ch) {
        return '<li><b>' + esc(date(ch.date)) + '.</b> ' + esc(ch.text) + '</li>';
      }).join('') + '</ul>' +
      '<p class="src">Page last verified ' + esc(date(c.updated)) +
      '. Corrections are welcome at <a href="https://github.com/GoodDevCo/understand" rel="noopener">github.com/GoodDevCo/understand</a>.</p>';
    return s;
  }

  // ---------- render ----------

  function render(c) {
    var app = document.getElementById('app');
    app.innerHTML = '';
    var banner = el('div', 'status-banner');
    banner.innerHTML = '<p>' + esc(c.status_headline) + '</p>' +
      '<div class="asof">Verified ' + esc(date(c.updated)) + '. Nothing on this page is legal advice.</div>';
    app.appendChild(banner);
    [secSixty(c), secStatuses(), secTimeline(c), secConditions(c), secAffected(c),
     secMeans(c), secPaths(), secContested(c), secLitigation(c), secHelp(),
     secTerms(), secChanges(c)].forEach(function (n) { app.appendChild(n); });
    document.title = 'UnderSTAND — ' + c.name;
  }

  function nav(idx, current) {
    var n = document.getElementById('country-nav');
    n.innerHTML = '';
    idx.countries.forEach(function (c) {
      var b = el('button', null, esc(c.name));
      if (!c.published) { b.disabled = true; b.title = 'Not yet published'; }
      else {
        b.setAttribute('aria-current', c.slug === current ? 'true' : 'false');
        b.onclick = function () { load(c.slug); };
      }
      n.appendChild(b);
    });
  }

  function get(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' → ' + r.status);
      return r.json();
    });
  }

  function load(slug) {
    get('data/countries/' + slug + '.json').then(function (c) {
      render(c);
      nav(D.index, slug);
      if (history.replaceState) history.replaceState(null, '', '#' + slug);
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  function fail(e) {
    document.getElementById('app').innerHTML =
      '<p class="loading">Could not load the data files. If you are opening this ' +
      'from your filesystem, browsers block local fetches — run a local server ' +
      '(<code>python3 -m http.server</code>) or view the published site.<br><br>' +
      '<small>' + esc(e.message) + '</small></p>';
  }

  Promise.all([
    get('data/countries/index.json'),
    get('data/shared/statuses.json'),
    get('data/shared/paths.json'),
    get('data/shared/glossary.json'),
    get('data/shared/orgs.json'),
    get('data/shared/waittimes.json')
  ]).then(function (r) {
    D.index = r[0]; D.statuses = r[1]; D.paths = r[2];
    D.glossary = r[3]; D.orgs = r[4]; D.wait = r[5];
    var want = location.hash.replace('#', '');
    var ok = D.index.countries.some(function (c) { return c.slug === want && c.published; });
    load(ok ? want : D.index.default);
  }).catch(fail);
})();
