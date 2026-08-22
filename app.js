const SEARCH_RADIUS_METERS = 1500;
const MAX_RESULTS = 50;
const DEFAULT_CENTER = { lat: 25.0478, lng: 121.5170 }; // 台北車站

// 免費公共 Overpass 服務僅適合 MVP / 小型測試。
// 主站失敗時會自動切換到備援站。
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const TYPE_CONFIG = {
  convenience: { label: "便利商店", icon: "🏪" },
  vending: { label: "飲料販賣機", icon: "🥤" },
  bubble_tea: { label: "手搖／飲料店", icon: "🧋" },
};

let map;
let userMarker;
let userPosition = null;
let places = [];
let placeMarkers = [];
let activeFilter = "all";
let requestController = null;

const els = {
  locateBtn: document.getElementById("locateBtn"),
  startBtn: document.getElementById("startBtn"),
  taipeiTestBtn: document.getElementById("taipeiTestBtn"),
  statusDot: document.getElementById("statusDot"),
  statusTitle: document.getElementById("statusTitle"),
  statusText: document.getElementById("statusText"),
  mapLoading: document.getElementById("mapLoading"),
  results: document.getElementById("results"),
  emptyState: document.getElementById("emptyState"),
  resultMeta: document.getElementById("resultMeta"),
  countAll: document.getElementById("countAll"),
  countConvenience: document.getElementById("countConvenience"),
  countVending: document.getElementById("countVending"),
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
  if (!navigator.geolocation) {
    setStatus("error", "瀏覽器不支援定位", "可以先按「台北車站測試」確認搜尋功能是否正常。");
    showEmptyState("無法使用定位", "你的瀏覽器不支援 Geolocation API。", true);
    return;
  }

  setStatus("loading", "正在取得位置…", "如果瀏覽器跳出權限詢問，請選擇允許。");
  setLoading(true, "取得目前位置中…");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      await usePosition(latitude, longitude, `定位成功，誤差約 ${Math.round(accuracy)} 公尺`);
    },
    (error) => {
      setLoading(false);
      let message = "請確認瀏覽器的定位權限後再試一次。";

      if (error.code === error.PERMISSION_DENIED) {
        message = "你拒絕了定位權限；可以重新允許，或先用台北車站測試。";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "目前無法取得位置，請稍後重試。";
      } else if (error.code === error.TIMEOUT) {
        message = "定位逾時，請再按一次重新定位。";
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

async function usePosition(lat, lng, statusMessage = "") {
  userPosition = { lat, lng };
  setUserMarker(lat, lng);

  map.easeTo({
    center: [lng, lat],
    zoom: 15,
    duration: 900,
  });

  setStatus("success", "位置已取得", statusMessage || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  await searchNearby(lat, lng);
}

function setUserMarker(lat, lng) {
  if (userMarker) userMarker.remove();

  const el = document.createElement("div");
  el.className = "marker-user";
  el.title = "你的位置";

  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(new maplibregl.Popup({ offset: 14 }).setText("你在這裡"))
    .addTo(map);
}

function buildOverpassQuery(lat, lng) {
  const around = `(around:${SEARCH_RADIUS_METERS},${lat},${lng})`;

  return `
[out:json][timeout:20];
(
  nwr${around}["shop"="convenience"];

  nwr${around}["amenity"="vending_machine"]["vending"~"drinks|coffee|water|milk",i];
  nwr${around}["amenity"="vending_machine"]["name"~"飲料|咖啡|coffee|drink",i];

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

    const vendingCount = places.filter((p) => p.type === "vending").length;
    setStatus(
      "success",
      `找到 ${places.length} 個地點`,
      vendingCount === 0
        ? "這附近的 OSM 販賣機資料可能不完整，這正是後續要補強的地方。"
        : `其中有 ${vendingCount} 台飲料販賣機。`
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
      "免費 Overpass 伺服器可能忙碌。稍後可按右上角 ◎ 重新搜尋。"
    );
    showEmptyState(
      "資料服務暫時沒有回應",
      "這不一定是你的網站壞掉；V0.1 使用免費公共 Overpass API，偶爾可能忙碌。",
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

function parseOverpassElements(elements, userLat, userLng) {
  return elements
    .map((element) => {
      const tags = element.tags || {};
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      const type = classifyPlace(tags);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) return null;

      const name = getPlaceName(tags, type);
      const distance = haversineMeters(userLat, userLng, lat, lng);
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
        tags,
      };
    })
    .filter(Boolean);
}

function classifyPlace(tags) {
  if (tags.amenity === "vending_machine") return "vending";
  if (tags.shop === "convenience") return "convenience";

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

function getPlaceName(tags, type) {
  if (tags.name) return tags.name;
  if (tags.brand) return tags.brand;
  if (tags.operator) return tags.operator;

  if (type === "vending") return "飲料販賣機";
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

function renderResults(items) {
  els.results.innerHTML = items
    .map((place) => {
      const config = TYPE_CONFIG[place.type];
      const navigationUrl = buildGoogleMapsUrl(place);
      const openingText = place.openingHours === "24/7" ? " · 24 小時" : "";

      return `
        <article class="place-card" id="card-${escapeAttr(place.id)}">
          <div class="place-icon">${config.icon}</div>
          <div class="place-info">
            <div class="place-type">${config.label}</div>
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
  const vending = places.filter((p) => p.type === "vending").length;
  const bubbleTea = places.filter((p) => p.type === "bubble_tea").length;

  els.countAll.textContent = places.length;
  els.countConvenience.textContent = convenience;
  els.countVending.textContent = vending;
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
  els.startBtn.addEventListener("click", locateUser);

  els.taipeiTestBtn.addEventListener("click", async () => {
    await usePosition(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, "目前使用台北車站作為測試位置");
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });
}

initMap();
bindEvents();

// 首次進站就嘗試定位；若使用者拒絕，畫面仍保留台北車站測試入口。
window.addEventListener("load", () => {
  setTimeout(locateUser, 350);
});
