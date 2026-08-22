const SEARCH_RADIUS_METERS = 1500;
const MAX_RESULTS = 50;
const DEFAULT_CENTER = { lat: 25.0478, lng: 121.5170 }; // 台北車站
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const GEOCODE_MIN_INTERVAL_MS = 1100;

// 免費公共 Overpass 服務僅適合 MVP / 小型測試。
// 主站失敗時會自動切換到備援站。
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const TYPE_CONFIG = {
  convenience: { label: "便利商店", icon: "🏪" },
  coffee: { label: "連鎖咖啡", icon: "☕" },
  bubble_tea: { label: "手搖／飲料店", icon: "🧋" },
};

// V0.4：品牌識別。
// 這些是本站自製的簡化品牌 badge，不是品牌官方 Logo；
// 未來如果要換成正式圖片，只要替換 renderBrandIcon() 即可。
const BRAND_CONFIG = {
  "7eleven": { label: "7-ELEVEN", short: "7", className: "brand-7eleven" },
  familymart: { label: "全家", short: "全家", className: "brand-familymart" },
  hilife: { label: "萊爾富", short: "Hi", className: "brand-hilife" },
  okmart: { label: "OK Mart", short: "OK", className: "brand-okmart" },

  starbucks: { label: "星巴克", short: "★", className: "brand-starbucks" },
  louisa: { label: "路易莎", short: "L", className: "brand-louisa" },
  cama: { label: "cama", short: "cama", className: "brand-cama" },
  "85c": { label: "85°C", short: "85°", className: "brand-85c" },
  dante: { label: "丹堤", short: "D", className: "brand-dante" },
  mrbrown: { label: "伯朗", short: "伯朗", className: "brand-mrbrown" },
  komeda: { label: "客美多", short: "K", className: "brand-komeda" },

  "50lan": { label: "50嵐", short: "50嵐", className: "brand-50lan" },
  kebuke: { label: "可不可", short: "可", className: "brand-kebuke" },
  milksha: { label: "迷客夏", short: "迷", className: "brand-milksha" },
  chingshin: { label: "清心福全", short: "清", className: "brand-chingshin" },
  coco: { label: "CoCo", short: "CoCo", className: "brand-coco" },
  macu: { label: "麻古茶坊", short: "麻古", className: "brand-macu" },
  dejeng: { label: "得正", short: "得", className: "brand-dejeng" },
  yimu: { label: "一沐日", short: "沐", className: "brand-yimu" },
  gongcha: { label: "貢茶", short: "貢", className: "brand-gongcha" },
};

let map;
let userMarker;
let centerMarker;
let userPosition = null;
let activeCenter = null;
let places = [];
let placeMarkers = [];
let activeFilter = "all";
let requestController = null;
let geocodeController = null;
let geocodeLastRequestAt = 0;
let centerIntentVersion = 0;

const geocodeCache = new Map();

const els = {
  locateBtn: document.getElementById("locateBtn"),
  useMyLocationBtn: document.getElementById("useMyLocationBtn"),
  startBtn: document.getElementById("startBtn"),
  taipeiTestBtn: document.getElementById("taipeiTestBtn"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  geocodePanel: document.getElementById("geocodePanel"),
  geocodeTitle: document.getElementById("geocodeTitle"),
  geocodeResults: document.getElementById("geocodeResults"),
  closeGeocodeBtn: document.getElementById("closeGeocodeBtn"),
  statusDot: document.getElementById("statusDot"),
  statusTitle: document.getElementById("statusTitle"),
  statusText: document.getElementById("statusText"),
  mapLoading: document.getElementById("mapLoading"),
  results: document.getElementById("results"),
  emptyState: document.getElementById("emptyState"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultMeta: document.getElementById("resultMeta"),
  countAll: document.getElementById("countAll"),
  countConvenience: document.getElementById("countConvenience"),
  countCoffee: document.getElementById("countCoffee"),
  countBubbleTea: document.getElementById("countBubbleTea"),
};

function initMap() {
  map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
    zoom: 13.5,
    attributionControl: true,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
}

function setStatus(state, title, text) {
  els.statusDot.className = `status-dot ${state || ""}`.trim();
  els.statusTitle.textContent = title;
  els.statusText.textContent = text;
}

function setLoading(isLoading, text = "搜尋附近地點中…") {
  els.mapLoading.textContent = text;
  els.mapLoading.classList.toggle("hidden", !isLoading);
}

function locateUser() {
  const intentVersion = ++centerIntentVersion;
  closeGeocodePanel();

  if (!navigator.geolocation) {
    setStatus("error", "瀏覽器不支援定位", "你仍然可以直接搜尋地點，或先按「台北車站測試」。");
    showEmptyState("無法使用定位", "你的瀏覽器不支援 Geolocation API，但地點搜尋仍可使用。", true);
    return;
  }

  setStatus("loading", "正在取得目前位置…", "如果瀏覽器跳出權限詢問，請選擇允許。");
  setLoading(true, "取得目前位置中…");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      // 使用者在定位途中改去搜尋別的地點時，不讓舊的定位結果把畫面搶回來。
      if (intentVersion !== centerIntentVersion) return;

      const { latitude, longitude, accuracy } = position.coords;
      userPosition = { lat: latitude, lng: longitude };
      setUserMarker(latitude, longitude);

      await setActiveCenter({
        lat: latitude,
        lng: longitude,
        label: "我的位置",
        mode: "current",
        detail: `定位誤差約 ${Math.round(accuracy)} 公尺`,
      });
    },
    (error) => {
      if (intentVersion !== centerIntentVersion) return;

      setLoading(false);
      let message = "請確認瀏覽器的定位權限後再試一次，也可以直接搜尋地點。";

      if (error.code === error.PERMISSION_DENIED) {
        message = "你拒絕了定位權限；可以重新允許，或直接搜尋想查看的地點。";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "目前無法取得位置；你仍然可以直接搜尋地點。";
      } else if (error.code === error.TIMEOUT) {
        message = "定位逾時，請再按一次定位，或直接搜尋地點。";
      }

      setStatus("error", "定位失敗", message);
      showEmptyState("定位沒有成功", message, true);
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    }
  );
}

async function setActiveCenter(center) {
  activeCenter = center;

  if (center.mode === "current") {
    removeCenterMarker();
  } else {
    setCenterMarker(center.lat, center.lng, center.label);
  }

  els.resultsTitle.textContent = `${center.label}附近`;

  map.easeTo({
    center: [center.lng, center.lat],
    zoom: 15,
    duration: 900,
  });

  setStatus(
    "success",
    `正在查看：${center.label}`,
    center.mode === "current"
      ? center.detail || "以下距離以你的目前位置為中心。"
      : "以下距離以這個搜尋位置為中心，不是你目前所在的位置。"
  );

  await searchNearby(center.lat, center.lng);
}

function setUserMarker(lat, lng) {
  if (userMarker) userMarker.remove();

  const el = document.createElement("div");
  el.className = "marker-user";
  el.title = "你的位置";

  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(new maplibregl.Popup({ offset: 14 }).setText("你目前在這裡"))
    .addTo(map);
}

function setCenterMarker(lat, lng, label) {
  removeCenterMarker();

  const el = document.createElement("div");
  el.className = "marker-search-center";
  el.title = `搜尋中心：${label}`;

  centerMarker = new maplibregl.Marker({ element: el, anchor: "bottom" })
    .setLngLat([lng, lat])
    .setPopup(new maplibregl.Popup({ offset: 18 }).setText(`搜尋中心：${label}`))
    .addTo(map);
}

function removeCenterMarker() {
  if (centerMarker) {
    centerMarker.remove();
    centerMarker = null;
  }
}

// ---------- V0.4：Nominatim 地點搜尋 ----------
async function handleLocationSearch(event) {
  event.preventDefault();

  const query = els.searchInput.value.trim();
  if (!query) {
    openGeocodeMessage("請先輸入地點，例如「台北101」、「西門站」或一段地址。", "請輸入地點");
    els.searchInput.focus();
    return;
  }

  // 使用者明確選擇搜尋時，讓尚未完成的初始 GPS 定位失效。
  centerIntentVersion += 1;

  if (geocodeController) geocodeController.abort();
  geocodeController = new AbortController();

  els.searchBtn.disabled = true;
  els.searchBtn.textContent = "搜尋中";
  openGeocodeMessage(`正在搜尋「${query}」…`, "搜尋地點");

  try {
    const results = await geocodePlace(query, geocodeController.signal);
    renderGeocodeResults(results, query);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Geocoding failed:", error);
    openGeocodeMessage(
      "地點搜尋服務暫時沒有回應。請稍後再試，或使用目前位置。",
      "搜尋失敗"
    );
  } finally {
    els.searchBtn.disabled = false;
    els.searchBtn.textContent = "搜尋";
  }
}

async function geocodePlace(query, signal) {
  const cacheKey = query.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 公共 Nominatim 不適合高頻連打；V0.4 主動將請求間隔拉到至少約 1.1 秒。
  const elapsed = Date.now() - geocodeLastRequestAt;
  if (elapsed < GEOCODE_MIN_INTERVAL_MS) {
    await sleep(GEOCODE_MIN_INTERVAL_MS - elapsed);
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "5",
    countrycodes: "tw",
    addressdetails: "1",
    "accept-language": "zh-TW,zh,en",
  });

  geocodeLastRequestAt = Date.now();

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Nominatim 回傳 HTTP ${response.status}`);
  }

  const data = await response.json();
  const normalized = (Array.isArray(data) ? data : [])
    .map((item) => ({
      placeId: item.place_id,
      lat: Number(item.lat),
      lng: Number(item.lon),
      title: getGeocodeTitle(item),
      displayName: item.display_name || "",
      type: item.addresstype || item.type || "place",
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  geocodeCache.set(cacheKey, normalized);
  return normalized;
}

function getGeocodeTitle(item) {
  if (item.name) return item.name;
  if (item.display_name) return item.display_name.split(",")[0].trim();
  return "搜尋地點";
}

function renderGeocodeResults(results, query) {
  els.geocodePanel.classList.remove("hidden");

  if (!results.length) {
    els.geocodeTitle.textContent = "找不到地點";
    els.geocodeResults.innerHTML = `
      <div class="geocode-message">
        找不到「${escapeHtml(query)}」。可以改用更完整的名稱，例如「台北101 台北」或直接輸入地址。
      </div>
    `;
    return;
  }

  els.geocodeTitle.textContent = `請選擇地點 · ${results.length} 個結果`;
  els.geocodeResults.innerHTML = results
    .map(
      (result, index) => `
        <button class="geocode-item" type="button" data-geocode-index="${index}">
          <strong>📍 ${escapeHtml(result.title)}</strong>
          <span>${escapeHtml(result.displayName)}</span>
        </button>
      `
    )
    .join("");

  els.geocodeResults.querySelectorAll("[data-geocode-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      const result = results[Number(button.dataset.geocodeIndex)];
      if (!result) return;

      centerIntentVersion += 1;
      closeGeocodePanel();
      els.searchInput.value = result.title;

      await setActiveCenter({
        lat: result.lat,
        lng: result.lng,
        label: result.title,
        mode: "search",
        detail: result.displayName,
      });
    });
  });
}

function openGeocodeMessage(message, title = "搜尋結果") {
  els.geocodeTitle.textContent = title;
  els.geocodeResults.innerHTML = `<div class="geocode-message">${escapeHtml(message)}</div>`;
  els.geocodePanel.classList.remove("hidden");
}

function closeGeocodePanel() {
  els.geocodePanel.classList.add("hidden");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Overpass ----------
function buildOverpassQuery(lat, lng) {
  const around = `(around:${SEARCH_RADIUS_METERS},${lat},${lng})`;
  // V0.4 咖啡仍先鎖定主要連鎖品牌，避免把所有一般咖啡廳一次混進結果。
  const coffeeChains = "Starbucks|星巴克|Louisa|路易莎|cama|85.?C|85度C|85度Ｃ|丹堤|Dante|伯朗|Mr\.? ?Brown|客美多|Komeda";

  return `
[out:json][timeout:20];
(
  nwr${around}["shop"="convenience"];

  nwr${around}["amenity"="cafe"]["name"~"${coffeeChains}",i];
  nwr${around}["amenity"="cafe"]["brand"~"${coffeeChains}",i];
  nwr${around}["amenity"="cafe"]["operator"~"${coffeeChains}",i];
  nwr${around}["shop"="coffee"]["name"~"${coffeeChains}",i];
  nwr${around}["shop"="bakery"]["name"~"${coffeeChains}",i];

  nwr${around}["cuisine"~"bubble_tea",i];
  nwr${around}["drink:bubble_tea"="yes"];
  nwr${around}["shop"="beverages"];
);
out center tags;
`;
}

async function searchNearby(lat, lng) {
  if (requestController) requestController.abort();
  requestController = new AbortController();

  clearPlaces();
  hideEmptyState();
  setLoading(true);
  els.resultMeta.textContent = `搜尋 ${SEARCH_RADIUS_METERS / 1000} km 內…`;

  const query = buildOverpassQuery(lat, lng);

  try {
    const data = await fetchOverpassWithFallback(query, requestController.signal);
    const parsed = parseOverpassElements(data.elements || [], lat, lng);

    places = dedupePlaces(parsed)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);

    renderMarkers();
    updateCounts();
    applyFilter(activeFilter);

    const coffeeCount = places.filter((p) => p.type === "coffee").length;
    const centerLabel = activeCenter?.label || "搜尋位置";
    const centerPrefix = activeCenter?.mode === "current" ? "你的目前位置" : `「${centerLabel}」`;

    setStatus(
      "success",
      `找到 ${places.length} 個地點`,
      coffeeCount === 0
        ? `以${centerPrefix}為中心；目前沒有抓到支援名單內的連鎖咖啡。`
        : `以${centerPrefix}為中心，其中有 ${coffeeCount} 間連鎖咖啡。`
    );
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error(error);
    places = [];
    updateCounts();
    renderResults([]);
    setStatus(
      "error",
      "附近資料暫時抓不到",
      "免費 Overpass 伺服器可能忙碌。稍後可重新搜尋或按右上角 ◎ 回到目前位置。"
    );
    showEmptyState(
      "資料服務暫時沒有回應",
      "這不一定是網站壞掉；V0.4 仍使用免費公共 Overpass API，偶爾可能忙碌。",
      false
    );
  } finally {
    setLoading(false);
  }
}

async function fetchOverpassWithFallback(query, signal) {
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const body = new URLSearchParams({ data: query });
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
        signal,
      });

      if (!response.ok) {
        throw new Error(`${endpoint} 回傳 HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
      console.warn("Overpass endpoint failed:", endpoint, error);
    }
  }

  throw lastError || new Error("所有 Overpass 伺服器皆無回應");
}

function parseOverpassElements(elements, centerLat, centerLng) {
  return elements
    .map((element) => {
      const tags = element.tags || {};
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      const type = classifyPlace(tags);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) return null;

      const name = getPlaceName(tags, type);
      const distance = haversineMeters(centerLat, centerLng, lat, lng);
      const minutes = Math.max(1, Math.ceil(distance / 80));

      return {
        id: `${element.type}-${element.id}`,
        osmType: element.type,
        osmId: element.id,
        name,
        type,
        lat,
        lng,
        distance,
        minutes,
        openingHours: tags.opening_hours || "",
        brand: tags.brand || "",
        operator: tags.operator || "",
        coffeeBrand: type === "coffee" ? getCoffeeBrand(tags) : "",
        brandKey: detectBrand(tags, type),
        tags,
      };
    })
    .filter(Boolean);
}

function classifyPlace(tags) {
  if (tags.shop === "convenience") return "convenience";

  if (getCoffeeBrand(tags)) return "coffee";

  const cuisine = (tags.cuisine || "").toLowerCase();
  if (
    cuisine.includes("bubble_tea") ||
    tags["drink:bubble_tea"] === "yes" ||
    tags.shop === "beverages"
  ) {
    return "bubble_tea";
  }

  return null;
}

function detectBrand(tags, type) {
  const haystack = normalizeBrandText([tags.name, tags.brand, tags.operator, tags.branch].filter(Boolean).join(" "));

  if (type === "convenience") {
    if (/7[\s-]?eleven|seven[\s-]?eleven|統一超商/.test(haystack)) return "7eleven";
    if (/familymart|全家便利商店|全家/.test(haystack)) return "familymart";
    if (/hi[\s-]?life|hilife|萊爾富/.test(haystack)) return "hilife";
    if (/ok[\s-]?(mart|便利商店|超商)|來來超商/.test(haystack)) return "okmart";
  }

  if (type === "coffee") {
    if (/starbucks|星巴克/.test(haystack)) return "starbucks";
    if (/louisa|路易莎/.test(haystack)) return "louisa";
    if (/cama/.test(haystack)) return "cama";
    if (/85.?c|85度[cｃ]/.test(haystack)) return "85c";
    if (/dante|丹堤/.test(haystack)) return "dante";
    if (/mr\.?\s*brown|伯朗/.test(haystack)) return "mrbrown";
    if (/komeda|客美多/.test(haystack)) return "komeda";
  }

  if (type === "bubble_tea") {
    if (/50嵐|五十嵐|50lan/.test(haystack)) return "50lan";
    if (/可不可|kebuke/.test(haystack)) return "kebuke";
    if (/迷客夏|milksha/.test(haystack)) return "milksha";
    if (/清心福全|清心|chingshin/.test(haystack)) return "chingshin";
    if (/coco都可|coco fresh|coco/.test(haystack)) return "coco";
    if (/麻古|macu/.test(haystack)) return "macu";
    if (/得正|dejeng|dejeng1923/.test(haystack)) return "dejeng";
    if (/一沐日|yimuri|yi mu ri/.test(haystack)) return "yimu";
    if (/貢茶|gong cha|gongcha/.test(haystack)) return "gongcha";
  }

  return "";
}

function normalizeBrandText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[＿_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCoffeeBrand(tags) {
  const haystack = [tags.name, tags.brand, tags.operator]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/starbucks|星巴克/.test(haystack)) return "星巴克";
  if (/louisa|路易莎/.test(haystack)) return "路易莎";
  if (/cama/.test(haystack)) return "cama";
  if (/85.?c|85度[cｃ]/i.test(haystack)) return "85°C";
  if (/dante|丹堤/.test(haystack)) return "丹堤";
  if (/mr\.?\s*brown|伯朗/.test(haystack)) return "伯朗";
  if (/komeda|客美多/.test(haystack)) return "客美多";
  return "";
}

function getPlaceName(tags, type) {
  if (tags.name) return tags.name;
  if (tags.brand) return tags.brand;
  if (tags.operator) return tags.operator;

  if (type === "coffee") return "連鎖咖啡";
  if (type === "convenience") return "便利商店";
  return "手搖／飲料店";
}

function dedupePlaces(items) {
  const seen = new Map();

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }

  return [...seen.values()];
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderMarkers() {
  clearMarkers();

  placeMarkers = places.map((place) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "marker";
    el.dataset.type = place.type;
    el.dataset.id = place.id;
    el.title = place.name;
    el.textContent = TYPE_CONFIG[place.type].icon;

    const popupHtml = `
      <strong>${escapeHtml(place.name)}</strong><br>
      ${formatDistance(place.distance)} · 約 ${place.minutes} 分鐘
    `;

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([place.lng, place.lat])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(popupHtml))
      .addTo(map);

    el.addEventListener("click", () => {
      scrollCardIntoView(place.id);
    });

    return { marker, el, place };
  });
}

function clearMarkers() {
  placeMarkers.forEach(({ marker }) => marker.remove());
  placeMarkers = [];
}

function clearPlaces() {
  places = [];
  clearMarkers();
  els.results.innerHTML = "";
  updateCounts();
}

function applyFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });

  placeMarkers.forEach(({ el, place }) => {
    const visible = filter === "all" || place.type === filter;
    el.style.display = visible ? "grid" : "none";
  });

  const filtered = filter === "all" ? places : places.filter((place) => place.type === filter);
  renderResults(filtered);

  if (filtered.length === 0 && places.length > 0) {
    showEmptyState(
      "這個分類目前沒有資料",
      "可能代表附近真的沒有，也可能是 OpenStreetMap 尚未收錄。",
      false
    );
  } else if (places.length > 0) {
    hideEmptyState();
  }

  els.resultMeta.textContent = places.length
    ? `${filtered.length} 個結果 · ${SEARCH_RADIUS_METERS / 1000} km 內`
    : "沒有結果";
}

function renderBrandIcon(place) {
  const brand = BRAND_CONFIG[place.brandKey];
  if (!brand) {
    return `<div class="place-icon place-icon-fallback" aria-hidden="true">${TYPE_CONFIG[place.type].icon}</div>`;
  }

  return `
    <div
      class="place-icon brand-icon ${brand.className}"
      role="img"
      aria-label="${escapeAttr(brand.label)} 品牌圖示"
      title="${escapeAttr(brand.label)}"
    >
      <span>${escapeHtml(brand.short)}</span>
    </div>
  `;
}

function renderResults(items) {
  els.results.innerHTML = items
    .map((place) => {
      const config = TYPE_CONFIG[place.type];
      const navigationUrl = buildGoogleMapsUrl(place);
      const openingText = place.openingHours === "24/7" ? " · 24 小時" : "";

      return `
        <article class="place-card" id="card-${escapeAttr(place.id)}">
          ${renderBrandIcon(place)}
          <div class="place-info">
            <div class="place-type">${config.label}${place.brandKey && BRAND_CONFIG[place.brandKey] ? ` · ${escapeHtml(BRAND_CONFIG[place.brandKey].label)}` : place.coffeeBrand ? ` · ${escapeHtml(place.coffeeBrand)}` : ""}</div>
            <div class="place-name" title="${escapeAttr(place.name)}">${escapeHtml(place.name)}</div>
            <p class="place-meta">
              <strong>${formatDistance(place.distance)}</strong>
              · 約 ${place.minutes} 分鐘${openingText}
            </p>
          </div>
          <a
            class="nav-button"
            href="${navigationUrl}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="導航到 ${escapeAttr(place.name)}"
          >導航 ↗</a>
        </article>
      `;
    })
    .join("");
}

function buildGoogleMapsUrl(place) {
  const destination = `${place.lat},${place.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

function updateCounts() {
  const convenience = places.filter((p) => p.type === "convenience").length;
  const coffee = places.filter((p) => p.type === "coffee").length;
  const bubbleTea = places.filter((p) => p.type === "bubble_tea").length;

  els.countAll.textContent = places.length;
  els.countConvenience.textContent = convenience;
  els.countCoffee.textContent = coffee;
  els.countBubbleTea.textContent = bubbleTea;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function showEmptyState(title, text, showTestButton) {
  els.emptyState.classList.remove("hidden");
  els.emptyState.querySelector("h3").textContent = title;
  els.emptyState.querySelector("p").textContent = text;
  els.taipeiTestBtn.classList.toggle("hidden", !showTestButton);
  els.startBtn.classList.toggle("hidden", !showTestButton);
}

function hideEmptyState() {
  els.emptyState.classList.add("hidden");
}

function scrollCardIntoView(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function bindEvents() {
  els.locateBtn.addEventListener("click", locateUser);
  els.useMyLocationBtn.addEventListener("click", locateUser);
  els.startBtn.addEventListener("click", locateUser);
  els.searchForm.addEventListener("submit", handleLocationSearch);
  els.closeGeocodeBtn.addEventListener("click", closeGeocodePanel);

  els.taipeiTestBtn.addEventListener("click", async () => {
    centerIntentVersion += 1;
    closeGeocodePanel();
    els.searchInput.value = "台北車站";

    await setActiveCenter({
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      label: "台北車站",
      mode: "test",
      detail: "目前使用台北車站作為測試位置",
    });
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });
}

initMap();
bindEvents();

// 首次進站仍自動嘗試定位；使用者若開始搜尋，搜尋意圖會優先，不會被稍後完成的 GPS 搶回畫面。
window.addEventListener("load", () => {
  setTimeout(locateUser, 350);
});
