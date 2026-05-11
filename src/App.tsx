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
  Bolt,
  LogOut,
  ShieldCheck,
  UserCircle,
  Pencil,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  MousePointer2,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { supabase } from './supabase';
import { KasbonView } from './views/KasbonView';
import { KontakView } from './views/KontakView';
import { VoucherView } from './views/VoucherView';
import { KalenderView } from './views/KalenderView';
import { NotaView } from './views/NotaView';

// --- Types ---
interface Transaction {
  id: string | number;
  kategori: string;
  nominal: number;
  admin_fee: number;
  keterangan: string;
  waktu: string;
  tanggal_iso: string;
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
    className={`flex-1 flex flex-col min-h-0 ${active ? 'flex' : 'hidden'} animate-fadeIn`}
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

  // Settings & Theme State
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState<'light' | 'dark' | 'blue'>('light');
  const [displayMode, setDisplayMode] = useState<'mobile' | 'tablet' | 'pc'>('mobile');

  // Isi Saldo Form
  const [jenisSaldo, setJenisSaldo] = useState('');
  const [nominalIsi, setNominalIsi] = useState('');
  const [keteranganIsi, setKeteranganIsi] = useState('');

  // Inspector Mode State
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showSaldoModal, setShowSaldoModal] = useState(false);

  // Laporan State
  const [laporanSearch, setLaporanSearch] = useState('');
  const [laporanStartDate, setLaporanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [laporanEndDate, setLaporanEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [laporanFilter, setLaporanFilter] = useState('Semua');
   const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [activeSaldoFilter, setActiveSaldoFilter] = useState('Semua');

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Filtered Laporan Data
  const filteredLaporanTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isNotIsi = !t.kategori.startsWith('Isi ');
      const matchesSearch = t.keterangan.toLowerCase().includes(laporanSearch.toLowerCase()) || 
                            t.kategori.toLowerCase().includes(laporanSearch.toLowerCase());
      const matchesDate = t.tanggal_iso >= laporanStartDate && t.tanggal_iso <= laporanEndDate;
      const matchesFilter = laporanFilter === 'Semua' || t.kategori === laporanFilter;
      
      return isNotIsi && matchesSearch && matchesDate && matchesFilter;
    });
  }, [transactions, laporanSearch, laporanStartDate, laporanEndDate, laporanFilter]);

  const filteredSaldoTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isIsi = t.kategori.startsWith('Isi ');
      const matchesDate = t.tanggal_iso >= laporanStartDate && t.tanggal_iso <= laporanEndDate;
      const matchesFilter = activeSaldoFilter === 'Semua' || 
                           (activeSaldoFilter === 'Bank' && t.kategori === 'Isi Saldo Bank') ||
                           (activeSaldoFilter === 'Cash' && t.kategori === 'Isi Total Penjualan');
      
      return isIsi && matchesDate && matchesFilter;
    });
  }, [transactions, laporanStartDate, laporanEndDate, activeSaldoFilter]);

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

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Calculations ---
  const today = new Date().toISOString().split('T')[0];
  
  const transactionsToday = useMemo(() => {
    return transactions.filter(t => t.tanggal_iso === today && (currentRole === 'OWNER' || t.kasir === currentRole));
  }, [transactions, today, currentRole]);

  const saldoBank = useMemo(() => {
    return transactionsToday.reduce((acc, t) => {
      if (t.kategori === 'Isi Saldo Bank') return acc + t.nominal;
      if (['Transfer Bank', 'DANA', 'FLIP', 'Order Kuota'].includes(t.kategori)) return acc - t.nominal;
      return acc;
    }, 0); 
  }, [transactionsToday]);

  const totalPenjualan = useMemo(() => {
    return transactionsToday.reduce((acc, t) => {
      if (t.kategori === 'Isi Total Penjualan') return acc + t.nominal;
      if (['Transfer Bank', 'DANA', 'FLIP', 'Order Kuota'].includes(t.kategori)) return acc + t.nominal;
      if (t.kategori === 'Tarik Tunai') return acc - t.nominal;
      return acc;
    }, 0);
    }, [transactions]);

  const totalAdmin = useMemo(() => transactionsToday.reduce((sum, t) => sum + t.admin_fee, 0), [transactionsToday]);
  const totalVolume = useMemo(() => transactionsToday.reduce((sum, t) => sum + t.nominal, 0), [transactionsToday]);
  const totalTarikTunai = useMemo(() => 
    transactionsToday.filter(t => t.kategori === 'Tarik Tunai').reduce((sum, t) => sum + t.nominal, 0), 
    [transactionsToday]
  );

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
    setAdminFee(formatRupiah(t.admin_fee.toString()));
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
            admin_fee: rawAdmin,
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
          tanggal_iso: today,
          kategori,
          nominal: rawNominal,
          admin_fee: rawAdmin,
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
      tanggal_iso: today,
      kategori: `Isi ${jenisSaldo}`,
      nominal: rawNominal,
      admin_fee: 0,
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

  // Theme Colors
  const themeClasses = {
    light: 'bg-[#f8fafc] text-gray-800',
    dark: 'bg-gray-900 text-gray-100',
    blue: 'bg-sky-500 text-white'
  };

  const containerClasses = {
    mobile: 'max-w-[420px]',
    tablet: 'max-w-[768px]',
    pc: 'max-w-full'
  };

  const inspectorStyle = (name: string) => isInspectorActive ? {
    outline: selectedElement === name ? '2px solid #3b82f6' : '1px dashed rgba(59, 130, 246, 0.5)',
    outlineOffset: '2px',
    cursor: 'help',
    transition: 'all 0.2s ease'
  } : {};

  const handleElementSelect = (name: string, e: React.MouseEvent) => {
    if (isInspectorActive) {
      e.stopPropagation();
      setSelectedElement(name);
      alert(`Elemen Terpilih: ${name}\n\nAnda bisa memberitahu saya: "Tolong edit/hapus bagian ${name}"`);
    }
  };

  return (
    <div className={`flex justify-center min-h-screen font-plus transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
      <div className={`w-full ${containerClasses[displayMode]} ${themeClasses[theme]} h-screen relative overflow-hidden flex flex-col shadow-2xl transition-all duration-500 border-x border-white/5`}>
        
        {/* --- SIDE PANEL --- */}
        <div 
          className={`absolute inset-0 z-[100] bg-black/10 backdrop-blur-[2px] transition-opacity duration-300 ${isSidePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidePanelOpen(false)}
        />
        <div className={`absolute top-0 left-0 h-full w-[260px] z-[110] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-2xl transition-transform duration-500 ease-out p-4 flex flex-col ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20">Konfigurasi Sistem</span>
            <button onClick={() => setIsSidePanelOpen(false)} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SINGLE COMPACT INFO BLOCK */}
          <div className={`rounded-xl p-3.5 mb-5 ${theme === 'dark' ? 'bg-white/5' : 'bg-[#f1f5f9]'} border border-gray-100/10`}>
            <div className="space-y-3">
              {/* Jam & Tanggal */}
              <div className="space-y-0">
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Jam & Tanggal</p>
                <p className="text-xl font-black tabular-nums leading-none tracking-tighter">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[9px] font-bold text-gray-400 leading-none mt-0.5">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
              
              {/* Kasir & Absen */}
              <div className="pt-3 border-t border-gray-400/10 space-y-0">
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Kasir Aktif</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black uppercase leading-none tracking-tight">{currentRole}</p>
                  <p className="text-[8px] font-bold text-gray-400 leading-none">MASUK: 08:00 WIB</p>
                </div>
              </div>
            </div>
          </div>

          {/* SETTINGS GROUPS */}
          <div className="space-y-5">
            {isLocalhost && (
              <div className="space-y-2">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Edit Aplikasi</p>
                <button 
                  onClick={() => {
                    setIsInspectorActive(!isInspectorActive);
                    setIsSidePanelOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between border transition-all ${isInspectorActive ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                >
                  <span className="text-[9px] font-black uppercase">{isInspectorActive ? 'Matikan Pilih Elemen' : 'Aktifkan Pilih Elemen'}</span>
                  <MousePointer2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Mode Tampilan</p>
              <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                {(['mobile', 'tablet', 'pc'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setDisplayMode(mode)}
                    className={`flex-1 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${displayMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    {mode === 'mobile' ? 'HP' : mode === 'tablet' ? 'Tablet' : 'PC'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest ml-1">Tema Visual</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setTheme('light')} className="flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-lg bg-white border transition-all ${theme === 'light' ? 'border-blue-600 shadow-sm' : 'border-gray-100'}`} />
                  <span className="text-[7px] font-black uppercase opacity-30">Terang</span>
                </button>
                <button onClick={() => setTheme('dark')} className="flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-lg bg-gray-900 border transition-all ${theme === 'dark' ? 'border-blue-600 shadow-sm' : 'border-gray-800'}`} />
                  <span className="text-[7px] font-black uppercase opacity-30">Gelap</span>
                </button>
                 <button onClick={() => setTheme('blue')} className="flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-lg bg-sky-400 border transition-all ${theme === 'blue' ? 'border-white shadow-sm' : 'border-sky-600'}`} />
                  <span className="text-[7px] font-black uppercase opacity-30">Sky</span>
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsLoggedIn(false)}
            className="mt-auto p-3 bg-gray-50 text-gray-400 rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-3 h-3" /> Keluar Sistem
          </button>
        </div>
        
        {/* --- VIEWS --- */}

        {/* GLOBAL HEADER */}
        <div className={`px-5 pt-6 pb-6 flex justify-between items-center z-50 rounded-b-[2.5rem] shadow-xl ${theme === 'dark' ? 'bg-gray-900' : (theme === 'blue' ? 'bg-sky-600' : 'bg-white')}`}>
          <button 
            onClick={() => setIsSidePanelOpen(true)}
            className={`w-9 h-9 rounded-xl shadow-sm flex items-center justify-center border transition-all ${theme === 'dark' || theme === 'blue' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
          >
            <Bolt className="w-4 h-4" />
          </button>
          <div className="flex-1 ml-3" onClick={(e) => handleElementSelect('JUDUL_APLIKASI', e)} style={inspectorStyle('JUDUL_APLIKASI')}>
            <h1 className={`text-base font-black tracking-tighter leading-none ${theme === 'dark' || theme === 'blue' ? 'text-white' : 'text-gray-900'}`}>
              LOKET <span className="text-blue-600">ALFAZA</span>
            </h1>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] leading-tight">Kasir Profesional</p>
          </div>
          <button 
            className={`w-9 h-9 rounded-xl shadow-sm flex items-center justify-center border transition-all ${theme === 'dark' || theme === 'blue' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* --- VIEWS --- */}

        {/* BERANDA */}
        <ViewLayout id="view-beranda" active={currentView === 'view-beranda'} title="">

          {/* KARTU SALDO */}
          <div 
            onClick={(e) => handleElementSelect('KARTU_SALDO', e)} 
            style={inspectorStyle('KARTU_SALDO')}
            className="mx-5 mt-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-5 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="space-y-0.5">
                <p className="text-[8px] text-blue-100/60 font-black uppercase tracking-widest leading-none">Saldo Bank</p>
                <h2 className="text-xl font-black tabular-nums tracking-tighter leading-tight">Rp {saldoBank.toLocaleString('id-ID')}</h2>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[8px] text-blue-100/60 font-black uppercase tracking-widest leading-none">Total Penjualan</p>
                <h2 className="text-xl font-black tabular-nums tracking-tighter leading-tight">Rp {totalPenjualan.toLocaleString('id-ID')}</h2>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status: Aktif</span>
               <button onClick={() => setShowSaldoModal(true)} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">
                 Detail <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          </div>

          {/* MENU GRID */}
          <div 
            onClick={(e) => handleElementSelect('MENU_GRID', e)} 
            style={inspectorStyle('MENU_GRID')}
            className="px-5 mt-6 grid grid-cols-5 gap-2.5"
          >
            {[
              { id: 'view-kasbon', label: 'Kasbon', icon: NotebookPen, color: 'bg-blue-50 text-blue-600' },
              { id: 'view-kontak', label: 'Kontak', icon: UserIcon, color: 'bg-emerald-50 text-emerald-600' },
              { id: 'view-stok-voucher', label: 'Voucher', icon: Gem, color: 'bg-orange-50 text-orange-600' },
              { id: 'view-kalender', label: 'Kalender', icon: CalendarDays, color: 'bg-indigo-50 text-indigo-600' },
              { id: 'view-nota', label: 'Nota', icon: Receipt, color: 'bg-rose-50 text-rose-600' },
            ].map((m) => (
              <div key={m.id} onClick={() => !isInspectorActive && setCurrentView(m.id)} className="flex flex-col items-center cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-active:scale-90 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : `${m.color} shadow-sm shadow-black/5`}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <span className="text-[8px] font-black text-gray-400 mt-1.5 uppercase tracking-tighter leading-none">{m.label}</span>
              </div>
            ))}
          </div>

          {/* FORM TRANSAKSI */}
          <div 
            onClick={(e) => handleElementSelect('KOLOM_FORM', e)} 
            style={inspectorStyle('KOLOM_FORM')}
            className={`mx-5 mt-8 rounded-[1.5rem] p-5 shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : (theme === 'blue' ? 'bg-blue-800 border-blue-700 text-white' : 'bg-blue-400 border-blue-300 text-black')}`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-blue-600' : 'text-blue-200'}`} />
                <h3 className="font-black text-xs tracking-widest uppercase leading-none">
                  {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
                </h3>
              </div>
              {editingId && (
                <button onClick={handleBatalEdit} className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 leading-none">
                  <X className="w-2.5 h-2.5" /> Batal
                </button>
              )}
            </div>
            
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className={`text-[9px] font-black ${theme === 'dark' || theme === 'blue' ? 'text-white/70' : 'text-black'} uppercase tracking-widest ml-1 leading-none`}>Kategori</label>
                <select 
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className={`w-full ${theme === 'dark' || theme === 'blue' ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-blue-100 text-black'} border rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500 transition-all appearance-none leading-none`}
                >
                  <option value="" disabled className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>Pilih kategori</option>
                  <option value="Transfer Bank" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>Transfer Bank</option>
                  <option value="DANA" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>DANA</option>
                  <option value="FLIP" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>FLIP</option>
                  <option value="Order Kuota" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>Order Kuota</option>
                  <option value="Tarik Tunai" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>Tarik Tunai</option>
                  <option value="Aksesoris" className={theme === 'dark' || theme === 'blue' ? 'bg-gray-800 text-white' : 'bg-white text-black'}>Aksesoris</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[9px] font-black ${theme === 'dark' || theme === 'blue' ? 'text-white/70' : 'text-black'} uppercase tracking-widest ml-1 leading-none`}>Nominal</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 leading-none">Rp</span>
                    <input 
                      type="text" 
                      value={nominal}
                      onChange={(e) => setNominal(formatRupiah(e.target.value))}
                      className={`w-full ${theme === 'dark' || theme === 'blue' ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-blue-100 text-black'} border rounded-xl py-3 pl-8 pr-4 text-xs font-black outline-none focus:border-blue-500 transition-all tabular-nums leading-none`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={`text-[9px] font-black ${theme === 'dark' || theme === 'blue' ? 'text-white/70' : 'text-black'} uppercase tracking-widest ml-1 leading-none`}>Biaya Admin</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 leading-none">Rp</span>
                    <input 
                      type="text" 
                      value={adminFee}
                      onChange={(e) => setAdminFee(formatRupiah(e.target.value))}
                      className={`w-full ${theme === 'dark' || theme === 'blue' ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-blue-100 text-black'} border rounded-xl py-3 pl-8 pr-4 text-xs font-black outline-none focus:border-blue-500 transition-all tabular-nums leading-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[9px] font-black ${theme === 'dark' || theme === 'blue' ? 'text-white/70' : 'text-black'} uppercase tracking-widest ml-1 leading-none`}>Keterangan</label>
                <input 
                  type="text"
                  placeholder="Keterangan tambahan..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className={`w-full ${theme === 'dark' || theme === 'blue' ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-blue-100 text-black'} border rounded-xl py-3 px-4 text-xs font-medium outline-none focus:border-blue-500 transition-all leading-none`}
                />
              </div>

              <button 
                onClick={handleSimpanTransaksi}
                className={`w-full py-3.5 ${editingId ? 'bg-amber-400 text-amber-950' : 'bg-white text-blue-600'} rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all mt-1 leading-none`}
              >
                {editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
              </button>
            </div>
          </div>

          {/* LAPORAN HARI INI */}
          <div 
            onClick={(e) => handleElementSelect('RINGKASAN_HARIAN', e)} 
            style={inspectorStyle('RINGKASAN_HARIAN')}
            className="px-5 mt-8 mb-6"
          >
            <div className="flex justify-between items-end mb-3.5">
              <div>
                <h3 className="font-black text-gray-800 text-xs tracking-widest uppercase leading-none">Laporan Hari Ini</h3>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 leading-none">Ringkasan transaksi hari ini</p>
              </div>
              <button onClick={() => setCurrentView('view-transaksi')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Lihat Semua</button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Transaksi</p>
                <p className="text-base font-black leading-none tabular-nums">{transactionsToday.length}</p>
              </div>
              <div className={`p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Total Admin</p>
                <p className="text-base font-black leading-none tabular-nums">Rp {totalAdmin.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </ViewLayout>

        {/* RIWAYAT */}
        <ViewLayout id="view-transaksi" active={currentView === 'view-transaksi'} title="">
          <div 
            onClick={(e) => handleElementSelect('HALAMAN_RIWAYAT', e)} 
            style={inspectorStyle('HALAMAN_RIWAYAT')}
            className="flex flex-col h-full bg-[#f1f5f9]"
          >
            {/* HEADER SEARCH & FILTER */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex flex-col gap-3 sticky top-0 z-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari keterangan..."
                  value={laporanSearch}
                  onChange={(e) => setLaporanSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-gray-50 border border-gray-100 rounded-full px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input 
                    type="date" 
                    value={laporanStartDate}
                    onChange={(e) => setLaporanStartDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-tight outline-none w-full"
                  />
                </div>
                <div className="flex-1 flex items-center bg-gray-50 border border-gray-100 rounded-full px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input 
                    type="date" 
                    value={laporanEndDate}
                    onChange={(e) => setLaporanEndDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-tight outline-none w-full"
                  />
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">
                  Tampilkan
                </button>
              </div>

              <div className="relative">
                <select 
                  value={laporanFilter}
                  onChange={(e) => setLaporanFilter(e.target.value)}
                  className="w-full px-5 py-3 rounded-full bg-gray-50 border border-gray-100 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="DANA">DANA</option>
                  <option value="FLIP">FLIP</option>
                  <option value="Order Kuota">Order Kuota</option>
                  <option value="Tarik Tunai">Tarik Tunai</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* SECTION: RIWAYAT TRANSAKSI */}
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <div className="bg-blue-700 p-3 flex justify-between items-center text-white">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Riwayat Transaksi</h3>
                  <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">Tanggal • {new Date().toISOString().split('T')[0]}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-50 text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="p-3 w-8">#</th>
                        <th className="p-3 w-12 text-center">Jam</th>
                        <th className="p-3 w-16 text-center">Tipe</th>
                        <th className="p-3 text-center">Nominal</th>
                        <th className="p-3 text-center">Admin</th>
                        <th className="p-3">Ket</th>
                        <th className="p-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLaporanTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center">
                             <div className="flex flex-col items-center opacity-30">
                               <Receipt className="w-10 h-10 mb-2" />
                               <p className="text-[9px] font-black uppercase tracking-widest">Tidak ada transaksi</p>
                             </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLaporanTransactions.map((t, idx) => (
                          <React.Fragment key={t.id}>
                            <tr 
                              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                              className={`border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50 ${expandedId === t.id ? 'bg-blue-50/30' : ''}`}
                            >
                              <td className="p-1.5 text-[8px] font-black text-gray-300 text-center">{idx + 1}</td>
                              <td className="p-1.5 text-[8px] font-black text-gray-800 text-center tabular-nums">
                                {new Date(t.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-1.5 text-center">
                                <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                  {t.kategori.length > 8 ? t.kategori.substring(0, 8) + '...' : t.kategori}
                                </span>
                              </td>
                              <td className="p-1.5 text-[9px] font-black text-blue-700 text-center tabular-nums">
                                Rp {t.nominal.toLocaleString('id-ID')}
                              </td>
                              <td className="p-1.5 text-[8px] font-black text-gray-800 text-center tabular-nums">
                                Rp {t.admin_fee.toLocaleString('id-ID')}
                              </td>
                              <td className="p-1.5 text-[8px] font-bold text-gray-400 truncate max-w-[80px]">
                                {t.keterangan}
                              </td>
                              <td className="p-1.5 text-center">
                                {expandedId === t.id ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
                              </td>
                            </tr>
                            {expandedId === t.id && (
                              <tr>
                                <td colSpan={7} className="p-4 bg-gray-50/50 border-b border-gray-50">
                                  <div className="flex flex-col gap-4 animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="w-3 h-3" /> {t.tanggal_iso}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <UserCircle className="w-3 h-3" /> {t.kasir}
                                        </div>
                                      </div>
                                      <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Tunai</span>
                                    </div>
                                    
                                    <div className="relative">
                                      <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                                      <div className="w-full bg-white border border-gray-100 rounded-full py-2.5 px-9 text-[10px] font-bold text-gray-600">
                                        {t.keterangan || '-'}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between p-1 pl-4 bg-white border border-black rounded-full shadow-sm">
                                      <div className="flex gap-6">
                                        <div className="flex flex-col">
                                          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Saldo Bank</span>
                                          <span className={`text-[10px] font-black tabular-nums ${t.kategori === 'Tarik Tunai' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            {t.kategori === 'Tarik Tunai' ? '+' : '-'}{t.nominal.toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Saldo Cash</span>
                                          <span className={`text-[10px] font-black tabular-nums ${t.kategori === 'Tarik Tunai' ? 'text-red-600' : 'text-orange-600'}`}>
                                            {t.kategori === 'Tarik Tunai' ? '-' : '+'}{t.nominal.toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => handleEdit(t)}
                                        className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-full flex items-center gap-1.5 active:scale-95 transition-all"
                                      >
                                        <Pencil className="w-2.5 h-2.5 text-gray-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-800">Edit</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION: RIWAYAT TAMBAH SALDO */}
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Riwayat Tambah Saldo</h3>
                    <button className="bg-white/20 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                      Detail <ChevronRight className="w-2 h-2" />
                    </button>
                  </div>
                  <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">Tanggal • {new Date().toISOString().split('T')[0]}</span>
                </div>

                <div className="p-3 flex gap-2 overflow-x-auto hide-scrollbar border-b border-gray-50">
                  {['Semua', 'Bank', 'Cash', 'Saldo Real'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setActiveSaldoFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSaldoFilter === f ? 'bg-blue-900 text-white shadow-md' : 'bg-white border border-gray-100 text-gray-400'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-50 text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="p-3 w-8">#</th>
                        <th className="p-3 w-12 text-center">Jam</th>
                        <th className="p-3 w-16 text-center">Jenis</th>
                        <th className="p-3 text-center">Nominal</th>
                        <th className="p-3">Ket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSaldoTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center">
                            <div className="flex flex-col items-center opacity-10">
                               <Plus className="w-10 h-10 mb-2" />
                             </div>
                          </td>
                        </tr>
                      ) : (
                        filteredSaldoTransactions.map((t, idx) => (
                          <tr key={t.id} className="border-b border-gray-50 text-[9px] font-bold">
                            <td className="p-2.5 text-center text-gray-300 font-black">{idx + 1}</td>
                            <td className="p-2.5 text-center tabular-nums text-gray-800">
                              {new Date(t.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                {t.kategori.replace('Isi ', '')}
                              </span>
                            </td>
                            <td className="p-2.5 text-center tabular-nums text-emerald-700 font-black">
                              Rp {t.nominal.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-gray-400 truncate max-w-[100px]">
                              {t.keterangan}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </ViewLayout>


        {/* ISI SALDO */}
        <ViewLayout id="view-isi-saldo" active={currentView === 'view-isi-saldo'} title="">
          <div 
            onClick={(e) => handleElementSelect('KOLOM_ISI_SALDO', e)} 
            style={inspectorStyle('KOLOM_ISI_SALDO')}
            className="p-5 space-y-6"
          >
            <div className={`rounded-[2rem] p-6 shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Jenis Saldo</label>
                  <select 
                    value={jenisSaldo}
                    onChange={(e) => setJenisSaldo(e.target.value)}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'} border rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none`}
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
                      className={`w-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'} border rounded-2xl py-4 pl-12 pr-5 text-base font-black outline-none focus:border-blue-500 transition-all tabular-nums`}
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
                    className={`w-full ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'} border rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-blue-500 transition-all resize-none`}
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
        <ViewLayout id="view-laporan" active={currentView === 'view-laporan'} title="">
          <div 
            onClick={(e) => handleElementSelect('HALAMAN_LAPORAN', e)} 
            style={inspectorStyle('HALAMAN_LAPORAN')}
            className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto hide-scrollbar pb-32"
          >
            {/* HEADER LAPORAN */}
            <div className="bg-white p-6 border-b border-gray-100 sticky top-0 z-40">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black tracking-tighter">REKAP <span className="text-blue-600">HARIAN</span></h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Laporan Real-time • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>

              {/* QUICK SUMMARY */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg shadow-blue-100 flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Saldo Bank</span>
                  <span className="text-sm font-black tabular-nums">Rp {saldoBank.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-lg shadow-emerald-100 flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Saldo Cash</span>
                  <span className="text-sm font-black tabular-nums">Rp {totalPenjualan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* PERFORMANCE METRICS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1">
                   <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-1">
                     <TrendingUp className="w-4 h-4" />
                   </div>
                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Transaksi</span>
                   <span className="text-xs font-black">{transactionsToday.length}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                     <History className="w-4 h-4" />
                   </div>
                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Admin</span>
                   <span className="text-xs font-black">Rp {totalAdmin.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1">
                   <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
                     <Wallet className="w-4 h-4" />
                   </div>
                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Tarik Tunai</span>
                   <span className="text-xs font-black">Rp {totalTarikTunai.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* CATEGORY BREAKDOWN */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-blue-600" /> Distribusi Kategori
                </h3>
                <div className="space-y-4">
                  {['Transfer Bank', 'DANA', 'FLIP', 'Order Kuota', 'Tarik Tunai'].map(cat => {
                    const count = transactionsToday.filter(t => t.kategori === cat).length;
                    const totalForCat = transactionsToday.filter(t => t.kategori === cat).reduce((s, t) => s + t.nominal, 0);
                    const percentage = transactionsToday.length > 0 ? (count / transactionsToday.length) * 100 : 0;
                    
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-tight text-gray-700">{cat}</span>
                          <span className="text-[10px] font-bold text-gray-400">{count} Transaksi • Rp {totalForCat.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              cat === 'Transfer Bank' ? 'bg-blue-500' :
                              cat === 'DANA' ? 'bg-emerald-500' :
                              cat === 'FLIP' ? 'bg-orange-500' :
                              cat === 'Order Kuota' ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* VOLUME CARD */}
              <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[2.5rem] p-6 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Volume Perputaran Hari Ini</p>
                  <h3 className="text-2xl font-black tabular-nums tracking-tighter leading-none">Rp {totalVolume.toLocaleString('id-ID')}</h3>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* AUTO RESET INFO */}
              <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900 mb-1">Reset Otomatis Aktif</h4>
                  <p className="text-[9px] font-bold text-blue-700/60 leading-relaxed uppercase tracking-tight">
                    Sesuai pengaturan, seluruh saldo dan riwayat akan kembali ke angka 0 tepat pada pukul 00:00 setiap harinya untuk memulai pembukuan baru.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ViewLayout>

        {/* AKUN */}
        <ViewLayout id="view-akun" active={currentView === 'view-akun'} title="">
          <div 
            onClick={(e) => handleElementSelect('HALAMAN_AKUN', e)} 
            style={inspectorStyle('HALAMAN_AKUN')}
            className="p-5"
          >
            <div className={`rounded-[2.5rem] p-8 border shadow-sm text-center mb-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
              <div className="w-24 h-24 bg-blue-100 rounded-[2rem] mx-auto flex items-center justify-center text-blue-600 mb-6 border-4 border-white shadow-xl shadow-blue-50">
                <UserCircle className="w-12 h-12" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-tight">{currentRole}</h3>
              <p className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full inline-block mt-3 uppercase tracking-widest">Kasir Terdaftar</p>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-3xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-bold">Aktif</p>
                </div>
                <div className={`p-4 rounded-3xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Versi App</p>
                  <p className="text-xs font-bold">2.0.4</p>
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

        {/* FLOATING SALDO MODAL */}
        {showSaldoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" 
              onClick={() => setShowSaldoModal(false)}
            ></div>
            <div 
              onClick={(e) => handleElementSelect('MODAL_RINCIAN_SALDO', e)} 
              style={inspectorStyle('MODAL_RINCIAN_SALDO')}
              className="relative w-full max-w-[380px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleIn border border-gray-100"
            >
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-widest">Rincian Saldo</h3>
                    <p className="text-[8px] font-bold text-blue-100/60 uppercase tracking-widest">Update Otomatis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSaldoModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar bg-gray-50/50">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="flex flex-col">
                    <span className="font-black text-[8px] uppercase tracking-widest text-gray-400 mb-1">Saldo Bank</span>
                    <span className="text-lg font-black tabular-nums tracking-tighter text-blue-600">Rp {saldoBank.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-all">
                    <History className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
                  <div className="flex flex-col">
                    <span className="font-black text-[8px] uppercase tracking-widest text-gray-400 mb-1">Penjualan Cash</span>
                    <span className="text-lg font-black tabular-nums tracking-tighter text-emerald-600">Rp {totalPenjualan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-all">
                    <History className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <span className="font-black text-[7px] uppercase tracking-widest text-gray-400">Tarik Tunai</span>
                    <span className="text-xs font-black tabular-nums text-rose-600">
                      Rp {transactionsToday.filter(t => t.kategori === 'Tarik Tunai').reduce((s, t) => s + t.nominal, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <span className="font-black text-[7px] uppercase tracking-widest text-gray-400">Total Admin</span>
                    <span className="text-xs font-black tabular-nums text-orange-600">Rp {totalAdmin.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-black text-[8px] uppercase tracking-widest opacity-70 mb-1">Volume Hari Ini</span>
                    <span className="text-lg font-black tabular-nums tracking-tighter">Rp {totalVolume.toLocaleString('id-ID')}</span>
                  </div>
                  <BarChart3 className="w-6 h-6 opacity-30" />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-50 flex justify-center">
                <button 
                  onClick={() => setShowSaldoModal(false)}
                  className="px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-gray-200 active:scale-95 transition-all"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODUL-MODUL DASHBOARD */}
        <ViewLayout id="view-kasbon" active={currentView === 'view-kasbon'} title="" showBack onBack={() => setCurrentView('view-beranda')}>
          <KasbonView onBack={() => setCurrentView('view-beranda')} currentRole={currentRole} theme={theme} />
        </ViewLayout>

        <ViewLayout id="view-kontak" active={currentView === 'view-kontak'} title="" showBack onBack={() => setCurrentView('view-beranda')}>
          <KontakView onBack={() => setCurrentView('view-beranda')} currentRole={currentRole} theme={theme} />
        </ViewLayout>

        <ViewLayout id="view-stok-voucher" active={currentView === 'view-stok-voucher'} title="" showBack onBack={() => setCurrentView('view-beranda')}>
          <VoucherView onBack={() => setCurrentView('view-beranda')} currentRole={currentRole} theme={theme} />
        </ViewLayout>

        <ViewLayout id="view-kalender" active={currentView === 'view-kalender'} title="" showBack onBack={() => setCurrentView('view-beranda')}>
          <KalenderView onBack={() => setCurrentView('view-beranda')} theme={theme} />
        </ViewLayout>

        <ViewLayout id="view-nota" active={currentView === 'view-nota'} title="" showBack onBack={() => setCurrentView('view-beranda')}>
          <NotaView onBack={() => setCurrentView('view-beranda')} theme={theme} />
        </ViewLayout>

        {/* FLOATING INSPECTOR TOGGLE (LOCALHOST ONLY) */}
        {isLocalhost && (
          <button 
            onClick={() => setIsInspectorActive(!isInspectorActive)}
            className={`fixed bottom-24 right-5 w-12 h-12 rounded-2xl z-[150] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isInspectorActive ? 'bg-blue-600 text-white shadow-blue-500/40' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            <MousePointer2 className={`w-5 h-5 ${isInspectorActive ? 'animate-pulse' : ''}`} />
          </button>
        )}

        {/* --- NAVIGASI BAWAH --- */}
        <nav 
          onClick={(e) => handleElementSelect('NAVIGASI_BAWAH', e)} 
          style={inspectorStyle('NAVIGASI_BAWAH')}
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-[75px] z-[100] rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] flex items-center justify-around px-2 border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : (theme === 'blue' ? 'bg-sky-600 border-sky-500' : 'bg-white border-gray-100')}`}
        >
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
                onClick={() => !isInspectorActive && setCurrentView(nav.id)}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive ? '-translate-y-2' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? (theme === 'dark' || theme === 'blue' ? 'bg-white text-blue-600 shadow-xl shadow-white/10' : 'bg-blue-600 text-white shadow-xl shadow-blue-200') + ' rotate-[360deg]' : 'text-gray-400'}`}>
                  <nav.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? (theme === 'dark' || theme === 'blue' ? 'text-white opacity-100' : 'text-blue-600 opacity-100') : 'text-gray-400 opacity-0'}`}>
                  {nav.label}
                </span>
                {isActive && (
                  <div className={`absolute -top-3 w-1 h-1 rounded-full animate-ping ${theme === 'dark' || theme === 'blue' ? 'bg-white' : 'bg-blue-600'}`}></div>
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
