import React, { useState, useEffect, useMemo } from 'react';
import { 
  NotebookPen, 
  UserIcon, 
  Gem, 
  CalendarDays, 
  Receipt, 
  Home, 
  Clock, 
  Wallet, 
  BarChart3, 
  User, 
  ArrowLeft, 
  Bell, 
  Plus, 
  History,
  ChevronRight,
  ShoppingCart,
  Banknote,
  Coins,
  ArrowRightLeft,
  Bolt,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  Pencil,
  X
} from 'lucide-react';
import { supabase } from './supabase';

// --- Types ---
interface Transaction {
  id: string | number;
  kategori: string;
  nominal: number;
  adminFee: number;
  keterangan: string;
  waktu: string;
  tanggalISO: string;
  kasir: string;
}

// --- Components ---

const ViewLayout: React.FC<{ 
  id: string; 
  active: boolean; 
  title: string; 
  children: React.ReactNode; 
  onBack?: () => void;
  showBack?: boolean;
}> = ({ id, active, title, children, onBack, showBack = false }) => (
  <div 
    id={id} 
    className={`flex-1 flex flex-col min-h-0 bg-[#f8fafc] ${active ? 'flex' : 'hidden'} animate-fadeIn`}
  >
    {title && (
      <div className="px-5 pt-7 pb-4 border-b border-gray-100 flex items-center gap-3 bg-white">
        {showBack && (
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
    )}
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('view-beranda');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<'OWNER' | 'KASIR 1' | 'KASIR 2'>('OWNER');

  // Form State
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Isi Saldo Form
  const [jenisSaldo, setJenisSaldo] = useState('');
  const [nominalIsi, setNominalIsi] = useState('');
  const [keteranganIsi, setKeteranganIsi] = useState('');

  // --- Fetch Data ---
  useEffect(() => {
    fetchTransactions();
    // Subscribe to changes
    const subscription = supabase
      .channel('public:transaksi_loket')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi_loket' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transaksi_loket')
      .select('*')
      .order('waktu', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
  };

  // --- Calculations ---
  const today = new Date().toISOString().split('T')[0];
  
  const transactionsToday = useMemo(() => {
    return transactions.filter(t => t.tanggalISO === today && (currentRole === 'OWNER' || t.kasir === currentRole));
  }, [transactions, today, currentRole]);

  const saldoBank = useMemo(() => {
    // Basic logic from legacy HTML: 
    // Transfer/DANA/FLIP/Kuota -> saldoBank -= nominal
    // Isi Saldo Bank -> saldoBank += nominal
    return transactions.reduce((acc, t) => {
      if (t.kategori === 'Isi Saldo Bank') return acc + t.nominal;
      if (['Transfer Bank', 'DANA', 'FLIP', 'Order Kuota'].includes(t.kategori)) return acc - t.nominal;
      return acc;
    }, 1000000); // Base balance as per legacy HTML
  }, [transactions]);

  const totalPenjualan = useMemo(() => {
    // Basic logic from legacy HTML:
    // Transfer/DANA/FLIP/Kuota -> totalPenjualan += nominal
    // Tarik Tunai -> totalPenjualan -= nominal
    // Isi Total Penjualan -> totalPenjualan += nominal
    return transactions.reduce((acc, t) => {
      if (t.kategori === 'Isi Total Penjualan') return acc + t.nominal;
      if (['Transfer Bank', 'DANA', 'FLIP', 'Order Kuota'].includes(t.kategori)) return acc + t.nominal;
      if (t.kategori === 'Tarik Tunai') return acc - t.nominal;
      return acc;
    }, 0);
  }, [transactions]);

  const totalAdmin = useMemo(() => transactionsToday.reduce((sum, t) => sum + t.adminFee, 0), [transactionsToday]);
  const totalVolume = useMemo(() => transactionsToday.reduce((sum, t) => sum + t.nominal, 0), [transactionsToday]);

  // --- Handlers ---
  const formatRupiah = (val: string) => {
    const numberString = val.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setKategori(t.kategori);
    setNominal(formatRupiah(t.nominal.toString()));
    setAdminFee(formatRupiah(t.adminFee.toString()));
    setKeterangan(t.keterangan === '-' ? '' : t.keterangan);
    setCurrentView('view-beranda');
    
    // Scroll ke atas agar user sadar form sudah terisi
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatalEdit = () => {
    setEditingId(null);
    setKategori('');
    setNominal('');
    setAdminFee('');
    setKeterangan('');
  };

  const handleSimpanTransaksi = async () => {
    if (!kategori || !nominal) return alert('Kategori dan Nominal harus diisi!');

    const rawNominal = parseInt(nominal.replace(/\./g, '')) || 0;
    const rawAdmin = parseInt(adminFee.replace(/\./g, '')) || 0;
    
    try {
      if (editingId) {
        // --- MODE UPDATE ---
        const { error } = await supabase
          .from('transaksi_loket')
          .update({
            kategori,
            nominal: rawNominal,
            adminFee: rawAdmin,
            keterangan: keterangan || '-',
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Transaksi Berhasil Diperbarui!');
      } else {
        // --- MODE SIMPAN BARU ---
        const now = new Date();
        const newTransaction = {
          tanggal: now.toLocaleDateString('id-ID'),
          tanggalISO: today,
          kategori,
          nominal: rawNominal,
          adminFee: rawAdmin,
          keterangan: keterangan || '-',
          waktu: now.toISOString(),
          kasir: currentRole
        };

        const { error } = await supabase.from('transaksi_loket').insert([newTransaction]);
        if (error) throw error;
        alert('Transaksi Berhasil Disimpan!');
      }

      // Bersihkan Form
      handleBatalEdit();
      setCurrentView('view-beranda');
      fetchTransactions(); // Refresh data
    } catch (error: any) {
      alert('Gagal: ' + error.message);
    }
  };

  const handleSimpanIsiSaldo = async () => {
    if (!jenisSaldo || !nominalIsi) return alert('Pilih jenis saldo dan nominal!');

    const rawNominal = parseInt(nominalIsi.replace(/\./g, '')) || 0;
    const now = new Date();

    const newTransaction = {
      tanggal: now.toLocaleDateString('id-ID'),
      tanggalISO: today,
      kategori: `Isi ${jenisSaldo}`,
      nominal: rawNominal,
      adminFee: 0,
      keterangan: keteranganIsi || 'Setoran saldo',
      waktu: now.toISOString(),
      kasir: currentRole
    };

    const { error } = await supabase.from('transaksi_loket').insert([newTransaction]);

    if (error) {
      alert('Gagal menyimpan saldo: ' + error.message);
    } else {
      alert('Saldo Berhasil Ditambahkan!');
      setJenisSaldo('');
      setNominalIsi('');
      setKeteranganIsi('');
      setCurrentView('view-beranda');
    }
  };

  const handleLogin = (role: 'OWNER' | 'KASIR 1' | 'KASIR 2') => {
    setCurrentRole(role);
    setIsLoggedIn(true);
  };

  // --- Render Functions ---

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f1f5f9] p-6 font-plus">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-100 border border-white">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">LOKET ALFAZA</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Sistem Keuangan Multi-Kasir</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleLogin('OWNER')}
              className="w-full p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold flex items-center justify-between group hover:scale-[1.02] transition-all shadow-lg shadow-blue-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-100 font-medium">Masuk sebagai</p>
                  <p className="text-base uppercase tracking-wider">OWNER</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => handleLogin('KASIR 1')}
              className="w-full p-5 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium">Masuk sebagai</p>
                  <p className="text-base uppercase tracking-wider">KASIR 1</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => handleLogin('KASIR 2')}
              className="w-full p-5 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium">Masuk sebagai</p>
                  <p className="text-base uppercase tracking-wider">KASIR 2</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-300 mt-12 uppercase tracking-[0.2em] font-bold">Powered by Antigravity v2.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen font-plus">
      <div className="w-full max-w-[420px] bg-[#f8fafc] h-screen relative overflow-hidden flex flex-col shadow-2xl">
        
        {/* --- VIEWS --- */}

        {/* BERANDA */}
        <ViewLayout id="view-beranda" active={currentView === 'view-beranda'} title="">
          {/* HEADER */}
          <div className="px-5 pt-7 pb-3 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
            <button className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
              <Bolt className="w-4 h-4" />
            </button>
            <div className="flex-1 ml-3">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Selamat Siang,</p>
              <h1 className="text-lg font-black text-gray-800 tracking-tight">
                LOKET <span className="text-blue-600">ALFAZA</span>
                <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded-full ml-1 font-bold">PRO</span>
              </h1>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 border border-gray-100">
                <Bell className="w-4 h-4" />
              </div>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </div>
          </div>

          {/* SALDO CARD */}
          <div className="mx-5 mt-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mb-1 opacity-80">Saldo Bank</p>
                <h2 className="text-2xl font-black tabular-nums tracking-tighter">Rp {saldoBank.toLocaleString('id-ID')}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mb-1 opacity-80">Penjualan</p>
                <h2 className="text-2xl font-black tabular-nums tracking-tighter">Rp {totalPenjualan.toLocaleString('id-ID')}</h2>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('view-saldo-detail')}
              className="w-full py-3.5 bg-white/15 backdrop-blur-md rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
            >
              Lihat Detail <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* MENU GRID */}
          <div className="px-5 mt-8 grid grid-cols-5 gap-3">
            {[
              { id: 'view-kasbon', label: 'KASBON', icon: NotebookPen, color: 'from-blue-500 to-blue-600' },
              { id: 'view-kontak', label: 'KONTAK', icon: UserIcon, color: 'from-emerald-500 to-emerald-600' },
              { id: 'view-stok-voucher', label: 'VOUCHER', icon: Gem, color: 'from-orange-500 to-orange-600' },
              { id: 'view-kalender', label: 'KALENDER', icon: CalendarDays, color: 'from-rose-500 to-rose-600' },
              { id: 'view-nota', label: 'NOTA', icon: Receipt, color: 'from-purple-500 to-purple-600' },
            ].map(m => (
              <div 
                key={m.id}
                onClick={() => setCurrentView(m.id)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-all`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-gray-500 mt-2 tracking-widest">{m.label}</span>
              </div>
            ))}
          </div>

          {/* FORM TRANSAKSI */}
          <div className="mx-5 mt-10 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-sm tracking-tight">
                    {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">
                    {editingId ? 'Perbarui data penjualan' : 'Input data penjualan'}
                  </p>
                </div>
              </div>
              {editingId && (
                <button 
                  onClick={handleBatalEdit}
                  className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Kategori</label>
                <select 
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="" disabled>Pilih kategori</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="DANA">DANA</option>
                  <option value="FLIP">FLIP</option>
                  <option value="Order Kuota">Order Kuota</option>
                  <option value="Tarik Tunai">Tarik Tunai</option>
                  <option value="Aksesoris">Aksesoris</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nominal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                    <input 
                      type="text" 
                      placeholder="0"
                      value={nominal}
                      onChange={(e) => setNominal(formatRupiah(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-black text-gray-800 outline-none focus:border-blue-500 transition-all tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Admin Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                    <input 
                      type="text" 
                      placeholder="0"
                      value={adminFee}
                      onChange={(e) => setAdminFee(formatRupiah(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-black text-gray-800 outline-none focus:border-blue-500 transition-all tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Keterangan</label>
                <textarea 
                  rows={2}
                  placeholder="Masukkan keterangan..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleSimpanTransaksi}
                className={`w-full py-4 ${editingId ? 'bg-amber-500' : 'bg-blue-600'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:opacity-90 active:scale-95 transition-all mt-2`}
              >
                {editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
              </button>
            </div>
          </div>

          {/* TRANSAKSI TERAKHIR */}
          <div className="px-5 mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 text-sm tracking-tight uppercase tracking-widest">Ringkasan Hari Ini</h3>
              <button 
                onClick={() => setCurrentView('view-transaksi')}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-3xl p-5 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Transaksi</p>
                    <p className="text-base font-black text-gray-800 tabular-nums">{transactionsToday.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 100%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Volume</p>
                    <p className="text-base font-black text-gray-800 tabular-nums">Rp {totalVolume.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Admin</p>
                    <p className="text-base font-black text-gray-800 tabular-nums">Rp {totalAdmin.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ViewLayout>

        {/* RIWAYAT */}
        <ViewLayout id="view-transaksi" active={currentView === 'view-transaksi'} title="Riwayat Transaksi">
          <div className="p-5 space-y-3">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">Belum ada transaksi</p>
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {t.kategori}
                      </span>
                      <h3 className="font-black text-gray-800 mt-2 text-lg tabular-nums">Rp {t.nominal.toLocaleString('id-ID')}</h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">{t.keterangan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                        {new Date(t.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs font-black text-emerald-500 mt-2">+ Rp {t.adminFee.toLocaleString('id-ID')}</p>
                      <p className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest opacity-60">{t.kasir}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                    <button 
                      onClick={() => handleEdit(t)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Data
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ViewLayout>

        {/* ISI SALDO */}
        <ViewLayout id="view-isi-saldo" active={currentView === 'view-isi-saldo'} title="Tambah Saldo">
          <div className="p-5 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Jenis Saldo</label>
                  <select 
                    value={jenisSaldo}
                    onChange={(e) => setJenisSaldo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Pilih jenis saldo</option>
                    <option value="Saldo Bank">Saldo Bank</option>
                    <option value="Total Penjualan">Total Penjualan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nominal</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                    <input 
                      type="text" 
                      placeholder="0"
                      value={nominalIsi}
                      onChange={(e) => setNominalIsi(formatRupiah(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-5 text-base font-black text-gray-800 outline-none focus:border-blue-500 transition-all tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Keterangan</label>
                  <textarea 
                    rows={3}
                    placeholder="Masukkan keterangan tambahan..."
                    value={keteranganIsi}
                    onChange={(e) => setKeteranganIsi(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                <button 
                  onClick={handleSimpanIsiSaldo}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Simpan Saldo
                </button>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
              <h4 className="font-black text-blue-600 text-xs uppercase tracking-widest mb-2">Informasi</h4>
              <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                Penambahan saldo ini akan tercatat dalam riwayat transaksi sebagai data setoran manual dan akan memperbarui tampilan saldo di beranda.
              </p>
            </div>
          </div>
        </ViewLayout>

        {/* LAPORAN */}
        <ViewLayout id="view-laporan" active={currentView === 'view-laporan'} title="Laporan Keuangan">
          <div className="flex flex-col items-center justify-center h-full py-40 text-gray-300 px-10 text-center">
            <BarChart3 className="w-16 h-16 mb-6 opacity-20" />
            <h3 className="font-black text-gray-400 text-sm uppercase tracking-widest">Laporan Sedang Disiapkan</h3>
            <p className="text-xs font-medium text-gray-400 mt-2">Fitur analisis keuangan mendalam akan segera hadir untuk membantu monitoring bisnis Anda.</p>
          </div>
        </ViewLayout>

        {/* AKUN */}
        <ViewLayout id="view-akun" active={currentView === 'view-akun'} title="Profil Akun">
          <div className="p-5">
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-[2rem] mx-auto flex items-center justify-center text-blue-600 mb-6 border-4 border-white shadow-xl shadow-blue-50">
                <UserCircle className="w-12 h-12" />
              </div>
              <h3 className="font-black text-xl text-gray-800 uppercase tracking-tight">{currentRole}</h3>
              <p className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full inline-block mt-3 uppercase tracking-widest">Kasir Terdaftar</p>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-3xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-bold text-gray-700">Aktif</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-3xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Versi App</p>
                  <p className="text-xs font-bold text-gray-700">2.0.4</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsLoggedIn(false)}
              className="w-full py-5 bg-white border-2 border-red-50 text-red-500 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun
            </button>
          </div>
        </ViewLayout>

        {/* DETAIL SALDO */}
        <ViewLayout 
          id="view-saldo-detail" 
          active={currentView === 'view-saldo-detail'} 
          title="Rincian Saldo" 
          showBack 
          onBack={() => setCurrentView('view-beranda')}
        >
          <div className="p-5 space-y-4">
            <div className="bg-blue-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-blue-100">
              <span className="font-black text-xs uppercase tracking-widest opacity-80">Saldo Bank</span>
              <span className="text-xl font-black tabular-nums tracking-tighter">Rp {saldoBank.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-emerald-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-emerald-100">
              <span className="font-black text-xs uppercase tracking-widest opacity-80">Penjualan</span>
              <span className="text-xl font-black tabular-nums tracking-tighter">Rp {totalPenjualan.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-rose-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-rose-100">
              <span className="font-black text-xs uppercase tracking-widest opacity-80">Tarik Tunai</span>
              <span className="text-xl font-black tabular-nums tracking-tighter">
                Rp {transactionsToday.filter(t => t.kategori === 'Tarik Tunai').reduce((s, t) => s + t.nominal, 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="bg-amber-500 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-amber-100">
              <span className="font-black text-xs uppercase tracking-widest opacity-80">Total Admin</span>
              <span className="text-xl font-black tabular-nums tracking-tighter">Rp {totalAdmin.toLocaleString('id-ID')}</span>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-indigo-100">
              <span className="font-black text-xs uppercase tracking-widest opacity-80">Volume Hari Ini</span>
              <span className="text-xl font-black tabular-nums tracking-tighter">Rp {totalVolume.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </ViewLayout>

        {/* PLACEHOLDERS FOR GRID MENU */}
        {['view-kasbon', 'view-kontak', 'view-stok-voucher', 'view-kalender', 'view-nota'].map(id => (
          <ViewLayout 
            key={id} 
            id={id} 
            active={currentView === id} 
            title={id.replace('view-', '').toUpperCase()} 
            showBack 
            onBack={() => setCurrentView('view-beranda')}
          >
            <div className="flex flex-col items-center justify-center py-40 text-gray-300 px-10 text-center">
              <LayoutDashboard className="w-16 h-16 mb-6 opacity-20" />
              <h3 className="font-black text-gray-400 text-sm uppercase tracking-widest">Halaman {id.replace('view-', '').toUpperCase()}</h3>
              <p className="text-xs font-medium text-gray-400 mt-2">Fitur ini sedang dalam pengembangan dan akan segera tersedia.</p>
            </div>
          </ViewLayout>
        ))}

        {/* --- NAVIGATION (BCA Style) --- */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[75px] bg-white border-t border-gray-100 z-[100] rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] flex items-center justify-around px-2">
          {[
            { id: 'view-beranda', label: 'Beranda', icon: Home },
            { id: 'view-transaksi', label: 'Riwayat', icon: Clock },
            { id: 'view-isi-saldo', label: 'Saldo', icon: Wallet },
            { id: 'view-laporan', label: 'Laporan', icon: BarChart3 },
            { id: 'view-akun', label: 'Akun', icon: User },
          ].map(nav => {
            const isActive = currentView === nav.id;
            return (
              <button 
                key={nav.id}
                onClick={() => setCurrentView(nav.id)}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive ? '-translate-y-2' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 rotate-[360deg]' : 'text-gray-400'}`}>
                  <nav.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-blue-600 opacity-100' : 'text-gray-400 opacity-0'}`}>
                  {nav.label}
                </span>
                {isActive && (
                  <div className="absolute -top-3 w-1 h-1 bg-blue-600 rounded-full animate-ping"></div>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};

export default App;
