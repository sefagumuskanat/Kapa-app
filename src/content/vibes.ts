/**
 * KAPAMETRE'nin ağzı.
 *
 * Uygulamanın tonu buradan yönetilir. Hedef kitle ciddi yatırımcı değil;
 * "acaba kaç paralık adamım" diye merak eden, eğlenmek için açan kullanıcı.
 * Bu yüzden metinler mahalle ağzı, samimi ve şakacı.
 *
 * Tek kural: şaka dürüstlüğü bozmaz. Değerin tahmin olduğu, yatırım tavsiyesi
 * olmadığı ve verinin cihazda kaldığı bilgisi espriyle yumuşatılır ama gizlenmez.
 */

import { AssetCategory, AssetCondition, RankCohort, ValuationScenario } from '@/types';

export const BRAND = {
  name: 'KAPAMETRE',
  /** KAPA = Kaç PAralık Adam */
  tagline: 'Kaç paralık adamsın?',
  expansion: 'KAPA = “Kaç Paralık Adam”',
  subtitle: 'Kaç paralık adam olduğunu ölçer.',
} as const;

/* ------------------------------------------------------------------ */
/* Varlık ekleme kutlamaları                                           */
/* ------------------------------------------------------------------ */

export interface Celebration {
  emoji: string;
  headline: string;
  line: string;
}

/** Küçük katkılar — yine de tebrik ederiz. */
const SMALL_WIN: Celebration[] = [
  { emoji: '🎉', headline: 'Allah bereket versin!', line: 'Malına mal kattın yine.' },
  { emoji: '🤲', headline: 'Maşallah!', line: 'Bu da kasaya girdi işte.' },
  { emoji: '👏', headline: 'Eline sağlık!', line: 'Damlaya damlaya göl olur.' },
  { emoji: '✨', headline: 'Hayırlı olsun!', line: 'Güle güle kullan inşallah.' },
  { emoji: '🙂', headline: 'Oldu bu iş!', line: 'Azıcık daha zenginsin.' },
];

/** Orta boy katkılar. */
const MID_WIN: Celebration[] = [
  { emoji: '😎', headline: 'Vay be, adamın malı var!', line: 'Bu ciddi bir katkı oldu.' },
  { emoji: '💰', headline: 'Bereket versin!', line: 'Kese gözle görülür şekilde şişti.' },
  { emoji: '🔥', headline: 'Helal olsun sana!', line: 'Böyle giderse mahallede konuşuruz.' },
  { emoji: '🎊', headline: 'Aferin be!', line: 'Malına mal kattın, hem de iyisinden.' },
];

/** Büyük katkılar — abartmakta beis yok. */
const BIG_WIN: Celebration[] = [
  { emoji: '🤑', headline: 'Yuh artık!', line: 'Sen bu işi ciddiye almışsın.' },
  { emoji: '👑', headline: 'Kodaman geldi!', line: 'Bu tek başına bir servet.' },
  { emoji: '🚀', headline: 'Maşallah maşallah!', line: 'Nazar değmesin, epey büyük bir kalem.' },
  { emoji: '💎', headline: 'Bu ne böyle!', line: 'Kasa sallandı resmen.' },
];

/**
 * Eklenen varlığın Normal Satış değerine göre kutlama seçer.
 * Küçük bir kaleme "yuh artık" demek komik değil, sahte olur.
 */
export function pickCelebration(normalValue: number): Celebration {
  const pool = normalValue >= 500_000 ? BIG_WIN : normalValue >= 50_000 ? MID_WIN : SMALL_WIN;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Değeri hesaplanamayan varlık için ayrı ton — yalandan övmeyiz. */
export const UNKNOWN_VALUE_CELEBRATION: Celebration = {
  emoji: '🤔',
  headline: 'Eklendi ama…',
  line: 'Buna bir değer biçemedik. Biraz detay girersen yardımcı oluruz.',
};

/* ------------------------------------------------------------------ */
/* "Kaç paralık adamsın" karnesi                                       */
/* ------------------------------------------------------------------ */

export interface KapaTier {
  min: number;
  emoji: string;
  title: string;
  line: string;
}

/** Toplam Normal Satış değerine göre kullanıcının karnesi. */
export const KAPA_TIERS: KapaTier[] = [
  {
    min: 0,
    emoji: '🕳️',
    title: 'Cepte delik var',
    line: 'Şu an teknik olarak sıfır paralık adamsın. Ama umut fakirin ekmeği.',
  },
  {
    min: 25_000,
    emoji: '🙂',
    title: 'İdare eder',
    line: 'Yani aç kalmazsın. Fena da sayılmaz.',
  },
  {
    min: 150_000,
    emoji: '😌',
    title: 'Fena değilmişsin',
    line: 'Bir şeyler biriktirmişsin. Devam.',
  },
  {
    min: 750_000,
    emoji: '😎',
    title: 'Adamın malı var',
    line: 'Bu noktada artık laf söylemeye hakkın var.',
  },
  {
    min: 3_000_000,
    emoji: '🤑',
    title: 'Kodaman',
    line: 'Mahallede sana selam duruyorlardır.',
  },
  {
    min: 15_000_000,
    emoji: '👑',
    title: 'Efsane',
    line: 'Sen bu uygulamayı niye kullanıyorsun ki?',
  },
];

export function resolveKapaTier(normalValue: number): KapaTier {
  let tier = KAPA_TIERS[0];
  for (const candidate of KAPA_TIERS) {
    if (normalValue >= candidate.min) tier = candidate;
  }
  return tier;
}

/* ------------------------------------------------------------------ */
/* Sıralama kohortları                                                 */
/* ------------------------------------------------------------------ */

export const COHORT_VIBE: Record<RankCohort, { emoji: string; title: string; line: string }> = {
  starter: {
    emoji: '🌱',
    title: 'Fakir ama gururlu',
    line: 'Herkes bir yerden başlıyor.',
  },
  builder: {
    emoji: '🧱',
    title: 'Yavaş yavaş toparlıyor',
    line: 'Tuğla tuğla örüyorsun.',
  },
  established: {
    emoji: '😎',
    title: 'Hali vakti yerinde',
    line: 'Bu ligde işler ciddileşiyor.',
  },
  advanced: {
    emoji: '🤑',
    title: 'Kodamanlar ligi',
    line: 'Burada herkesin malı var.',
  },
};

/* ------------------------------------------------------------------ */
/* Kategori ve durum etiketleri                                        */
/* ------------------------------------------------------------------ */

export const CATEGORY_EMOJI: Record<AssetCategory, string> = {
  gold: '🪙',
  silver: '🥈',
  jewelry: '💍',
  watch: '⌚',
  electronics: '📱',
  photography: '📷',
  vehicle: '🚗',
  bicycle: '🚲',
  furniture: '🛋️',
  collectible: '🏆',
  property: '🏠',
  other: '📦',
};

export const CONDITION_EMOJI: Record<AssetCondition, string> = {
  new: '✨',
  likeNew: '🌟',
  good: '👍',
  fair: '🤷',
  poor: '🩹',
};

/* ------------------------------------------------------------------ */
/* Senaryo açıklamaları                                                */
/* ------------------------------------------------------------------ */

/** Üç senaryonun mahalle ağzıyla karşılığı. */
export const SCENARIO_VIBE: Record<ValuationScenario, { emoji: string; hint: string }> = {
  fast: { emoji: '🏃', hint: 'Acil param lazım dersen' },
  normal: { emoji: '🤝', hint: 'Normal şartlarda satarsan' },
  patient: { emoji: '🪑', hint: 'Alıcıyı beklerim abi dersen' },
};

/* ------------------------------------------------------------------ */
/* Güven skoru                                                          */
/* ------------------------------------------------------------------ */

/** Sahte kesinlik yok; "bilmiyoruz"u da açıkça söyleriz, ama gülerek. */
export function confidenceVibe(score: number): { emoji: string; label: string } {
  if (score >= 0.75) return { emoji: '💪', label: 'Bundan gayet eminiz' };
  if (score >= 0.5) return { emoji: '🤔', label: 'Şöyle böyle eminiz' };
  if (score >= 0.3) return { emoji: '😬', label: 'Pek emin değiliz' };
  return { emoji: '🤷', label: 'Valla bilemedik' };
}

/* ------------------------------------------------------------------ */
/* Boş durumlar ve uyarılar                                            */
/* ------------------------------------------------------------------ */

export const EMPTY = {
  home: {
    emoji: '🪹',
    title: 'Kasa bomboş',
    line: 'Daha hiçbir şey eklemedin. Şu haliyle sıfır paralık adamsın — ki bu düzeltilebilir bir durum.',
  },
  assets: {
    emoji: '📦',
    title: 'Burada hiçbir şey yok',
    line: 'Ne eklersen burada listelenir. Altın, telefon, bisiklet… ne varsa.',
  },
  search: {
    emoji: '🔍',
    title: 'Bulamadık',
    line: 'Öyle bir şeyin yok galiba. Aramayı değiştirip tekrar dene.',
  },
  documents: {
    emoji: '🧾',
    title: 'Belge yok',
    line: 'Faturayı sakladıysan tara, kaybolmasın.',
  },
} as const;

export const DELETE_ASSET = {
  title: 'Bu gidiyor mu?',
  body: (name: string) => `"${name}" listeden tamamen silinecek. Sattıysan helal olsun, kaybettiysen geçmiş olsun.`,
  confirm: 'Sil gitsin',
  cancel: 'Dur bakalım',
} as const;

export const DELETE_ALL = {
  title: 'Her şeyi silelim mi?',
  body: (assets: number, documents: number) =>
    `${assets} varlık ve ${documents} belge cihazından uçacak. Geri getirmenin yolu yok, baştan girersin.`,
  confirm: 'Hepsini sil',
  cancel: 'Yok, vazgeçtim',
} as const;

/* ------------------------------------------------------------------ */
/* Yasal uyarı — şakayla ama net                                       */
/* ------------------------------------------------------------------ */

export const DISCLAIMER =
  'Bunlar tahmin, kesin fiyat değil. Yatırım tavsiyesi hiç değil — paranı buna bakarak yatırma. 🙃';

export const DISCLAIMER_SHORT = 'Tahmini değerler. Yatırım tavsiyesi değildir.';

export const NOT_A_BANK = [
  { emoji: '🏦', text: 'Banka değiliz, paranı tutmuyoruz.' },
  { emoji: '📈', text: 'Yatırım tavsiyesi vermiyoruz, veremeyiz de.' },
  { emoji: '🛒', text: 'Pazar yeri değiliz, burada alım satım yok.' },
  { emoji: '👥', text: 'Sosyal medya değiliz, kimsenin listesini göremezsin.' },
  { emoji: '📸', text: 'Eşyalarının fotoğrafını istemiyoruz.' },
];

export const WHAT_WE_DO = {
  emoji: '✅',
  text: 'Neyin var yazıyorsun, biz de üç ihtimalle kaç para eder söylüyoruz. Hepsi bu.',
};

/* ------------------------------------------------------------------ */
/* Gizlilik — samimi dille                                             */
/* ------------------------------------------------------------------ */

export const PRIVACY_PITCH = {
  emoji: '🔒',
  title: 'Kimse görmüyor, merak etme',
  line: 'Listen telefonunda kalıyor. Biz de görmüyoruz, komşu da görmüyor.',
} as const;

export const RANK_PITCH = {
  emoji: '🏆',
  title: 'Sıralamaya girmek ister misin?',
  line: 'İsteğe bağlı. Girersen sadece toplam değerinin hangi aralıkta olduğu, isimsiz şekilde karşılaştırılır. Kimse seni göremez, sen de kimseyi göremezsin.',
} as const;
