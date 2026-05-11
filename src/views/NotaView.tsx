import React from 'react';
import { Receipt, Printer, Share2, Download } from 'lucide-react';

interface NotaViewProps {
  onBack: () => void;
  theme: 'light' | 'dark' | 'blue';
}

export const NotaView: React.FC<NotaViewProps> = ({ theme }) => {
  return (
    <div className="p-5 space-y-6">
      <div className={`rounded-[2.5rem] p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-dashed border-gray-200 relative overflow-hidden`}>
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-gray-50 rounded-full" />
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gray-50 rounded-full" />
        
        <div className="text-center mb-8 border-b border-dashed border-gray-100 pb-6">
          <h2 className="text-xl font-black tracking-tighter">LOKET ALFAZA</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Struk Transaksi Digital</p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>No. Ref</span>
            <span className="text-gray-800">#TRX-000000</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Tanggal</span>
            <span className="text-gray-800">-- / -- / ----</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 opacity-20">
          <Receipt className="w-16 h-16 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Pilih transaksi untuk cetak nota</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
          <Printer className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Print</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
          <Share2 className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Share</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
          <Download className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Save</span>
        </button>
      </div>
    </div>
  );
};
