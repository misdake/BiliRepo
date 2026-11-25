export type DanmakuFontEffect = "outline" | "stroke" | "shadow";

export interface DanmakuPrefs {
    fontScale: number;
    speedScale: number;
    scaleWithPlayer: boolean;
    fontEffect: DanmakuFontEffect;
}

export const DANMAKU_SCALE_STOPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4] as const;

export const DEFAULT_DANMAKU_PREFS: DanmakuPrefs = {
    fontScale: 1,
    speedScale: 1,
    scaleWithPlayer: true,
    fontEffect: "outline",
};

export const DANMAKU_FONT_EFFECTS: { id: DanmakuFontEffect; label: string }[] = [
    { id: "outline", label: "默认描边" },
    { id: "stroke", label: "重墨描边" },
    { id: "shadow", label: "投影" },
];

const STORAGE_KEY = "bilirepo-danmaku-prefs";

export function scaleToStopIndex(value: number): number {
    if (!Number.isFinite(value)) return DANMAKU_SCALE_STOPS.indexOf(1);
    let bestIndex = 0;
    let bestDiff = Math.abs(DANMAKU_SCALE_STOPS[0] - value);
    for (let i = 1; i < DANMAKU_SCALE_STOPS.length; i++) {
        const diff = Math.abs(DANMAKU_SCALE_STOPS[i] - value);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestIndex = i;
        }
    }
    return bestIndex;
}

export function snapScale(value: number): number {
    return DANMAKU_SCALE_STOPS[scaleToStopIndex(value)];
}

export function isDefaultDanmakuPrefs(prefs: DanmakuPrefs): boolean {
    return prefs.fontScale === DEFAULT_DANMAKU_PREFS.fontScale
        && prefs.speedScale === DEFAULT_DANMAKU_PREFS.speedScale
        && prefs.scaleWithPlayer === DEFAULT_DANMAKU_PREFS.scaleWithPlayer
        && prefs.fontEffect === DEFAULT_DANMAKU_PREFS.fontEffect;
}

export function loadDanmakuPrefs(): DanmakuPrefs {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_DANMAKU_PREFS };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { ...DEFAULT_DANMAKU_PREFS };

        const fontEffect: DanmakuFontEffect =
            parsed.fontEffect === "outline" || parsed.fontEffect === "stroke" || parsed.fontEffect === "shadow"
                ? parsed.fontEffect
                : DEFAULT_DANMAKU_PREFS.fontEffect;

        return {
            fontScale: typeof parsed.fontScale === "number" ? snapScale(parsed.fontScale) : DEFAULT_DANMAKU_PREFS.fontScale,
            speedScale: typeof parsed.speedScale === "number" ? snapScale(parsed.speedScale) : DEFAULT_DANMAKU_PREFS.speedScale,
            scaleWithPlayer: typeof parsed.scaleWithPlayer === "boolean" ? parsed.scaleWithPlayer : DEFAULT_DANMAKU_PREFS.scaleWithPlayer,
            fontEffect,
        };
    } catch {
        return { ...DEFAULT_DANMAKU_PREFS };
    }
}

export function saveDanmakuPrefs(prefs: DanmakuPrefs): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // ignore storage quota/privacy mode failures
    }
}
