'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, Trash2, Sparkles, Activity, Crown,
  Download, Upload, TrendingUp, BarChart3, ArrowRight,
  Zap, Target, RefreshCw, Calculator, Coins, AlertCircle
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
  multiplier: number;
}

export const SYMBOLS: SymbolInfo[] = [
  { id: 'tomato',  name: 'بندورة', emoji: '🍅', color: '#EF4444', type: 'vegetable', multiplier: 5 },
  { id: 'pepper',  name: 'فلفل',   emoji: '🌶️', color: '#F97316', type: 'vegetable', multiplier: 5 },
  { id: 'corn',    name: 'ذرة',    emoji: '🌽', color: '#EAB308', type: 'vegetable', multiplier: 5 },
  { id: 'carrot',  name: 'جزر',    emoji: '🥕', color: '#FB923C', type: 'vegetable', multiplier: 5 },
  { id: 'rooster', name: 'ديك',    emoji: '🐓', color: '#DC2626', type: 'animal', multiplier: 45 },
  { id: 'sheep',   name: 'خروف',   emoji: '🐑', color: '#A3A3A3', type: 'animal', multiplier: 15 },
  { id: 'shrimp',  name: 'جمبري',  emoji: '🦐', color: '#EC4899', type: 'animal', multiplier: 10 },
  { id: 'fish',    name: 'سمكة',   emoji: '🐟', color: '#3B82F6', type: 'animal', multiplier: 25 },
];

// الاحتمال النظري = (1 / المضاعف) * 100
const THEORETICAL_WEIGHTS: Record<SymbolId, number> = (() => {
  const raw: Record<string, number> = {};
  let sum = 0;
  SYMBOLS.forEach(s => {
    raw[s.id] = 1 / s.multiplier;
    sum += raw[s.id];
  });
  const normalized: Record<string, number> = {};
  SYMBOLS.forEach(s => {
    normalized[s.id] = (raw[s.id] / sum) * 100;
  });
  return normalized as Record<SymbolId, number>;
})();

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ fontFamily: 'var(--font-cairo), sans-serif' }}>
      
      {/* ========== Top Bar ========== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0F]/70 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">محلل العجلة</h1>
              <p className="text-[10px] text-slate-500">Wheel Analyzer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <TopStat label="إجمالي" value={sequence.length} />
            <TopStat label="آخر نتيجة" value={sequence.length > 0 ? SYMBOLS.find(s => s.id === sequence[sequence.length - 1].symbol_id)?.emoji ?? '—' : '—'} />
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] text-green-400 font-medium">متصل</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========== Main Content ========== */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8">

        {error && (
          <div className="mb-6 surface p-3 flex items-center justify-between text-red-400 text-sm animate-fade-in">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white text-xs underline">
              إغلاق
            </button>
          </div>
        )}

        {/* ========== Hero Grid ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mb-6">

          {/* Wheel */}
          <div className="lg:col-span-5 surface-elevated p-6 md:p-8 flex flex-col items-center justify-center min-h-[440px]">
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <p className="section-label">العجلة</p>
                <p className="text-xs text-slate-500 mt-0.5">Wheel Overview</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-indigo-300 font-medium">Live</span>
              </div>
            </div>
            <WheelDisplay sequence={sequence} />
          </div>

          {/* Controls + Last Results */}
          <div className="lg:col-span-7 space-y-5">

            {/* Register */}
            <div className="surface p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">تسجيل</p>
                  <p className="text-sm font-semibold text-white mt-0.5">سجّل النتيجة</p>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              <div className="grid grid-cols-4 gap-2.5 md:gap-3">
                {SYMBOLS.map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => handleAddSymbol(sym.id)}
                    disabled={submitting}
                    className="group relative surface-subtle p-3 md:p-4 flex flex-col items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                    title={`${sym.name} (×${sym.multiplier})`}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at center, ${sym.color}15, transparent 70%)` }}
                    />
                    <span className="relative text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-200">
                      {sym.emoji}
                    </span>
                    <span className="relative text-[10px] text-slate-400 group-hover:text-white transition-colors font-medium">{sym.name}</span>
                    <span className="relative text-[9px] text-indigo-400 font-bold">×{sym.multiplier}</span>
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: sym.color }}
                    />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <button
                  onClick={handleUndo}
                  disabled={submitting || sequence.length === 0}
                  className="btn-ghost flex items-center justify-center gap-2 px-3 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  تراجع
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={submitting || sequence.length === 0}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الكل
                </button>
              </div>
            </div>

            {/* Last Results */}
            <div className="surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">آخر 20 نتيجة</p>
                  <p className="text-[10px] text-slate-500">Recent Results</p>
                </div>
              </div>
              <LastResults sequence={sequence} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <QuickStat 
                label="إجمالي النتائج" 
                value={sequence.length} 
                icon={<BarChart3 className="w-4 h-4" />}
                accent="indigo"
              />
              <QuickStat 
                label="الرمز الأكثر" 
                value={getMostFrequent(sequence)} 
                icon={<Crown className="w-4 h-4" />}
                accent="amber"
              />
            </div>
          </div>
        </div>

        {/* ========== Bento Grid: Analytics ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">

          {/* Frequency */}
          <div className="lg:col-span-4 surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">تكرار الرموز</p>
                <p className="text-[10px] text-slate-500">Frequency</p>
              </div>
            </div>
            <FrequencyList sequence={sequence} />
          </div>

          {/* Gap */}
          <div className="lg:col-span-4 surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">الغياب (Gap)</p>
                <p className="text-[10px] text-slate-500">Missed Rounds</p>
              </div>
            </div>
            <GapDisplay sequence={sequence} />
          </div>

          {/* Expected */}
          <div className="lg:col-span-4 surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">الرموز المتوقعة</p>
                <p className="text-[10px] text-slate-500">Predicted</p>
              </div>
            </div>
            <ExpectedSymbols sequence={sequence} />
          </div>

          {/* EV Calculator - NEW */}
          <div className="lg:col-span-12 surface p-5">
            <EVCalculator sequence={sequence} />
          </div>

          {/* Transition */}
          <div className="lg:col-span-12 surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">تحليل الانتقالات</p>
                <p className="text-[10px] text-slate-500">Transitions</p>
              </div>
            </div>
            <TransitionAnalyzer sequence={sequence} />
          </div>

          {/* CSV */}
          <div className="lg:col-span-12 surface p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">استيراد / تصدير</p>
                  <p className="text-[10px] text-slate-500">CSV Import & Export</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => exportCSV(sequence)}
                  disabled={sequence.length === 0}
                  className="btn-ghost flex items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  تصدير CSV
                </button>
                <label className="btn-accent flex items-center justify-center gap-2 px-4 py-2.5 text-sm cursor-pointer">
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
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 mt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Wheel Analyzer — محلل العجلة</span>
          <span>Data-driven predictions</span>
        </div>
      </footer>
    </main>
  );
}

// ==========================================
// Small Components
// ==========================================
function TopStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center md:items-end">
      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-white stat-number">{value}</span>
    </div>
  );
}

function QuickStat({ 
  label, value, icon, accent 
}: { 
  label: string; value: string | number; icon: React.ReactNode; accent: 'indigo' | 'amber' 
}) {
  const accentStyles = {
    indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
  };
  
  return (
    <div className={`surface p-4 md:p-5 relative overflow-hidden group`}>
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-bl ${accentStyles[accent]} opacity-50`}></div>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-white stat-number">{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${accentStyles[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Wheel Display
// ==========================================
function WheelDisplay({ sequence }: { sequence: SequenceRow[] }) {
  const size = 400;
  const center = size / 2;
  const radius = center - 40;
  const sliceAngle = (2 * Math.PI) / SYMBOLS.length;
  const lastSymbol = sequence.length > 0 ? sequence[sequence.length - 1].symbol_id : null;

  return (
    <div className="flex flex-col items-center animate-fade-in-scale">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-3xl scale-90"></div>
        
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`} 
          className="relative drop-shadow-2xl"
        >
          <circle cx={center} cy={center} r={radius + 20} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
          <circle cx={center} cy={center} r={radius + 12} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          
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
            const textX = center + (radius * 0.68) * Math.cos(midAngle);
            const textY = center + (radius * 0.68) * Math.sin(midAngle);
            const isLast = lastSymbol === sym.id;

            return (
              <g key={sym.id}>
                <path
                  d={path}
                  fill={sym.color}
                  opacity={isLast ? 1 : 0.7}
                  stroke="#0A0A0F"
                  strokeWidth="1.5"
                  className={isLast ? 'animate-pulse' : ''}
                  style={{ transition: 'opacity 0.3s' }}
                />
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="36"
                  className="select-none"
                  style={{ pointerEvents: 'none' }}
                >
                  {sym.emoji}
                </text>
              </g>
            );
          })}

          <circle cx={center} cy={center} r="46" fill="#0A0A0F" stroke="rgba(99,102,241,0.4)" strokeWidth="2" />
          <circle cx={center} cy={center} r="40" fill="url(#centerGrad)" />
          <defs>
            <radialGradient id="centerGrad">
              <stop offset="0%" stopColor="#1E1E2E" />
              <stop offset="100%" stopColor="#0A0A0F" />
            </radialGradient>
          </defs>
          <text
            x={center}
            y={center - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fill="#FFFFFF"
            fontWeight="800"
            className="stat-number"
          >
            {sequence.length}
          </text>
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="#64748B"
            fontWeight="600"
            letterSpacing="1"
          >
            TOTAL
          </text>
        </svg>
      </div>

      {lastSymbol && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full surface-subtle animate-fade-in">
          <span className="text-xs text-slate-500">آخر نتيجة</span>
          <span className="text-lg">{SYMBOLS.find(s => s.id === lastSymbol)?.emoji}</span>
          <span className="text-sm font-bold text-white">{SYMBOLS.find(s => s.id === lastSymbol)?.name}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Gap Display
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
    <div className="space-y-1.5">
      {gaps.map((g) => {
        let colorClass = 'text-green-400 bg-green-500/10 border-green-500/20';
        let dotColor = 'bg-green-500';
        if (g.neverAppeared) {
          colorClass = 'text-slate-400 bg-slate-500/10 border-slate-500/20';
          dotColor = 'bg-slate-500';
        } else if (g.gap > 20) {
          colorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
          dotColor = 'bg-red-500';
        } else if (g.gap >= 10) {
          colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          dotColor = 'bg-amber-500';
        }

        return (
          <div
            key={g.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorClass} transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
              <span className="text-base">{g.emoji}</span>
              <span className="text-xs font-medium">{g.name}</span>
            </div>
            <span className="text-sm font-bold stat-number">
              {g.neverAppeared ? '—' : g.gap}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Helpers
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
// Frequency List
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
          <div key={sym.id} className="flex items-center gap-2 group">
            <span className="text-base w-6 shrink-0">{sym.emoji}</span>
            <div className="flex-1 h-6 bg-white/[0.03] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                style={{ 
                  width: `${Math.max(pct, 4)}%`, 
                  background: `linear-gradient(90deg, ${sym.color}, ${sym.color}dd)`,
                  boxShadow: `0 0 12px ${sym.color}40`
                }}
              >
                <span className="text-[9px] text-white font-bold stat-number">{count}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 w-10 text-left stat-number shrink-0">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Transition Analyzer
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
      <p className="text-[10px] text-slate-500 mb-2">اختر رمز لتحليل ما يليه</p>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 mb-3">
        {SYMBOLS.map(sym => (
          <button
            key={sym.id}
            onClick={() => setSelected(selected === sym.id ? null : sym.id)}
            className={`p-2 rounded-lg transition-all border text-xl ${
              selected === sym.id
                ? 'bg-indigo-500/20 border-indigo-500/50 scale-105 shadow-lg shadow-indigo-500/20'
                : 'surface-subtle border-transparent hover:border-white/10'
            }`}
          >
            {sym.emoji}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-1.5 animate-fade-in">
          <p className="text-[10px] text-slate-500 mb-1">احتمالات الرموز بعد {SYMBOLS.find(s => s.id === selected)?.emoji}:</p>
          {SYMBOLS
            .map(s => ({ ...s, pct: transitions[s.id] || 0 }))
            .sort((a, b) => b.pct - a.pct)
            .filter(s => s.pct > 0)
            .map(s => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-5">{s.emoji}</span>
                <div className="flex-1 h-4 bg-white/[0.03] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-10 text-left stat-number">{s.pct.toFixed(0)}%</span>
              </div>
            ))}
          {Object.values(transitions).every(v => v === 0) && (
            <p className="text-[10px] text-slate-600 text-center py-2">لا توجد بيانات كافية</p>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Advanced Analysis
// ==========================================
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

function getAverageInterval(intervals: number[]): number | null {
  if (intervals.length === 0) return null;
  const sum = intervals.reduce((a, b) => a + b, 0);
  return sum / intervals.length;
}

// ==========================================
// Expected Symbols (UPDATED with Theoretical Weights)
// ==========================================
function ExpectedSymbols({ sequence }: { sequence: SequenceRow[] }) {
  if (sequence.length === 0) {
    return <p className="text-xs text-slate-600 text-center py-6">لا توجد بيانات كافية</p>;
  }

  const total = sequence.length;
  const recent = sequence.slice(-15);
  const recentTotal = recent.length;
  const dataWeight = Math.min(sequence.length / 50, 1);

  const scores = SYMBOLS.map(sym => {
    const theoreticalPct = THEORETICAL_WEIGHTS[sym.id];
    const totalCount = sequence.filter(s => s.symbol_id === sym.id).length;
    const generalPct = (totalCount / total) * 100;
    const recentCount = recent.filter(s => s.symbol_id === sym.id).length;
    const recentPct = recentTotal > 0 ? (recentCount / recentTotal) * 100 : 0;

    let currentGap = 0;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i].symbol_id === sym.id) break;
      currentGap++;
    }

    const intervals = getSymbolIntervals(sequence, sym.id);
    const avgInterval = getAverageInterval(intervals);
    let overdueBonus = 0;

    if (avgInterval !== null && avgInterval > 0) {
      if (currentGap / avgInterval > 1.5) {
        overdueBonus = 12;
      }
    }

    const gapWeight = Math.min((currentGap / Math.max(total, 1)) * 100 * 2, 25);

    const dataScore = (generalPct * 0.5) + (recentPct * 0.3) + (gapWeight * 0.2);
    const blendedScore = (theoreticalPct * (1 - dataWeight)) + (dataScore * dataWeight);

    return {
      ...sym, score: blendedScore + overdueBonus, currentGap, avgInterval,
      overdueBonus, generalPct, recentPct, theoreticalPct, gapWeight,
    };
  }).sort((a, b) => b.score - a.score);

  const veggies = scores.filter(s => s.type === 'vegetable').slice(0, 3);
  const animals = scores.filter(s => s.type === 'animal').slice(0, 2);
  const finalPicks = [...veggies, ...animals].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {finalPicks.map(s => (
          <div 
            key={s.id} 
            className={`relative p-2 rounded-xl text-center border transition-all hover:scale-105 ${
              s.overdueBonus > 0 
                ? 'bg-green-500/10 border-green-500/40 shadow-lg shadow-green-500/10' 
                : 'surface-subtle border-white/5'
            }`}
          >
            <div className="text-xl md:text-2xl">{s.emoji}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{s.name}</div>
            <div className={`text-[11px] font-bold mt-0.5 stat-number ${s.overdueBonus > 0 ? 'text-green-400' : 'text-amber-400'}`}>
              {s.score.toFixed(0)}%
            </div>
            <div className="text-[8px] text-indigo-400 mt-0.5">×{s.multiplier}</div>
            {s.overdueBonus > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px]">
                🔥
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
        {finalPicks.map(s => (
          <div key={s.id} className="flex items-center gap-2 text-[10px]">
            <span className="text-sm w-5">{s.emoji}</span>
            <span className="text-slate-400 w-14 truncate">{s.name}</span>
            <div className="flex-1 flex flex-wrap gap-x-2 gap-y-0.5 text-slate-500">
              <span>نظري <span className="text-indigo-400 stat-number">{s.theoreticalPct.toFixed(1)}%</span></span>
              <span>·</span>
              <span>عام <span className="text-slate-300 stat-number">{s.generalPct.toFixed(0)}%</span></span>
              <span>·</span>
              <span>غياب <span className="text-slate-300 stat-number">{s.currentGap}</span></span>
              {s.overdueBonus > 0 && <span className="text-green-400">· 🔥</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 text-center pt-1">
        {sequence.length < 50 
          ? `التحليل يعتمد ${Math.round((1 - dataWeight) * 100)}% على المضاعفات و${Math.round(dataWeight * 100)}% على بياناتك (سجّل المزيد لتحسين الدقة)` 
          : 'التحليل يعتمد على بياناتك الفعلية بشكل أساسي'}
      </p>
    </div>
  );
}

// ==========================================
// EV Calculator - NEW
// ==========================================
function EVCalculator({ sequence }: { sequence: SequenceRow[] }) {
  const [betAmount, setBetAmount] = useState<number>(1000);
  const total = sequence.length;

  if (sequence.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">حاسبة الرهان (EV)</p>
            <p className="text-[10px] text-slate-500">Expected Value Calculator</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 text-center py-6">سجّل نتائج أولاً لحساب القيمة المتوقعة</p>
      </div>
    );
  }

  const counts: Record<string, number> = {};
  SYMBOLS.forEach(s => { counts[s.id] = 0; });
  sequence.forEach(s => { counts[s.symbol_id]++; });

  const results = SYMBOLS.map(sym => {
    const actualProb = counts[sym.id] / total;
    const winAmount = betAmount * (sym.multiplier - 1);
    const ev = (actualProb * winAmount) - ((1 - actualProb) * betAmount);
    return { ...sym, actualProb, ev, winAmount };
  }).sort((a, b) => b.ev - a.ev);

  const hasPositiveEV = results.some(r => r.ev > 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">حاسبة الرهان (EV)</p>
            <p className="text-[10px] text-slate-500">Expected Value Calculator</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <label className="text-[10px] text-slate-400">مبلغ الرهان:</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value) || 0))}
            className="w-24 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white stat-number focus:outline-none focus:border-indigo-500/50"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {results.map(r => {
          const isPositive = r.ev > 0;
          return (
            <div 
              key={r.id}
              className={`p-3 rounded-xl border transition-all hover:scale-[1.02] ${
                isPositive
                  ? 'bg-green-500/10 border-green-500/40 shadow-lg shadow-green-500/10'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-[10px] text-slate-300 font-medium">{r.name}</span>
                </div>
                <span className="text-[9px] text-indigo-400 font-bold">×{r.multiplier}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-500">احتمال</span>
                  <span className="text-slate-300 stat-number">{(r.actualProb * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-500">ربح محتمل</span>
                  <span className="text-slate-300 stat-number">{r.winAmount.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between text-[10px] font-bold pt-1 border-t border-white/5 ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span>EV</span>
                  <span className="stat-number">
                    {r.ev > 0 ? '+' : ''}{r.ev.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-3 p-2.5 rounded-lg flex items-start gap-2 text-[10px] ${
        hasPositiveEV 
          ? 'bg-green-500/10 border border-green-500/20 text-green-300' 
          : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
      }`}>
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          {hasPositiveEV 
            ? 'الرموز الخضراء عندها قيمة متوقعة موجبة (رهان مربح على المدى الطويل).' 
            : 'لا يوجد رموز بقيمة متوقعة موجبة حالياً. الأفضل تجنب الرهان أو الانتظار لبيانات أكثر.'}
          {' '}
          تذكّر: EV إيجابي لا يعني ربح مؤكد، بل متوسط ربح على المدى الطويل.
        </span>
      </div>
    </div>
  );
}

// ==========================================
// Last Results
// ==========================================
function LastResults({ sequence }: { sequence: SequenceRow[] }) {
  const last = sequence.slice(-20).reverse();
  if (last.length === 0) {
    return <p className="text-xs text-slate-600 text-center py-6">لا توجد نتائج بعد</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {last.map((row, idx) => {
        const sym = SYMBOLS.find(s => s.id === row.symbol_id);
        const isHighlighted = idx === 10 || idx === 19;
        return (
          <div
            key={row.id}
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all hover:scale-110 ${
              isHighlighted 
                ? 'bg-green-500/20 border border-green-500/50 shadow-lg shadow-green-500/20' 
                : 'surface-subtle'
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
// CSV Functions
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