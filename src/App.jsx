import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "gym_tracker_simple_v3";

// --- Quick warm-up / cool-down (5 min each) ---
const EXERCISE_INFO = {
  "Incline DB Press": {
    sets: "4 × 6–10",
    target: "Hit 10 reps on all sets → increase 2–2.5kg",
    notes: ["30° incline", "Shoulders back", "Slow eccentric"],
  },
  "Flat Machine / Barbell Press": {
    sets: "4 × 6–10",
    target: "Progress weight once 10 reps achieved",
    notes: ["Full ROM", "Control descent"],
  },
  "Cable Chest Fly (Mid)": {
    sets: "3 × 12–15",
    target: "Focus contraction → increase after 15 clean reps",
    notes: ["Slight elbow bend", "Squeeze chest"],
  },
  "Seated DB Shoulder Press": {
    sets: "3 × 8–10",
    target: "Add weight after 10 reps achieved",
    notes: ["No lower back arch", "Control movement"],
  },
  "Lateral Raises": {
    sets: "4 × 12–15",
    target: "Add reps → then small weight increase",
    notes: ["Raise to shoulder height", "No swinging"],
  },
  "Face Pull": {
    sets: "3 × 12–15",
    target: "Increase slowly once form is perfect",
    notes: ["Elbows high", "Pull to face"],
  },

  "Bulgarian Split Squat": {
    sets: "3 × 8/leg",
    target: "Increase load once stable",
    notes: ["Long stance", "Control descent"],
  },
  "Romanian Deadlift": {
    sets: "3 × 6–8",
    target: "Increase 2.5–5kg when 8 reps solid",
    notes: ["Hinge hips", "Stretch hamstrings"],
  },
  "Step-Up to Knee Drive": {
    sets: "3 × 8/leg",
    target: "Add load after full control",
    notes: ["Drive knee up", "Balance"],
  },
  "Hamstring Curl": {
    sets: "3 × 10–12",
    target: "Increase machine weight after 12 reps",
    notes: ["Slow eccentric", "Full squeeze"],
  },
  "Single-Leg Calf Raise": {
    sets: "4 × 12–15",
    target: "Increase reps first → then weight",
    notes: ["Pause at top", "Full stretch"],
  },
  "Glute Bridge Hold": {
    sets: "3 × 30–45 sec",
    target: "Increase hold time",
    notes: ["Squeeze glutes", "Neutral spine"],
  },

  "Hanging Leg Raises": {
    sets: "4 × 8–12",
    target: "Progress to toes-to-bar",
    notes: ["No swing", "Controlled reps"],
  },
  "Cable Woodchopper": {
    sets: "3 × 12/side",
    target: "Increase cable load gradually",
    notes: ["Rotate core", "Control motion"],
  },
  "Side Plank Hip Dips": {
    sets: "3 × 10/side",
    target: "Increase reps/control",
    notes: ["Keep body straight"],
  },
  "Ab Wheel Rollout": {
    sets: "3 × 8–12",
    target: "Increase range before reps",
    notes: ["Tight core", "No sagging"],
  },
  "Weighted Russian Twists": {
    sets: "3 × 16–20",
    target: "Increase weight gradually",
    notes: ["Rotate fully", "Controlled pace"],
  },
  "Hollow Body Hold": {
    sets: "3 × 30–45 sec",
    target: "Increase hold duration",
    notes: ["Lower back flat"],
  },
};

const WARMUP = {
  A: [
    "Row / SkiErg – 2:00 easy",
    "Band pull-aparts – 2×15",
    "Band external rotations – 2×12/side",
  ],
  B: [
    "Bike / incline walk – 2:00 easy",
    "World’s greatest stretch – 5/side",
    "Glute bridges – 2×12",
  ],
  C: [
    "Cat–cow – 8 reps",
    "Dead bug – 2×8/side",
    "Bird dog – 2×6/side",
  ],
};

const COOLDOWN = {
  A: [
    "Chest stretch – 0:30–0:40",
    "Lat stretch – 0:30/side",
    "Triceps stretch – 0:30/side",
  ],
  B: [
    "Hip flexor stretch – 0:45/side",
    "Hamstring stretch – 0:45/side",
    "Calf stretch – 0:30/side",
  ],
  C: [
    "Child’s pose – 1:00",
    "Cobra / sphinx – 0:30",
    "Supine rotation – 0:30/side",
  ],
};

const DEFAULT = {
  sessions: {
    A: {
      name: "A – Upper Body",
      exercises: [
        "Incline DB Press",
        "Flat Machine / Barbell Press",
        "Cable Chest Fly (Mid)",
        "Seated DB Shoulder Press",
        "Lateral Raises",
        "Face Pull",
      ],
    },
    B: {
      name: "B – Lower Body (Running)",
      exercises: [
        "Bulgarian Split Squat",
        "Romanian Deadlift",
        "Step-Up to Knee Drive",
        "Hamstring Curl",
        "Single-Leg Calf Raise",
        "Glute Bridge Hold",
      ],
    },
    C: {
      name: "C – Core & Lower Back",
      exercises: [
        "Hanging Leg Raises",
        "Cable Woodchopper",
        "Side Plank Hip Dips",
        "Ab Wheel Rollout",
        "Weighted Russian Twists",
        "Hollow Body Hold",
      ],
    },
  },
  logs: [],
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      sessions: { ...DEFAULT.sessions, ...(parsed.sessions || {}) },
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return DEFAULT;
  }
}

function save(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function fmt(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfWeekTs(ts) {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function toCSV(logs) {
  const headers = [
    "timestamp",
    "session",
    "exercise",
    "set1_kg",
    "set1_reps",
    "set2_kg",
    "set2_reps",
    "set3_kg",
    "set3_reps",
    "set4_kg",
    "set4_reps",
    "notes",
    "volume",
  ];

  const rows = logs.map((l) => {
    const s = l.sets || [];
    const g = (i, k) => (s[i] ? s[i][k] ?? "" : "");
    const vol = (l.sets || []).reduce((acc, set) => {
      const w = Number(set.w);
      const r = Number(set.r);
      if (!Number.isFinite(w) || !Number.isFinite(r)) return acc;
      return acc + w * r;
    }, 0);

    const row = [
      new Date(l.ts).toISOString(),
      l.sessionName,
      l.exerciseName,
      g(0, "w"),
      g(0, "r"),
      g(1, "w"),
      g(1, "r"),
      g(2, "w"),
      g(2, "r"),
      g(3, "w"),
      g(3, "r"),
      (l.notes || "").split("\n").join(" "),
      Math.round(vol),
    ];

    return row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function pill(text) {
  return (
    <span
      style={{
        fontSize: 12,
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "4px 10px",
        background: "var(--card)",
        color: "var(--muted)",
      }}
    >
      {text}
    </span>
  );
}

export default function App() {
  const [data, setData] = useState(DEFAULT);
  const [sessionKey, setSessionKey] = useState("A");
  const [tab, setTab] = useState("log"); // log | stats
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState([
    { w: "", r: "" },
    { w: "", r: "" },
    { w: "", r: "" },
    { w: "", r: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [showWU, setShowWU] = useState(true);
  const [showCD, setShowCD] = useState(false);

  useEffect(() => setData(load()), []);
  useEffect(() => save(data), [data]);

  const session = data.sessions[sessionKey];
  const selectedInfo = selected ? EXERCISE_INFO[selected] : null;
  const selectedLastLog = selected ? logsSorted.find((l) => l.exerciseName === selected) : null;

  const exercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = session.exercises;
    if (!q) return list;
    return list.filter((x) => x.toLowerCase().includes(q));
  }, [session.exercises, search]);

  const logsSorted = useMemo(() => [...data.logs].sort((a, b) => b.ts - a.ts), [data.logs]);
  const recent = useMemo(() => logsSorted.slice(0, 12), [logsSorted]);

  const volumeOfLog = (l) =>
    (l.sets || []).reduce((acc, s) => {
      const w = Number(s.w);
      const r = Number(s.r);
      if (!Number.isFinite(w) || !Number.isFinite(r)) return acc;
      return acc + w * r;
    }, 0);

  const lastFor = (exerciseName) => logsSorted.find((l) => l.exerciseName === exerciseName);

  // --- Performance tracking ---
  const stats = useMemo(() => {
    const byExercise = new Map();

    for (const l of data.logs) {
      const vol = volumeOfLog(l);
      const maxW = (l.sets || []).reduce((m, s) => {
        const w = Number(s.w);
        return Number.isFinite(w) ? Math.max(m, w) : m;
      }, 0);

      const key = l.exerciseName;
      const prev = byExercise.get(key) || {
        exercise: key,
        bestWeight: 0,
        bestWeightTs: null,
        bestVolume: 0,
        bestVolumeTs: null,
        lastTs: null,
        lastWeight: 0,
        lastVolume: 0,
      };

      // last
      if (!prev.lastTs || l.ts > prev.lastTs) {
        prev.lastTs = l.ts;
        prev.lastWeight = maxW;
        prev.lastVolume = vol;
      }

      // PRs
      if (maxW > prev.bestWeight) {
        prev.bestWeight = maxW;
        prev.bestWeightTs = l.ts;
      }
      if (vol > prev.bestVolume) {
        prev.bestVolume = vol;
        prev.bestVolumeTs = l.ts;
      }

      byExercise.set(key, prev);
    }

    // Weekly volume (all exercises)
    const weekly = new Map();
    for (const l of data.logs) {
      const w = startOfWeekTs(l.ts);
      weekly.set(w, (weekly.get(w) || 0) + volumeOfLog(l));
    }

    const weeklySeries = [...weekly.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-8)
      .map(([weekTs, vol]) => ({
        weekTs,
        label: new Date(weekTs).toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
        vol: Math.round(vol),
      }));

    const maxWeekly = weeklySeries.reduce((m, x) => Math.max(m, x.vol), 0) || 1;

    const sessionTotals = ["A", "B", "C"].map((k) => ({
      key: k,
      label: data.sessions[k]?.name || k,
      volume: Math.round(
        data.logs
          .filter((l) => l.sessionKey === k)
          .reduce((acc, l) => acc + volumeOfLog(l), 0)
      ),
      logs: data.logs.filter((l) => l.sessionKey === k).length,
    }));

    const maxSessionVolume = sessionTotals.reduce((m, x) => Math.max(m, x.volume), 0) || 1;

    return {
      byExercise: [...byExercise.values()].sort((a, b) => a.exercise.localeCompare(b.exercise)),
      weeklySeries,
      maxWeekly,
      sessionTotals,
      maxSessionVolume,
    };
  }, [data.logs]);

  const openExercise = (exerciseName) => {
    setSelected(exerciseName);
    setNotes("");
    const last = lastFor(exerciseName);
    if (last?.sets?.length) {
      setSets([
        { w: String(last.sets[0]?.w ?? ""), r: String(last.sets[0]?.r ?? "") },
        { w: String(last.sets[1]?.w ?? ""), r: String(last.sets[1]?.r ?? "") },
        { w: String(last.sets[2]?.w ?? ""), r: String(last.sets[2]?.r ?? "") },
        { w: String(last.sets[3]?.w ?? ""), r: String(last.sets[3]?.r ?? "") },
      ]);
    } else {
      setSets([
        { w: "", r: "" },
        { w: "", r: "" },
        { w: "", r: "" },
      ]);
    }
  };

  const saveLog = () => {
    if (!selected) return;
    const cleaned = sets
      .map((s) => ({ w: String(s.w).trim(), r: String(s.r).trim() }))
      .filter((s) => s.w !== "" || s.r !== "");
    if (!cleaned.length) return;

    const log = {
      id: uid(),
      ts: Date.now(),
      sessionKey,
      sessionName: session.name,
      exerciseName: selected,
      sets: cleaned,
      notes: notes.trim(),
    };

    setData((d) => ({ ...d, logs: [log, ...d.logs] }));
    setSelected(null);
  };

  const delLog = (id) => setData((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }));

  const exportCSV = () => {
    const csv = toCSV([...data.logs].sort((a, b) => a.ts - b.ts));
    download(`gym_logs_${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
  };

  const exportJSON = () =>
    download(`gym_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");

  const importJSON = async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    setData({
      ...DEFAULT,
      ...parsed,
      sessions: { ...DEFAULT.sessions, ...(parsed.sessions || {}) },
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    });
  };

  const styles = `
    :root{
      --bg:#0b0f19;
      --panel:#0f1626;
      --card:#111b2e;
      --border:rgba(255,255,255,.08);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.7);
      --muted2:rgba(255,255,255,.55);
      --accent:#6ee7ff;
      --accent2:#a78bfa;
    }
    body{margin:0;background:radial-gradient(1200px 900px at 20% 0%, rgba(110,231,255,.12), transparent 50%),
                         radial-gradient(900px 700px at 80% 20%, rgba(167,139,250,.12), transparent 50%),
                         var(--bg);
         color:var(--text);
         font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;}
    a{color:inherit}
    .wrap{max-width:520px;margin:0 auto;padding:14px 14px 96px;}
    .top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
    .title{font-size:20px;font-weight:900;letter-spacing:.2px;margin:6px 0 2px;}
    .sub{font-size:12px;color:var(--muted2);}
    .tabs{display:flex;gap:8px;margin-top:12px;}
    .tabbtn{flex:1;padding:10px 0;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.04);
            color:var(--text);font-weight:800;cursor:pointer;}
    .tabbtn.active{background:linear-gradient(135deg, rgba(110,231,255,.18), rgba(167,139,250,.16));border-color:rgba(255,255,255,.14)}
    .seg{display:flex;gap:8px;margin-top:10px;}
    .seg button{flex:1;padding:10px 0;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);
                font-weight:800;cursor:pointer;}
    .seg button.active{background:rgba(255,255,255,.08)}
    .panel{margin-top:12px;padding:12px;border:1px solid var(--border);border-radius:18px;background:rgba(255,255,255,.03);}
    .panelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;}
    .h{font-weight:900}
    .muted{color:var(--muted2);font-size:12px;}
    .input{width:100%;margin-top:8px;padding:12px 12px;border-radius:14px;border:1px solid var(--border);
           background:rgba(0,0,0,.18);color:var(--text);outline:none;}
    .input:focus{border-color:rgba(110,231,255,.35)}
    .grid{display:grid;gap:8px;margin-top:10px;}
    .cardBtn{width:100%;text-align:left;padding:12px;border-radius:18px;border:1px solid var(--border);
             background:rgba(255,255,255,.04);color:var(--text);cursor:pointer;}
    .cardBtn:active{transform:scale(.99)}
    .cardTitle{font-weight:900}
    .cardSub{font-size:12px;color:var(--muted2);margin-top:2px}
    .bar{position:fixed;left:0;right:0;bottom:0;border-top:1px solid var(--border);
         background:rgba(11,15,25,.7);backdrop-filter: blur(8px);}
    .barInner{max-width:520px;margin:0 auto;padding:10px 14px;display:flex;gap:8px;}
    .btn{flex:1;padding:12px 0;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.04);
         color:var(--text);font-weight:900;cursor:pointer;}
    .btnPrimary{border-color:rgba(110,231,255,.35);background:rgba(110,231,255,.12)}
    .btnDanger{border-color:rgba(255,255,255,.14)}
    .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .log{border:1px solid var(--border);border-radius:18px;padding:12px;background:rgba(255,255,255,.03)}
    .pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    .mini{font-size:12px;color:var(--muted2)}
    .toggle{font-size:12px;color:var(--muted);border:1px solid var(--border);background:rgba(255,255,255,.03);border-radius:999px;padding:6px 10px;cursor:pointer;}
    .modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:14px;}
    .modal{width:100%;max-width:520px;background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
           border:1px solid var(--border);border-radius:20px;padding:14px;}
    .setGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .kpi{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
    .kpiCard{border:1px solid var(--border);border-radius:18px;padding:12px;background:rgba(255,255,255,.03)}
    .kpiLabel{font-size:12px;color:var(--muted2)}
    .kpiValue{font-weight:950;font-size:18px;margin-top:4px}
    .spark{display:flex;align-items:flex-end;gap:6px;margin-top:10px;height:52px}
    .spark > div{flex:1;border-radius:8px;background:rgba(110,231,255,.18);border:1px solid rgba(110,231,255,.12)}
    .table{display:grid;gap:8px;margin-top:10px}
    .tableRow{border:1px solid var(--border);border-radius:18px;padding:12px;background:rgba(255,255,255,.03)}
    .badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);}
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="wrap">
        <div className="top">
          <div>
            <div className="title">Gym Tracker</div>
            <div className="sub">Fast kg × reps logging • offline • export CSV</div>
          </div>
          <div className="badge">{pill("v3")}</div>
        </div>

        <div className="tabs">
          {[
            { k: "A", t: "A" },
            { k: "B", t: "B" },
            { k: "C", t: "C" },
          ].map((x) => (
            <button
              key={x.k}
              className={"tabbtn" + (sessionKey === x.k ? " active" : "")}
              onClick={() => setSessionKey(x.k)}
            >
              {x.t}
            </button>
          ))}
        </div>

        <div className="seg">
          <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
            Log
          </button>
          <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
            Stats
          </button>
        </div>

        {tab === "log" ? (
          <>
            <div className="panel">
              <div className="panelHead">
                <div>
                  <div className="h">{session.name}</div>
                  <div className="muted">Tap an exercise to log sets</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="toggle" onClick={() => setShowWU((v) => !v)}>
                    {showWU ? "Hide" : "Show"} warm-up
                  </button>
                  <button className="toggle" onClick={() => setShowCD((v) => !v)}>
                    {showCD ? "Hide" : "Show"} cool-down
                  </button>
                </div>
              </div>

              {showWU ? (
                <div style={{ marginTop: 10 }}>
                  <div className="mini" style={{ fontWeight: 800, color: "var(--muted)" }}>
                    5-min warm-up
                  </div>
                  <div className="pills">
                    {WARMUP[sessionKey].map((x, i) => (
                      <span key={i}>{pill(x)}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {showCD ? (
                <div style={{ marginTop: 10 }}>
                  <div className="mini" style={{ fontWeight: 800, color: "var(--muted)" }}>
                    5-min cool-down
                  </div>
                  <div className="pills">
                    {COOLDOWN[sessionKey].map((x, i) => (
                      <span key={i}>{pill(x)}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exercise…"
              />

              <div className="grid">
                {exercises.map((ex) => {
                  const last = lastFor(ex);
                  const info = EXERCISE_INFO[ex];
                  const sub = last
                    ? `Last: ${last.sets?.[0]?.w || "—"}kg × ${last.sets?.[0]?.r || "—"} • ${fmt(last.ts)}`
                    : info?.sets
                      ? `Recommended: ${info.sets}`
                      : "No history yet";
                  return (
                    <button key={ex} className="cardBtn" onClick={() => openExercise(ex)}>
                      <div className="cardTitle">{ex}</div>
		      <div className="cardSub">{sub}</div>

		   {EXERCISE_INFO[ex]?.notes?.[0] ? (
		     <div className="mini" style={{ marginTop: 6 }}>
		      {EXERCISE_INFO[ex].notes[0]}
		  </div>
		) : null}

		{EXERCISE_INFO[ex]?.target ? (
		  <div className="mini" style={{ marginTop: 4, opacity: 0.9 }}>
		    Target: {EXERCISE_INFO[ex].target}
		  </div>
		) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="h">Recent logs</div>
              <div className="muted">{data.logs.length} total</div>
            </div>

            <div className="grid" style={{ marginTop: 10 }}>
              {recent.length === 0 ? <div className="muted">No logs yet. Tap an exercise to add your first.</div> : null}
              {recent.map((l) => {
                const vol = Math.round(volumeOfLog(l));
                return (
                  <div key={l.id} className="log">
                    <div className="row">
                      <div>
                        <div style={{ fontWeight: 950 }}>{l.exerciseName}</div>
                        <div className="mini">
                          {l.sessionName} • {fmt(l.ts)}
                        </div>
                      </div>
                      <button className="toggle" onClick={() => delLog(l.id)}>
                        Delete
                      </button>
                    </div>

                    <div className="pills">
                      {(l.sets || []).map((s, i) => (
                        <span key={i}>{pill(`${s.w || "—"}kg × ${s.r || "—"}`)}</span>
                      ))}
                      <span>{pill(`Vol ${vol}`)}</span>
                    </div>

                    {l.notes ? <div className="mini" style={{ marginTop: 8 }}>{l.notes}</div> : null}
                  </div>
                );
              })}
            </div>

            {selected ? (
              <div className="modalOverlay" onClick={() => setSelected(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>{selected}</div>
                  <div className="mini">{session.name}</div>

                  {selectedInfo ? (
                    <div style={{ marginTop: 10 }}>
                      <div className="pills">
                        <span>{pill(`Recommended sets: ${selectedInfo.sets}`)}</span>
                      </div>
                      {selectedInfo.target ? (
                        <div className="mini" style={{ marginTop: 8, lineHeight: 1.45 }}>
                          <strong>Progression target:</strong> {selectedInfo.target}
                        </div>
                      ) : null}
                      <div className="table" style={{ marginTop: 10 }}>
                        {selectedInfo.notes.map((n, i) => (
                          <div key={i} className="mini" style={{ lineHeight: 1.4 }}>• {n}</div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedLastLog?.notes ? (
                    <div style={{ marginTop: 12 }}>
                      <div className="mini" style={{ fontWeight: 900, color: "var(--muted)" }}>Last note to self</div>
                      <div className="tableRow" style={{ marginTop: 8 }}>
                        <div className="mini" style={{ lineHeight: 1.45 }}>{selectedLastLog.notes}</div>
                      </div>
                    </div>
                  ) : null}

                  <div className="setGrid">
                    {sets.map((s, idx) => (
                      <React.Fragment key={idx}>
                        <input
                          className="input"
                          inputMode="decimal"
                          placeholder={`Set ${idx + 1} kg`}
                          value={s.w}
                          onChange={(e) =>
                            setSets((prev) => prev.map((p, i) => (i === idx ? { ...p, w: e.target.value } : p)))
                          }
                        />
                        <input
                          className="input"
                          inputMode="numeric"
                          placeholder="Reps"
                          value={s.r}
                          onChange={(e) =>
                            setSets((prev) => prev.map((p, i) => (i === idx ? { ...p, r: e.target.value } : p)))
                          }
                        />
                      </React.Fragment>
                    ))}
                  </div>

                  <button
                    className="btn"
                    onClick={() => setSets((prev) => [...prev, { w: "", r: "" }])}
                    style={{ marginTop: 10 }}
                  >
                    + Add Set
                  </button>

                  <input
                    className="input"
                    placeholder={selectedLastLog?.notes ? "New note (last note shown above)" : "Notes (optional) e.g., RPE 8"}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn" onClick={() => setSelected(null)}>
                      Cancel
                    </button>
                    <button className="btn btnPrimary" onClick={saveLog}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="panel">
              <div className="panelHead">
                <div>
                  <div className="h">Performance tracking</div>
                  <div className="muted">PRs + volume + session balance</div>
                </div>
              </div>

              <div className="kpi">
                <div className="kpiCard">
                  <div className="kpiLabel">Total logs</div>
                  <div className="kpiValue">{data.logs.length}</div>
                </div>
                <div className="kpiCard">
                  <div className="kpiLabel">Last 7 days volume</div>
                  <div className="kpiValue">
                    {Math.round(
                      data.logs
                        .filter((l) => l.ts >= Date.now() - 7 * 24 * 3600 * 1000)
                        .reduce((acc, l) => acc + volumeOfLog(l), 0)
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="mini" style={{ fontWeight: 900, color: "var(--muted)" }}>
                  Volume by session block
                </div>
                <div className="spark">
                  {stats.sessionTotals.map((x) => {
                    const h = Math.max(6, Math.round((x.volume / stats.maxSessionVolume) * 52));
                    return <div key={x.key} title={`${x.label}: ${x.volume}`} style={{ height: h }} />;
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {stats.sessionTotals.map((x) => (
                    <div key={x.key} className="mini" style={{ width: `${100 / stats.sessionTotals.length}%`, textAlign: "center" }}>
                      {x.key} · {x.logs}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="mini" style={{ fontWeight: 900, color: "var(--muted)" }}>
                  Weekly volume (last {stats.weeklySeries.length} weeks)
                </div>
                <div className="spark">
                  {stats.weeklySeries.map((x) => {
                    const h = Math.max(6, Math.round((x.vol / stats.maxWeekly) * 52));
                    return <div key={x.weekTs} title={`${x.label}: ${x.vol}`} style={{ height: h }} />;
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {stats.weeklySeries.map((x) => (
                    <div key={x.weekTs} className="mini" style={{ width: `${100 / stats.weeklySeries.length}%`, textAlign: "center" }}>
                      {x.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panelHead">
                <div>
                  <div className="h">PRs by exercise</div>
                  <div className="muted">Best weight (max kg) and best volume</div>
                </div>
              </div>

              <div className="table">
                {stats.byExercise.length === 0 ? (
                  <div className="muted">No data yet — log a few exercises and your PRs will appear here.</div>
                ) : null}

                {stats.byExercise.map((x) => (
                  <div key={x.exercise} className="tableRow">
                    <div className="row">
                      <div style={{ fontWeight: 950 }}>{x.exercise}</div>
                      <div className="mini">Last: {x.lastWeight || 0}kg • Vol {Math.round(x.lastVolume || 0)}</div>
                    </div>
                    <div className="pills">
                      <span>{pill(`Best kg: ${x.bestWeight || 0}`)}</span>
                      <span>{pill(`Best vol: ${Math.round(x.bestVolume || 0)}`)}</span>
                      {x.bestWeightTs ? <span>{pill(`kg on ${fmt(x.bestWeightTs)}`)}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bar">
        <div className="barInner">
          <button className="btn" onClick={() => exportCSV()}>
            Export CSV
          </button>
          <button className="btn" onClick={() => exportJSON()}>
            Backup JSON
          </button>
          <label style={{ flex: 1 }}>
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJSON(f);
                e.target.value = "";
              }}
            />
            <span className="btn" style={{ display: "block", textAlign: "center" }}>
              Restore
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
