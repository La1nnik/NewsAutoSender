const dropZone = document.getElementById("dropZone");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const pickBtn = document.getElementById("pickBtn");
const countEl = document.getElementById("count");
const warnEl = document.getElementById("warn");

// items: { id, key, kind: "image"|"video", name, size, type, url }
const items = [];
const seen = new Set(); // дедуп по name+size+lastModified

function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function setWarn(msg) {
    warnEl.textContent = msg || "";
}

function updateCount() {
    // в UI у тебя написано "Добавлено:" — оставим, но считаем файлы
    countEl.textContent = String(items.length);
}

function kindOf(file) {
    const t = file?.type || "";
    if (t.startsWith("image/")) return "image";
    if (t.startsWith("video/")) return "video";
    return null;
}

function addFiles(fileList) {
    setWarn("");

    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    let added = 0;
    let skipped = 0;
    let skippedNotSupported = 0;

    for (const f of files) {
        const kind = kindOf(f);
        if (!kind) {
            skipped++;
            skippedNotSupported++;
            continue;
        }

        const key = `${f.name}|${f.size}|${f.lastModified ?? 0}`;
        if (seen.has(key)) {
            skipped++;
            continue;
        }
        seen.add(key);

        const url = URL.createObjectURL(f);
        const id = crypto.randomUUID();

        items.push({
            id,
            key,
            kind,
            name: f.name,
            size: f.size,
            type: f.type,
            url,
            path: f.path || null
        });

        added++;
    }

    render();
    updateCount();

    if (skipped > 0) {
        const reason = skippedNotSupported > 0 ? "неподдерживаемый тип или уже добавлено" : "уже добавлено";
        setWarn(`Пропущено: ${skipped} (${reason})`);
    }
}

function removeItem(id) {
    const idx = items.findIndex(x => x.id === id);
    if (idx === -1) return;

    URL.revokeObjectURL(items[idx].url);

    if (items[idx].key) {
        seen.delete(items[idx].key);
    }

    items.splice(idx, 1);

    render();
    updateCount();
}

function render() {
    gallery.innerHTML = "";

    for (const it of items) {
        const el = document.createElement("div");
        el.className = "thumb";
        el.dataset.id = it.id;

        let mediaEl;

        if (it.kind === "image") {
            const img = document.createElement("img");
            img.src = it.url;
            img.alt = it.name;
            mediaEl = img;
        } else {
            const video = document.createElement("video");
            video.src = it.url;
            video.muted = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.controls = true; // можно убрать если не нужно
            mediaEl = video;
        }

        const meta = document.createElement("div");
        meta.className = "meta";

        const name = document.createElement("div");
        name.className = "name";
        name.title = it.name;
        name.textContent = it.name;

        const size = document.createElement("div");
        size.className = "size";
        size.textContent = `${formatBytes(it.size)} • ${it.kind.toUpperCase()} • ${it.type || "file"}`;

        meta.appendChild(name);
        meta.appendChild(size);

        const rm = document.createElement("button");
        rm.className = "remove";
        rm.title = "Удалить";
        rm.innerHTML = "✕";
        rm.addEventListener("click", () => removeItem(it.id));

        el.appendChild(mediaEl);
        el.appendChild(meta);
        el.appendChild(rm);

        gallery.appendChild(el);
    }
}
// --- Кнопка перевода --- 
var translateBtn = document.getElementById("translateBtn");
var rusText = document.getElementById("rusText");

rusText.addEventListener("input", () => {
    if (rusText.classList.contains("custom-placeholder")) {
        rusText.classList.remove("custom-placeholder");
        rusText.setAttribute("placeholder", "Напиши тут текст...");
    }
});

translateBtn.addEventListener("click", async (e) => {
    if (rusText.value.length === 0) {
        rusText.setAttribute("placeholder", "Поле текста пустое, для перевода напиши что-нибудь");
        rusText.classList.add("custom-placeholder");
        return;
    }
    translateBtn.setAttribute("disabled", "disabled");

    // const translatedText = await window.api.translateText(rusText.value);
    let engTextArea;

    if (!document.getElementById("en")) {
        engTextArea = document.createElement("textarea");
        engTextArea.setAttribute("id", "engTextArea");

        let engRow = document.createElement("div");
        engRow.setAttribute("id", "engRow");
        engRow.style.display = "flex";
        engRow.style.alignItems = "center";
        engRow.style.gap = "10px";
        engRow.style.marginTop = "10px";
        engRow.style.marginBottom = "20px";

        let engLable = document.createElement("label");
        engLable.setAttribute("for", "en");
        engLable.className = "lang-label";
        const textNode = document.createTextNode("EN");
        engLable.appendChild(textNode);

        let engRadio = document.createElement("input");
        engRadio.setAttribute("type", "radio");
        engRadio.setAttribute("id", "en");
        engRadio.setAttribute("name", "lang");
        engRadio.setAttribute("value", "en");
        engRadio.className = "lang-radio";

        engRow.appendChild(engLable);
        engRow.appendChild(engRadio);

        document.getElementById("textSection").appendChild(engRow);
        document.getElementById("textSection").appendChild(engTextArea);
    } else {
        engTextArea = document.getElementById("engTextArea");
    }

    engTextArea.value = "test test !!!!!!!!"//translatedText;




    translateBtn.removeAttribute("disabled");
});

// --- Глобально гасим дефолтное поведение drag&drop (чтобы Electron не открывал файл) ---
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

// ---------- Drag & Drop (локально подсветка) ----------
dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("isOver");
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("isOver");
});

dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && dropZone.contains(e.relatedTarget)) return;
    dropZone.classList.remove("isOver");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("isOver");

    const dt = e.dataTransfer;
    if (!dt) return;

    addFiles(dt.files);
});

// ---------- File picker ----------
pickBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
});

// старт
render();
updateCount();

// -------- Publish toggles --------
const toggleX = document.getElementById("toggleX");
const toggleReddit = document.getElementById("toggleReddit");
const toggleTelegram = document.getElementById("toggleTelegram");
const toggleTikTok = document.getElementById("toggleTikTok");
const toggleDiscord = document.getElementById("toggleDiscord");
const toggleInstagram = document.getElementById("toggleInstagram");

const publishBtn = document.getElementById("publishBtn");
const selectionInfo = document.getElementById("selectionInfo");
const textEl = document.getElementById("rusText");

const selected = {
    x: false,
    reddit: false,
    telegram: false,
    tiktok: false,
    discord: false,
    instagram: false
};

function updatePublishUI() {
    toggleX.classList.toggle("active", selected.x);
    toggleReddit.classList.toggle("active", selected.reddit);
    toggleTelegram.classList.toggle("active", selected.telegram);
    toggleTikTok.classList.toggle("active", selected.tiktok);
    toggleDiscord.classList.toggle("active", selected.discord);
    toggleInstagram.classList.toggle("active", selected.instagram);

    const list = [];
    if (selected.x) list.push("X");
    if (selected.reddit) list.push("Reddit");
    if (selected.telegram) list.push("Telegram");
    if (selected.tiktok) list.push("TikTok");
    if (selected.discord) list.push("Discord");
    if (selected.instagram) list.push("Instagram");

    selectionInfo.textContent = `Выбрано: ${list.length ? list.join(", ") : "—"}`;

    publishBtn.disabled = list.length === 0;
}

toggleX.addEventListener("click", () => { selected.x = !selected.x; updatePublishUI(); });
toggleReddit.addEventListener("click", () => { selected.reddit = !selected.reddit; updatePublishUI(); });
toggleTelegram.addEventListener("click", () => { selected.telegram = !selected.telegram; updatePublishUI(); });
toggleTikTok.addEventListener("click", () => { selected.tiktok = !selected.tiktok; updatePublishUI(); });
toggleDiscord.addEventListener("click", () => { selected.discord = !selected.discord; updatePublishUI(); });
toggleInstagram.addEventListener("click", () => { selected.instagram = !selected.instagram; updatePublishUI(); });

publishBtn.addEventListener("click", async () => {
    const payload = {
        text: (textEl?.value || "").trim(),
        media: items.map(x => ({
            name: x.name,
            size: x.size,
            type: x.type,
            kind: x.kind,
            path: x.path // <-- путь файла для будущей отправки в API
        })),
        platforms: {
            x: selected.x,
            reddit: selected.reddit,
            telegram: selected.telegram,
            tiktok: selected.tiktok,
            discord: selected.discord,
            instagram: selected.instagram
        }
    };

    // Мини-проверка: пути реально есть
    const missingPaths = payload.media.filter(m => !m.path).length;
    if (missingPaths > 0) {
        setWarn(`⚠️ Внимание: у ${missingPaths} файлов нет path. (Такое бывает, если файл не из проводника).`);
    }

    try {
        setWarn("Отправляю в main.js (SendPost)...");
        publishBtn.disabled = true;

        const res = await window.api.sendPost(payload);

        if (res?.ok) {
            setWarn("✅ SendPost: успешно принято в main.js (демо).");
            console.log("SendPost response:", res);
        } else {
            setWarn(`❌ SendPost: ошибка: ${res?.error || "unknown"}`);
            console.error("SendPost error:", res);
        }
    } catch (e) {
        setWarn(`❌ SendPost: исключение: ${e?.message || e}`);
        console.error(e);
    } finally {
        publishBtn.disabled = false;
        updatePublishUI(); // вернём правильное состояние disabled по выбранным платформам
    }
});

// init
updatePublishUI();