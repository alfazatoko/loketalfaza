import hijriConverter from 'hijri-converter';

export interface Holiday {
  date: number; // 1-31
  month: number; // 0-11
  year: number;
  name: string;
  type: "merah" | "cuti";
}

// Complete 2026 Holidays based on SKB 3 Menteri
const HOLIDAYS: Holiday[] = [
  // Januari
  { date: 1, month: 0, year: 2026, name: "Tahun Baru Masehi", type: "merah" },
  { date: 16, month: 0, year: 2026, name: "Isra Mi'raj Nabi Muhammad S.A.W.", type: "merah" },
  
  // Februari
  { date: 16, month: 1, year: 2026, name: "Cuti Bersama Tahun Baru Imlek 2577 Kongzili", type: "cuti" },
  { date: 17, month: 1, year: 2026, name: "Tahun Baru Imlek 2577 Kongzili", type: "merah" },
  
  // Maret
  { date: 18, month: 2, year: 2026, name: "Cuti Bersama Hari Suci Nyepi (Tahun Baru Saka 1948)", type: "cuti" },
  { date: 19, month: 2, year: 2026, name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", type: "merah" },
  { date: 20, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  { date: 21, month: 2, year: 2026, name: "Hari Raya Idul Fitri 1447 H", type: "merah" },
  { date: 22, month: 2, year: 2026, name: "Hari Raya Idul Fitri 1447 H", type: "merah" },
  { date: 23, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  { date: 24, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  
  // April
  { date: 3, month: 3, year: 2026, name: "Wafat Yesus Kristus", type: "merah" },
  { date: 5, month: 3, year: 2026, name: "Kebangkitan Yesus Kristus (Paskah)", type: "merah" },
  
  // Mei
  { date: 1, month: 4, year: 2026, name: "Hari Buruh Internasional", type: "merah" },
  { date: 14, month: 4, year: 2026, name: "Kenaikan Yesus Kristus", type: "merah" },
  { date: 15, month: 4, year: 2026, name: "Cuti Bersama Kenaikan Yesus Kristus", type: "cuti" },
  { date: 27, month: 4, year: 2026, name: "Hari Raya Idul Adha 1447 H", type: "merah" },
  { date: 28, month: 4, year: 2026, name: "Cuti Bersama Hari Raya Idul Adha 1447 H", type: "cuti" },
  { date: 31, month: 4, year: 2026, name: "Hari Raya Waisak 2570 BE", type: "merah" },
  
  // Juni
  { date: 1, month: 5, year: 2026, name: "Hari Lahir Pancasila", type: "merah" },
  { date: 16, month: 5, year: 2026, name: "Tahun Baru Islam 1448 H", type: "merah" },
  
  // Agustus
  { date: 17, month: 7, year: 2026, name: "Proklamasi Kemerdekaan RI", type: "merah" },
  { date: 25, month: 7, year: 2026, name: "Maulid Nabi Muhammad S.A.W.", type: "merah" },
  
  // Desember
  { date: 24, month: 11, year: 2026, name: "Cuti Bersama Kelahiran Yesus Kristus", type: "cuti" },
  { date: 25, month: 11, year: 2026, name: "Kelahiran Yesus Kristus (Natal)", type: "merah" },
];

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulkaidah", "Dzulhijjah"
];

interface HijriAnchor {
  gregYear: number;
  gregMonth: number; // 1-12
  gregDay: number;
  hijriYear: number;
  hijriMonth: number; // 1-12
}

const KEMENAG_ANCHORS: HijriAnchor[] = [
  { gregYear: 2025, gregMonth: 6, gregDay: 26, hijriYear: 1447, hijriMonth: 1 },
  { gregYear: 2025, gregMonth: 7, gregDay: 26, hijriYear: 1447, hijriMonth: 2 },
  { gregYear: 2025, gregMonth: 8, gregDay: 24, hijriYear: 1447, hijriMonth: 3 },
  { gregYear: 2025, gregMonth: 9, gregDay: 23, hijriYear: 1447, hijriMonth: 4 },
  { gregYear: 2025, gregMonth: 10, gregDay: 22, hijriYear: 1447, hijriMonth: 5 },
  { gregYear: 2025, gregMonth: 11, gregDay: 21, hijriYear: 1447, hijriMonth: 6 },
  { gregYear: 2025, gregMonth: 12, gregDay: 21, hijriYear: 1447, hijriMonth: 7 },
  { gregYear: 2026, gregMonth: 1, gregDay: 20, hijriYear: 1447, hijriMonth: 8 },
  { gregYear: 2026, gregMonth: 2, gregDay: 19, hijriYear: 1447, hijriMonth: 9 },
  { gregYear: 2026, gregMonth: 3, gregDay: 21, hijriYear: 1447, hijriMonth: 10 },
  { gregYear: 2026, gregMonth: 4, gregDay: 19, hijriYear: 1447, hijriMonth: 11 },
  { gregYear: 2026, gregMonth: 5, gregDay: 18, hijriYear: 1447, hijriMonth: 12 },
  { gregYear: 2026, gregMonth: 6, gregDay: 16, hijriYear: 1448, hijriMonth: 1 },
];

const anchorTimestamps = KEMENAG_ANCHORS.map(a => ({
  ...a,
  timestamp: Date.UTC(a.gregYear, a.gregMonth - 1, a.gregDay)
}));

export async function fetchHolidays(year: number): Promise<Holiday[]> {
  try {
    const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`);
    if (!res.ok) throw new Error("API response not ok");
    const json = await res.json();
    if (json.status !== 'success' || !Array.isArray(json.data)) {
      throw new Error("Invalid API response format");
    }
    
    return json.data.map((item: any) => {
      const d = new Date(item.date);
      const isCuti = item.description.toLowerCase().includes("cuti bersama");
      return {
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        name: item.description,
        type: isCuti ? "cuti" : "merah"
      } as Holiday;
    });
  } catch (e) {
    return HOLIDAYS.filter(h => h.year === year);
  }
}

export function getHijriDate(date: Date): { day: number; month: string; year: number } {
  try {
    const targetTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    for (let i = anchorTimestamps.length - 1; i >= 0; i--) {
      const anchor = anchorTimestamps[i];
      if (targetTimestamp >= anchor.timestamp) {
        const diffDays = Math.floor((targetTimestamp - anchor.timestamp) / 86400000);
        if (diffDays <= 29) {
          return {
            day: diffDays + 1,
            month: HIJRI_MONTHS[anchor.hijriMonth - 1],
            year: anchor.hijriYear
          };
        }
      }
    }
    const hijri = (hijriConverter as any).toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { day: hijri.hd, month: HIJRI_MONTHS[hijri.hm - 1], year: hijri.hy };
  } catch (e) {
    return { day: date.getDate(), month: "Unknown", year: 1400 };
  }
}
