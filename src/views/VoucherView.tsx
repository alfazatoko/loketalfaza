import React from 'react';
import { Gem, Tag } from 'lucide-react';

interface VoucherViewProps {
  onBack: () => void;
  currentRole: string;
  theme: 'light' | 'dark' | 'blue';
}

export const VoucherView: React.FC<VoucherViewProps> = ({ theme }) => {
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} text-center`}>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Stok Voucher</p>
          <p className="text-xl font-black tabular-nums">0 Pcs</p>
        </div>
        <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} text-center`}>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Voucher Terjual</p>
          <p className="text-xl font-black tabular-nums text-blue-600">0</p>
        </div>
      </div>

      <div className={`rounded-[2rem] p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-gray-100 min-h-[250px] flex flex-col items-center justify-center`}>
        <Gem className="w-12 h-12 mb-4 text-orange-200" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada inventori voucher</p>
      </div>

      <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-orange-100">
        <Tag className="w-4 h-4" /> Tambah Stok
      </button>
    </div>
  );
};
