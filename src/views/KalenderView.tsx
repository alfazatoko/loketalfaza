import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface KalenderViewProps {
  onBack: () => void;
  theme: 'light' | 'dark' | 'blue';
}

export const KalenderView: React.FC<KalenderViewProps> = ({ theme }) => {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const today = new Date();
  
  return (
    <div className="p-5 space-y-4">
      <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-gray-100 shadow-sm`}>
        <div className="flex justify-between items-center mb-8">
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-black text-sm uppercase tracking-[0.2em]">Mei 2026</h2>
          <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map(d => (
            <div key={d} className="text-[10px] font-black text-gray-300 uppercase text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 31 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${i + 1 === today.getDate() ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-gray-50 text-gray-400'}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50/30 border-blue-100'} flex items-center gap-4`}>
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Catatan Hari Ini</p>
          <p className="text-xs font-medium text-gray-400">Tidak ada agenda khusus hari ini.</p>
        </div>
      </div>
    </div>
  );
};
