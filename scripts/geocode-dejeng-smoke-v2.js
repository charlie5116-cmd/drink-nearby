/**
 * Drink Nearby — Dejeng Geocoder V2 Smoke Test
 *
 * PURPOSE
 * - Test ONLY 3 known Dejeng stores.
 * - Does NOT modify data/dejeng.json.
 * - Tries Taiwan-address normalization, free-form queries, and structured queries.
 * - Rejects obvious wrong-house-number matches.
 *
 * This script is intentionally diagnostic. Do NOT schedule it.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const WAIT_MS = 1100; // smoke test only: keep below the public max of 1 request/sec
const USER_AGENT =
  "DrinkNearby-Geocoder-Smoke/2.0 (+https://github.com/charlie5116-cmd/drink-nearby)";

const TEST_STORES = [
  {
    branch: "台北木新",
    address: "116台北市文山區木新路三段146號",
  },
  {
    branch: "台北西門",
    address: "108台北市萬華區西寧南路111號",
  },
  {
    branch: "台北晴光",
    address: "104台北市中山區農安街18號",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeTaiwanAddress(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/[，,。．]/g, "")
    .replace(/\s+/g, "")
    .replace(/台/g, "臺");
}

function parseTaiwanAddress(input) {
  let rest = normalizeTaiwanAddress(input);

  const result = {
    original: input,
    postalCode: "",
    city: "",
    district: "",
    street: "",
    section: "",
    lane: "",
    alley: "",
    number: "",
    floor: "",
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
  if (!m) {
    throw new Error(`無法解析道路：${input}`);
  }
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
    rest = rest.slice(m[0].length);
  }

  m = rest.match(/^(.+?(?:樓|F|f))/);
  if (m) {
    result.floor = m[1];
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

function freeFormAttempts(parts) {
  const road = streetText(parts);
  const number = parts.number ? `${parts.number.replace("-", "之")}號` : "";
  const full = `${parts.city}${parts.district}${road}${number}`;

  return [
    {
      kind: "free",
      label: "normalized-full",
      params: { q: full },
    },
    {
      kind: "free",
      label: "comma-separated",
      params: {
        q: [number + road, parts.district, parts.city, "臺灣"]
          .filter(Boolean)
          .join(", "),
      },
    },
    {
      kind: "free",
      label: "number-first",
      params: {
        q: [number, road, parts.district, parts.city, "Taiwan"]
          .filter(Boolean)
          .join(" "),
      },
    },
  ];
}

function structuredAttempts(parts) {
  const road = streetText(parts);
  const number = parts.number ? `${parts.number.replace("-", "之")}號` : "";

  return [
    {
      kind: "structured",
      label: "structured-number-first",
      params: {
        street: `${number} ${road}`.trim(),
        city: parts.city,
        county: parts.district,
        country: "Taiwan",
      },
    },
    {
      kind: "structured",
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
  ]
    .filter(Boolean)
    .join(" ");
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
      // Fallback because some Nominatim results put the number only in display_name.
      const rawDisplay = normalize(item.display_name || "");
      const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const numberRegex = new RegExp(`(^|[^0-9])${escaped}([^0-9]|$)`);
      if (numberRegex.test(rawDisplay)) {
        score += 75;
        exactHouse = true;
      } else if (house) {
        score -= 90; // explicit but wrong house number
      } else {
        score -= 20; // street centroid / building without a number
      }
    }
  }

  return {
    score,
    exactHouse,
    streetMatched,
  };
}

async function request(attempt) {
  const url = new URL(NOMINATIM_URL);

  for (const [key, value] of Object.entries(attempt.params)) {
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
    throw new Error(
      `Nominatim HTTP ${response.status}: ${response.statusText}`
    );
  }

  return {
    url: url.toString(),
    data: await response.json(),
  };
}

async function testStore(store) {
  const parts = parseTaiwanAddress(store.address);
  const attempts = [
    ...freeFormAttempts(parts),
    ...structuredAttempts(parts),
  ];

  console.log("\n============================================================");
  console.log(`🏪 ${store.branch}`);
  console.log(`原始地址：${store.address}`);
  console.log("解析結果：", parts);

  let best = null;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];

    if (i > 0) await sleep(WAIT_MS);

    console.log(`\n[${i + 1}/${attempts.length}] ${attempt.label}`);
    console.log("params:", attempt.params);

    const { data } = await request(attempt);

    console.log(`Nominatim results: ${Array.isArray(data) ? data.length : 0}`);

    for (const item of Array.isArray(data) ? data : []) {
      const scored = scoreCandidate(item, parts);
      console.log(
        `  score=${scored.score} exactHouse=${scored.exactHouse} ` +
          `lat=${item.lat} lon=${item.lon}`
      );
      console.log(`  ${item.display_name}`);

      const candidate = {
        ...item,
        ...scored,
        attempt: attempt.label,
      };

      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }

    // High-confidence exact house-number match: stop early.
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
    best &&
    best.streetMatched &&
    best.exactHouse &&
    best.score >= 180
  ) {
    console.log("\n✅ EXACT MATCH");
    console.log(`   ${best.lat}, ${best.lon}`);
    console.log(`   via: ${best.attempt}`);
    console.log(`   ${best.display_name}`);
    return { status: "exact", best };
  }

  if (best && best.streetMatched && best.score >= 70) {
    console.log("\n⚠️ APPROXIMATE ONLY — 不應直接寫入正式資料");
    console.log(`   best score: ${best.score}`);
    console.log(`   ${best.display_name}`);
    return { status: "approximate", best };
  }

  console.log("\n❌ NO RELIABLE MATCH");
  return { status: "failed", best };
}

async function main() {
  console.log("🧪 Drink Nearby — Dejeng Geocoder V2 Smoke Test");
  console.log("只測 3 間，不修改 data/dejeng.json。");

  const results = [];

  for (let i = 0; i < TEST_STORES.length; i++) {
    if (i > 0) await sleep(WAIT_MS);
    results.push({
      store: TEST_STORES[i],
      result: await testStore(TEST_STORES[i]),
    });
  }

  const exact = results.filter((x) => x.result.status === "exact").length;
  const approximate = results.filter(
    (x) => x.result.status === "approximate"
  ).length;
  const failed = results.filter((x) => x.result.status === "failed").length;

  console.log("\n============================================================");
  console.log("📊 SMOKE TEST SUMMARY");
  console.log(`Exact:       ${exact}/3`);
  console.log(`Approximate: ${approximate}/3`);
  console.log(`Failed:      ${failed}/3`);

  if (exact === 3) {
    console.log("\n✅ 3/3 exact. 可以進入 Geocoder V2 全量版。");
    process.exit(0);
  }

  if (exact === 0) {
    console.error(
      "\n❌ 0/3 exact. 停止使用 public Nominatim 做得正批次門牌 geocoding；不要再跑 210 間。"
    );
    process.exit(2);
  }

  console.error(
    "\n⚠️ 部分成功。先看 logs 判斷是 parser/query 問題，還是 OSM 門牌 coverage 不足。"
  );
  process.exit(3);
}

main().catch((error) => {
  console.error("\n❌ Smoke test crashed");
  console.error(error);
  process.exit(1);
});
