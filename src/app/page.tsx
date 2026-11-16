'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, Trash2, Target, Sparkles, Activity,
  Download, Upload, TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';

// ==========================================
// تعريفات الرموز (8 رموز)
// ==========================================
export type SymbolId = 
  | 'tomato' | 'pepper' | 'corn' | 'carrot' 
  | 'rooster' | 'sheep' | 'shrimp' | 'fish';

export interface SymbolInfo {
  id: SymbolId;
  name: string;
  emoji: string;
  color: string;
  type: 'vegetable' | 'animal';
}

export const SYMBOLS: SymbolInfo[] = [
  { id: 'tomato',  name: 'بندورة', emoji: '🍅', color: '#EF4444', type: 'vegetable' },
  { id: 'pepper',  name: 'فلفل',   emoji: '🌶️', color: '#F97316', type: 'vegetable' },
  { id: 'corn',    name: 'ذرة',    emoji: '🌽', color: '#EAB308', type: 'vegetable' },
  { id: 'carrot',  name: 'جزر',    emoji: '🥕', color: '#FB923C', type: 'vegetable' },
  { id: 'rooster', name: 'ديك',    emoji: '🐓', color: '#DC2626', type: 'animal' },
  { id: 'sheep',   name: 'خروف',   emoji: '🐑', color: '#A3A3A3', type: 'animal' },
  { id: 'shrimp',  name: 'جمبري',  emoji: '🦐', color: '#EC4899', type: 'animal' },
  { id: 'fish',    name: 'سمكة',   emoji: '🐟', color: '#3B82F6', type: 'animal' },
];

// ==========================================
// أنواع البيانات
// ==========================================
interface SequenceRow {
  id: number;
  symbol_id: SymbolId;
  created_at: string;
}

// ==========================================
// المكون الرئيسي
// ==========================================
export default function HomePage() {
  const [sequence, setSequence] = useState<SequenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSequence = useCallback(async () => {
    try {
      const res = await fetch('/api/sequence');
      if (!res.ok) throw new Error('Failed to fetch sequence');
      const data: SequenceRow[] = await res.json();
      setSequence(data);
    } catch (e) {
      console.error(e);
      setError('تعذر جلب النتائج');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchSequence();
      setLoading(false);
    };
    init();
  }, [fetchSequence]);

  const handleAddSymbol = useCallback(async (symbolId: SymbolId) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol_id: symbolId }),
      });
      if (!res.ok) throw new Error('Failed to add symbol');
      await fetchSequence();
    } catch (e) {
      console.error(e);
      setError('تعذر إضافة النتيجة');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, fetchSequence]);

  const handleUndo = useCallback(async () => {
    if (submitting || sequence.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sequence', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to undo');
      await fetchSequence();
    } catch (e) {
      console.error(e);
      setError('تعذر التراجع');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, sequence.length, fetchSequence]);

  const handleClearAll = useCallback(async () => {
    if (submitting) return;
    if (!confirm('هل أنت متأكد من مسح كل النتائج؟')) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sequence', { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to clear');
      await fetchSequence();
    } catch (e) {
      console.error(e);
      setError('تعذر مسح النتائج');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, fetchSequence]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#0EA5E9] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-300">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6" style={{ fontFamily: 'var(--font-cairo), sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            محلل العجلة
          </h1>
          <p className="text-slate-400 text-sm">أداة تحليل نتائج عجلة الحظ</p>
        </header>

        {error && (
          <div className="glass p-3 mb-4 text-red-400 text-sm text-center">
            {error}
            <button 
              onClick={() => setError(null)}
              className="mr-2 text-red-300 underline"
            >
              إغلاق
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#0EA5E9]" />
                العجلة
              </h2>
              <WheelDisplay sequence={sequence} />
            </div>

            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                سجّل النتيجة
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {SYMBOLS.map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => handleAddSymbol(sym.id)}
                    disabled={submitting}
                    className="glass-strong p-3 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 flex flex-col items-center gap-1 group"
                    style={{ borderColor: `${sym.color}40` }}
                    title={sym.name}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {sym.emoji}
                    </span>
                    <span className="text-[10px] text-slate-300">{sym.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={handleUndo}
                  disabled={submitting || sequence.length === 0}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm transition-all disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4" />
                  تراجع
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={submitting || sequence.length === 0}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-sm transition-all disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الكل
                </button>
              </div>
            </div>

            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0EA5E9]" />
                الغياب (Gap)
              </h2>
              <GapDisplay sequence={sequence} />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">

            <div className="grid grid-cols-2 gap-3">
              <StatCard title="إجمالي النتائج" value={sequence.length} icon="📊" color="blue" />
              <StatCard title="الرمز الأكثر" value={getMostFrequent(sequence)} icon="👑" color="gold" />
            </div>

            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0EA5E9]" />
                تكرار كل رمز
              </h2>
              <FrequencyList sequence={sequence} />
            </div>

            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-[#0EA5E9]" />
                تحليل الانتقالات
              </h2>
              <TransitionAnalyzer sequence={sequence} />
            </div>

            <div className="glass p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
                الرموز المتوقعة (تحليل متقدم)
              </h2>
              <ExpectedSymbols sequence={sequence} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#0EA5E9]" />
                  استيراد / تصدير
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => exportCSV(sequence)}
                    disabled={sequence.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0EA5E9]/20 hover:bg-[#0EA5E9]/30 border border-[#0EA5E9]/40 text-[#0EA5E9] text-sm transition-all disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    تصدير CSV
                  </button>
                  <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 text-sm transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    استيراد CSV
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await importCSV(file, fetchSequence);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="glass p-4">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0EA5E9]" />
                  آخر 20 نتيجة
                </h2>
                <LastResults sequence={sequence} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// مكون: رسم العجلة
// ==========================================
function WheelDisplay({ sequence }: { sequence: SequenceRow[] }) {
  const size = 280;
  const center = size / 2;
  const radius = center - 20;
  const sliceAngle = (2 * Math.PI) / SYMBOLS.length;
  const lastSymbol = sequence.length > 0 ? sequence[sequence.length - 1].symbol_id : null;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <circle cx={center} cy={center} r={radius + 10} fill="none" stroke="#1E293B" strokeWidth="4" />
        
        {SYMBOLS.map((sym, i) => {
          const startAngle = i * sliceAngle - Math.PI / 2;
          const endAngle = (i + 1) * sliceAngle - Math.PI / 2;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const largeArc = sliceAngle > Math.PI ? 1 : 0;
          const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          const midAngle = (startAngle + endAngle) / 2;
          const textX = center + (radius * 0.65) * Math.cos(midAngle);
          const textY = center + (radius * 0.65) * Math.sin(midAngle);
          const isLast = lastSymbol === sym.id;

          return (
            <g key={sym.id}>
              <path
                d={path}
                fill={sym.color}
                opacity={isLast ? 1 : 0.85}
                stroke="#0B1120"
                strokeWidth="2"
                className={isLast ? 'animate-pulse' : ''}
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="28"
                className="select-none"
                style={{ pointerEvents: 'none' }}
              >
                {sym.emoji}
              </text>
            </g>
          );
        })}

        <circle cx={center} cy={center} r={30} fill="#0B1120" stroke="#0EA5E9" strokeWidth="2" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#0EA5E9"
          fontWeight="bold"
        >
          {sequence.length}
        </text>
      </svg>

      {lastSymbol && (
        <p className="mt-2 text-sm text-slate-300">
          آخر نتيجة: <span className="text-white font-bold">
            {SYMBOLS.find(s => s.id === lastSymbol)?.emoji} {SYMBOLS.find(s => s.id === lastSymbol)?.name}
          </span>
        </p>
      )}
    </div>
  );
}

// ==========================================
// مكون: الغياب (Gap)
// ==========================================
function GapDisplay({ sequence }: { sequence: SequenceRow[] }) {
  const gaps = SYMBOLS.map((sym) => {
    let gap = 0;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i].symbol_id === sym.id) break;
      gap++;
    }
    const neverAppeared = !sequence.some(s => s.symbol_id === sym.id);
    return { ...sym, gap, neverAppeared };
  });

  return (
    <div className="space-y-2">
      {gaps.map((g) => {
        let colorClass = 'text-green-400 bg-green-500/20 border-green-500/40';
        if (g.neverAppeared) {
          colorClass = 'text-slate-400 bg-slate-500/20 border-slate-500/40';
        } else if (g.gap > 20) {
          colorClass = 'text-red-400 bg-red-500/20 border-red-500/40';
        } else if (g.gap >= 10) {
          colorClass = 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
        }

        return (
          <div
            key={g.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorClass}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{g.emoji}</span>
              <span className="text-sm font-semibold">{g.name}</span>
            </div>
            <span className="text-sm font-bold">
              {g.neverAppeared ? '—' : g.gap}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// دوال مساعدة
// ==========================================
function getMostFrequent(sequence: SequenceRow[]): string {
  if (sequence.length === 0) return '—';
  const counts: Record<string, number> = {};
  sequence.forEach(s => { counts[s.symbol_id] = (counts[s.symbol_id] || 0) + 1; });
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const sym = SYMBOLS.find(s => s.id === max[0]);
  return sym ? `${sym.emoji}` : '—';
}

// ==========================================
// مكون: بطاقة إحصائية
// ==========================================
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-[#0EA5E9]/40 text-[#0EA5E9]',
    gold: 'border-[#F59E0B]/40 text-[#F59E0B]',
    green: 'border-green-500/40 text-green-400',
    red: 'border-red-500/40 text-red-400',
  };
  return (
    <div className={`glass-strong p-3 rounded-xl border ${colors[color]} text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1">{title}</div>
    </div>
  );
}

// ==========================================
// مكون: تكرار كل رمز
// ==========================================
function FrequencyList({ sequence }: { sequence: SequenceRow[] }) {
  const total = sequence.length;
  const counts: Record<string, number> = {};
  SYMBOLS.forEach(s => { counts[s.id] = 0; });
  sequence.forEach(s => { counts[s.symbol_id] = (counts[s.symbol_id] || 0) + 1; });

  return (
    <div className="space-y-2">
      {SYMBOLS.map(sym => {
        const count = counts[sym.id] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={sym.id} className="flex items-center gap-2">
            <span className="text-lg w-6">{sym.emoji}</span>
            <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: sym.color }}
              >
                <span className="text-[10px] text-white font-bold">{count}</span>
              </div>
            </div>
            <span className="text-xs text-slate-400 w-12 text-left">{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// مكون: تحليل الانتقالات
// ==========================================
function TransitionAnalyzer({ sequence }: { sequence: SequenceRow[] }) {
  const [selected, setSelected] = useState<SymbolId | null>(null);

  const transitions: Record<string, number> = {};
  if (selected) {
    SYMBOLS.forEach(s => { transitions[s.id] = 0; });
    let total = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i].symbol_id === selected) {
        const next = sequence[i + 1].symbol_id;
        transitions[next] = (transitions[next] || 0) + 1;
        total++;
      }
    }
    if (total > 0) {
      Object.keys(transitions).forEach(k => {
        transitions[k] = (transitions[k] / total) * 100;
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-3">
        {SYMBOLS.map(sym => (
          <button
            key={sym.id}
            onClick={() => setSelected(selected === sym.id ? null : sym.id)}
            className={`p-2 rounded-lg transition-all border ${
              selected === sym.id
                ? 'bg-[#0EA5E9]/20 border-[#0EA5E9]'
                : 'glass-strong border-transparent hover:border-slate-500'
            }`}
          >
            <div className="text-xl">{sym.emoji}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-slate-400 mb-2">احتمالات الرموز بعد {SYMBOLS.find(s => s.id === selected)?.emoji}:</p>
          {SYMBOLS
            .map(s => ({ ...s, pct: transitions[s.id] || 0 }))
            .sort((a, b) => b.pct - a.pct)
            .filter(s => s.pct > 0)
            .map(s => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span>{s.emoji}</span>
                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-xs text-slate-400 w-12 text-left">{s.pct.toFixed(1)}%</span>
              </div>
            ))}
          {Object.values(transitions).every(v => v === 0) && (
            <p className="text-xs text-slate-500 text-center py-2">لا توجد بيانات كافية</p>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// دوال التحليل الإحصائي المتقدم
// ==========================================

// حساب الفترات بين ظهور كل رمز
function getSymbolIntervals(sequence: SequenceRow[], symbolId: SymbolId): number[] {
  const indexes: number[] = [];
  sequence.forEach((row, idx) => {
    if (row.symbol_id === symbolId) indexes.push(idx);
  });
  
  if (indexes.length < 2) return [];
  
  const intervals: number[] = [];
  for (let i = 1; i < indexes.length; i++) {
    intervals.push(indexes[i] - indexes[i - 1]);
  }
  return intervals;
}

// حساب متوسط الفترات
function getAverageInterval(intervals: number[]): number | null {
  if (intervals.length === 0) return null;
  const sum = intervals.reduce((a, b) => a + b, 0);
  return sum / intervals.length;
}

// ==========================================
// مكون: الرموز المتوقعة (الخوارزمية المتقدمة)
// ==========================================
function ExpectedSymbols({ sequence }: { sequence: SequenceRow[] }) {
  if (sequence.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">لا توجد بيانات كافية</p>;
  }

  const total = sequence.length;
  const recent = sequence.slice(-15);
  const recentTotal = recent.length;

  // حساب نقاط كل رمز
  const scores = SYMBOLS.map(sym => {
    // 1. التكرار العام
    const totalCount = sequence.filter(s => s.symbol_id === sym.id).length;
    const generalPct = (totalCount / total) * 100;

    // 2. التكرار الشرطي (آخر 15)
    const recentCount = recent.filter(s => s.symbol_id === sym.id).length;
    const recentPct = recentTotal > 0 ? (recentCount / recentTotal) * 100 : 0;

    // 3. الغياب الحالي
    let currentGap = 0;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i].symbol_id === sym.id) break;
      currentGap++;
    }
    const neverAppeared = totalCount === 0;

    // 4. تحليل الفترات
    const intervals = getSymbolIntervals(sequence, sym.id);
    const avgInterval = getAverageInterval(intervals);
    
    // 5. حساب "التأخر" عن المتوسط
    let overdueRatio = 0;
    let overdueBonus = 0;
    let overdueInfo: string | null = null;

    if (avgInterval !== null && avgInterval > 0) {
      overdueRatio = currentGap / avgInterval;
      // إذا الغياب الحالي > 1.5 × المتوسط، نعتبره "متأخر" ونعطيه مكافأة
      if (overdueRatio > 1.5) {
        overdueBonus = 15;
        overdueInfo = `متأخر ${currentGap} عن متوسط ${avgInterval.toFixed(1)}`;
      } else {
        overdueInfo = `غائب ${currentGap} من ${avgInterval.toFixed(1)}`;
      }
    }

    // 6. وزن الغياب (بحد أقصى 30 نقطة)
    const gapWeight = Math.min((currentGap / Math.max(total, 1)) * 100 * 2, 30);

    // 7. النقاط النهائية
    let score;
    if (neverAppeared) {
      // رمز جديد ما ظهر أبداً: نعتمد على التكرار العام بس (نقطة صغيرة للاحتياط)
      score = generalPct * 0.5 + 5;
    } else {
      score = 
        (generalPct * 0.4) +   // 40% تكرار عام
        (recentPct * 0.3) +    // 30% تكرار شرطي
        (gapWeight * 0.3) +    // 30% وزن غياب
        overdueBonus;          // مكافأة التأخر
    }

    return {
      ...sym,
      score,
      currentGap,
      avgInterval,
      overdueInfo,
      neverAppeared,
      overdueBonus,
      generalPct,
      recentPct,
      gapWeight,
    };
  }).sort((a, b) => b.score - a.score);

  // تصنيف: 3 خضار + 2 حيوانات
  const veggies = scores.filter(s => s.type === 'vegetable').slice(0, 3);
  const animals = scores.filter(s => s.type === 'animal').slice(0, 2);
  const finalPicks = [...veggies, ...animals].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {finalPicks.map(s => (
          <div 
            key={s.id} 
            className={`glass-strong p-2 rounded-lg text-center border ${
              s.overdueBonus > 0 ? 'border-green-500/60' : 'border-[#F59E0B]/30'
            }`}
          >
            <div className="text-2xl">{s.emoji}</div>
            <div className="text-[10px] text-slate-300 mt-1">{s.name}</div>
            <div className="text-xs text-[#F59E0B] font-bold mt-1">{s.score.toFixed(1)}%</div>
            {s.overdueBonus > 0 && (
              <div className="text-[9px] text-green-400 mt-1">🔥 متأخر</div>
            )}
          </div>
        ))}
      </div>

      {/* تفاصيل السبب */}
      <div className="mt-3 space-y-1 border-t border-slate-700/50 pt-3">
        <p className="text-xs text-slate-400 mb-2 font-semibold">تفاصيل التوقع:</p>
        {finalPicks.map(s => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span className="text-base">{s.emoji}</span>
            <span className="text-slate-300 w-16">{s.name}</span>
            <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
              <span>عام: {s.generalPct.toFixed(1)}%</span>
              <span>شرطي: {s.recentPct.toFixed(1)}%</span>
              <span>غياب: {s.currentGap}</span>
              {s.overdueInfo && (
                <span className={s.overdueBonus > 0 ? 'text-green-400' : ''}>
                  {s.overdueInfo}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// مكون: آخر النتائج
// ==========================================
function LastResults({ sequence }: { sequence: SequenceRow[] }) {
  const last = sequence.slice(-20).reverse();
  if (last.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">لا توجد نتائج بعد</p>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {last.map((row, idx) => {
        const sym = SYMBOLS.find(s => s.id === row.symbol_id);
        const isHighlighted = idx === 10 || idx === 19;
        return (
          <div
            key={row.id}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
              isHighlighted ? 'bg-green-500/30 border border-green-500/60' : 'glass-strong'
            }`}
            title={`${sym?.name} - ${idx + 1}`}
          >
            {sym?.emoji}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// دوال CSV
// ==========================================
function exportCSV(sequence: SequenceRow[]) {
  const header = 'id,symbol_id,created_at\n';
  const rows = sequence.map(r => `${r.id},${r.symbol_id},${r.created_at}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wheel-sequence-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importCSV(file: File, onDone: () => Promise<void>) {
  const text = await file.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    alert('ملف CSV فارغ أو غير صالح');
    return;
  }
  const dataLines = lines.slice(1);
  const validIds = SYMBOLS.map(s => s.id);

  let added = 0;
  for (const line of dataLines) {
    const parts = line.split(',');
    const symbolId = parts[1]?.trim();
    if (symbolId && validIds.includes(symbolId as SymbolId)) {
      try {
        await fetch('/api/sequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol_id: symbolId }),
        });
        added++;
      } catch (e) {
        console.error('Import error:', e);
      }
    }
  }
  await onDone();
  alert(`تم استيراد ${added} نتيجة`);
}