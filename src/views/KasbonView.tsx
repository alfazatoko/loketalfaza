import React from 'react';
import { NotebookPen, Plus } from 'lucide-react';

interface KasbonViewProps {
  onBack: () => void;
  currentRole: string;
  theme: 'light' | 'dark' | 'blue';
}

export const KasbonView: React.FC<KasbonViewProps> = ({ theme }) => {
  return (
    <div className="p-5 space-y-6">
      <div className={`rounded-3xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-gray-100 shadow-sm`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <NotebookPen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Catatan Kasbon</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kelola piutang pelanggan</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <NotebookPen className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada data kasir/pelanggan</p>
        </div>

        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Kasbon
        </button>
      </div>
    </div>
  );
};
