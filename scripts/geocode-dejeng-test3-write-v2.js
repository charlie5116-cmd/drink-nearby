/**
 * Drink Nearby — Dejeng Geocoder V2
 * 3-store write test
 *
 * Writes ONLY:
 *   data/dejeng-test-3.json
 *
 * Does NOT modify:
 *   data/dejeng.json
 */

const fs = require("fs");
const path = require("path");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const WAIT_MS = 1100;
const OUTPUT_PATH = path.resolve(__dirname, "../data/dejeng-test-3.json");

const USER_AGENT =
  "DrinkNearby-Geocoder-Test3/2.0 (+https://github.com/charlie5116-cmd/drink-nearby)";

const STORES = [
  {
    id: "dejeng:台北木新",
    brand: "得正",
    branch: "台北木新",
    name: "得正 台北木新",
    address: "116台北市文山區木新路三段146號",
    phone: "02-29390285",
  },
  {
    id: "dejeng:台北西門",
    brand: "得正",
    branch: "台北西門",
    name: "得正 台北西門",
    address: "108台北市萬華區西寧南路111號",
    phone: null,
  },
  {
    id: "dejeng:台北晴光",
    brand: "得正",
    branch: "台北晴光",
    name: "得正 台北晴光",
    address: "104台北市中山區農安街18號",
    phone: null,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTaiwanAddress(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/[，,。．]/g, "")
    .replace(/\s+/g, "")
    .replace(/台/g, "臺");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .replace(/[，,。．.]/g, "")
    .replace(/之/g, "-")
    .toLowerCase();
}

function parseTaiwanAddress(input) {
  let rest = normalizeTaiwanAddress(input);

  const result = {
    postalCode: "",
    city: "",
    district: "",
    street: "",
    section: "",
    lane: "",
    alley: "",
    number: "",
  };

  let m = rest.match(/^(\d{3,6})/);
  if (m) {
    result.postalCode = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(.{2,4}?(?:縣|市))/);
  if (m) {
    result.city = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(.{1,6}?(?:區|鄉|鎮|市))/);
  if (m) {
    result.district = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(.+?(?:大道|路|街|道))/);
  if (!m) throw new Error(`無法解析道路：${input}`);
  result.street = m[1];
  rest = rest.slice(m[0].length);

  m = rest.match(/^([一二三四五六七八九十百零〇\d]+)段/);
  if (m) {
    result.section = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(\d+)巷/);
  if (m) {
    result.lane = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(\d+)弄/);
  if (m) {
    result.alley = m[1];
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(\d+(?:[-之]\d+)?)號?/);
  if (m) {
    result.number = m[1].replace("之", "-");
  }

  return result;
}

function streetText(parts) {
  return [
    parts.street,
    parts.section ? `${parts.section}段` : "",
    parts.lane ? `${parts.lane}巷` : "",
    parts.alley ? `${parts.alley}弄` : "",
  ].join("");
}

function structuredAttempts(parts) {
  const road = streetText(parts);
  const number = parts.number ? `${parts.number.replace("-", "之")}號` : "";

  return [
    {
      label: "structured-number-first",
      params: {
        street: `${number} ${road}`.trim(),
        city: parts.city,
        county: parts.district,
        country: "Taiwan",
      },
    },
    {
      label: "structured-road-first",
      params: {
        street: `${road} ${number}`.trim(),
        city: parts.city,
        county: parts.district,
        country: "Taiwan",
      },
    },
  ];
}

function candidateText(item) {
  const a = item.address || {};
  return [
    item.display_name,
    a.house_number,
    a.road,
    a.pedestrian,
    a.residential,
    a.city_district,
    a.suburb,
    a.district,
    a.city,
    a.county,
  ].filter(Boolean).join(" ");
}

function scoreCandidate(item, parts) {
  const text = normalize(candidateText(item));
  const road = normalize(streetText(parts));
  const district = normalize(parts.district);
  const city = normalize(parts.city);
  const number = normalize(parts.number);

  let score = 0;
  let exactHouse = false;
  let streetMatched = false;

  if (road && text.includes(road)) {
    score += 80;
    streetMatched = true;
  }

  if (district && text.includes(district)) score += 30;
  if (city && text.includes(city)) score += 20;

  if (number) {
    const house = normalize(item.address?.house_number || "");

    if (house && house === number) {
      score += 100;
      exactHouse = true;
    } else {
      const rawDisplay = normalize(item.display_name || "");
      const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^0-9])${escaped}([^0-9]|$)`);

      if (regex.test(rawDisplay)) {
        score += 75;
        exactHouse = true;
      } else if (house) {
        score -= 90;
      } else {
        score -= 20;
      }
    }
  }

  return { score, exactHouse, streetMatched };
}

async function request(params) {
  const url = new URL(NOMINATIM_URL);

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "tw");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.5",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  return response.json();
}

async function geocodeExact(store) {
  const parts = parseTaiwanAddress(store.address);
  const attempts = structuredAttempts(parts);

  let best = null;

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(WAIT_MS);

    const attempt = attempts[i];
    console.log(`  → ${attempt.label}`, attempt.params);

    const results = await request(attempt.params);

    for (const item of results) {
      const scored = scoreCandidate(item, parts);
      const candidate = {
        item,
        attempt: attempt.label,
        ...scored,
      };

      if (!best || candidate.score > best.score) best = candidate;
    }

    if (
      best &&
      best.streetMatched &&
      best.exactHouse &&
      best.score >= 180
    ) {
      break;
    }
  }

  if (
    !best ||
    !best.streetMatched ||
    !best.exactHouse ||
    best.score < 180
  ) {
    throw new Error(`找不到可靠 exact match：${store.branch}`);
  }

  return {
    lat: Number(best.item.lat),
    lng: Number(best.item.lon),
    displayName: best.item.display_name || null,
    provider: "nominatim_osmf_test",
    method: best.attempt,
    score: best.score,
  };
}

async function main() {
  console.log("🧪 Dejeng Geocoder V2 — 3-store WRITE TEST");

  const outputStores = [];

  for (let i = 0; i < STORES.length; i++) {
    if (i > 0) await sleep(WAIT_MS);

    const store = STORES[i];
    console.log(`\n[${i + 1}/3] ${store.name}`);
    console.log(`  ${store.address}`);

    const result = await geocodeExact(store);

    console.log(`  ✅ ${result.lat}, ${result.lng}`);

    outputStores.push({
      ...store,
      lat: result.lat,
      lng: result.lng,
      geocoded_at: new Date().toISOString(),
      geocode_provider: result.provider,
      geocode_method: result.method,
      geocode_score: result.score,
      geocode_display_name: result.displayName,
    });
  }

  const output = {
    meta: {
      test: true,
      purpose: "Dejeng Geocoder V2 3-store end-to-end write test",
      generated_at: new Date().toISOString(),
      store_count: outputStores.length,
      geocoded_count: outputStores.filter(
        (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)
      ).length,
    },
    stores: outputStores,
  };

  if (output.meta.geocoded_count !== 3) {
    throw new Error(`Validation failed: ${output.meta.geocoded_count}/3 geocoded`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log("\n==============================");
  console.log("✅ WRITE TEST SUCCESS");
  console.log(`Stores: ${output.meta.store_count}`);
  console.log(`Geocoded: ${output.meta.geocoded_count}/3`);
  console.log(`Written: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("\n❌ WRITE TEST FAILED");
  console.error(err);
  process.exit(1);
});
