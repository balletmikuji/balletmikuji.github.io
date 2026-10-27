/**
 * 運勢データ
 * ------------------------------------------------------------
 * id      : 内部ID（保存に使うので一度決めたら変えない）
 * label   : 札に表示する運勢
 * weight  : 出やすさ（数値が大きいほど出やすい。合計は自由）
 * message : 運勢の下に出す一言（空でもOK）
 * color   : 運勢の文字色（デザイン確定後に調整）
 */
window.FORTUNES = [
  { id: "daikichi", label: "吉　大", weight: 10, message: "", color: "#c0392b" },
  { id: "chukichi", label: "吉　中", weight: 15, message: "", color: "#c0392b" },
  { id: "shokichi", label: "吉　小", weight: 20, message: "", color: "#c0392b" },
  { id: "kichi",    label: "吉",   weight: 20, message: "", color: "#c0392b" },
  { id: "suekichi", label: "吉　末", weight: 20, message: "", color: "#c0392b" },
  { id: "kyo",      label: "凶",   weight: 10, message: "", color: "#34495e" },
  { id: "daikyo",   label: "凶　大", weight: 5,  message: "", color: "#34495e" },
];
