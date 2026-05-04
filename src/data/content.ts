export interface Ayah {
  number: number;
  arabic: string;
  translation: string;
  reflection?: string;
}

export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  translation: string;
  ayahs: Ayah[];
}

export const SURAHS: Surah[] = [
  {
    number: 1,
    name: 'Al-Fatiha',
    arabicName: 'الفاتحة',
    translation: 'The Opening',
    ayahs: [
      { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Gracious, the Most Merciful.', reflection: 'Begin everything with His name — and your day softens.' },
      { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'All praise is due to Allah, Lord of the worlds.' },
      { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Most Gracious, the Most Merciful.' },
      { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Master of the Day of Judgment.' },
      { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'You alone we worship, and You alone we ask for help.', reflection: 'A vow renewed seventeen times a day.' },
      { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us along the straight path.' },
      { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those You have blessed — not those who earned anger, nor those who went astray.' },
    ],
  },
  {
    number: 112,
    name: 'Al-Ikhlas',
    arabicName: 'الإخلاص',
    translation: 'Sincerity',
    ayahs: [
      { number: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say: He is Allah, the One.' },
      { number: 2, arabic: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.', reflection: 'Everything leans on Him; He leans on nothing.' },
      { number: 3, arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born.' },
      { number: 4, arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'And there is none comparable to Him.' },
    ],
  },
  {
    number: 113,
    name: 'Al-Falaq',
    arabicName: 'الفلق',
    translation: 'The Daybreak',
    ayahs: [
      { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say: I seek refuge in the Lord of daybreak.' },
      { number: 2, arabic: 'مِن شَرِّ مَا خَلَقَ', translation: 'From the evil of what He has created.' },
      { number: 3, arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'From the evil of darkness when it settles.' },
      { number: 4, arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of those who blow on knots.' },
      { number: 5, arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies.' },
    ],
  },
  {
    number: 114,
    name: 'An-Nas',
    arabicName: 'الناس',
    translation: 'Mankind',
    ayahs: [
      { number: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say: I seek refuge in the Lord of mankind.' },
      { number: 2, arabic: 'مَلِكِ النَّاسِ', translation: 'The King of mankind.' },
      { number: 3, arabic: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind.' },
      { number: 4, arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the lurking whisperer.' },
      { number: 5, arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers into the hearts of mankind.' },
      { number: 6, arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'Among the jinn and mankind.' },
    ],
  },
];

export const DAILY_REMINDERS = [
  { text: 'Verily, with hardship comes ease.', source: 'Quran 94:6' },
  { text: 'Allah does not burden a soul beyond what it can bear.', source: 'Quran 2:286' },
  { text: 'And remember Me — I will remember you.', source: 'Quran 2:152' },
  { text: 'The most beloved deeds to Allah are those done consistently, even if small.', source: 'Hadith — Bukhari' },
  { text: 'Seek help through patience and prayer.', source: 'Quran 2:45' },
  { text: 'Indeed, in the remembrance of Allah do hearts find rest.', source: 'Quran 13:28' },
  { text: 'Be in this world as if you were a stranger or a traveler.', source: 'Hadith — Bukhari' },
];

export const todayReminder = () => {
  const i = new Date().getDate() % DAILY_REMINDERS.length;
  return DAILY_REMINDERS[i];
};

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: 'Prophets' | 'Companions' | 'History' | 'Modern';
  readTime: string;
  excerpt: string;
  body: string[];
}

export const STORIES: Story[] = [
  {
    id: 'yunus',
    title: 'Yunus in the Belly of the Whale',
    subtitle: 'A prayer that pierced three darknesses',
    category: 'Prophets',
    readTime: '4 min',
    excerpt: 'When everything went dark, he did not stop calling out.',
    body: [
      'Yunus (peace be upon him) walked away from his people in frustration. The sea swallowed his ship. A whale swallowed him.',
      'Inside the darkness of the belly, the darkness of the deep sea, and the darkness of the night — he did not despair. He whispered: "There is no god but You. Glory be to You. Indeed, I have been among the wrongdoers."',
      'Allah heard him. The whale released him onto a quiet shore. A vine grew over him to give shade.',
      'No matter how dark it gets — your voice still reaches the One who listens.',
    ],
  },
  {
    id: 'bilal',
    title: 'Bilal — The Voice of Dawn',
    subtitle: 'A freed slave who called the world to prayer',
    category: 'Companions',
    readTime: '3 min',
    excerpt: 'They placed a stone on his chest. He answered with one word: One.',
    body: [
      'Bilal ibn Rabah was tortured under the Meccan sun, a heavy stone crushing his chest. Through cracked lips, he repeated: "Ahad. Ahad." — One. One.',
      'When the Prophet ﷺ entered Medina, it was Bilal he chose to call the first adhan. His voice — once silenced — became the voice that woke a city to prayer.',
      'What the world tried to break, Allah elevated.',
    ],
  },
  {
    id: 'khadija',
    title: 'Khadija — The First to Believe',
    subtitle: 'Strength wrapped in tenderness',
    category: 'Companions',
    readTime: '3 min',
    excerpt: 'When he came home shaking, she wrapped him in a blanket and in faith.',
    body: [
      'When the Prophet ﷺ returned from the cave of Hira trembling, it was Khadija who calmed him. "By Allah, He will never disgrace you. You keep good ties, carry the weak, and stand by the truth."',
      'She believed before anyone believed. She gave her wealth, her home, her heart.',
      'A reminder that the people who steady us are themselves a mercy.',
    ],
  },
  {
    id: 'andalus',
    title: 'The Library of Cordoba',
    subtitle: 'When Muslims lit the world with knowledge',
    category: 'History',
    readTime: '5 min',
    excerpt: 'A city where streetlamps burned and books outnumbered the stars.',
    body: [
      'In 10th-century Cordoba, while much of Europe slept in darkness, Muslim Spain glowed.',
      'The royal library held over 400,000 volumes — catalogued, copied, and freely read. Streets were paved and lit. Scholars of every faith gathered.',
      'Knowledge, when paired with worship, is a form of light.',
    ],
  },
];
