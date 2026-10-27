(() => {
  "use strict";
 
  const C = window.CONFIG;
  const FORTUNES = window.FORTUNES || [];
  const TRIVIA = window.TRIVIA || [];
  const DEBUG = new URLSearchParams(location.search).has("debug");
 
  const $ = (sel) => document.querySelector(sel);
 
  // 演出時間（config.js に無ければ既定値）
  const BOX_LEAVE_MS = C.BOX_LEAVE_DURATION_MS ?? 700;  // 箱が上に消えるまで
  const STICK_HOLD_MS = C.STICK_HOLD_DURATION_MS ?? 250; // 札だけが見えている間
  const UNFOLD_MS = C.UNFOLD_DURATION_MS ?? 800;         // 札が開くまで
  document.documentElement.style.setProperty("--box-leave-ms", BOX_LEAVE_MS + "ms");
 
  /* =========================================================
   * 保存データ
   * {
   *   lastDrawDate: "2026-10-15",
   *   lastResult: { fortuneId, triviaId, isNew },
   *   collection: { [triviaId]: { firstDate, count, lastFortuneId } }
   * }
   * ======================================================= */
  const Store = {
    load() {
      try {
        const raw = localStorage.getItem(C.STORAGE_KEY);
        if (raw) return Object.assign(this.empty(), JSON.parse(raw));
      } catch (e) { /* 読めない環境では空データで動かす */ }
      return this.empty();
    },
    save(data) {
      try { localStorage.setItem(C.STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    },
    empty() {
      return { lastDrawDate: null, lastResult: null, collection: {} };
    },
  };
 
  let state = Store.load();
 
  /* =========================================================
   * 日付・抽選ロジック
   * ======================================================= */
  function todayKey() {
    const d = new Date(Date.now() - C.DAY_RESET_HOUR * 3600 * 1000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
 
  function hasDrawnToday() {
    return state.lastDrawDate === todayKey() && !!state.lastResult;
  }
 
  function pickWeighted(list) {
    const total = list.reduce((s, x) => s + (x.weight || 1), 0);
    let r = Math.random() * total;
    for (const x of list) {
      r -= x.weight || 1;
      if (r < 0) return x;
    }
    return list[list.length - 1];
  }
 
  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
 
  function pickTrivia() {
    if (C.PREFER_UNCOLLECTED) {
      const uncollected = TRIVIA.filter((t) => !state.collection[t.id]);
      if (uncollected.length) return pickRandom(uncollected);
    }
    return pickRandom(TRIVIA);
  }
 
  /** おみくじを引いて保存する */
  function drawOmikuji() {
    const fortune = pickWeighted(FORTUNES);
    const trivia = pickTrivia();
    const date = todayKey();
 
    const entry = state.collection[trivia.id];
    const isNew = !entry;
    state.collection[trivia.id] = {
      firstDate: entry ? entry.firstDate : date,
      count: (entry ? entry.count : 0) + 1,
      lastFortuneId: fortune.id,
    };
    state.lastDrawDate = date;
    state.lastResult = { fortuneId: fortune.id, triviaId: trivia.id, isNew };
    Store.save(state);
    return state.lastResult;
  }
 
  const findFortune = (id) => FORTUNES.find((f) => f.id === id);
  const findTrivia = (id) => TRIVIA.find((t) => t.id === id);
 
  /* =========================================================
   * 画面切り替え
   * ======================================================= */
  const screens = {
    title: $("#screen-title"),
    draw: $("#screen-draw"),
    result: $("#screen-result"),
    zukan: $("#screen-zukan"),
  };
 
  function show(name, opts) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("is-active", k === name));
    const onEnter = { title: enterTitle, draw: enterDraw, result: enterResult, zukan: enterZukan }[name];
    if (onEnter) onEnter(opts || {});
  }
 
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) show(go.dataset.go);
  });
 
  /* ---------- タイトル ---------- */
  function enterTitle() {
    $("#title-status").textContent = hasDrawnToday() ? C.TEXT.alreadyDrawn : C.TEXT.notYetDrawn;
  }
 
  $("#btn-go-draw").addEventListener("click", () => {
    // 1日1回：引き済みなら今日の結果を表示
    show(hasDrawnToday() ? "result" : "draw");
  });
  $("#btn-go-zukan").addEventListener("click", () => show("zukan"));
 
  /* ---------- おみくじ（箱） ---------- */
  const box = $("#omikuji-box");
  const stick = $("#omikuji-stick");
  let shakeCount = 0;
  let drawing = false;
  let pointerStart = null;
 
  function applyAssets() {
    if (C.ASSETS.boxImage) box.innerHTML = `<img src="${C.ASSETS.boxImage}" alt="おみくじの箱" draggable="false">`;
    if (C.ASSETS.stickImage) stick.innerHTML = `<img src="${C.ASSETS.stickImage}" alt="おみくじの札" draggable="false">`;
  }
 
  function enterDraw() {
    shakeCount = 0;
    drawing = false;
    box.classList.remove("is-shaking", "is-leaving");
    stick.classList.remove("is-revealed");
    updateGuide();
  }
 
  function updateGuide() {
    const canDraw = !C.REQUIRE_SHAKE_BEFORE_DRAW || shakeCount > 0;
    $("#draw-guide").textContent = canDraw ? C.TEXT.guideSwipe : C.TEXT.guideShake;
  }
 
  function onBoxTap() {
    if (drawing) return;
    shakeCount++;
    box.classList.remove("is-shaking");
    void box.offsetWidth; // アニメーションを再始動
    box.classList.add("is-shaking");
    setTimeout(() => box.classList.remove("is-shaking"), C.SHAKE_DURATION_MS);
    // [HOOK] 効果音・バイブレーションを入れるならここ
    if (navigator.vibrate) navigator.vibrate(30);
    updateGuide();
  }
 
  function onBoxSwipeUp() {
    if (drawing) return;
    if (C.REQUIRE_SHAKE_BEFORE_DRAW && shakeCount === 0) {
      onBoxTap(); // 振っていなければ、まず振る
      return;
    }
    drawing = true;
    drawOmikuji();
 
    // 箱が上に移動しながらフェードアウト → 中央に札（白い短冊）が残る
    box.classList.remove("is-shaking");
    box.classList.add("is-leaving");
    stick.classList.add("is-revealed");
    // [HOOK] 箱を持ち上げる効果音などはここ
 
    setTimeout(() => {
      // 札の位置・大きさを結果画面に引き継ぎ、そこから横に開く
      const fromRect = stick.getBoundingClientRect();
      show("result", { fromRect });
    }, BOX_LEAVE_MS + STICK_HOLD_MS);
  }
 
  box.addEventListener("pointerdown", (e) => {
    pointerStart = { x: e.clientX, y: e.clientY };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener("pointerup", (e) => {
    if (!pointerStart) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    pointerStart = null;
    if (-dy > C.SWIPE_THRESHOLD_PX && Math.abs(dy) > Math.abs(dx)) onBoxSwipeUp();
    else if (Math.hypot(dx, dy) < C.TAP_TOLERANCE_PX) onBoxTap();
  });
  box.addEventListener("pointercancel", () => { pointerStart = null; });
 
  /* ---------- 結果（札） ---------- */
  function enterResult(opts) {
    const r = state.lastResult;
    if (!r) return show("title");
    renderSlip(findFortune(r.fortuneId), findTrivia(r.triviaId));
    $("#result-caption").textContent = C.TEXT.resultCaption;
    $("#result-note").textContent = r.isNew ? C.TEXT.registered : C.TEXT.alreadyRegistered;
    playUnfold(opts.fromRect);
  }
 
  /**
   * 札が横に開く演出
   * fromRect あり：おみくじ画面の札（短冊）の位置・大きさから、結果の札の位置・大きさへ変形
   *   ① その場で横に開く → ② 本来の位置・高さへ移動 → ③ 文字がふわっと出る
   * fromRect なし（今日すでに引いた場合）：その場で細い短冊から横に開く
   */
  function playUnfold(fromRect) {
    const slip = $("#slip");
    slip.getAnimations().forEach((a) => a.cancel());
    slip.classList.add("is-unfolding");             // 開いている間は札の文字を隠す
    screens.result.classList.add("is-unfolding");   // 周りの文字・ボタンも隠す
 
    const to = slip.getBoundingClientRect();
    let keyframes;
    if (fromRect && to.width && to.height) {
      const dx = (fromRect.left + fromRect.width / 2) - (to.left + to.width / 2);
      const dy = (fromRect.top + fromRect.height / 2) - (to.top + to.height / 2);
      const sx = fromRect.width / to.width;
      const sy = fromRect.height / to.height;
      keyframes = [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: `translate(${dx}px, ${dy}px) scale(1, ${sy})`, offset: 0.55 }, // ①横に開く
        { transform: "none" },                                                    // ②定位置へ
      ];
    } else {
      keyframes = [
        { transform: "scaleX(0.08)", opacity: 0 },
        { transform: "scaleX(0.08)", opacity: 1, offset: 0.15 },
        { transform: "none", opacity: 1 },
      ];
    }
 
    const anim = slip.animate(keyframes, { duration: UNFOLD_MS, easing: "ease-in-out" });
    anim.onfinish = anim.oncancel = () => { // ③
      slip.classList.remove("is-unfolding");
      screens.result.classList.remove("is-unfolding");
    };
  }
 
  /** 札の描画。項目を増やした場合はここを編集 */
  function renderSlip(fortune, trivia) {
    const slip = $("#slip");
    slip.dataset.fortune = fortune ? fortune.id : "";
    $("#slip-fortune").textContent = fortune ? fortune.label : "";
    $("#slip-fortune").style.color = (fortune && fortune.color) || "";
    $("#slip-message").textContent = (fortune && fortune.message) || "";
    $("#slip-trivia-title").textContent = trivia ? trivia.title : "（豆知識が見つかりません）";
    $("#slip-trivia-body").textContent = trivia ? trivia.body : "";
  }
 
  /* ---------- ずかん ---------- */
  function enterZukan() {
    const list = $("#zukan-list");
    list.innerHTML = "";
    let got = 0;
 
    TRIVIA.forEach((t, i) => {
      const entry = state.collection[t.id];
      if (entry) got++;
      const li = document.createElement("li");
      li.className = "zukan-item" + (entry ? " is-collected" : " is-locked");
      li.innerHTML = `
        <span class="zukan-no">No.${String(i + 1).padStart(3, "0")}</span>
        <span class="zukan-name"></span>`;
      li.querySelector(".zukan-name").textContent = entry ? t.title : C.TEXT.locked;
      if (entry) li.addEventListener("click", () => openZukanModal(t, i, entry));
      list.appendChild(li);
    });
 
    $("#zukan-progress").textContent = `${got} / ${TRIVIA.length}`;
  }
 
  /** ずかん詳細。項目を増やした場合はここを編集 */
  function openZukanModal(t, index, entry) {
    const f = findFortune(entry.lastFortuneId);
    $("#modal-no").textContent = `No.${String(index + 1).padStart(3, "0")}`;
    $("#modal-title").textContent = t.title;
    $("#modal-text").textContent = t.body;
    $("#modal-meta").textContent =
      `はじめて引いた日：${entry.firstDate}　引いた回数：${entry.count}回` +
      (f ? `　最後の運勢：${f.label}` : "");
    $("#zukan-modal").hidden = false;
  }
 
  $("#zukan-modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) $("#zukan-modal").hidden = true;
  });
 
  /* ---------- デバッグ（URL に ?debug を付けると表示） ---------- */
  if (DEBUG) {
    const btn = $("#btn-debug-reset");
    btn.hidden = false;
    btn.addEventListener("click", () => {
      state.lastDrawDate = null;
      state.lastResult = null;
      Store.save(state);
      enterTitle();
    });
  }
 
  /* ---------- 起動 ---------- */
  applyAssets();
  show("title");
})();