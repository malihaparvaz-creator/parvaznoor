// Full Quran integration via AlQuran.cloud API with localStorage caching.
// API is open & free — https://alquran.cloud/api

export interface SurahMeta {
  number: number;
  name: string;          // English transliteration (e.g. "Al-Fatiha")
  arabicName: string;    // Arabic name (e.g. "الفاتحة")
  translation: string;   // English meaning
  ayahCount: number;
  revelation: 'Meccan' | 'Medinan';
}

export interface AyahFull {
  number: number;       // ayah number within surah
  arabic: string;
  translation: string;
}

export interface SurahFull extends SurahMeta {
  ayahs: AyahFull[];
}

// All 114 surahs metadata — embedded so the surah list works fully offline.
export const SURAH_LIST: SurahMeta[] = [
  { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', translation: 'The Opening', ayahCount: 7, revelation: 'Meccan' },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', translation: 'The Cow', ayahCount: 286, revelation: 'Medinan' },
  { number: 3, name: 'Aal-Imran', arabicName: 'آل عمران', translation: 'Family of Imran', ayahCount: 200, revelation: 'Medinan' },
  { number: 4, name: 'An-Nisa', arabicName: 'النساء', translation: 'The Women', ayahCount: 176, revelation: 'Medinan' },
  { number: 5, name: 'Al-Maidah', arabicName: 'المائدة', translation: 'The Table Spread', ayahCount: 120, revelation: 'Medinan' },
  { number: 6, name: 'Al-Anam', arabicName: 'الأنعام', translation: 'The Cattle', ayahCount: 165, revelation: 'Meccan' },
  { number: 7, name: 'Al-Araf', arabicName: 'الأعراف', translation: 'The Heights', ayahCount: 206, revelation: 'Meccan' },
  { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', translation: 'The Spoils of War', ayahCount: 75, revelation: 'Medinan' },
  { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', translation: 'The Repentance', ayahCount: 129, revelation: 'Medinan' },
  { number: 10, name: 'Yunus', arabicName: 'يونس', translation: 'Jonah', ayahCount: 109, revelation: 'Meccan' },
  { number: 11, name: 'Hud', arabicName: 'هود', translation: 'Hud', ayahCount: 123, revelation: 'Meccan' },
  { number: 12, name: 'Yusuf', arabicName: 'يوسف', translation: 'Joseph', ayahCount: 111, revelation: 'Meccan' },
  { number: 13, name: 'Ar-Rad', arabicName: 'الرعد', translation: 'The Thunder', ayahCount: 43, revelation: 'Medinan' },
  { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', translation: 'Abraham', ayahCount: 52, revelation: 'Meccan' },
  { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', translation: 'The Rocky Tract', ayahCount: 99, revelation: 'Meccan' },
  { number: 16, name: 'An-Nahl', arabicName: 'النحل', translation: 'The Bee', ayahCount: 128, revelation: 'Meccan' },
  { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', translation: 'The Night Journey', ayahCount: 111, revelation: 'Meccan' },
  { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', translation: 'The Cave', ayahCount: 110, revelation: 'Meccan' },
  { number: 19, name: 'Maryam', arabicName: 'مريم', translation: 'Mary', ayahCount: 98, revelation: 'Meccan' },
  { number: 20, name: 'Ta-Ha', arabicName: 'طه', translation: 'Ta-Ha', ayahCount: 135, revelation: 'Meccan' },
  { number: 21, name: 'Al-Anbiya', arabicName: 'الأنبياء', translation: 'The Prophets', ayahCount: 112, revelation: 'Meccan' },
  { number: 22, name: 'Al-Hajj', arabicName: 'الحج', translation: 'The Pilgrimage', ayahCount: 78, revelation: 'Medinan' },
  { number: 23, name: 'Al-Muminun', arabicName: 'المؤمنون', translation: 'The Believers', ayahCount: 118, revelation: 'Meccan' },
  { number: 24, name: 'An-Nur', arabicName: 'النور', translation: 'The Light', ayahCount: 64, revelation: 'Medinan' },
  { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', translation: 'The Criterion', ayahCount: 77, revelation: 'Meccan' },
  { number: 26, name: 'Ash-Shuara', arabicName: 'الشعراء', translation: 'The Poets', ayahCount: 227, revelation: 'Meccan' },
  { number: 27, name: 'An-Naml', arabicName: 'النمل', translation: 'The Ant', ayahCount: 93, revelation: 'Meccan' },
  { number: 28, name: 'Al-Qasas', arabicName: 'القصص', translation: 'The Stories', ayahCount: 88, revelation: 'Meccan' },
  { number: 29, name: 'Al-Ankabut', arabicName: 'العنكبوت', translation: 'The Spider', ayahCount: 69, revelation: 'Meccan' },
  { number: 30, name: 'Ar-Rum', arabicName: 'الروم', translation: 'The Romans', ayahCount: 60, revelation: 'Meccan' },
  { number: 31, name: 'Luqman', arabicName: 'لقمان', translation: 'Luqman', ayahCount: 34, revelation: 'Meccan' },
  { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', translation: 'The Prostration', ayahCount: 30, revelation: 'Meccan' },
  { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', translation: 'The Confederates', ayahCount: 73, revelation: 'Medinan' },
  { number: 34, name: 'Saba', arabicName: 'سبأ', translation: 'Sheba', ayahCount: 54, revelation: 'Meccan' },
  { number: 35, name: 'Fatir', arabicName: 'فاطر', translation: 'Originator', ayahCount: 45, revelation: 'Meccan' },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', translation: 'Ya-Sin', ayahCount: 83, revelation: 'Meccan' },
  { number: 37, name: 'As-Saffat', arabicName: 'الصافات', translation: 'Those Who Set the Ranks', ayahCount: 182, revelation: 'Meccan' },
  { number: 38, name: 'Sad', arabicName: 'ص', translation: 'Sad', ayahCount: 88, revelation: 'Meccan' },
  { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', translation: 'The Groups', ayahCount: 75, revelation: 'Meccan' },
  { number: 40, name: 'Ghafir', arabicName: 'غافر', translation: 'The Forgiver', ayahCount: 85, revelation: 'Meccan' },
  { number: 41, name: 'Fussilat', arabicName: 'فصلت', translation: 'Explained in Detail', ayahCount: 54, revelation: 'Meccan' },
  { number: 42, name: 'Ash-Shura', arabicName: 'الشورى', translation: 'The Consultation', ayahCount: 53, revelation: 'Meccan' },
  { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', translation: 'The Gold Adornments', ayahCount: 89, revelation: 'Meccan' },
  { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', translation: 'The Smoke', ayahCount: 59, revelation: 'Meccan' },
  { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', translation: 'The Kneeling', ayahCount: 37, revelation: 'Meccan' },
  { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', translation: 'The Curved Sand-Hills', ayahCount: 35, revelation: 'Meccan' },
  { number: 47, name: 'Muhammad', arabicName: 'محمد', translation: 'Muhammad', ayahCount: 38, revelation: 'Medinan' },
  { number: 48, name: 'Al-Fath', arabicName: 'الفتح', translation: 'The Victory', ayahCount: 29, revelation: 'Medinan' },
  { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', translation: 'The Chambers', ayahCount: 18, revelation: 'Medinan' },
  { number: 50, name: 'Qaf', arabicName: 'ق', translation: 'Qaf', ayahCount: 45, revelation: 'Meccan' },
  { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', translation: 'The Winnowing Winds', ayahCount: 60, revelation: 'Meccan' },
  { number: 52, name: 'At-Tur', arabicName: 'الطور', translation: 'The Mount', ayahCount: 49, revelation: 'Meccan' },
  { number: 53, name: 'An-Najm', arabicName: 'النجم', translation: 'The Star', ayahCount: 62, revelation: 'Meccan' },
  { number: 54, name: 'Al-Qamar', arabicName: 'القمر', translation: 'The Moon', ayahCount: 55, revelation: 'Meccan' },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', translation: 'The Most Merciful', ayahCount: 78, revelation: 'Medinan' },
  { number: 56, name: 'Al-Waqiah', arabicName: 'الواقعة', translation: 'The Inevitable', ayahCount: 96, revelation: 'Meccan' },
  { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', translation: 'The Iron', ayahCount: 29, revelation: 'Medinan' },
  { number: 58, name: 'Al-Mujadilah', arabicName: 'المجادلة', translation: 'The Pleading Woman', ayahCount: 22, revelation: 'Medinan' },
  { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', translation: 'The Gathering', ayahCount: 24, revelation: 'Medinan' },
  { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', translation: 'She That Is To Be Examined', ayahCount: 13, revelation: 'Medinan' },
  { number: 61, name: 'As-Saff', arabicName: 'الصف', translation: 'The Ranks', ayahCount: 14, revelation: 'Medinan' },
  { number: 62, name: 'Al-Jumuah', arabicName: 'الجمعة', translation: 'Friday', ayahCount: 11, revelation: 'Medinan' },
  { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', translation: 'The Hypocrites', ayahCount: 11, revelation: 'Medinan' },
  { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', translation: 'Mutual Disillusion', ayahCount: 18, revelation: 'Medinan' },
  { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', translation: 'The Divorce', ayahCount: 12, revelation: 'Medinan' },
  { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', translation: 'The Prohibition', ayahCount: 12, revelation: 'Medinan' },
  { number: 67, name: 'Al-Mulk', arabicName: 'الملك', translation: 'The Sovereignty', ayahCount: 30, revelation: 'Meccan' },
  { number: 68, name: 'Al-Qalam', arabicName: 'القلم', translation: 'The Pen', ayahCount: 52, revelation: 'Meccan' },
  { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', translation: 'The Reality', ayahCount: 52, revelation: 'Meccan' },
  { number: 70, name: 'Al-Maarij', arabicName: 'المعارج', translation: 'The Ascending Stairways', ayahCount: 44, revelation: 'Meccan' },
  { number: 71, name: 'Nuh', arabicName: 'نوح', translation: 'Noah', ayahCount: 28, revelation: 'Meccan' },
  { number: 72, name: 'Al-Jinn', arabicName: 'الجن', translation: 'The Jinn', ayahCount: 28, revelation: 'Meccan' },
  { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', translation: 'The Enshrouded One', ayahCount: 20, revelation: 'Meccan' },
  { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', translation: 'The Cloaked One', ayahCount: 56, revelation: 'Meccan' },
  { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', translation: 'The Resurrection', ayahCount: 40, revelation: 'Meccan' },
  { number: 76, name: 'Al-Insan', arabicName: 'الانسان', translation: 'Man', ayahCount: 31, revelation: 'Medinan' },
  { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', translation: 'The Emissaries', ayahCount: 50, revelation: 'Meccan' },
  { number: 78, name: 'An-Naba', arabicName: 'النبأ', translation: 'The Tidings', ayahCount: 40, revelation: 'Meccan' },
  { number: 79, name: 'An-Naziat', arabicName: 'النازعات', translation: 'Those Who Drag Forth', ayahCount: 46, revelation: 'Meccan' },
  { number: 80, name: 'Abasa', arabicName: 'عبس', translation: 'He Frowned', ayahCount: 42, revelation: 'Meccan' },
  { number: 81, name: 'At-Takwir', arabicName: 'التكوير', translation: 'The Overthrowing', ayahCount: 29, revelation: 'Meccan' },
  { number: 82, name: 'Al-Infitar', arabicName: 'الإنفطار', translation: 'The Cleaving', ayahCount: 19, revelation: 'Meccan' },
  { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', translation: 'Defrauding', ayahCount: 36, revelation: 'Meccan' },
  { number: 84, name: 'Al-Inshiqaq', arabicName: 'الإنشقاق', translation: 'The Splitting Open', ayahCount: 25, revelation: 'Meccan' },
  { number: 85, name: 'Al-Buruj', arabicName: 'البروج', translation: 'The Constellations', ayahCount: 22, revelation: 'Meccan' },
  { number: 86, name: 'At-Tariq', arabicName: 'الطارق', translation: 'The Morning Star', ayahCount: 17, revelation: 'Meccan' },
  { number: 87, name: 'Al-Ala', arabicName: 'الأعلى', translation: 'The Most High', ayahCount: 19, revelation: 'Meccan' },
  { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', translation: 'The Overwhelming', ayahCount: 26, revelation: 'Meccan' },
  { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', translation: 'The Dawn', ayahCount: 30, revelation: 'Meccan' },
  { number: 90, name: 'Al-Balad', arabicName: 'البلد', translation: 'The City', ayahCount: 20, revelation: 'Meccan' },
  { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', translation: 'The Sun', ayahCount: 15, revelation: 'Meccan' },
  { number: 92, name: 'Al-Lail', arabicName: 'الليل', translation: 'The Night', ayahCount: 21, revelation: 'Meccan' },
  { number: 93, name: 'Ad-Duha', arabicName: 'الضحى', translation: 'The Morning Hours', ayahCount: 11, revelation: 'Meccan' },
  { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', translation: 'The Relief', ayahCount: 8, revelation: 'Meccan' },
  { number: 95, name: 'At-Tin', arabicName: 'التين', translation: 'The Fig', ayahCount: 8, revelation: 'Meccan' },
  { number: 96, name: 'Al-Alaq', arabicName: 'العلق', translation: 'The Clot', ayahCount: 19, revelation: 'Meccan' },
  { number: 97, name: 'Al-Qadr', arabicName: 'القدر', translation: 'The Power', ayahCount: 5, revelation: 'Meccan' },
  { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', translation: 'The Clear Proof', ayahCount: 8, revelation: 'Medinan' },
  { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', translation: 'The Earthquake', ayahCount: 8, revelation: 'Medinan' },
  { number: 100, name: 'Al-Adiyat', arabicName: 'العاديات', translation: 'The Courser', ayahCount: 11, revelation: 'Meccan' },
  { number: 101, name: 'Al-Qariah', arabicName: 'القارعة', translation: 'The Calamity', ayahCount: 11, revelation: 'Meccan' },
  { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', translation: 'Rivalry in World Increase', ayahCount: 8, revelation: 'Meccan' },
  { number: 103, name: 'Al-Asr', arabicName: 'العصر', translation: 'Time', ayahCount: 3, revelation: 'Meccan' },
  { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', translation: 'The Traducer', ayahCount: 9, revelation: 'Meccan' },
  { number: 105, name: 'Al-Fil', arabicName: 'الفيل', translation: 'The Elephant', ayahCount: 5, revelation: 'Meccan' },
  { number: 106, name: 'Quraysh', arabicName: 'قريش', translation: 'Quraysh', ayahCount: 4, revelation: 'Meccan' },
  { number: 107, name: 'Al-Maun', arabicName: 'الماعون', translation: 'Small Kindnesses', ayahCount: 7, revelation: 'Meccan' },
  { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', translation: 'The Abundance', ayahCount: 3, revelation: 'Meccan' },
  { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', translation: 'The Disbelievers', ayahCount: 6, revelation: 'Meccan' },
  { number: 110, name: 'An-Nasr', arabicName: 'النصر', translation: 'The Divine Support', ayahCount: 3, revelation: 'Medinan' },
  { number: 111, name: 'Al-Masad', arabicName: 'المسد', translation: 'The Palm Fibre', ayahCount: 5, revelation: 'Meccan' },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', translation: 'Sincerity', ayahCount: 4, revelation: 'Meccan' },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', translation: 'The Daybreak', ayahCount: 5, revelation: 'Meccan' },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', translation: 'Mankind', ayahCount: 6, revelation: 'Meccan' },
];

const cacheKey = (n: number, ed: string) => `quran-${n}-${ed}`;

interface ApiAyah { numberInSurah: number; text: string; }
interface ApiResp { data: { ayahs: ApiAyah[] } }

export const fetchSurah = async (
  number: number,
  translationEdition = 'en.sahih'
): Promise<SurahFull> => {
  const meta = SURAH_LIST.find((s) => s.number === number);
  if (!meta) throw new Error('Surah not found');

  const ck = cacheKey(number, translationEdition);
  const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(ck) : null;
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }

  const [arRes, trRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/${translationEdition}`),
  ]);
  if (!arRes.ok || !trRes.ok) throw new Error('Failed to fetch surah');
  const arJson = (await arRes.json()) as ApiResp;
  const trJson = (await trRes.json()) as ApiResp;

  const ayahs: AyahFull[] = arJson.data.ayahs.map((a, i) => ({
    number: a.numberInSurah,
    arabic: a.text,
    translation: trJson.data.ayahs[i]?.text ?? '',
  }));

  const full: SurahFull = { ...meta, ayahs };
  try { localStorage.setItem(ck, JSON.stringify(full)); } catch { /* quota */ }
  return full;
};
