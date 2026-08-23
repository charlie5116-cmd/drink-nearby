const SEARCH_RADIUS_METERS = 1500;
const MAX_RESULTS = 80;
const DEFAULT_CENTER = { lat: 25.0478, lng: 121.5170 }; // 台北車站
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const GEOCODE_MIN_INTERVAL_MS = 1100;
const DICE_MAX_MINUTES = 5;

const FAVORITE_STORES_KEY = "drinkNearby.favoriteStores.v1";
const FAVORITE_LOCATIONS_KEY = "drinkNearby.favoriteLocations.v1";

const LANGUAGE_KEY = "drinkNearby.language.v1";
let currentLang = localStorage.getItem(LANGUAGE_KEY) || "zh-TW";

const I18N = {
  "zh-TW": {
    heroTitle: "現在最快去哪裡喝？",
    locateTitle: "回到我的位置",
    searchPlaceholder: "搜尋地點、捷運站或地址",
    search: "搜尋",
    searching: "搜尋中",
    useCurrent: "使用我的目前位置",
    geocodeResults: "搜尋結果",
    close: "關閉",
    waitingLocation: "等待定位",
    waitingLocationText: "允許瀏覽器取得位置，或直接搜尋想先查看的地點。",
    savePlace: "☆ 常用地點",
    savedPlace: "★ 已存常用",
    favoritesTitle: "我的常用",
    browserOnly: "儲存在這個瀏覽器",
    favoriteLocations: "常用地點",
    favoriteStores: "常去店家",
    all: "全部",
    convenienceShort: "超商",
    coffeeShort: "咖啡",
    bubbleShort: "手搖",
    barShort: "酒吧",
    typeConvenience: "便利商店",
    typeCoffee: "連鎖咖啡",
    typeBubble: "手搖／飲料店",
    typeBar: "酒吧／Pub",
    diceTitle: "今天喝哪間？",
    diceSubtitle: "從目前位置／搜尋地點 5 分鐘內，各抽 1 間超商、咖啡、手搖。",
    roll: "骰一下",
    rollAgain: "再骰一次",
    diceInitial: "搜尋完成後按骰子，讓系統幫你決定。",
    mapLoading: "搜尋附近地點中…",
    nearest: "距離最近",
    notSearched: "尚未搜尋",
    emptyTitle: "先取得你的位置",
    emptyText: "也可以直接在上方搜尋「台北101」、「西門站」或地址。",
    startLocate: "開始定位",
    taipeiTest: "改用台北車站測試",
    saveModalTitle: "儲存常用地點",
    favoriteNameLabel: "這個地點要叫什麼？",
    favoriteNamePlaceholder: "例如：家裡、公司、球場",
    cancel: "取消",
    save: "儲存",
    quick_home: "家裡",
    quick_work: "公司",
    quick_school: "學校",
    quick_court: "球場",
    quick_gym: "健身房",
    footer: "V0.5.5 地點資料來自 OpenStreetMap / Overpass；新增酒吧／Pub 分類，介面可切換繁中、English、日本語。店名優先使用 OSM 的對應語言名稱，沒有時保留原始店名。常用資料只儲存在此瀏覽器。骰子推薦目前以直線距離估算步行時間，5 分鐘約等於 400 公尺。資料仍可能不完整。",
    browserNoGeoTitle: "瀏覽器不支援定位",
    browserNoGeoText: "你仍然可以直接搜尋地點，或先按「台北車站測試」。",
    cannotLocate: "無法使用定位",
    geolocationApiUnavailable: "你的瀏覽器不支援 Geolocation API，但地點搜尋仍可使用。",
    locatingTitle: "正在取得目前位置…",
    locatingText: "如果瀏覽器跳出權限詢問，請選擇允許。",
    locatingLoading: "取得目前位置中…",
    currentLocation: "我的位置",
    accuracy: "定位誤差約 {n} 公尺",
    locationDefaultError: "請確認瀏覽器的定位權限後再試一次，也可以直接搜尋地點。",
    locationDenied: "你拒絕了定位權限；可以重新允許，或直接搜尋想查看的地點。",
    locationUnavailable: "目前無法取得位置；你仍然可以直接搜尋地點。",
    locationTimeout: "定位逾時，請再按一次定位，或直接搜尋地點。",
    locationFailed: "定位失敗",
    locationNotSuccess: "定位沒有成功",
    nearbySuffix: "{name}附近",
    viewing: "正在查看：{name}",
    currentCenterText: "以下距離以你的目前位置為中心。",
    searchCenterText: "以下距離以這個搜尋位置為中心，不是你目前所在的位置。",
    yourLocation: "你的位置",
    youAreHere: "你目前在這裡",
    searchCenter: "搜尋中心：{name}",
    inputPlaceFirst: "請先輸入地點，例如「台北101」、「西門站」或一段地址。",
    inputPlaceTitle: "請輸入地點",
    searchingFor: "正在搜尋「{query}」…",
    searchPlaceTitle: "搜尋地點",
    geocodeFailText: "地點搜尋服務暫時沒有回應。請稍後再試，或使用目前位置。",
    searchFailed: "搜尋失敗",
    genericSearchPlace: "搜尋地點",
    noPlaceTitle: "找不到地點",
    noPlaceText: "找不到與「{query}」足夠相符的地點。可以改用更完整的名稱／地址，例如「臺北市政府 信義區」或直接輸入門牌地址。",
    choosePlace: "請選擇地點 · {n} 個結果",
    searchingRadius: "搜尋 {km} km 內…",
    searchPosition: "搜尋位置",
    currentPositionPrefix: "你的目前位置",
    foundPlaces: "找到 {n} 個地點",
    noCoffee: "以{center}為中心；目前沒有抓到支援名單內的連鎖咖啡。",
    coffeeFound: "以{center}為中心，其中有 {n} 間連鎖咖啡。",
    nearbyDataFail: "附近資料暫時抓不到",
    overpassBusy: "免費 Overpass 伺服器可能忙碌。稍後可重新搜尋或按右上角 ◎ 回到目前位置。",
    dataServiceFail: "資料服務暫時沒有回應",
    dataServiceText: "這不一定是網站壞掉；目前仍使用免費公共 Overpass API，偶爾可能忙碌。",
    categoryEmpty: "這個分類目前沒有資料",
    categoryEmptyText: "可能代表附近真的沒有，也可能是 OpenStreetMap 尚未收錄。",
    resultCount: "{n} 個結果 · {km} km 內",
    noResults: "沒有結果",
    diceNone: "目前 {n} 分鐘內沒有可抽的店家。",
    diceCandidates: "目前有 {n} 個候選地點；按骰子各抽 1 間超商、咖啡、手搖。",
    diceNoData: "5 分鐘內暫時沒有資料",
    minutes: "{n} 分鐘",
    approxMinutes: "約 {n} 分鐘",
    open24: "24 小時",
    nav: "導航 ↗",
    navigateTo: "導航到 {name}",
    addFavoriteStore: "加入常去店家",
    removeFavoriteStore: "取消常去店家",
    addFavorite: "加入常用",
    removeFavorite: "取消常用",
    brandIcon: "{name} 品牌圖示",
    noFavoriteLocations: "尚未加入常用地點",
    noFavoriteStores: "尚未加入常去店家；在搜尋結果按 ☆ 即可收藏",
    removeItem: "移除 {name}",
    viewNearby: "查看 {name} 附近",
    favoriteLocationDetail: "從常用地點開啟",
    favoriteStoreDetail: "從常去店家開啟；以下顯示這家店附近的結果。",
    taipeiMainStation: "台北車站",
    taipeiTestDetail: "目前使用台北車站作為測試位置",
    addressNearby: "{name}附近",
    houseNumber: "{street} {number}號"
  },
  en: {
    heroTitle: "Where can I get a drink fastest?",
    locateTitle: "Back to my location",
    searchPlaceholder: "Search a place, station, or address",
    search: "Search",
    searching: "Searching",
    useCurrent: "Use my current location",
    geocodeResults: "Search results",
    close: "Close",
    waitingLocation: "Waiting for location",
    waitingLocationText: "Allow location access, or search a place you want to check.",
    savePlace: "☆ Save place",
    savedPlace: "★ Saved",
    favoritesTitle: "Favorites",
    browserOnly: "Saved in this browser",
    favoriteLocations: "Saved places",
    favoriteStores: "Favorite stores",
    all: "All",
    convenienceShort: "Convenience",
    coffeeShort: "Coffee",
    bubbleShort: "Bubble tea",
    barShort: "Bars",
    typeConvenience: "Convenience store",
    typeCoffee: "Chain coffee",
    typeBubble: "Bubble tea / drinks",
    typeBar: "Bar / Pub",
    diceTitle: "Where should I drink today?",
    diceSubtitle: "Pick one convenience store, coffee shop, and bubble tea shop within about a 5-minute walk.",
    roll: "Roll",
    rollAgain: "Roll again",
    diceInitial: "Search an area, then roll the dice and let us choose.",
    mapLoading: "Searching nearby places…",
    nearest: "Nearest",
    notSearched: "Not searched yet",
    emptyTitle: "Get your location first",
    emptyText: "Or search for “Taipei 101”, “Ximen Station”, or an address above.",
    startLocate: "Use my location",
    taipeiTest: "Test with Taipei Main Station",
    saveModalTitle: "Save this place",
    favoriteNameLabel: "What do you want to call this place?",
    favoriteNamePlaceholder: "e.g. Home, Office, Basketball court",
    cancel: "Cancel",
    save: "Save",
    quick_home: "Home",
    quick_work: "Office",
    quick_school: "School",
    quick_court: "Court",
    quick_gym: "Gym",
    footer: "V0.5.5 uses OpenStreetMap / Overpass data and adds Bars / Pubs as a fourth category. The interface supports Traditional Chinese, English, and Japanese. Store names use OSM localized names when available; otherwise the original name is kept. Favorites are stored only in this browser. The 5-minute dice filter is still an estimate based on straight-line distance.",
    browserNoGeoTitle: "Location is not supported",
    browserNoGeoText: "You can still search for a place or use Taipei Main Station for testing.",
    cannotLocate: "Location unavailable",
    geolocationApiUnavailable: "Your browser does not support the Geolocation API, but place search still works.",
    locatingTitle: "Getting your location…",
    locatingText: "If your browser asks for location permission, choose Allow.",
    locatingLoading: "Getting current location…",
    currentLocation: "My location",
    accuracy: "Location accuracy: about {n} m",
    locationDefaultError: "Check your browser location permission and try again, or search for a place.",
    locationDenied: "Location permission was denied. You can allow it again or search for a place.",
    locationUnavailable: "Your location is currently unavailable. Place search still works.",
    locationTimeout: "Location timed out. Try again or search for a place.",
    locationFailed: "Location failed",
    locationNotSuccess: "Could not get your location",
    nearbySuffix: "Near {name}",
    viewing: "Viewing: {name}",
    currentCenterText: "Distances are measured from your current location.",
    searchCenterText: "Distances are measured from this searched location, not your current location.",
    yourLocation: "Your location",
    youAreHere: "You are here",
    searchCenter: "Search center: {name}",
    inputPlaceFirst: "Enter a place, such as “Taipei 101”, “Ximen Station”, or an address.",
    inputPlaceTitle: "Enter a place",
    searchingFor: "Searching for “{query}”…",
    searchPlaceTitle: "Search place",
    geocodeFailText: "The place search service is temporarily unavailable. Try again later or use your current location.",
    searchFailed: "Search failed",
    genericSearchPlace: "Place",
    noPlaceTitle: "No matching place",
    noPlaceText: "No sufficiently relevant result was found for “{query}”. Try a fuller place name or street address.",
    choosePlace: "Choose a place · {n} results",
    searchingRadius: "Searching within {km} km…",
    searchPosition: "search location",
    currentPositionPrefix: "your current location",
    foundPlaces: "Found {n} places",
    noCoffee: "Centered on {center}; no supported chain coffee shops were found.",
    coffeeFound: "Centered on {center}; {n} chain coffee shops were found.",
    nearbyDataFail: "Nearby data is temporarily unavailable",
    overpassBusy: "The free Overpass server may be busy. Try again later or use ◎ to return to your location.",
    dataServiceFail: "Data service is temporarily unavailable",
    dataServiceText: "This does not necessarily mean the site is broken. The MVP still uses a free public Overpass API.",
    categoryEmpty: "No data in this category",
    categoryEmptyText: "There may be none nearby, or OpenStreetMap may not have mapped them yet.",
    resultCount: "{n} results · within {km} km",
    noResults: "No results",
    diceNone: "There are no eligible stores within {n} minutes.",
    diceCandidates: "{n} candidates available. Roll to pick one convenience store, coffee shop, and bubble tea shop.",
    diceNoData: "No data within 5 minutes",
    minutes: "{n} min",
    approxMinutes: "about {n} min",
    open24: "24 hours",
    nav: "Directions ↗",
    navigateTo: "Directions to {name}",
    addFavoriteStore: "Add favorite store",
    removeFavoriteStore: "Remove favorite store",
    addFavorite: "Add favorite",
    removeFavorite: "Remove favorite",
    brandIcon: "{name} brand icon",
    noFavoriteLocations: "No saved places yet",
    noFavoriteStores: "No favorite stores yet. Tap ☆ on a result to save one.",
    removeItem: "Remove {name}",
    viewNearby: "View around {name}",
    favoriteLocationDetail: "Opened from a saved place",
    favoriteStoreDetail: "Opened from a favorite store. Showing places around this store.",
    taipeiMainStation: "Taipei Main Station",
    taipeiTestDetail: "Using Taipei Main Station as the test location",
    addressNearby: "near {name}",
    houseNumber: "{street} {number}"
  },
  ja: {
    heroTitle: "今すぐ飲むならどこ？",
    locateTitle: "現在地に戻る",
    searchPlaceholder: "場所・駅・住所を検索",
    search: "検索",
    searching: "検索中",
    useCurrent: "現在地を使う",
    geocodeResults: "検索結果",
    close: "閉じる",
    waitingLocation: "現在地を待っています",
    waitingLocationText: "位置情報を許可するか、確認したい場所を検索してください。",
    savePlace: "☆ よく使う場所",
    savedPlace: "★ 保存済み",
    favoritesTitle: "お気に入り",
    browserOnly: "このブラウザに保存",
    favoriteLocations: "よく使う場所",
    favoriteStores: "よく行くお店",
    all: "すべて",
    convenienceShort: "コンビニ",
    coffeeShort: "カフェ",
    bubbleShort: "ドリンク",
    barShort: "バー",
    typeConvenience: "コンビニ",
    typeCoffee: "チェーンカフェ",
    typeBubble: "ドリンク／タピオカ",
    typeBar: "バー／パブ",
    diceTitle: "今日はどこで飲む？",
    diceSubtitle: "現在地／検索地点から約徒歩5分以内で、コンビニ・カフェ・ドリンク店を1軒ずつ選びます。",
    roll: "サイコロ",
    rollAgain: "もう一度",
    diceInitial: "検索後にサイコロを押すと、お店をランダムに選びます。",
    mapLoading: "周辺のお店を検索中…",
    nearest: "近い順",
    notSearched: "未検索",
    emptyTitle: "まず現在地を取得",
    emptyText: "上の検索欄から「台北101」「西門駅」や住所を検索することもできます。",
    startLocate: "現在地を取得",
    taipeiTest: "台北駅でテスト",
    saveModalTitle: "よく使う場所に保存",
    favoriteNameLabel: "この場所の名前は？",
    favoriteNamePlaceholder: "例：自宅、会社、体育館",
    cancel: "キャンセル",
    save: "保存",
    quick_home: "自宅",
    quick_work: "会社",
    quick_school: "学校",
    quick_court: "コート",
    quick_gym: "ジム",
    footer: "V0.5.5 は OpenStreetMap / Overpass のデータを使用し、バー／パブを新しいカテゴリとして追加しています。繁體中文・English・日本語に切り替えられます。店舗名は OSM に日本語名がある場合はそれを使用し、なければ元の名称を表示します。お気に入りはこのブラウザだけに保存されます。徒歩5分の判定は現在、直線距離による概算です。",
    browserNoGeoTitle: "位置情報に対応していません",
    browserNoGeoText: "場所を検索するか、台北駅をテスト地点として使えます。",
    cannotLocate: "現在地を取得できません",
    geolocationApiUnavailable: "このブラウザは Geolocation API に対応していませんが、場所検索は利用できます。",
    locatingTitle: "現在地を取得中…",
    locatingText: "位置情報の許可が表示されたら「許可」を選んでください。",
    locatingLoading: "現在地を取得中…",
    currentLocation: "現在地",
    accuracy: "位置精度：約 {n} m",
    locationDefaultError: "ブラウザの位置情報設定を確認するか、場所を検索してください。",
    locationDenied: "位置情報が拒否されました。再度許可するか、場所を検索できます。",
    locationUnavailable: "現在地を取得できません。場所検索は利用できます。",
    locationTimeout: "位置情報の取得がタイムアウトしました。再試行するか、場所を検索してください。",
    locationFailed: "位置情報エラー",
    locationNotSuccess: "現在地を取得できませんでした",
    nearbySuffix: "{name} 周辺",
    viewing: "表示中：{name}",
    currentCenterText: "距離は現在地を基準にしています。",
    searchCenterText: "距離は検索した地点を基準にしています。現在地基準ではありません。",
    yourLocation: "現在地",
    youAreHere: "現在地です",
    searchCenter: "検索地点：{name}",
    inputPlaceFirst: "「台北101」「西門駅」または住所を入力してください。",
    inputPlaceTitle: "場所を入力",
    searchingFor: "「{query}」を検索中…",
    searchPlaceTitle: "場所を検索",
    geocodeFailText: "場所検索サービスが一時的に利用できません。後でもう一度試すか、現在地を使ってください。",
    searchFailed: "検索失敗",
    genericSearchPlace: "検索地点",
    noPlaceTitle: "場所が見つかりません",
    noPlaceText: "「{query}」に十分一致する場所が見つかりません。より詳しい名称や住所を入力してください。",
    choosePlace: "場所を選択 · {n} 件",
    searchingRadius: "{km} km 以内を検索中…",
    searchPosition: "検索地点",
    currentPositionPrefix: "現在地",
    foundPlaces: "{n} 件見つかりました",
    noCoffee: "{center}を中心に検索しましたが、対象のチェーンカフェは見つかりませんでした。",
    coffeeFound: "{center}を中心に、チェーンカフェが {n} 店見つかりました。",
    nearbyDataFail: "周辺データを取得できません",
    overpassBusy: "無料の Overpass サーバーが混雑している可能性があります。後でもう一度試してください。",
    dataServiceFail: "データサービスが一時的に利用できません",
    dataServiceText: "サイトの故障とは限りません。現在は無料の公開 Overpass API を使用しています。",
    categoryEmpty: "このカテゴリのデータがありません",
    categoryEmptyText: "近くにないか、OpenStreetMap にまだ登録されていない可能性があります。",
    resultCount: "{n} 件 · {km} km 以内",
    noResults: "結果なし",
    diceNone: "{n} 分以内に選べるお店がありません。",
    diceCandidates: "候補は {n} 件。サイコロでコンビニ・カフェ・ドリンク店を1軒ずつ選びます。",
    diceNoData: "5分以内のデータなし",
    minutes: "{n} 分",
    approxMinutes: "約 {n} 分",
    open24: "24時間",
    nav: "経路 ↗",
    navigateTo: "{name} への経路",
    addFavoriteStore: "よく行くお店に追加",
    removeFavoriteStore: "よく行くお店から削除",
    addFavorite: "お気に入りに追加",
    removeFavorite: "お気に入り解除",
    brandIcon: "{name} のブランドアイコン",
    noFavoriteLocations: "よく使う場所はまだありません",
    noFavoriteStores: "よく行くお店はまだありません。検索結果の ☆ から保存できます。",
    removeItem: "{name} を削除",
    viewNearby: "{name} 周辺を見る",
    favoriteLocationDetail: "よく使う場所から開きました",
    favoriteStoreDetail: "よく行くお店から開きました。この店の周辺を表示しています。",
    taipeiMainStation: "台北駅",
    taipeiTestDetail: "台北駅をテスト地点として使用中",
    addressNearby: "{name} 周辺",
    houseNumber: "{street} {number}"
  }
};

const BRAND_LABELS = {
  "7eleven": {"zh-TW":"7-ELEVEN","en":"7-ELEVEN","ja":"7-ELEVEN"},
  familymart: {"zh-TW":"全家","en":"FamilyMart","ja":"ファミリーマート"},
  hilife: {"zh-TW":"萊爾富","en":"Hi-Life","ja":"Hi-Life"},
  okmart: {"zh-TW":"OK Mart","en":"OK Mart","ja":"OK Mart"},
  starbucks: {"zh-TW":"星巴克","en":"Starbucks","ja":"スターバックス"},
  louisa: {"zh-TW":"路易莎","en":"Louisa Coffee","ja":"Louisa Coffee"},
  cama: {"zh-TW":"cama","en":"cama","ja":"cama"},
  "85c": {"zh-TW":"85°C","en":"85°C","ja":"85°C"},
  dante: {"zh-TW":"丹堤","en":"Dante Coffee","ja":"Dante Coffee"},
  mrbrown: {"zh-TW":"伯朗","en":"Mr. Brown Coffee","ja":"Mr. Brown Coffee"},
  komeda: {"zh-TW":"客美多","en":"Komeda's Coffee","ja":"コメダ珈琲店"},
  "50lan": {"zh-TW":"50嵐","en":"50 Lan","ja":"50嵐"},
  kebuke: {"zh-TW":"可不可","en":"KEBUKE","ja":"KEBUKE"},
  milksha: {"zh-TW":"迷客夏","en":"Milksha","ja":"Milksha"},
  chingshin: {"zh-TW":"清心福全","en":"Ching Shin","ja":"清心福全"},
  coco: {"zh-TW":"CoCo","en":"CoCo","ja":"CoCo"},
  macu: {"zh-TW":"麻古茶坊","en":"MACU","ja":"MACU"},
  dejeng: {"zh-TW":"得正","en":"DEJENG","ja":"DEJENG"},
  yimu: {"zh-TW":"一沐日","en":"YI MU RI","ja":"一沐日"},
  gongcha: {"zh-TW":"貢茶","en":"Gong cha","ja":"ゴンチャ"}
};

function t(key, vars = {}) {
  let value = I18N[currentLang]?.[key] ?? I18N["zh-TW"]?.[key] ?? key;
  return String(value).replace(/\{(\w+)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`
  );
}

function getNominatimLanguage() {
  if (currentLang === "en") return "en,zh-TW,zh";
  if (currentLang === "ja") return "ja,zh-TW,zh,en";
  return "zh-TW,zh,en";
}

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
  bar: { label: "酒吧／Pub", icon: "🍸" },
};

// V0.5.5：新增酒吧／Pub 分類；骰子仍維持超商／咖啡／手搖。
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
let favoriteStores = loadLocalArray(FAVORITE_STORES_KEY);
let favoriteLocations = loadLocalArray(FAVORITE_LOCATIONS_KEY);
let lastDicePickIds = {
  convenience: "",
  coffee: "",
  bubble_tea: "",
};

const geocodeCache = new Map();

const els = {
  locateBtn: document.getElementById("locateBtn"),
  languageSelect: document.getElementById("languageSelect"),
  mainTitle: document.getElementById("mainTitle"),
  useMyLocationText: document.getElementById("useMyLocationText"),
  favoritesTitle: document.getElementById("favoritesTitle"),
  favoritesNote: document.getElementById("favoritesNote"),
  favoriteLocationsTitle: document.getElementById("favoriteLocationsTitle"),
  favoriteStoresTitle: document.getElementById("favoriteStoresTitle"),
  filterAllLabel: document.getElementById("filterAllLabel"),
  filterConvenienceLabel: document.getElementById("filterConvenienceLabel"),
  filterCoffeeLabel: document.getElementById("filterCoffeeLabel"),
  filterBubbleTeaLabel: document.getElementById("filterBubbleTeaLabel"),
  filterBarLabel: document.getElementById("filterBarLabel"),
  countBar: document.getElementById("countBar"),
  diceTitle: document.getElementById("diceTitle"),
  diceSubtitle: document.getElementById("diceSubtitle"),
  emptyTitle: document.getElementById("emptyTitle"),
  emptyText: document.getElementById("emptyText"),
  footerText: document.getElementById("footerText"),
  favoriteLocationLabel: document.getElementById("favoriteLocationLabel"),
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
  saveCenterBtn: document.getElementById("saveCenterBtn"),
  favoriteLocations: document.getElementById("favoriteLocations"),
  favoriteStores: document.getElementById("favoriteStores"),
  favoriteLocationModal: document.getElementById("favoriteLocationModal"),
  favoriteLocationName: document.getElementById("favoriteLocationName"),
  closeFavoriteLocationModal: document.getElementById("closeFavoriteLocationModal"),
  cancelFavoriteLocation: document.getElementById("cancelFavoriteLocation"),
  confirmFavoriteLocation: document.getElementById("confirmFavoriteLocation"),
  diceBtn: document.getElementById("diceBtn"),
  diceIcon: document.getElementById("diceIcon"),
  diceButtonText: document.getElementById("diceButtonText"),
  diceIntro: document.getElementById("diceIntro"),
  diceResults: document.getElementById("diceResults"),
};


function applyLanguage(lang, { persist = true } = {}) {
  if (!I18N[lang]) lang = "zh-TW";
  currentLang = lang;

  if (persist) localStorage.setItem(LANGUAGE_KEY, currentLang);

  document.documentElement.lang =
    currentLang === "zh-TW" ? "zh-Hant" : currentLang;
  els.languageSelect.value = currentLang;

  // Static UI
  els.mainTitle.textContent = t("heroTitle");
  els.locateBtn.title = t("locateTitle");
  els.locateBtn.setAttribute("aria-label", t("locateTitle"));
  els.searchInput.placeholder = t("searchPlaceholder");
  els.searchInput.setAttribute("aria-label", t("searchPlaceholder"));
  els.searchBtn.textContent = t("search");
  els.useMyLocationText.textContent = t("useCurrent");
  els.closeGeocodeBtn.textContent = t("close");
  els.favoritesTitle.textContent = t("favoritesTitle");
  els.favoritesNote.textContent = t("browserOnly");
  els.favoriteLocationsTitle.textContent = t("favoriteLocations");
  els.favoriteStoresTitle.textContent = t("favoriteStores");
  els.filterAllLabel.textContent = t("all");
  els.filterConvenienceLabel.textContent = t("convenienceShort");
  els.filterCoffeeLabel.textContent = t("coffeeShort");
  els.filterBubbleTeaLabel.textContent = t("bubbleShort");
  els.filterBarLabel.textContent = t("barShort");
  els.diceTitle.textContent = t("diceTitle");
  els.diceSubtitle.textContent = t("diceSubtitle");
  els.mapLoading.textContent = t("mapLoading");
  els.emptyTitle.textContent = t("emptyTitle");
  els.emptyText.textContent = t("emptyText");
  els.startBtn.textContent = t("startLocate");
  els.taipeiTestBtn.textContent = t("taipeiTest");
  els.footerText.textContent = t("footer");
  document.getElementById("favoriteLocationModalTitle").textContent = t("saveModalTitle");
  els.favoriteLocationLabel.textContent = t("favoriteNameLabel");
  els.favoriteLocationName.placeholder = t("favoriteNamePlaceholder");
  els.cancelFavoriteLocation.textContent = t("cancel");
  els.confirmFavoriteLocation.textContent = t("save");

  document.querySelectorAll("[data-quick-key]").forEach((button) => {
    const key = button.dataset.quickKey;
    const text = button.querySelector("[data-quick-text]");
    if (text) text.textContent = t(`quick_${key}`);
  });

  // Mutable localized labels used by render functions.
  TYPE_CONFIG.convenience.label = t("typeConvenience");
  TYPE_CONFIG.coffee.label = t("typeCoffee");
  TYPE_CONFIG.bubble_tea.label = t("typeBubble");
  TYPE_CONFIG.bar.label = t("typeBar");
  Object.entries(BRAND_CONFIG).forEach(([key, config]) => {
    config.label = BRAND_LABELS[key]?.[currentLang] || BRAND_LABELS[key]?.["zh-TW"] || config.label;
  });

  // Clear language-sensitive geocoder cache.
  geocodeCache.clear();

  if (activeCenter?.mode === "current") {
    activeCenter.label = t("currentLocation");
  }

  if (activeCenter) {
    els.resultsTitle.textContent = t("nearbySuffix", { name: activeCenter.label });
    setStatus(
      "success",
      t("viewing", { name: activeCenter.label }),
      activeCenter.mode === "current" ? t("currentCenterText") : t("searchCenterText")
    );
  } else {
    els.statusTitle.textContent = t("waitingLocation");
    els.statusText.textContent = t("waitingLocationText");
    els.resultsTitle.textContent = t("nearest");
    els.resultMeta.textContent = t("notSearched");
  }

  updateSaveCenterButton();
  renderFavorites();

  if (places.length) {
    // Rebuild localized place names from original OSM tags.
    places = places.map((place) => ({
      ...place,
      name: getPlaceDisplayName(place.tags, place.type, place.brandKey, place.branchName),
      locationHint: getLocationHint(place.tags),
    }));
    renderMarkers();
    applyFilter(activeFilter);
    resetDiceRecommendations();
    updateDiceAvailability();
  } else {
    resetDiceRecommendations();
  }

  closeGeocodePanel();
}

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

function setLoading(isLoading, text = t("mapLoading")) {
  els.mapLoading.textContent = text;
  els.mapLoading.classList.toggle("hidden", !isLoading);
}

function locateUser() {
  const intentVersion = ++centerIntentVersion;
  closeGeocodePanel();

  if (!navigator.geolocation) {
    setStatus("error", t("browserNoGeoTitle"), t("browserNoGeoText"));
    showEmptyState(t("cannotLocate"), t("geolocationApiUnavailable"), true);
    return;
  }

  setStatus("loading", t("locatingTitle"), t("locatingText"));
  setLoading(true, t("locatingLoading"));

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
        label: t("currentLocation"),
        mode: "current",
        detail: t("accuracy", { n: Math.round(accuracy) }),
      });
    },
    (error) => {
      if (intentVersion !== centerIntentVersion) return;

      setLoading(false);
      let message = t("locationDefaultError");

      if (error.code === error.PERMISSION_DENIED) {
        message = t("locationDenied");
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = t("locationUnavailable");
      } else if (error.code === error.TIMEOUT) {
        message = t("locationTimeout");
      }

      setStatus("error", t("locationFailed"), message);
      showEmptyState(t("locationNotSuccess"), message, true);
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
  resetDiceRecommendations();
  els.saveCenterBtn.disabled = false;
  updateSaveCenterButton();

  if (center.mode === "current") {
    removeCenterMarker();
  } else {
    setCenterMarker(center.lat, center.lng, center.label);
  }

  els.resultsTitle.textContent = t("nearbySuffix", { name: center.label });

  map.easeTo({
    center: [center.lng, center.lat],
    zoom: 15,
    duration: 900,
  });

  setStatus(
    "success",
    t("viewing", { name: center.label }),
    center.mode === "current"
      ? center.detail || t("currentCenterText")
      : t("searchCenterText")
  );

  await searchNearby(center.lat, center.lng);
}

function setUserMarker(lat, lng) {
  if (userMarker) userMarker.remove();

  const el = document.createElement("div");
  el.className = "marker-user";
  el.title = t("yourLocation");

  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(new maplibregl.Popup({ offset: 14 }).setText(t("youAreHere")))
    .addTo(map);
}

function setCenterMarker(lat, lng, label) {
  removeCenterMarker();

  const el = document.createElement("div");
  el.className = "marker-search-center";
  el.title = t("searchCenter", { name: label });

  centerMarker = new maplibregl.Marker({ element: el, anchor: "bottom" })
    .setLngLat([lng, lat])
    .setPopup(new maplibregl.Popup({ offset: 18 }).setText(t("searchCenter", { name: label })))
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
    openGeocodeMessage(t("inputPlaceFirst"), t("inputPlaceTitle"));
    els.searchInput.focus();
    return;
  }

  // 使用者明確選擇搜尋時，讓尚未完成的初始 GPS 定位失效。
  centerIntentVersion += 1;

  if (geocodeController) geocodeController.abort();
  geocodeController = new AbortController();

  els.searchBtn.disabled = true;
  els.searchBtn.textContent = t("searching");
  openGeocodeMessage(t("searchingFor", { query }), t("searchPlaceTitle"));

  try {
    const results = await geocodePlace(query, geocodeController.signal);
    renderGeocodeResults(results, query);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Geocoding failed:", error);
    openGeocodeMessage(
      t("geocodeFailText"),
      t("searchFailed")
    );
  } finally {
    els.searchBtn.disabled = false;
    els.searchBtn.textContent = t("search");
  }
}

async function geocodePlace(query, signal) {
  const cacheKey = `${currentLang}:${normalizeSearchText(query)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const queryVariants = buildGeocodeQueryVariants(query);
  let collected = [];

  for (const variant of queryVariants) {
    const results = await requestNominatim(variant, signal);

    collected.push(
      ...results.map((item) => ({
        ...item,
        searchVariant: variant,
      }))
    );

    const rankedSoFar = rankGeocodeResults(collected, query);
    if (rankedSoFar.length && rankedSoFar[0].relevance >= 80) {
      collected = rankedSoFar;
      break;
    }
  }

  const normalized = rankGeocodeResults(collected, query)
    .filter((item) => item.relevance >= getMinimumGeocodeRelevance(query))
    .slice(0, 5)
    .map(({ relevance, searchVariant, ...item }) => item);

  geocodeCache.set(cacheKey, normalized);
  return normalized;
}

async function requestNominatim(query, signal) {
  const elapsed = Date.now() - geocodeLastRequestAt;
  if (elapsed < GEOCODE_MIN_INTERVAL_MS) {
    await sleep(GEOCODE_MIN_INTERVAL_MS - elapsed);
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "10",
    countrycodes: "tw",
    addressdetails: "1",
    namedetails: "1",
    "accept-language": getNominatimLanguage(),
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

  return (Array.isArray(data) ? data : [])
    .map((item) => ({
      placeId: item.place_id,
      lat: Number(item.lat),
      lng: Number(item.lon),
      title: getGeocodeTitle(item),
      displayName: item.display_name || "",
      type: item.addresstype || item.type || "place",
      importance: Number(item.importance || 0),
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

function buildGeocodeQueryVariants(query) {
  const raw = String(query || "").trim();
  const variants = [];

  const add = (value) => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return;
    if (!variants.some((item) => normalizeSearchText(item) === normalizeSearchText(cleaned))) {
      variants.push(cleaned);
    }
  };

  add(raw);

  // 台灣地名在 OSM 裡可能同時存在「台」和「臺」兩種寫法。
  if (raw.includes("台")) add(raw.replace(/台/g, "臺"));
  if (raw.includes("臺")) add(raw.replace(/臺/g, "台"));

  // 部分市政府建築在 OSM 的正式名稱可能是「市政大樓」。
  const normalized = normalizeSearchText(raw);
  const cityGovernmentMatch = normalized.match(/^(.+市)政府$/);
  if (cityGovernmentMatch) {
    const city = cityGovernmentMatch[1];
    add(`${city}市政大樓`);
    if (city.includes("台")) add(`${city.replace(/台/g, "臺")}市政大樓`);
    if (city.includes("臺")) add(`${city.replace(/臺/g, "台")}市政大樓`);
  }

  // 最後才補台灣，降低同名地點誤判。
  add(`${raw}, 台灣`);

  return variants.slice(0, 4);
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/臺/g, "台")
    .replace(/[，,。．.\s\-_/()（）【】\[\]·•]/g, "");
}

function getSearchCoreTerms(query) {
  const normalized = normalizeSearchText(query);

  const stopTerms = [
    "台灣",
    "臺灣",
    "台北市",
    "臺北市",
    "新北市",
    "桃園市",
    "台中市",
    "臺中市",
    "台南市",
    "臺南市",
    "高雄市",
  ].map(normalizeSearchText);

  let core = normalized;
  for (const term of stopTerms) {
    if (core.startsWith(term) && core.length > term.length) {
      core = core.slice(term.length);
      break;
    }
  }

  return {
    full: normalized,
    core,
  };
}

function scoreGeocodeResult(result, query) {
  const { full, core } = getSearchCoreTerms(query);
  const title = normalizeSearchText(result.title);
  const display = normalizeSearchText(result.displayName);
  const combined = `${title}${display}`;

  let score = 0;

  if (title === full) score += 140;
  else if (title.includes(full)) score += 120;
  else if (display.includes(full)) score += 100;

  if (core && core.length >= 2) {
    if (title === core) score += 100;
    else if (title.includes(core)) score += 85;
    else if (display.includes(core)) score += 65;
  }

  // 市政府與市政大樓視為高度相關詞。
  const govAliases = ["市政府", "市政大樓"].map(normalizeSearchText);
  const queryIsGovernment = govAliases.some((term) => full.includes(term));
  const resultIsGovernment = govAliases.some((term) => combined.includes(term));
  if (queryIsGovernment && resultIsGovernment) score += 80;

  // 車站、捷運站、學校等明確類型詞也要真的出現在結果名稱／地址。
  const semanticTerms = [
    "政府",
    "市政大樓",
    "車站",
    "捷運",
    "機場",
    "公園",
    "醫院",
    "大學",
    "高中",
    "國中",
    "國小",
    "球場",
    "體育館",
  ].map(normalizeSearchText);

  for (const term of semanticTerms) {
    if (full.includes(term)) {
      const acceptable =
        combined.includes(term) ||
        (term === normalizeSearchText("政府") &&
          combined.includes(normalizeSearchText("市政大樓")));
      if (acceptable) score += 25;
      else score -= 45;
    }
  }

  // Nominatim importance 只當很小的 tie-breaker。
  score += Math.min(10, Math.max(0, (result.importance || 0) * 10));

  return score;
}

function rankGeocodeResults(results, query) {
  const unique = new Map();

  for (const result of results) {
    const key = result.placeId || `${result.lat},${result.lng}`;
    const relevance = scoreGeocodeResult(result, query);
    const current = unique.get(key);

    if (!current || relevance > current.relevance) {
      unique.set(key, { ...result, relevance });
    }
  }

  return [...unique.values()].sort((a, b) => b.relevance - a.relevance);
}

function getMinimumGeocodeRelevance(query) {
  const normalized = normalizeSearchText(query);

  // 中文 POI 名稱通常不長，3 字以上就要求至少有核心詞命中；
  // 避免「台北市政府 → 政大附中」這種只靠地址與單字模糊命中的結果。
  if (normalized.length >= 4) return 55;
  return 35;
}

function getGeocodeTitle(item) {
  if (item.name) return item.name;
  if (item.display_name) return item.display_name.split(",")[0].trim();
  return t("genericSearchPlace");
}

function renderGeocodeResults(results, query) {
  els.geocodePanel.classList.remove("hidden");

  if (!results.length) {
    els.geocodeTitle.textContent = t("noPlaceTitle");
    els.geocodeResults.innerHTML = `
      <div class="geocode-message">
        ${escapeHtml(t("noPlaceText", { query }))}
      </div>
    `;
    return;
  }

  els.geocodeTitle.textContent = t("choosePlace", { n: results.length });
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

function openGeocodeMessage(message, title = t("geocodeResults")) {
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

  nwr${around}["amenity"="bar"];
  nwr${around}["amenity"="pub"];
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
  els.resultMeta.textContent = t("searchingRadius", { km: SEARCH_RADIUS_METERS / 1000 });

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
    updateDiceAvailability();

    const coffeeCount = places.filter((p) => p.type === "coffee").length;
    const centerLabel = activeCenter?.label || t("searchPosition");
    const centerPrefix = activeCenter?.mode === "current" ? t("currentPositionPrefix") : `「${centerLabel}」`;

    setStatus(
      "success",
      t("foundPlaces", { n: places.length }),
      coffeeCount === 0
        ? t("noCoffee", { center: centerPrefix })
        : t("coffeeFound", { center: centerPrefix, n: coffeeCount })
    );
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error(error);
    places = [];
    updateCounts();
    renderResults([]);
    resetDiceRecommendations();
    setStatus(
      "error",
      t("nearbyDataFail"),
      t("overpassBusy")
    );
    showEmptyState(
      t("dataServiceFail"),
      t("dataServiceText"),
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

      const brandKey = detectBrand(tags, type);
      const branchName = getBranchName(tags, brandKey, type);
      const name = getPlaceDisplayName(tags, type, brandKey, branchName);
      const locationHint = getLocationHint(tags);
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
        brandKey,
        branchName,
        locationHint,
        tags,
      };
    })
    .filter(Boolean);
}

function classifyPlace(tags) {
  if (tags.amenity === "bar" || tags.amenity === "pub") return "bar";

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


function getLocalizedTagName(tags) {
  if (currentLang === "en") {
    return tags["name:en"] || tags.name || tags.brand || tags.operator || "";
  }
  if (currentLang === "ja") {
    return tags["name:ja"] || tags["name:en"] || tags.name || tags.brand || tags.operator || "";
  }
  return tags["name:zh-Hant"] || tags["name:zh"] || tags.name || tags.brand || tags.operator || "";
}

function getPlaceDisplayName(tags, type, brandKey, branch = "") {
  const brandLabel = BRAND_CONFIG[brandKey]?.label || "";

  if (brandLabel && branch) {
    return `${brandLabel} ${formatBranchSuffix(branch, type)}`;
  }

  if (brandLabel) return brandLabel;
  const localizedName = getLocalizedTagName(tags);
  if (localizedName) return String(localizedName).trim();

  return TYPE_CONFIG[type]?.label || t("genericSearchPlace");
}

function getBranchName(tags, brandKey, type) {
  const explicitBranch = String(tags.branch || "").trim();
  if (explicitBranch) return cleanBranchText(explicitBranch);

  const rawName = String(tags.name || "").trim();
  if (!rawName || !brandKey) return "";

  const stripped = stripBrandFromName(rawName, brandKey);
  if (!stripped) return "";

  const normalizedRaw = normalizeBrandText(rawName);
  const normalizedBrand = normalizeBrandText(BRAND_CONFIG[brandKey]?.label || "");
  if (normalizedRaw === normalizedBrand) return "";

  return cleanBranchText(stripped);
}

function stripBrandFromName(value, brandKey) {
  const patterns = {
    "7eleven": /(7[\s-]?ELEVEN|SEVEN[\s-]?ELEVEN|統一超商)/ig,
    familymart: /(FamilyMart|全家便利商店|全家)/ig,
    hilife: /(Hi[\s-]?Life|萊爾富)/ig,
    okmart: /(OK[\s-]?(Mart|便利商店|超商)|來來超商)/ig,
    starbucks: /(Starbucks|星巴克)/ig,
    louisa: /(Louisa(?:\s+Coffee)?|路易莎(?:咖啡)?)/ig,
    cama: /(cama(?:\s+café)?)/ig,
    "85c": /(85\s*°?\s*[CcＣｃ]|85度[CＣ])/ig,
    dante: /(Dante|丹堤(?:咖啡)?)/ig,
    mrbrown: /(Mr\.?\s*Brown|伯朗(?:咖啡)?)/ig,
    komeda: /(Komeda|客美多)/ig,
    "50lan": /(50嵐|五十嵐|50lan)/ig,
    kebuke: /(可不可(?:熟成紅茶)?|KEBUKE)/ig,
    milksha: /(迷客夏|Milksha)/ig,
    chingshin: /(清心福全|清心|Ching\s*Shin)/ig,
    coco: /(CoCo(?:都可)?|CoCo Fresh Tea)/ig,
    macu: /(麻古(?:茶坊)?|MACU)/ig,
    dejeng: /(得正|DEJENG(?:1923)?)/ig,
    yimu: /(一沐日|YIMURI|Yi Mu Ri)/ig,
    gongcha: /(貢茶|Gong\s*Cha|Gongcha)/ig,
  };

  const pattern = patterns[brandKey];
  if (!pattern) return value;

  return value
    .replace(pattern, " ")
    .replace(/[｜|·•／/\\—–_-]+/g, " ")
    .replace(/[()（）【】\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBranchText(value) {
  return String(value || "")
    .replace(/^[-–—·•｜|／/\s]+|[-–—·•｜|／/\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBranchSuffix(branch, type) {
  const value = cleanBranchText(branch);
  if (!value) return "";

  if (currentLang !== "zh-TW") return value;

  if (/(門市|分店|店$|店舖|旗艦店|概念店|直營店|直營)$/.test(value)) {
    return value;
  }

  if (type === "convenience") return `${value}門市`;
  return `${value}店`;
}


function getLocationHint(tags) {
  const full = cleanAddressValue(tags["addr:full"]);
  if (full) return full;

  const street = cleanAddressValue(
    tags["addr:street"] ||
    tags["addr:place"] ||
    tags["addr:neighbourhood"] ||
    tags["addr:suburb"]
  );
  const houseNumber = cleanAddressValue(tags["addr:housenumber"]);

  if (street && houseNumber) {
    return t("houseNumber", { street, number: houseNumber });
  }

  if (street) return t("addressNearby", { name: street });

  const district = cleanAddressValue(
    tags["addr:district"] ||
    tags["addr:borough"] ||
    tags["addr:quarter"]
  );

  if (district) return t("addressNearby", { name: district });

  return "";
}

function cleanAddressValue(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldShowLocationHint(place) {
  if (!place.locationHint) return false;

  // 沒有可靠分店名稱時，地址提示最重要。
  // 有分店名稱時也保留地址，讓同名門市更容易辨認。
  return true;
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
      ${place.locationHint ? `${escapeHtml(place.locationHint)}<br>` : ""}
      ${formatDistance(place.distance)} · ${escapeHtml(t("approxMinutes", { n: place.minutes }))}
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
  resetDiceRecommendations();
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
      t("categoryEmpty"),
      t("categoryEmptyText"),
      false
    );
  } else if (places.length > 0) {
    hideEmptyState();
  }

  els.resultMeta.textContent = places.length
    ? t("resultCount", { n: filtered.length, km: SEARCH_RADIUS_METERS / 1000 })
    : t("noResults");
}


function getDiceEligiblePlaces(type) {
  return places.filter(
    (place) =>
      place.type === type &&
      Number.isFinite(place.minutes) &&
      place.minutes <= DICE_MAX_MINUTES
  );
}

function pickRandomPlace(type) {
  const pool = getDiceEligiblePlaces(type);
  if (!pool.length) return null;

  const previousId = lastDicePickIds[type];
  const candidates =
    pool.length > 1 && previousId
      ? pool.filter((place) => place.id !== previousId)
      : pool;

  const selected = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
  lastDicePickIds[type] = selected.id;
  return selected;
}

function updateDiceAvailability() {
  if (!els.diceBtn) return;

  const totalEligible = places.filter(
    (place) => Number.isFinite(place.minutes) && place.minutes <= DICE_MAX_MINUTES
  ).length;

  els.diceBtn.disabled = totalEligible === 0;

  if (!totalEligible) {
    els.diceIntro.textContent = t("diceNone", { n: DICE_MAX_MINUTES });
  } else if (els.diceResults.classList.contains("hidden")) {
    els.diceIntro.textContent =
      t("diceCandidates", { n: totalEligible });
  }
}

function resetDiceRecommendations() {
  lastDicePickIds = {
    convenience: "",
    coffee: "",
    bubble_tea: "",
  };

  if (!els.diceBtn) return;

  els.diceBtn.disabled = true;
  els.diceButtonText.textContent = t("roll");
  els.diceResults.innerHTML = "";
  els.diceResults.classList.add("hidden");
  els.diceIntro.classList.remove("hidden");
  els.diceIntro.textContent = t("diceInitial");
}

function rollDiceRecommendations() {
  if (!places.length || els.diceBtn.disabled) return;

  els.diceIcon.classList.remove("rolling");
  // 觸發 reflow，讓每次點擊都能重新播放動畫
  void els.diceIcon.offsetWidth;
  els.diceIcon.classList.add("rolling");

  const picks = [
    { type: "convenience", place: pickRandomPlace("convenience") },
    { type: "coffee", place: pickRandomPlace("coffee") },
    { type: "bubble_tea", place: pickRandomPlace("bubble_tea") },
  ];

  renderDiceRecommendations(picks);

  els.diceIntro.classList.add("hidden");
  els.diceResults.classList.remove("hidden");
  els.diceButtonText.textContent = t("rollAgain");
}

function renderDiceRecommendations(picks) {
  els.diceResults.innerHTML = picks
    .map(({ type, place }) => {
      const config = TYPE_CONFIG[type];

      if (!place) {
        return `
          <article class="dice-pick-card empty">
            <div class="dice-pick-category">${config.icon} ${config.label}</div>
            <div class="dice-pick-empty">${escapeHtml(t("diceNoData"))}</div>
          </article>
        `;
      }

      const navigationUrl = buildGoogleMapsUrl(place);

      return `
        <article class="dice-pick-card">
          <div class="dice-pick-head">
            <span class="dice-pick-category">${config.icon} ${config.label}</span>
            <span class="dice-pick-time">${escapeHtml(t("minutes", { n: place.minutes }))}</span>
          </div>

          <div class="dice-pick-name">${escapeHtml(place.name)}</div>
          ${place.locationHint ? `<div class="dice-pick-location">📍 ${escapeHtml(place.locationHint)}</div>` : ""}

          <div class="dice-pick-bottom">
            <span>${formatDistance(place.distance)}</span>
            <a
              href="${navigationUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="dice-nav-button"
              aria-label="${escapeAttr(t("navigateTo", { name: place.name }))}"
            >${escapeHtml(t("nav"))}</a>
          </div>
        </article>
      `;
    })
    .join("");
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
      aria-label="${escapeAttr(t("brandIcon", { name: brand.label }))}"
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
      const openingText = place.openingHours === "24/7" ? ` · ${t("open24")}` : "";
      const favorite = isFavoriteStore(place.id);

      return `
        <article class="place-card" id="card-${escapeAttr(place.id)}">
          ${renderBrandIcon(place)}
          <div class="place-info">
            <div class="place-type">${config.label}${place.brandKey && BRAND_CONFIG[place.brandKey] ? ` · ${escapeHtml(BRAND_CONFIG[place.brandKey].label)}` : place.coffeeBrand ? ` · ${escapeHtml(place.coffeeBrand)}` : ""}</div>
            <div class="place-name" title="${escapeAttr(place.name)}">${escapeHtml(place.name)}</div>
            ${shouldShowLocationHint(place) ? `<div class="place-location" title="${escapeAttr(place.locationHint)}">📍 ${escapeHtml(place.locationHint)}</div>` : ""}
            <p class="place-meta">
              <strong>${formatDistance(place.distance)}</strong>
              · ${escapeHtml(t("approxMinutes", { n: place.minutes }))}${openingText}
            </p>
          </div>
          <div class="place-actions">
            <button
              class="favorite-store-button ${favorite ? "active" : ""}"
              type="button"
              data-favorite-store-id="${escapeAttr(place.id)}"
              aria-label="${escapeAttr((favorite ? t("removeFavoriteStore") : t("addFavoriteStore")) + ": " + place.name)}"
              title="${escapeAttr(favorite ? t("removeFavorite") : t("addFavorite"))}"
            >${favorite ? "★" : "☆"}</button>
            <a
              class="nav-button"
              href="${navigationUrl}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="${escapeAttr(t("navigateTo", { name: place.name }))}"
            >${escapeHtml(t("nav"))}</a>
          </div>
        </article>
      `;
    })
    .join("");
}


function loadLocalArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveLocalArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("localStorage save failed:", error);
  }
}

function isFavoriteStore(id) {
  return favoriteStores.some((item) => item.id === id);
}

function toggleFavoriteStore(place) {
  const existingIndex = favoriteStores.findIndex((item) => item.id === place.id);

  if (existingIndex >= 0) {
    favoriteStores.splice(existingIndex, 1);
  } else {
    favoriteStores.unshift({
      id: place.id,
      name: place.name,
      brandKey: place.brandKey || "",
      type: place.type,
      locationHint: place.locationHint || "",
      lat: place.lat,
      lng: place.lng,
      savedAt: new Date().toISOString(),
    });
  }

  saveLocalArray(FAVORITE_STORES_KEY, favoriteStores);
  renderFavorites();
  applyFilter(activeFilter);
}

function getLocationFavoriteId(lat, lng) {
  return `location:${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

function isActiveCenterFavorite() {
  if (!activeCenter) return false;
  const id = getLocationFavoriteId(activeCenter.lat, activeCenter.lng);
  return favoriteLocations.some((item) => item.id === id);
}

function updateSaveCenterButton() {
  if (!els.saveCenterBtn) return;

  if (!activeCenter) {
    els.saveCenterBtn.disabled = true;
    els.saveCenterBtn.textContent = t("savePlace");
    return;
  }

  els.saveCenterBtn.disabled = false;
  els.saveCenterBtn.textContent = isActiveCenterFavorite()
    ? t("savedPlace")
    : t("savePlace");
  els.saveCenterBtn.classList.toggle("active", isActiveCenterFavorite());
}

function openFavoriteLocationModal() {
  if (!activeCenter) return;

  const existingId = getLocationFavoriteId(activeCenter.lat, activeCenter.lng);
  const existing = favoriteLocations.find((item) => item.id === existingId);

  els.favoriteLocationName.value =
    existing?.label ||
    (activeCenter.label && activeCenter.mode !== "current"
      ? activeCenter.label
      : "");

  els.favoriteLocationModal.classList.remove("hidden");
  setTimeout(() => els.favoriteLocationName.focus(), 30);
}

function closeFavoriteLocationModal() {
  els.favoriteLocationModal.classList.add("hidden");
}

function saveActiveCenterFavorite() {
  if (!activeCenter) return;

  const label = els.favoriteLocationName.value.trim();
  if (!label) {
    els.favoriteLocationName.focus();
    return;
  }

  const id = getLocationFavoriteId(activeCenter.lat, activeCenter.lng);
  const item = {
    id,
    label,
    lat: activeCenter.lat,
    lng: activeCenter.lng,
    detail: activeCenter.detail || "",
    savedAt: new Date().toISOString(),
  };

  const index = favoriteLocations.findIndex((location) => location.id === id);
  if (index >= 0) {
    favoriteLocations[index] = item;
  } else {
    favoriteLocations.unshift(item);
  }

  saveLocalArray(FAVORITE_LOCATIONS_KEY, favoriteLocations);
  closeFavoriteLocationModal();
  renderFavorites();
  updateSaveCenterButton();
}

function removeFavoriteLocation(id) {
  favoriteLocations = favoriteLocations.filter((item) => item.id !== id);
  saveLocalArray(FAVORITE_LOCATIONS_KEY, favoriteLocations);
  renderFavorites();
  updateSaveCenterButton();
}

function removeFavoriteStore(id) {
  favoriteStores = favoriteStores.filter((item) => item.id !== id);
  saveLocalArray(FAVORITE_STORES_KEY, favoriteStores);
  renderFavorites();
  applyFilter(activeFilter);
}

async function openFavoriteLocation(id) {
  const location = favoriteLocations.find((item) => item.id === id);
  if (!location) return;

  centerIntentVersion += 1;
  closeGeocodePanel();
  els.searchInput.value = location.label;

  await setActiveCenter({
    lat: location.lat,
    lng: location.lng,
    label: location.label,
    mode: "favorite-location",
    detail: location.detail || t("favoriteLocationDetail"),
  });
}

async function openFavoriteStore(id) {
  const store = favoriteStores.find((item) => item.id === id);
  if (!store) return;

  centerIntentVersion += 1;
  closeGeocodePanel();
  els.searchInput.value = store.name;

  await setActiveCenter({
    lat: store.lat,
    lng: store.lng,
    label: store.name,
    mode: "favorite-store",
    detail: t("favoriteStoreDetail"),
  });
}

function renderFavorites() {
  if (!favoriteLocations.length) {
    els.favoriteLocations.innerHTML =
      `<span class="favorite-empty">${escapeHtml(t("noFavoriteLocations"))}</span>`;
  } else {
    els.favoriteLocations.innerHTML = favoriteLocations
      .map(
        (location) => `
          <div class="favorite-chip-wrap">
            <button
              class="favorite-chip"
              type="button"
              data-open-location="${escapeAttr(location.id)}"
            >📍 ${escapeHtml(location.label)}</button>
            <button
              class="favorite-remove"
              type="button"
              data-remove-location="${escapeAttr(location.id)}"
              aria-label="${escapeAttr(t("removeItem", { name: location.label }))}"
            >×</button>
          </div>
        `
      )
      .join("");
  }

  if (!favoriteStores.length) {
    els.favoriteStores.innerHTML =
      `<span class="favorite-empty">${escapeHtml(t("noFavoriteStores"))}</span>`;
  } else {
    els.favoriteStores.innerHTML = favoriteStores
      .map((store) => {
        const typeIcon = TYPE_CONFIG[store.type]?.icon || "📍";
        const nav = buildGoogleMapsUrl(store);

        return `
          <article class="favorite-store-card">
            <button
              class="favorite-store-main"
              type="button"
              data-open-store="${escapeAttr(store.id)}"
              title="${escapeAttr(t("viewNearby", { name: store.name }))}"
            >
              <span class="favorite-store-icon">${typeIcon}</span>
              <span class="favorite-store-copy">
                <span class="favorite-store-name">${escapeHtml(store.name)}</span>
                ${store.locationHint ? `<span class="favorite-store-location">${escapeHtml(store.locationHint)}</span>` : ""}
              </span>
            </button>
            <a
              class="favorite-store-nav"
              href="${nav}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="${escapeAttr(t("navigateTo", { name: store.name }))}"
            >↗</a>
            <button
              class="favorite-store-remove"
              type="button"
              data-remove-store="${escapeAttr(store.id)}"
              aria-label="${escapeAttr(t("removeItem", { name: store.name }))}"
            >×</button>
          </article>
        `;
      })
      .join("");
  }
}

function buildGoogleMapsUrl(place) {
  const destination = `${place.lat},${place.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

function updateCounts() {
  const convenience = places.filter((p) => p.type === "convenience").length;
  const coffee = places.filter((p) => p.type === "coffee").length;
  const bubbleTea = places.filter((p) => p.type === "bubble_tea").length;
  const bar = places.filter((p) => p.type === "bar").length;

  els.countAll.textContent = places.length;
  els.countConvenience.textContent = convenience;
  els.countCoffee.textContent = coffee;
  els.countBubbleTea.textContent = bubbleTea;
  els.countBar.textContent = bar;
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
  els.languageSelect.addEventListener("change", () => {
    applyLanguage(els.languageSelect.value);
  });
  els.locateBtn.addEventListener("click", locateUser);
  els.useMyLocationBtn.addEventListener("click", locateUser);
  els.startBtn.addEventListener("click", locateUser);
  els.searchForm.addEventListener("submit", handleLocationSearch);
  els.closeGeocodeBtn.addEventListener("click", closeGeocodePanel);
  els.saveCenterBtn.addEventListener("click", openFavoriteLocationModal);
  els.closeFavoriteLocationModal.addEventListener("click", closeFavoriteLocationModal);
  els.cancelFavoriteLocation.addEventListener("click", closeFavoriteLocationModal);
  els.confirmFavoriteLocation.addEventListener("click", saveActiveCenterFavorite);
  els.diceBtn.addEventListener("click", rollDiceRecommendations);

  document.querySelectorAll("[data-quick-key]").forEach((button) => {
    button.addEventListener("click", () => {
      els.favoriteLocationName.value = t(`quick_${button.dataset.quickKey}`) || "";
      els.favoriteLocationName.focus();
    });
  });

  els.favoriteLocationName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveActiveCenterFavorite();
    if (event.key === "Escape") closeFavoriteLocationModal();
  });

  els.favoriteLocationModal.addEventListener("click", (event) => {
    if (event.target === els.favoriteLocationModal) closeFavoriteLocationModal();
  });

  els.results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorite-store-id]");
    if (!button) return;

    const place = places.find((item) => item.id === button.dataset.favoriteStoreId);
    if (place) toggleFavoriteStore(place);
  });

  els.favoriteLocations.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-location]");
    if (removeButton) {
      removeFavoriteLocation(removeButton.dataset.removeLocation);
      return;
    }

    const openButton = event.target.closest("[data-open-location]");
    if (openButton) await openFavoriteLocation(openButton.dataset.openLocation);
  });

  els.favoriteStores.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-store]");
    if (removeButton) {
      removeFavoriteStore(removeButton.dataset.removeStore);
      return;
    }

    const openButton = event.target.closest("[data-open-store]");
    if (openButton) await openFavoriteStore(openButton.dataset.openStore);
  });

  els.taipeiTestBtn.addEventListener("click", async () => {
    centerIntentVersion += 1;
    closeGeocodePanel();
    els.searchInput.value = t("taipeiMainStation");

    await setActiveCenter({
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      label: t("taipeiMainStation"),
      mode: "test",
      detail: t("taipeiTestDetail"),
    });
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });
}

initMap();
bindEvents();
applyLanguage(currentLang, { persist: false });

// 首次進站仍自動嘗試定位；使用者若開始搜尋，搜尋意圖會優先，不會被稍後完成的 GPS 搶回畫面。
window.addEventListener("load", () => {
  setTimeout(locateUser, 350);
});
