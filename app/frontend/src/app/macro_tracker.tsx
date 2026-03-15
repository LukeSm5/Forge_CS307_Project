// Font: load in index.html or global CSS:
//   <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Barlow:wght@400;500&display=swap" rel="stylesheet" />

import React, { useState, useRef, useCallback, useEffect } from "react";

export type GoalDirection = "under" | "over";
export type OverlayMode = "log" | "remove" | "set-goal";

export interface TrackerState {
  id: string;
  name: string;
  unit: string;
  goal: number | null;   // null = no goal set
  direction: GoalDirection;
  value: number;
}
const FORGE = {
  orange:      "#E8820A",
  orangeGlow:  "#F5A030",
  red:         "#C94040",
  steel:       "#B0AFA8",
  charcoal:    "#1A1917",
  cardBg:      "#222120",
  cardBorder:  "#333230",
  trackEmpty:  "#3A3836",
  trackMet:    "#4A3010",
  textPrimary: "#F0EDE8",
  dim:         "#5A5855",
} as const;
export const ALL_TRACKERS: Omit<TrackerState, "value">[] = [
  { id: "calories", name: "Calories", unit: "kcal", goal: 2000, direction: "under" },
  { id: "protein",  name: "Protein",  unit: "g",    goal: 150,  direction: "over"  },
  { id: "carbs",    name: "Carbs",    unit: "g",    goal: 250,  direction: "under" },
  { id: "fat",      name: "Fat",      unit: "g",    goal: 65,   direction: "under" },
  { id: "sugar",    name: "Sugar",    unit: "g",    goal: 50,   direction: "under" },
  { id: "sodium",   name: "Sodium",   unit: "mg",   goal: 2300, direction: "under" },
  { id: "fiber",    name: "Fiber",    unit: "g",    goal: 28,   direction: "over"  },
  { id: "water",    name: "Water",    unit: "cups", goal: 8,    direction: "over"  },
];

const DEFAULT_SLOTS = ["calories", "protein", "carbs", "water"];
export function isGoalMet(t: TrackerState): boolean | null {
  if (t.goal === null || t.value === 0) return null;
  return t.direction === "under" ? t.value <= t.goal : t.value >= t.goal;
}

export function progressPct(t: TrackerState): number {
  if (t.goal === null || t.goal <= 0) return 0;
  return Math.min(t.value / t.goal, 1);
}

export function statusText(t: TrackerState): string {
  const met = isGoalMet(t);
  if (met === null || t.goal === null) return "";
  const diff = Math.abs(t.goal - t.value);
  if (met) return t.direction === "under" ? `${Math.round(diff)}${t.unit} left` : "goal met";
  return t.direction === "under"
    ? `${Math.round(diff)}${t.unit} over`
    : `${Math.round(diff)}${t.unit} to go`;
}

export function logAmount(trackers: TrackerState[], id: string, amount: number): TrackerState[] {
  return trackers.map((t) =>
    t.id === id ? { ...t, value: Math.max(0, t.value + amount) } : t
  );
}

export function setGoalValue(
  trackers: TrackerState[],
  id: string,
  goal: number | null,
  direction?: GoalDirection
): TrackerState[] {
  return trackers.map((t) =>
    t.id === id
      ? { ...t, goal, value: goal === null ? 0 : t.value, ...(direction ? { direction } : {}) }
      : t
  );
}

function arcPath(cx: number, cy: number, r: number, frac: number): string {
  if (frac <= 0) return "";
  const f = Math.min(frac, 0.9999);
  const angle = f * 2 * Math.PI - Math.PI / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  return `M${cx},${cy - r} A${r},${r} 0 ${f > 0.5 ? 1 : 0},1 ${x},${y}`;
}

interface OverlayProps {
  mode: OverlayMode;
  unit: string;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

function RingOverlay({ mode, unit, onConfirm, onCancel }: OverlayProps) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const confirm = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) onConfirm(n);
    else onCancel();
  };

  const label =
    mode === "set-goal" ? `Set goal (${unit})` :
    mode === "remove"   ? "Remove amount" :
                          "Add amount";

  const confirmLabel =
    mode === "set-goal" ? "Set" :
    mode === "remove"   ? "Remove" : "Add";

  return (
    <div style={S.overlay} onClick={(e) => e.stopPropagation()}>
      <div style={S.ovLabel}>{label}</div>
      <input
        ref={inputRef}
        style={S.ovInput}
        type="number"
        min="0"
        placeholder="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button style={S.ovBtn} onClick={onCancel}>Cancel</button>
        <button style={{ ...S.ovBtn, ...S.ovBtnConfirm }} onClick={confirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

interface RingProps {
  tracker: TrackerState;
  onLog: (id: string, amount: number) => void;
  onSetGoal: (id: string, goal: number | null) => void;
  onDirectionChange: (id: string, dir: GoalDirection) => void;
  onSwapClick: () => void;
}

function Ring({ tracker: t, onLog, onSetGoal, onDirectionChange, onSwapClick }: RingProps) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasGoal = t.goal !== null;
  const met = isGoalMet(t);
  const arc = arcPath(45, 45, 35, progressPct(t));
  const ringColor = met === null ? FORGE.trackEmpty : met ? FORGE.orange : FORGE.red;
  const trackColor = met === true ? FORGE.trackMet : FORGE.trackEmpty;
  const statusColor = met === null ? FORGE.steel : met ? FORGE.orangeGlow : FORGE.red;

  const handleRingClick = useCallback(() => {
    if (overlayMode) return;
    setOverlayMode(hasGoal ? "log" : "set-goal");
  }, [overlayMode, hasGoal]);

  const handleConfirm = (amount: number) => {
    if (overlayMode === "set-goal") {
      onSetGoal(t.id, amount);
    } else if (overlayMode === "remove") {
      onLog(t.id, -amount);
    } else {
      onLog(t.id, amount);
    }
    setOverlayMode(null);
  };

  return (
    <div style={{
      ...S.card,
      ...(met === true ? S.cardMet : {}),
      ...(!hasGoal ? S.cardNoGoal : {}),
    }}>
      <button style={S.swapBtn} onClick={onSwapClick}>⇄</button>

      {/* Ring */}
      <div
        style={S.ringWrap}
        onClick={handleRingClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (hasGoal && !overlayMode) setOverlayMode("remove");
        }}
        onTouchStart={() => {
          if (hasGoal) longPressTimer.current = setTimeout(() => setOverlayMode("remove"), 500);
        }}
        onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
        onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
      >
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="35" fill="none" stroke={trackColor} strokeWidth="8" strokeLinecap="round" />
          {arc && <path d={arc} fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round" />}
        </svg>

        <div style={S.ringCenter}>
          {hasGoal ? (
            <>
              <div style={S.ringNum}>{Math.round(t.value)}</div>
              <div style={S.ringUnit}>{t.unit}</div>
            </>
          ) : (
            <div style={S.ringPrompt}>Set a<br />goal</div>
          )}
        </div>

        {overlayMode && (
          <RingOverlay
            mode={overlayMode}
            unit={t.unit}
            onConfirm={handleConfirm}
            onCancel={() => setOverlayMode(null)}
          />
        )}
      </div>

      <div style={S.ringName}>{t.name}</div>
      <div style={{ ...S.ringStatus, color: statusColor }}>{statusText(t)}</div>

      {/* Goal control */}
      {hasGoal ? (
        <div style={S.cfgRow}>
          <span style={S.cfgLabel}>Goal</span>
          <input
            style={S.cfgInput}
            type="number"
            min="0"
            value={Math.round(t.goal!)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (!isNaN(n) && n >= 0) onSetGoal(t.id, n);
            }}
          />
          <span style={S.cfgLabel}>{t.unit}</span>
          <button
            style={S.clearGoalBtn}
            title="Remove goal"
            onClick={() => onSetGoal(t.id, null)}
          >×</button>
        </div>
      ) : (
        <div style={S.cfgRow}>
          <button style={S.setGoalBtn} onClick={() => setOverlayMode("set-goal")}>
            + Set goal
          </button>
        </div>
      )}

      {/* Direction toggle */}
      <div style={S.dirToggle}>
        {(["under", "over"] as GoalDirection[]).map((dir) => (
          <button
            key={dir}
            style={{ ...S.dirBtn, ...(t.direction === dir ? S.dirBtnActive : {}) }}
            onClick={() => onDirectionChange(t.id, dir)}
          >
            {dir.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PickerProps {
  slots: string[];
  swapIndex: number;
  onPick: (id: string) => void;
  onClose: () => void;
}

function Picker({ slots, swapIndex, onPick, onClose }: PickerProps) {
  const currentId = slots[swapIndex];
  const currentName = ALL_TRACKERS.find((t) => t.id === currentId)?.name ?? "";

  return (
    <div style={S.picker}>
      <div style={S.pickerTitle}>Swap "{currentName}" with</div>
      <div style={S.pickerGrid}>
        {ALL_TRACKERS.map((t) => {
          const inSlot = slots.includes(t.id) && t.id !== currentId;
          const isCurrent = t.id === currentId;
          return (
            <div
              key={t.id}
              style={{
                ...S.pickerItem,
                ...(isCurrent ? S.pickerItemCurrent : {}),
                ...(inSlot ? S.pickerItemDisabled : {}),
              }}
              onClick={() => !inSlot && onPick(t.id)}
            >
              <div style={S.pickerItemName}>{t.name}</div>
              <div style={S.pickerItemUnit}>{t.unit}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button style={S.doneBtn} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export default function DietTracker() {
  const [trackers, setTrackers] = useState<TrackerState[]>(
    ALL_TRACKERS.map((t) => ({ ...t, value: 0 }))
  );
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const getTracker = (id: string) => trackers.find((t) => t.id === id)!;

  const handleLog = (id: string, amount: number) =>
    setTrackers((prev) => logAmount(prev, id, amount));

  const handleSetGoal = (id: string, goal: number | null) =>
    setTrackers((prev) => setGoalValue(prev, id, goal));

  const handleDirection = (id: string, dir: GoalDirection) =>
    setTrackers((prev) => setGoalValue(prev, id, getTracker(id).goal, dir));

  const handlePick = (id: string) => {
    if (swapIndex === null) return;
    const currentId = slots[swapIndex];
    if (id === currentId) { setSwapIndex(null); return; }
    setSlots((prev) => {
      const next = [...prev];
      const otherIdx = next.indexOf(id);
      if (otherIdx !== -1) next[otherIdx] = currentId;
      next[swapIndex] = id;
      return next;
    });
    setSwapIndex(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwapIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.grid}>
        {slots.map((id, i) => (
          <Ring
            key={id}
            tracker={getTracker(id)}
            onLog={handleLog}
            onSetGoal={handleSetGoal}
            onDirectionChange={handleDirection}
            onSwapClick={() => setSwapIndex(swapIndex === i ? null : i)}
          />
        ))}
      </div>

      {swapIndex !== null && (
        <Picker
          slots={slots}
          swapIndex={swapIndex}
          onPick={handlePick}
          onClose={() => setSwapIndex(null)}
        />
      )}

      <div style={S.hint}>
        Tap ring to log · right-click or long-press to remove · ⇄ to swap
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { padding: "1.25rem 0", fontFamily: "'Barlow', sans-serif", background: "transparent" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginBottom: 12 },
  card: {
    background: FORGE.cardBg, border: `1px solid ${FORGE.cardBorder}`, borderRadius: 10,
    padding: "1rem 0.6rem 0.85rem", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6, position: "relative", transition: "border-color 0.2s",
  },
  cardMet:    { borderColor: FORGE.orange },
  cardNoGoal: { borderStyle: "dashed" },
  swapBtn: {
    position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 4,
    border: `1px solid ${FORGE.cardBorder}`, background: FORGE.charcoal, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: FORGE.steel, fontFamily: "'Barlow', sans-serif", lineHeight: "1",
  },
  ringWrap:   { position: "relative", width: 90, height: 90, cursor: "pointer", flexShrink: 0 },
  ringCenter: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" },
  ringNum:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: FORGE.textPrimary, lineHeight: "1" },
  ringUnit:   { fontFamily: "'Barlow', sans-serif", fontSize: 10, color: FORGE.steel, letterSpacing: "0.04em" },
  ringPrompt: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 500, color: FORGE.dim, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: "1.3", textAlign: "center" },
  ringName:   { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: FORGE.textPrimary, textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase" },
  ringStatus: { fontFamily: "'Barlow', sans-serif", fontSize: 11, textAlign: "center", minHeight: 13 },
  cfgRow:     { display: "flex", alignItems: "center", gap: 4 },
  cfgLabel:   { fontFamily: "'Barlow', sans-serif", fontSize: 10, color: FORGE.steel },
  cfgInput:   { width: 50, padding: "3px 4px", borderRadius: 4, border: `1px solid ${FORGE.cardBorder}`, background: FORGE.charcoal, color: FORGE.textPrimary, fontSize: 11, fontFamily: "'Barlow', sans-serif", textAlign: "center" },
  clearGoalBtn: { width: 16, height: 16, borderRadius: 3, border: "none", background: "transparent", cursor: "pointer", color: FORGE.dim, fontSize: 14, lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
  setGoalBtn: { padding: "3px 8px", borderRadius: 4, border: `1px dashed ${FORGE.orange}`, background: "transparent", color: FORGE.orange, fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" },
  dirToggle:  { display: "flex", borderRadius: 4, overflow: "hidden", border: `1px solid ${FORGE.cardBorder}` },
  dirBtn:     { flex: 1, padding: "2px 5px", fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 500, letterSpacing: "0.05em", background: "transparent", border: "none", cursor: "pointer", color: FORGE.steel, textTransform: "uppercase" },
  dirBtnActive: { background: FORGE.orange, color: FORGE.charcoal },
  overlay:    { position: "absolute", inset: 0, background: "rgba(18,17,16,0.9)", borderRadius: 10, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 },
  ovLabel:    { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: FORGE.steel },
  ovInput:    { width: 86, padding: "7px 8px", borderRadius: 6, border: `1px solid ${FORGE.orange}`, background: FORGE.charcoal, color: FORGE.textPrimary, fontSize: 20, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", textAlign: "center" },
  ovBtn:      { padding: "5px 12px", borderRadius: 5, border: `1px solid ${FORGE.cardBorder}`, background: FORGE.charcoal, color: FORGE.steel, fontSize: 11, fontFamily: "'Barlow', sans-serif", cursor: "pointer" },
  ovBtnConfirm: { background: FORGE.orange, color: FORGE.charcoal, borderColor: FORGE.orange, fontWeight: 500 },
  picker:     { background: FORGE.cardBg, border: `1px solid ${FORGE.cardBorder}`, borderRadius: 10, padding: "1rem 1.1rem", marginBottom: 12 },
  pickerTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: FORGE.orange, marginBottom: 10 },
  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 7 },
  pickerItem: { padding: "9px 6px", borderRadius: 7, border: `1px solid ${FORGE.cardBorder}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: FORGE.charcoal },
  pickerItemCurrent:  { borderColor: FORGE.orange, background: "#2A2826" },
  pickerItemDisabled: { opacity: 0.35, cursor: "default", pointerEvents: "none" },
  pickerItemName: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: FORGE.textPrimary },
  pickerItemUnit: { fontFamily: "'Barlow', sans-serif", fontSize: 10, color: FORGE.steel },
  doneBtn:    { padding: "5px 16px", borderRadius: 5, border: `1px solid ${FORGE.cardBorder}`, background: "transparent", color: FORGE.steel, fontSize: 11, fontFamily: "'Barlow', sans-serif", cursor: "pointer" },
  hint:       { fontFamily: "'Barlow', sans-serif", fontSize: 11, color: FORGE.dim, textAlign: "center" },
};
