import React from 'react';
import { UserIcon, Plus, Search } from 'lucide-react';

interface KontakViewProps {
  onBack: () => void;
  currentRole: string;
  theme: 'light' | 'dark' | 'blue';
}

export const KontakView: React.FC<KontakViewProps> = ({ theme }) => {
  return (
    <div className="p-5 space-y-4">
      <div className={`relative ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari kontak pelanggan..."
          className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} text-xs font-bold outline-none focus:border-blue-500 transition-all`}
        />
      </div>

      <div className={`rounded-3xl p-5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-gray-100 min-h-[300px] flex flex-col items-center justify-center text-center`}>
        <UserIcon className="w-12 h-12 mb-4 text-gray-200" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar kontak kosong</p>
      </div>

      <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
        <Plus className="w-4 h-4" /> Kontak Baru
      </button>
    </div>
  );
};
