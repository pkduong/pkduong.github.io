(function () {
  "use strict";

  var synth = window.speechSynthesis;
  var supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var RATE_KEY = "pkduong.articleAudio.rate";
  var MAX_CHUNK_LENGTH = 220;
  var rates = [0.75, 1, 1.25, 1.5];
  var chunks = [];
  var chunkIndex = 0;
  var state = supported ? "idle" : "unsupported";
  var runId = 0;
  var restartOnResume = false;
  var activeUtterance = null;
  var controls = null;
  var mainButton = null;
  var optionsButton = null;
  var menu = null;
  var rateLabel = null;
  var statusRegion = null;
  var removePageListeners = null;

  var ICONS = {
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05A4.49 4.49 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.91 8.91 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06a8.96 8.96 0 0 0 3.69-1.81L19.73 21 21 19.73 12 10.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>'
  };

  function announce(message) {
    if (!statusRegion) return;
    statusRegion.textContent = "";
    window.setTimeout(function () {
      if (statusRegion) statusRegion.textContent = message;
    }, 20);
  }

  function setState(nextState) {
    state = nextState;
    if (!mainButton) return;

    var config = {
      idle: [ICONS.speaker, "Đọc bài viết", "false", false],
      playing: [ICONS.pause, "Tạm dừng đọc", "true", false],
      paused: [ICONS.play, "Tiếp tục đọc", "true", false],
      unsupported: [ICONS.muted, "Trình duyệt này chưa hỗ trợ đọc văn bản", "false", true]
    }[nextState];

    mainButton.innerHTML = config[0];
    mainButton.setAttribute("aria-label", config[1]);
    mainButton.setAttribute("title", config[1]);
    mainButton.setAttribute("aria-pressed", config[2]);
    mainButton.disabled = config[3];
    controls.setAttribute("data-state", nextState);

    if (optionsButton) optionsButton.disabled = nextState === "unsupported";
  }

  function readSavedRate() {
    try {
      var value = Number(window.localStorage.getItem(RATE_KEY));
      return rates.indexOf(value) !== -1 ? value : 1;
    } catch (_error) {
      return 1;
    }
  }

  function saveRate(rate) {
    try {
      window.localStorage.setItem(RATE_KEY, String(rate));
    } catch (_error) {
      // localStorage can be unavailable in private or restricted contexts.
    }
  }

  function formatRate(rate) {
    return String(rate).replace(".", ",") + "×";
  }

  function selectVoice() {
    if (!supported) return null;
    var voices = synth.getVoices();

    return voices.find(function (voice) {
      return voice.lang.toLowerCase() === "vi-vn";
    }) || voices.find(function (voice) {
      return voice.lang.toLowerCase().indexOf("vi") === 0;
    }) || voices.find(function (voice) {
      return voice.default;
    }) || voices[0] || null;
  }

  function hasVietnameseVoice() {
    return supported && synth.getVoices().some(function (voice) {
      return voice.lang.toLowerCase().indexOf("vi") === 0;
    });
  }

  function extractReadableText(article) {
    var clone = article.cloneNode(true);
    var excluded = [
      "[data-article-audio]",
      "pre",
      "code",
      "script",
      "style",
      "table",
      ".headerlink",
      ".md-clipboard",
      ".footnote-backref",
      ".MathJax",
      "mjx-container",
      "sup[id^='fnref']",
      "[aria-hidden='true']",
      "[hidden]"
    ].join(",");

    clone.querySelectorAll(excluded).forEach(function (node) {
      node.remove();
    });

    var candidates = Array.prototype.slice.call(clone.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption"
    ));

    return candidates.filter(function (node) {
      return !candidates.some(function (parent) {
        return parent !== node && parent.contains(node);
      });
    }).map(function (node) {
      return node.textContent.replace(/\s+/g, " ").trim();
    }).filter(Boolean).join("\n");
  }

  function splitLongSentence(sentence, maxLength) {
    var result = [];
    var remaining = sentence.trim();

    while (remaining.length > maxLength) {
      var breakAt = remaining.lastIndexOf(" ", maxLength);
      if (breakAt < Math.floor(maxLength * 0.6)) breakAt = maxLength;
      result.push(remaining.slice(0, breakAt).trim());
      remaining = remaining.slice(breakAt).trim();
    }

    if (remaining) result.push(remaining);
    return result;
  }

  function segmentSentences(text) {
    if (window.Intl && Intl.Segmenter) {
      var segmenter = new Intl.Segmenter("vi", { granularity: "sentence" });
      return Array.from(segmenter.segment(text), function (part) {
        return part.segment.trim();
      }).filter(Boolean);
    }

    return text.split(/(?<=[.!?;:])\s+|\n+/).map(function (part) {
      return part.trim();
    }).filter(Boolean);
  }

  function makeChunks(text) {
    var sentences = segmentSentences(text);
    var result = [];
    var current = "";

    sentences.forEach(function (sentence) {
      splitLongSentence(sentence, MAX_CHUNK_LENGTH).forEach(function (part) {
        if (!current) {
          current = part;
        } else if ((current + " " + part).length <= MAX_CHUNK_LENGTH) {
          current += " " + part;
        } else {
          result.push(current);
          current = part;
        }
      });
    });

    if (current) result.push(current);
    return result;
  }

  function finishReading() {
    chunks = [];
    chunkIndex = 0;
    restartOnResume = false;
    activeUtterance = null;
    setState("idle");
    announce("Đã đọc xong bài viết.");
  }

  function speakCurrentChunk(activeRunId) {
    if (state !== "playing" || activeRunId !== runId) return;
    if (chunkIndex >= chunks.length) {
      finishReading();
      return;
    }

    var utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    var voice = selectVoice();
    utterance.lang = voice && voice.lang ? voice.lang : "vi-VN";
    utterance.rate = readSavedRate();
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.addEventListener("end", function () {
      if (activeRunId !== runId || state !== "playing") return;
      activeUtterance = null;
      chunkIndex += 1;
      speakCurrentChunk(activeRunId);
    });

    utterance.addEventListener("error", function (event) {
      if (activeRunId !== runId || event.error === "canceled" || event.error === "interrupted") return;
      chunks = [];
      chunkIndex = 0;
      activeUtterance = null;
      setState("idle");
      announce("Không thể tiếp tục đọc. Hãy thử lại.");
    });

    activeUtterance = utterance;
    synth.speak(activeUtterance);
  }

  function startReading() {
    var article = document.querySelector(".md-content__inner");
    if (!article) return;

    var text = extractReadableText(article);
    chunks = makeChunks(text);
    chunkIndex = 0;
    restartOnResume = false;

    if (!chunks.length) {
      announce("Trang này không có nội dung để đọc.");
      return;
    }

    runId += 1;
    synth.cancel();
    setState("playing");
    announce("Bắt đầu đọc bài viết.");

    if (synth.getVoices().length && !hasVietnameseVoice()) {
      announce("Thiết bị chưa có giọng tiếng Việt; đang sử dụng giọng mặc định.");
    }

    speakCurrentChunk(runId);
  }

  function pauseReading() {
    synth.pause();
    setState("paused");
    announce("Đã tạm dừng.");
  }

  function resumeReading() {
    setState("playing");
    announce("Tiếp tục đọc.");

    if (restartOnResume) {
      restartOnResume = false;
      speakCurrentChunk(runId);
    } else {
      synth.resume();
    }
  }

  function stopReading(shouldAnnounce) {
    runId += 1;
    restartOnResume = false;
    chunks = [];
    chunkIndex = 0;
    activeUtterance = null;
    if (supported) synth.cancel();
    if (state !== "unsupported") setState("idle");
    if (shouldAnnounce) announce("Đã dừng đọc.");
  }

  function changeRate(rate) {
    saveRate(rate);
    if (rateLabel) rateLabel.textContent = formatRate(rate);

    controls.querySelectorAll("[data-audio-rate]").forEach(function (button) {
      var selected = Number(button.getAttribute("data-audio-rate")) === rate;
      button.setAttribute("aria-checked", selected ? "true" : "false");
    });

    if (state === "playing") {
      runId += 1;
      synth.cancel();
      speakCurrentChunk(runId);
    } else if (state === "paused") {
      runId += 1;
      synth.cancel();
      restartOnResume = true;
    }

    announce("Tốc độ đọc " + formatRate(rate) + ".");
  }

  function closeMenu() {
    if (!menu || !optionsButton) return;
    menu.hidden = true;
    optionsButton.setAttribute("aria-expanded", "false");
  }

  function createButton(className, label, icon) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.innerHTML = icon;
    return button;
  }

  function createControls() {
    var wrapper = document.createElement("div");
    wrapper.className = "article-audio";
    wrapper.setAttribute("data-article-audio", "");

    var buttonGroup = document.createElement("div");
    buttonGroup.className = "article-audio__buttons";

    mainButton = createButton("article-audio__button article-audio__button--main", "Đọc bài viết", ICONS.speaker);
    mainButton.setAttribute("aria-pressed", "false");
    mainButton.addEventListener("click", function () {
      if (state === "idle") startReading();
      else if (state === "playing") pauseReading();
      else if (state === "paused") resumeReading();
    });

    optionsButton = createButton("article-audio__button article-audio__button--options", "Tùy chọn đọc", ICONS.more);
    optionsButton.setAttribute("aria-expanded", "false");
    optionsButton.setAttribute("aria-haspopup", "true");

    menu = document.createElement("div");
    menu.className = "article-audio__menu";
    menu.id = "article-audio-options";
    menu.hidden = true;
    optionsButton.setAttribute("aria-controls", menu.id);

    var menuTitle = document.createElement("span");
    menuTitle.className = "article-audio__menu-title";
    menuTitle.textContent = "Tốc độ đọc";
    menu.appendChild(menuTitle);

    var rateGroup = document.createElement("div");
    rateGroup.className = "article-audio__rates";
    rateGroup.setAttribute("role", "radiogroup");
    rateGroup.setAttribute("aria-label", "Tốc độ đọc");

    var savedRate = readSavedRate();
    rates.forEach(function (rate) {
      var rateButton = document.createElement("button");
      rateButton.type = "button";
      rateButton.className = "article-audio__rate";
      rateButton.textContent = formatRate(rate);
      rateButton.setAttribute("role", "radio");
      rateButton.setAttribute("data-audio-rate", String(rate));
      rateButton.setAttribute("aria-checked", rate === savedRate ? "true" : "false");
      rateButton.addEventListener("click", function () {
        changeRate(rate);
      });
      rateGroup.appendChild(rateButton);
    });

    var stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "article-audio__stop";
    stopButton.textContent = "Dừng đọc";
    stopButton.addEventListener("click", function () {
      stopReading(true);
      closeMenu();
      mainButton.focus();
    });

    menu.appendChild(rateGroup);
    menu.appendChild(stopButton);

    rateLabel = document.createElement("span");
    rateLabel.className = "article-audio__rate-label";
    rateLabel.textContent = formatRate(savedRate);
    rateLabel.setAttribute("aria-hidden", "true");
    optionsButton.appendChild(rateLabel);

    statusRegion = document.createElement("span");
    statusRegion.className = "article-audio__status";
    statusRegion.setAttribute("aria-live", "polite");
    statusRegion.setAttribute("aria-atomic", "true");

    optionsButton.addEventListener("click", function () {
      var willOpen = menu.hidden;
      menu.hidden = !willOpen;
      optionsButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen) menu.querySelector("button").focus();
    });

    buttonGroup.appendChild(mainButton);
    buttonGroup.appendChild(optionsButton);
    wrapper.appendChild(buttonGroup);
    wrapper.appendChild(menu);
    wrapper.appendChild(statusRegion);

    var onDocumentClick = function (event) {
      if (!wrapper.contains(event.target)) closeMenu();
    };
    var onDocumentKeydown = function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        optionsButton.focus();
      }
    };
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeydown);
    removePageListeners = function () {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onDocumentKeydown);
    };

    return wrapper;
  }

  function initArticleAudio() {
    stopReading(false);
    if (removePageListeners) removePageListeners();
    removePageListeners = null;

    if (controls && controls.isConnected) controls.remove();
    controls = null;
    mainButton = null;
    optionsButton = null;
    menu = null;
    rateLabel = null;
    statusRegion = null;

    var article = document.querySelector(".md-content__inner");
    if (!article) return;

    controls = createControls();
    article.prepend(controls);
    setState(supported ? "idle" : "unsupported");
  }

  if (supported && synth.addEventListener) {
    synth.addEventListener("voiceschanged", selectVoice);
  }

  window.addEventListener("pagehide", function () {
    stopReading(false);
  });

  if (typeof document$ !== "undefined") {
    document$.subscribe(initArticleAudio);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArticleAudio, { once: true });
  } else {
    initArticleAudio();
  }
})();
