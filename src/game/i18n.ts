import type { LanguageId } from "./settings";

/**
 * UI chrome only: prompts, settings, footer, panel shells. Project prose stays
 * in English on purpose — it is portfolio content, not interface.
 */
const EN = {
  /* header / footer */
  roomLabel: "Room 01",
  play: "Play",
  viewPortfolio: "View Portfolio",
  move: "move",
  interactVerb: "interact",
  close: "close",
  stick: "Stick",
  hintMove: "Use the movement keys to walk",
  hintMoveTouch: "Drag the stick to move",

  /* interaction verbs */
  verbInspect: "Inspect",
  verbOpen: "Open",
  verbAdjust: "Adjust",
  verbTakeWater: "Fill a cup",
  verbWater: "Water",
  verbNeedsWater: "Needs water",
  verbLightsOn: "Turn the lights on",
  verbLightsOff: "Turn the lights off",
  verbViewCollection: "View",

  /* object names */
  nameLaptop: "Laptop",
  nameDevStation: "Dev Station",
  nameWorkbench: "Workbench",
  nameDoor: "Door",
  nameServer: "Server Rack",
  nameCooler: "Water Cooler",
  namePlant: "Plant",
  nameCase: "Bug Collection",
  nameSwitch: "Light Switch",

  /* settings panel */
  settingsTitle: "Settings",
  settingsSubtitle: "Sound, language and controls",
  audio: "Audio",
  volume: "Volume",
  soundEffects: "Sound effects",
  on: "On",
  off: "Off",
  language: "Language",
  english: "English",
  turkish: "Türkçe",
  controls: "Controls",
  controlsHint: "Click a key, then press the one you want.",
  actionUp: "Move up",
  actionDown: "Move down",
  actionLeft: "Move left",
  actionRight: "Move right",
  actionInteract: "Interact",
  primary: "Primary",
  alternate: "Alternate",
  pressKey: "Press…",
  resetDefaults: "Reset to defaults",

  /* bug collection */
  collectionTitle: "Bug Collection",
  collectionSubtitle: "Catch them before they scuttle off",
  collectionProgress: "Caught",
  collectionComplete: "Every bug found. The room is clean.",
  collectionHint: "Bugs wander in now and then. Walk into one to catch it.",
  collectionEmpty: "Nothing caught yet.",

  /* misc */
  carryingWater: "Carrying water",
} as const;

export type StringKey = keyof typeof EN;

const TR: Record<StringKey, string> = {
  roomLabel: "Oda 01",
  play: "Oyna",
  viewPortfolio: "Portfolyo",
  move: "hareket",
  interactVerb: "etkileşim",
  close: "kapat",
  stick: "Kumanda",
  hintMove: "Yürümek için hareket tuşlarını kullan",
  hintMoveTouch: "Yürümek için çubuğu sürükle",

  verbInspect: "İncele",
  verbOpen: "Aç",
  verbAdjust: "Ayarla",
  verbTakeWater: "Bardağı doldur",
  verbWater: "Sula",
  verbNeedsWater: "Su istiyor",
  verbLightsOn: "Işıkları aç",
  verbLightsOff: "Işıkları kapat",
  verbViewCollection: "Bak",

  nameLaptop: "Dizüstü",
  nameDevStation: "Geliştirme İstasyonu",
  nameWorkbench: "Tezgâh",
  nameDoor: "Kapı",
  nameServer: "Sunucu Dolabı",
  nameCooler: "Su Sebili",
  namePlant: "Çiçek",
  nameCase: "Böcek Koleksiyonu",
  nameSwitch: "Işık Anahtarı",

  settingsTitle: "Ayarlar",
  settingsSubtitle: "Ses, dil ve kontroller",
  audio: "Ses",
  volume: "Ses seviyesi",
  soundEffects: "Ses efektleri",
  on: "Açık",
  off: "Kapalı",
  language: "Dil",
  english: "English",
  turkish: "Türkçe",
  controls: "Kontroller",
  controlsHint: "Bir tuşa tıkla, sonra istediğin tuşa bas.",
  actionUp: "Yukarı",
  actionDown: "Aşağı",
  actionLeft: "Sola",
  actionRight: "Sağa",
  actionInteract: "Etkileşim",
  primary: "Birincil",
  alternate: "İkincil",
  pressKey: "Bas…",
  resetDefaults: "Varsayılana dön",

  collectionTitle: "Böcek Koleksiyonu",
  collectionSubtitle: "Kaçmadan yakala",
  collectionProgress: "Yakalanan",
  collectionComplete: "Bütün böcekler bulundu. Oda temiz.",
  collectionHint: "Böcekler arada bir odaya dalar. Üstüne yürüyerek yakala.",
  collectionEmpty: "Henüz bir şey yakalanmadı.",

  carryingWater: "Elinde su var",
};

const TABLE: Record<LanguageId, Record<StringKey, string>> = { en: EN, tr: TR };

export type Translate = (key: StringKey) => string;

export function translator(language: LanguageId): Translate {
  const table = TABLE[language] ?? EN;
  return (key) => table[key] ?? EN[key];
}
