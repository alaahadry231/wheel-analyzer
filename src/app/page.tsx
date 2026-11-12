"use client";

import { useState, useEffect } from "react";

// 👇 الرموز الثمانية (زي ما طلبت بالبرومت)
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

export default function Home() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // 👇 تحميل البيانات من localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSequence(JSON.parse(saved));
      } catch {
        setSequence([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // 👇 حفظ البيانات في localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sequence));
    }
  }, [sequence, isLoaded]);

  // 👇 إضافة نتيجة جديدة
  const addResult = (id: string) => {
    setSequence([...sequence, id]);
  };

  // 👇 تراجع (حذف آخر نتيجة)
  const undo = () => {
    if (sequence.length > 0) {
      setSequence(sequence.slice(0, -1));
    }
  };

  // 👇 مسح الكل
  const clearAll = () => {
    if (confirm("هل أنت متأكد من مسح كل النتائج؟")) {
      setSequence([]);
    }
  };

  // 👇 تصدير CSV
  const exportCSV = () => {
    if (sequence.length === 0) {
      alert("لا توجد نتائج للتصدير");
      return;
    }

    const header = "index,symbol_id,symbol_name\n";
    const rows = sequence
      .map((id, index) => {
        const symbol = SYMBOLS.find((s) => s.id === id);
        return `${index + 1},${id},${symbol?.name || ""}`;
      })
      .join("\n");

    const csv = "\ufeff" + header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `wheel_data_${date}.csv`);
    link.click();
  };

  // 👇 حساب التكرار
  const counts = SYMBOLS.map((symbol) => ({
    ...symbol,
    count: sequence.filter((id) => id === symbol.id).length,
  }));

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  // 👇 حساب الانتقالات (شو بيجي بعد شو)
  const transitions: Record<string, Record<string, number>> = {};
  for (const symbol of SYMBOLS) {
    transitions[symbol.id] = {};
    for (const s of SYMBOLS) {
      transitions[symbol.id][s.id] = 0;
    }
  }

  for (let i = 0; i < sequence.length - 1; i++) {
    const from = sequence[i];
    const to = sequence[i + 1];
    if (transitions[from] && transitions[from][to] !== undefined) {
      transitions[from][to]++;
    }
  }

  // 👇 حساب الاحتمالات الشرطية للرمز المختار
  const getConditionalProbabilities = (sourceId: string) => {
    const sourceTransitions = transitions[sourceId] || {};
    const total = Object.values(sourceTransitions).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return SYMBOLS.map((target) => ({
      ...target,
      count: sourceTransitions[target.id] || 0,
      probability: total > 0 ? (sourceTransitions[target.id] / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  };

  const conditionalData = selectedSource
    ? getConditionalProbabilities(selectedSource)
    : [];

  const selectedSourceTotal = selectedSource
    ? Object.values(transitions[selectedSource] || {}).reduce((a, b) => a + b, 0)
    : 0;

  // 👇 رسم العجلة SVG
  const renderWheel = () => {
    const size = 320;
    const center = size / 2;
    const radius = center - 10;
    const angleStep = (Math.PI * 2) / SYMBOLS.length;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {SYMBOLS.map((symbol, index) => {
          const startAngle = index * angleStep - Math.PI / 2;
          const endAngle = (index + 1) * angleStep - Math.PI / 2;

          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const largeArc = angleStep > Math.PI ? 1 : 0;

          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ");

          const midAngle = (startAngle + endAngle) / 2;
          const textX = center + radius * 0.65 * Math.cos(midAngle);
          const textY = center + radius * 0.65 * Math.sin(midAngle);

          return (
            <g key={symbol.id}>
              <path d={pathData} fill={symbol.color} stroke="#1a1a2e" strokeWidth="2" />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
              >
                {symbol.emoji}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r="25" fill="#000" stroke="#f0c040" strokeWidth="4" />
      </svg>
    );
  };

  if (!isLoaded) return null;

  return (
    <main dir="rtl" className="min-h-screen bg-[#1a1a2e] text-[#eee] p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#f0c040] text-center mb-8">🎡 محلل العجلة</h1>

        {/* القسم العلوي (العجلة + الأزرار) */}
        <div className="flex flex-wrap gap-6 mb-6">
          {/* العجلة */}
          <div className="flex-1 min-w-[320px] flex items-center justify-center bg-[#16213e] rounded-xl p-5">
            {renderWheel()}
          </div>

          {/* أزرار الإدخال */}
          <div className="flex-1 min-w-[320px] bg-[#16213e] rounded-xl p-5">
            <h2 className="text-lg font-bold text-[#f0c040] mb-4">
              اضغط على الرمز اللي طلع في التطبيق:
            </h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol.id}
                  onClick={() => addResult(symbol.id)}
                  className="bg-[#0f3460] border-2 border-[#1a4d8f] rounded-lg p-4 text-3xl hover:scale-105 hover:bg-[#1a4d8f] transition-transform"
                  title={symbol.name}
                >
                  {symbol.emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={undo}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition"
              >
                ↩ تراجع
              </button>
              <button
                onClick={exportCSV}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition"
              >
                ⬇ CSV
              </button>
              <button
                onClick={clearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition"
              >
                🗑 مسح
              </button>
            </div>
          </div>
        </div>

        {/* آخر النتائج */}
        <div className="bg-[#16213e] rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-[#f0c040] mb-4">📊 آخر النتائج</h2>
          <div className="flex flex-wrap gap-1 mb-2">
            {sequence.slice(-20).map((id, index) => {
              const symbol = SYMBOLS.find((s) => s.id === id);
              return (
                <span key={index} className="text-2xl">
                  {symbol?.emoji}
                </span>
              );
            })}
          </div>
          <p className="text-sm text-gray-400">إجمالي النتائج: {sequence.length}</p>
        </div>

        {/* تكرار كل رمز */}
        <div className="bg-[#16213e] rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-[#f0c040] mb-4">📈 تكرار كل رمز</h2>
          <div className="space-y-3">
            {counts.map((symbol) => (
              <div key={symbol.id} className="flex items-center gap-3">
                <div className="w-24 flex items-center gap-2">
                  <span className="text-2xl">{symbol.emoji}</span>
                  <span className="text-sm">{symbol.name}</span>
                </div>
                <div className="flex-1 h-[22px] bg-[#0f3460] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(symbol.count / maxCount) * 100}%`,
                      background: "linear-gradient(90deg, #f0c040, #e67e22)",
                    }}
                  />
                </div>
                <div className="w-24 text-left text-sm">
                  {symbol.count} ({sequence.length > 0 ? ((symbol.count / sequence.length) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* شو بيجي بعد...؟ */}
        <div className="bg-[#16213e] rounded-xl p-5">
          <h2 className="text-lg font-bold text-[#f0c040] mb-4">🔮 شو بيجي بعد...؟</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => setSelectedSource(symbol.id)}
                className={`px-4 py-2 rounded-lg text-xl transition ${
                  selectedSource === symbol.id
                    ? "bg-[#1a4d8f] border-2 border-[#f0c040]"
                    : "bg-[#0f3460] border-2 border-[#1a4d8f] hover:bg-[#1a4d8f]"
                }`}
                title={symbol.name}
              >
                {symbol.emoji}
              </button>
            ))}
          </div>

          {selectedSource && (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                بعد {SYMBOLS.find((s) => s.id === selectedSource)?.name} ({selectedSourceTotal} انتقال):
              </p>
              {selectedSourceTotal === 0 ? (
                <p className="text-gray-400">
                  لم تأتِ {SYMBOLS.find((s) => s.id === selectedSource)?.name} في أي نتيجة بعد
                </p>
              ) : (
                <div className="space-y-3">
                  {conditionalData.map((target) => (
                    <div key={target.id} className="flex items-center gap-3">
                      <div className="w-24 flex items-center gap-2">
                        <span className="text-2xl">{target.emoji}</span>
                        <span className="text-sm">{target.name}</span>
                      </div>
                      <div className="flex-1 h-[22px] bg-[#0f3460] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${target.probability}%`,
                            background: "linear-gradient(90deg, #3498db, #2980b9)",
                          }}
                        />
                      </div>
                      <div className="w-24 text-left text-sm">
                        {target.count} ({target.probability.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}