window.__CFG = {"id":"adu1113l","maxDetail":200,"kw":["related%20living","in-law","mother-in-law","guest%20house","two%20homes","two%20houses","coach%20house","second%20unit","carriage%20house","garage%20apartment","accessory%20dwelling","guest%20cottage","dual%20living"],"lanes":["related%20living","in-law","mother-in-law","guest%20house","two%20homes","two%20houses","coach%20house","second%20unit","carriage%20house","garage%20apartment","accessory%20dwelling","guest%20cottage","dual%20living"],"markets":[{"key":"bourbonnais-35mi","caps":{"r":450,"m":400,"n":300},"counties":[{"name":"Kankakee","st":"IL","path":"/county/757/IL/Kankakee-County"},{"name":"Grundy","st":"IL","path":"/county/743/IL/Grundy-County"},{"name":"Iroquois","st":"IL","path":"/county/749/IL/Iroquois-County"},{"name":"Will","st":"IL","path":"/county/810/IL/Will-County"},{"name":"LaPorte","st":"IN","path":"/county/859/IN/LaPorte-County"},{"name":"Porter","st":"IN","path":"/county/877/IN/Porter-County"},{"name":"Berrien","st":"MI","path":"/county/1358/MI/Berrien-County"},{"name":"Vermilion","st":"IL","path":"/county/803/IL/Vermilion-County"},{"name":"LaSalle","st":"IL","zip":"61350"},{"name":"Champaign","st":"IL","path":"/county/721/IL/Champaign-County"},{"name":"McLean","st":"IL","path":"/county/768/IL/McLean-County"},{"name":"Tippecanoe","st":"IN","path":"/county/892/IN/Tippecanoe-County"},{"name":"Kenosha","st":"WI","path":"/county/3192/WI/Kenosha-County"},{"name":"Winnebago","st":"IL","path":"/county/812/IL/Winnebago-County"},{"name":"DeKalb","st":"IL","path":"/county/730/IL/DeKalb-County"}]}]};
(() => {
  const CFG = window.__CFG;
  const S = window.__HQ = { id: CFG.id, state: "running", done: 0, total: 0, kept: 0, counties: {}, perUrl: [], errors: [], detail: 0 };
  const rows = new Map();
  const CK = "hqSweep:" + CFG.id + "-ck";
  let resumeAt = 0;
  try { const c = JSON.parse(localStorage.getItem(CK)); if (c) { c.rows.forEach(r => rows.set(r.url, r)); resumeAt = c.done; } } catch (e) {}
  const sleep = (() => { try {
    const w = new Worker(URL.createObjectURL(new Blob(["onmessage=e=>setTimeout(()=>postMessage(e.data[0]),e.data[1])"], { type: "text/javascript" })));
    let n = 0; const cb = new Map(); w.onmessage = e => { const f = cb.get(e.data); cb.delete(e.data); if (f) f(); };
    return ms => new Promise(r => { const id = ++n; cb.set(id, r); w.postMessage([id, ms]); });
  } catch (e) { return ms => new Promise(r => setTimeout(r, ms)); } })();
  const pause = () => sleep(2500 + Math.random() * 2000);
  const html = t => new DOMParser().parseFromString(t, "text/html");
  const num = s => { const n = parseFloat(String(s || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; };
  const ascii = s => s.replace(/[^\x00-\x7e]/g, c => "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4));
  const save = (id, arr) => localStorage.setItem("hqSweep:" + id, "HQBEGIN" + id + "|" + arr.length + "|" + ascii(JSON.stringify(arr)) + "HQEND");
  const get = async u => {
    const r = await fetch(u, { credentials: "same-origin" });
    const t = await r.text();
    if (r.status === 403 || r.status === 429 || /captcha|are you a human|access denied/i.test(t.slice(0, 4000))) throw new Error("BLOCKED " + r.status);
    if (r.status !== 200) throw new Error("HTTP " + r.status);
    return t;
  };
  const LANES = (r, m, n) => [
    ...(CFG.kw || ["related%20living", "in-law", "mother-in-law", "guest%20house", "two%20homes", "coach%20house", "second%20unit"])
      .map(k => [k, `remarks=${k},property-type=house+multifamily,max-price=${r}k`]),
    ["multifamily", `property-type=multifamily,max-price=${m}k`],
    ["cash only", `remarks=cash%20only,property-type=house+multifamily,max-price=${r}k`],
    ...["foreclosure", "bank%20owned", "auction", "short%20sale"]
      .map(k => ["distress:" + k, `remarks=${k},property-type=house+multifamily,max-price=${r}k`]),
    ["newest houses", `property-type=house,min-beds=2,max-price=${n}k,sort=lo-days`]
  ];
  const trueCards = doc => {
    const cards = [...doc.querySelectorAll(".bp-Homecard")];
    const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let mark = null;
    while (w.nextNode()) if (/nearby homes that match/i.test(w.currentNode.nodeValue)) { mark = w.currentNode; break; }
    return mark ? cards.filter(c => !(mark.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)) : cards;
  };
  const parseCard = (c, st) => {
    const g = s => { const e = c.querySelector(s); return e ? e.textContent.trim() : ""; };
    const parts = g(".bp-Homecard__Address").split(",").map(s => s.trim());
    if (parts.length < 3) return null;
    const m = parts[parts.length - 1].match(/^([A-Z]{2})\s+(\d{5})/);
    if (!m || m[1] !== st) return null;                     // another state leaked in
    const ld = (c.querySelector('script[type="application/ld+json"]') || {}).textContent || "";
    const url = (ld.match(/"url"\s*:\s*"([^"]+\/home\/\d+)"/) || [])[1]
      || ((c.querySelector('a[href*="/home/"]') || { getAttribute() { return ""; } }).getAttribute("href") || "");
    if (!url) return null;
    const rem = c.querySelector(".ListingRemarks");
    return {
      addr: parts.slice(0, parts.length - 2).join(", "), city: parts[parts.length - 2], st: m[1], zip: m[2],
      price: num(g(".bp-Homecard__Price--value")), beds: num(g(".bp-Homecard__Stats--beds")),
      baths: num(g(".bp-Homecard__Stats--baths")), sqft: num(g(".bp-Homecard__Stats--sqft")),
      redfinType: (ld.match(/"@type"\s*:\s*"(SingleFamilyResidence|Accommodation|Apartment|House)"/) || [])[1] || "",
      remarks: rem ? rem.textContent.replace(/\s+/g, " ").trim().replace(/^about this home\s*/i, "").replace(/^[^.!?]{0,60}?(County|Parish), [A-Z]{2} Homes for Sale\s*/, "").slice(0, 900) : "",
      remarksSource: rem ? "card" : "", url: url.replace(/^https?:\/\/www\.redfin\.com/, "https://www.redfin.com").replace(/^\//, "https://www.redfin.com/"),
      lat: num((ld.match(/"latitude"\s*:\s*"?(-?[\d.]+)/) || [])[1]), lon: (x => x ? parseFloat(x) : null)((ld.match(/"longitude"\s*:\s*"?(-?[\d.]+)/) || [])[1]),
      sash: g(".bp-Homecard__Sashes").replace(/about this home/i, "").trim()
    };
  };
  (async () => {
    try {
      localStorage.removeItem("hqSweep:" + CFG.id);
      for (const mk of CFG.markets) for (const c of mk.counties) {
        if (c.path) { S.counties[c.path] = c.name; continue; }
        const links = [...html(await get(`/zipcode/${c.zip}`)).querySelectorAll('a[href*="/county/"]')]
          .map(a => a.getAttribute("href").replace(/^https?:\/\/www\.redfin\.com/, ""))
          .filter(h => new RegExp(`^/county/\\d+/${c.st}/`).test(h));
        if (!links.length) { S.errors.push("no county link for zip " + c.zip); continue; }
        c.path = links[0];
        S.counties[c.path] = c.name;
        await pause();
      }
      const jobs = [];
      for (const mk of CFG.markets) for (const c of mk.counties) if (c.path)
        for (const [lane, f] of LANES(mk.caps.r, mk.caps.m, mk.caps.n)) if (!CFG.lanes || CFG.lanes.includes(lane)) jobs.push({ mk, c, lane, f });
      S.total = jobs.length;
      S.done = resumeAt; S.kept = rows.size;
      for (const j of jobs.slice(resumeAt)) {
        try {
          const doc = html(await get(`${j.c.path}/filter/${j.f}`));
          const cards = trueCards(doc);
          let kept = 0;
          for (const card of cards) {
            const r = parseCard(card, j.c.st);
            if (!r || !r.price) continue;
            kept++;
            const prev = rows.get(r.url);
            if (prev) { if (!prev.lanes.includes(j.lane)) prev.lanes.push(j.lane); if (!prev.remarks && r.remarks) Object.assign(prev, { remarks: r.remarks, remarksSource: "card" }); }
            else rows.set(r.url, Object.assign({ market: j.mk.key, county: j.c.name, lanes: [j.lane] }, r));
          }
          S.perUrl.push([j.c.name, j.lane, cards.length]);
          S.kept = rows.size;
        } catch (e) {
          S.errors.push(j.c.name + " / " + j.lane + ": " + e.message);
          if (/BLOCKED/.test(e.message)) { S.state = "blocked"; break; }
        }
        S.done++;
        localStorage.setItem(CK, JSON.stringify({ done: S.done, rows: [...rows.values()] }));
        await pause();
      }
      if (S.state !== "blocked") for (const r of rows.values()) {
        if (r.remarks || S.detail >= CFG.maxDetail || r.lanes.every(l => l === "newest houses")) continue;
        try {
          const e = html(await get(r.url)).querySelector("#marketing-remarks-scroll");
          if (e) Object.assign(r, { remarks: e.textContent.replace(/\s+/g, " ").trim().slice(0, 900), remarksSource: "detail" });
          S.detail++;
        } catch (e) { S.errors.push("detail: " + e.message); if (/BLOCKED/.test(e.message)) { S.state = "blocked"; break; } }
        await pause();
      }
      const arr = [...rows.values()];
      arr.forEach(r => { r.priceIsStartingBid = r.price < 5000 || /starting bid|price listed is/i.test(r.remarks); });
      save(CFG.id, arr);
      if (S.state !== "blocked") localStorage.removeItem(CK);
      save(CFG.id + "-meta", [{ counties: S.counties, perUrl: S.perUrl, errors: S.errors, detail: S.detail, state: S.state === "running" ? "saved" : S.state }]);
      if (S.state === "running") S.state = "saved";
    } catch (e) { S.errors.push("fatal: " + e.message); S.state = "failed"; }
  })();
  return "started " + CFG.id;
})();
