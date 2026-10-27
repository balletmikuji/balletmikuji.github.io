/**
 * アプリ設定
 * 動作の調整やデザイン素材の差し替えはここで行います。
 */
window.CONFIG = {
  // 1日の切り替わり時刻（0 = 深夜0時。例：5 にすると朝5時で日付が変わる）
  DAY_RESET_HOUR: 0,

  // true: 箱を1回以上振らないと札を出せない
  REQUIRE_SHAKE_BEFORE_DRAW: true,

  // true: まだずかんに無い豆知識を優先して出す（全部集め終わったら全体からランダム）
  PREFER_UNCOLLECTED: true,

  // 操作の感度
  SWIPE_THRESHOLD_PX: 60, // 下方向にこれ以上動かしたら「スワイプ」
  TAP_TOLERANCE_PX: 10,   // これ以下の移動なら「タップ」

  // 演出時間（ミリ秒）
  SHAKE_DURATION_MS: 600,
  BOX_LEAVE_DURATION_MS: 900,
  STICK_HOLD_DURATION_MS: 300,
  UNFOLD_DULATION_MS: 600,

  // 画面に出す文言
  TEXT: {
    guideShake: "箱をタップしてふってね",
    guideSwipe: "箱を上にスワイプして、おみくじを引こう",
    alreadyDrawn: "今日のおみくじはもう引きました。また明日！",
    notYetDrawn: "今日のおみくじを引こう",
    resultCaption: "今日の運勢",
    registered: "この豆知識を「ずかん」に登録しました",
    alreadyRegistered: "この豆知識はずかんに登録済みです",
    locked: "？？？",
  },

  // デザイン素材（画像パス）。null の間はプレースホルダー表示
  ASSETS: {
    boxImage: "assets/omikujiBox.png",   // 例: "assets/box.png"
    stickImage: null, // 例: "assets/stick.png"
  },

  // localStorage の保存キー（データ構造を変えたら v2 などに変更）
  STORAGE_KEY: "ballet-omikuji-v1",
};
