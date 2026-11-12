"use client";

import { useState, useEffect } from "react";
import { BarChart3, RotateCcw, Download, Trash2, ChevronLeft, Upload, CheckCircle, XCircle } from "lucide-react";

const SYMBOLS = [
  { id: "tomato", emoji: "🍅", name: "بندورة", color: "#e74c3c" },
  { id: "pepper", emoji: "🌶️", name: "فلفل", color: "#c0392b" },
  { id: "corn", emoji: "🌽", name: "ذرة", color: "#f1c40f" },
  { id: "carrot", emoji: "🥕", name: "جزر", color: "#e67e22" },
  { id: "rooster", emoji: "🐓", name: "ديك", color: "#d35400" },
  { id: "sheep", emoji: "🐑", name: "خروف", color: "#ecf0f1" },
  { id: "shrimp", emoji: "🦐", name: "جمبري", color: "#ff6b81" },
  { id: "fish", emoji: "🐟", name: "سمكة", color: "#3498db" },
];

const STORAGE_KEY = "wheel_sequence_v1";
const STATS_KEY = "wheel_stats_v1";
const PICKS_KEY = "wheel_picks_v1";

export default function Home() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  // إحصائيات الربح/الخسارة
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);
  
  // 👇 الرموز الـ 3 اللي اختارها المستخدم كتوقع
  const [userPicks, setUserPicks] = useState<string[]>([]);
  
  // 👇 حالة آخر نتيجة (عشان نعرضها)
  const [lastResult, setLastResult] = useState<{ symbolId: string; isWin: boolean } | null>(null);

  // 👇 تحميل البيانات من localStorage
  useEffect(() => {
    const savedSeq = localStorage.getItem(STORAGE_KEY);
    if (savedSeq) {
      try { setSequence(JSON.parse(savedSeq)); } catch { setSequence([]); }
    }

    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setWinCount(stats.winCount || 0);
        setLossCount(stats.lossCount || 0);
      } catch {}
    }

    const savedPicks = localStorage.getItem(PICKS_KEY);
    if (savedPicks) {
      try { setUserPicks(JSON.parse(savedPicks)); } catch {}
    }

    setIsLoaded(true);
  }, []);

  // 👇 حفظ البيانات في localStorage لما تتغير
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sequence));
      localStorage.setItem(STATS_KEY, JSON.stringify({ winCount, lossCount }));
      localStorage.setItem(PICKS_KEY, JSON.stringify(userPicks));
    }
  }, [sequence, winCount, lossCount, userPicks, isLoaded]);

  // 👇 إضافة نتيجة جديدة (من أزرار التسجيل)
  const addResult = (id: string) => {
    // إذا كان في توقعات مختارة، نقارن
    if (userPicks.length === 3) {
      const isWin = userPicks.includes(id);
      setLastResult({ symbolId: id, isWin });

      if (isWin) setWinCount((prev) => prev + 1);
      else setLossCount((prev) => prev + 1);

      // بعد ما نسجل، بنفضي التوقعات عشان يختار توقعات جديدة
      setUserPicks([]);
    } else {
      // إذا ما في توقعات، بس نسجل الرمز
      setLastResult({ symbolId: id, isWin: false });
    }

    // نضيف الرمز للمصفوفة (التاريخ)
    setSequence([...sequence, id]);
  };

  const undo = () => sequence.length > 0 && setSequence(sequence.slice(0, -1));
  const clearAll = () => {
    if (confirm("هل أنت متأكد من مسح كل النتائج والإحصائيات؟")) {
      setSequence([]);
      setWinCount(0);
      setLossCount(0);
      setUserPicks([]);
      setLastResult(null);
    }
  };

  const exportCSV = () => {
    if (sequence.length === 0) return alert("لا توجد نتائج للتصدير");
    const header = "index,symbol_id,symbol_name\n";
    const rows = sequence.map((id, index) => {
      const symbol = SYMBOLS.find((s) => s.id === id);
      return `${index + 1},${id},${symbol?.name || ""}`;
    }).join("\n");
    const csv = "\ufeff" + header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `wheel_data_${date}.csv`);
    link.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1);
      const importedIds: string[] = [];

      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length >= 2) {
          const id = parts[1].trim();
          if (SYMBOLS.find((s) => s.id === id)) {
            importedIds.push(id);
          }
        }
      }

      if (importedIds.length > 0) {
        setSequence(importedIds);
        alert(`تم استيراد ${importedIds.length} نتيجة بنجاح!`);
      } else {
        alert("لم يتم العثور على نتائج صالحة في الملف.");
      }
    };
    reader.readAsText(file);
  };

  const togglePick = (symbolId: string) => {
    if (userPicks.includes(symbolId)) {
      setUserPicks(userPicks.filter((id) => id !== symbolId));
    } else {
      if (userPicks.length < 3) {
        setUserPicks([...userPicks, symbolId]);
      } else {
        alert("ما فيك تختار أكتر من 3 رموز!");
      }
    }
  };

  const counts = SYMBOLS.map((symbol) => ({
    ...symbol,
    count: sequence.filter((id) => id === symbol.id).length,
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  const transitions: Record<string, Record<string, number>> = {};
  for (const symbol of SYMBOLS) {
    transitions[symbol.id] = {};
    for (const s of SYMBOLS) transitions[symbol.id][s.id] = 0;
  }
  for (let i = 0; i < sequence.length - 1; i++) {
    const from = sequence[i];
    const to = sequence[i + 1];
    if (transitions[from] && transitions[from][to] !== undefined) transitions[from][to]++;
  }

  const getConditionalProbabilities = (sourceId: string) => {
    const sourceTransitions = transitions[sourceId] || {};
    const totalSourceTransitions = Object.values(sourceTransitions).reduce((a, b) => a + b, 0);
    if (totalSourceTransitions === 0) return [];

    const globalCounts: Record<string, number> = {};
    for (const symbol of SYMBOLS) {
      globalCounts[symbol.id] = sequence.filter(id => id === symbol.id).length;
    }
    const totalGlobal = sequence.length;

    return SYMBOLS.map((target) => {
      const conditionalCount = sourceTransitions[target.id] || 0;
      const conditionalProb = (conditionalCount / totalSourceTransitions) * 100;
      const globalCount = globalCounts[target.id] || 0;
      const globalProb = (globalCount / totalGlobal) * 100;
      const blendedProb = (conditionalProb + globalProb) / 2;
      return { ...target, count: conditionalCount, probability: blendedProb };
    }).sort((a, b) => b.probability - a.probability);
  };

  const conditionalData = selectedSource ? getConditionalProbabilities(selectedSource) : [];
  const selectedSourceTotal = selectedSource ? Object.values(transitions[selectedSource] || {}).reduce((a, b) => a + b, 0) : 0;

  const getExpectedSymbols = () => {
    if (sequence.length < 2) return [];
    const totalCounts: Record<string, number> = {};
    for (const symbol of SYMBOLS) totalCounts[symbol.id] = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      const to = sequence[i + 1];
      if (totalCounts[to] !== undefined) totalCounts[to]++;
    }
    return SYMBOLS.map((symbol) => ({ ...symbol, count: totalCounts[symbol.id] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const renderWheel = () => {
    const size = 200;
    const center = size / 2;
    const radius = center - 10;
    const angleStep = (Math.PI * 2) / SYMBOLS.length;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        {SYMBOLS.map((symbol, index) => {
          const startAngle = index * angleStep - Math.PI / 2;
          const endAngle = (index + 1) * angleStep - Math.PI / 2;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const largeArc = angleStep > Math.PI ? 1 : 0;
          const pathData = [`M ${center} ${center}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, "Z"].join(" ");
          const midAngle = (startAngle + endAngle) / 2;
          const textX = center + radius * 0.65 * Math.cos(midAngle);
          const textY = center + radius * 0.65 * Math.sin(midAngle);

          return (
            <g key={symbol.id}>
              <path d={pathData} fill={symbol.color} stroke="#1e293b" strokeWidth="1" />
              <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle" fontSize="16">
                {symbol.emoji}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r="20" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      </svg>
    );
  };

  if (!isLoaded) return null;

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* الهيدر */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-white flex items-center gap-2">
              <BarChart3 className="text-amber-500" />
              محلل العجلة
            </h1>
            <p className="text-slate-400 mt-1 text-sm">أداة تحليل نتائج عجلة الحظ</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition border border-slate-700 cursor-pointer">
              <Upload size={16} /> استيراد CSV
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </label>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition border border-slate-700">
              <Download size={16} /> تصدير CSV
            </button>
            <button onClick={undo} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition border border-slate-700">
              <RotateCcw size={16} /> تراجع
            </button>
            <button onClick={clearAll} className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold transition border border-red-900/50">
              <Trash2 size={16} /> مسح الكل
            </button>
          </div>
        </header>

        {/* 👇 نتيجة التسجيل الأخيرة */}
        {lastResult && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${lastResult.isWin ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{SYMBOLS.find(s => s.id === lastResult.symbolId)?.emoji}</span>
              <span className="font-bold text-lg">{SYMBOLS.find(s => s.id === lastResult.symbolId)?.name}</span>
            </div>
            <div className={`font-bold text-lg flex items-center gap-2 ${lastResult.isWin ? "text-green-400" : "text-red-400"}`}>
              {lastResult.isWin ? <><CheckCircle size={20} /> ربح</> : <><XCircle size={20} /> خسارة</>}
            </div>
          </div>
        )}

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">إجمالي النتائج</div>
            <div className="text-2xl font-bold text-white">{sequence.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">الرمز الأكثر تكراراً</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {counts.sort((a, b) => b.count - a.count)[0]?.emoji} 
              {counts.sort((a, b) => b.count - a.count)[0]?.name}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">الرموز المتوقعة</div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              {getExpectedSymbols().length > 0 ? (
                getExpectedSymbols().map((symbol, index) => (
                  <span key={symbol.id} className="flex items-center gap-1">
                    {index > 0 && <span className="text-slate-600 text-xs">|</span>}
                    <span className="text-2xl">{symbol.emoji}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">سجل المزيد</span>
              )}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">النتائج</div>
            <div className="flex items-center gap-3">
              <div className="text-green-400 font-bold text-xl">{winCount} ✅</div>
              <div className="text-red-400 font-bold text-xl">{lossCount} ❌</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* العمود الأيمن */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
              {renderWheel()}
            </div>

            {/* 👇 اختيار 3 رموز */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-bold text-slate-300 mb-4 text-center">اختر 3 رموز (توقعك):</h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {SYMBOLS.map((symbol) => (
                  <button
                    key={symbol.id}
                    onClick={() => togglePick(symbol.id)}
                    className={`rounded-lg p-3 text-2xl flex items-center justify-center transition-all border ${
                      userPicks.includes(symbol.id)
                        ? "bg-amber-500/20 border-amber-500 scale-105"
                        : "bg-slate-800 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {symbol.emoji}
                  </button>
                ))}
              </div>
              <div className="text-sm text-slate-400 text-center">
                اخترت: {userPicks.length} / 3
              </div>
            </div>

            {/* 👇 سجل النتيجة (أزرار التسجيل) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-bold text-slate-300 mb-4 text-center">سجل النتيجة اللي طلعت:</h2>
              <div className="grid grid-cols-4 gap-2">
                {SYMBOLS.map((symbol) => (
                  <button
                    key={symbol.id}
                    onClick={() => addResult(symbol.id)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-lg p-3 text-2xl flex items-center justify-center transition-all active:scale-95"
                    title={symbol.name}
                  >
                    {symbol.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* آخر النتائج */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-bold text-slate-300 mb-4">آخر النتائج</h2>
              <div className="flex flex-wrap gap-2">
                {sequence.slice(-20).reverse().map((id, index) => {
                  const symbol = SYMBOLS.find((s) => s.id === id);
                  return <span key={index} className="text-xl bg-slate-800 p-1 rounded border border-slate-700">{symbol?.emoji}</span>;
                })}
                {sequence.length === 0 && <span className="text-slate-500 text-sm">لا توجد نتائج</span>}
              </div>
            </div>
          </div>

          {/* العمود الأيسر */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="font-bold text-white">تكرار كل رمز</h2>
              </div>
              <div className="p-4 space-y-4">
                {counts.map((symbol) => (
                  <div key={symbol.id} className="flex items-center gap-4">
                    <div className="w-24 flex items-center gap-2">
                      <span className="text-xl">{symbol.emoji}</span>
                      <span className="text-sm font-medium text-slate-300">{symbol.name}</span>
                    </div>
                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(symbol.count / maxCount) * 100}%` }} />
                    </div>
                    <div className="w-16 text-left text-sm font-mono text-slate-400">
                      {symbol.count} <span className="text-xs">({sequence.length > 0 ? ((symbol.count / sequence.length) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="font-bold text-white">تحليل الانتقالات (شو بيجي بعد...؟)</h2>
                {selectedSource && (
                  <button onClick={() => setSelectedSource(null)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    إلغاء التحديد <ChevronLeft size={14} />
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-6">
                  {SYMBOLS.map((symbol) => (
                    <button
                      key={symbol.id}
                      onClick={() => setSelectedSource(symbol.id)}
                      className={`px-3 py-2 rounded-lg text-lg transition-all border ${
                        selectedSource === symbol.id ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-slate-800 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {symbol.emoji}
                    </button>
                  ))}
                </div>

                {selectedSource ? (
                  <div>
                    <p className="text-sm text-slate-400 mb-4">
                      بعد {SYMBOLS.find((s) => s.id === selectedSource)?.name} ({selectedSourceTotal} انتقال):
                    </p>
                    {selectedSourceTotal === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/50 rounded-lg">لا توجد بيانات كافية لهذا الرمز</p>
                    ) : (
                      <div className="space-y-3">
                        {conditionalData.map((target) => (
                          <div key={target.id} className="flex items-center gap-4">
                            <div className="w-24 flex items-center gap-2">
                              <span className="text-lg">{target.emoji}</span>
                              <span className="text-sm text-slate-300">{target.name}</span>
                            </div>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${target.probability}%` }} />
                            </div>
                            <div className="w-16 text-left text-sm font-mono text-slate-400">
                              {target.count} <span className="text-xs">({target.probability.toFixed(0)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">اختر رمزاً من الأعلى لتحليل ما يأتي بعده</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}