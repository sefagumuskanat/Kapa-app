/**
 * Meslek listesi — kayıt sırasında seçilir.
 * Liste uzun olduğu için ekranda arama kutusu var (bkz. ProfessionPicker).
 */

export interface Profession {
  id: string;
  label: string;
  group: string;
}

const GROUPS: Record<string, string[]> = {
  'Sağlık': [
    'Doktor (Pratisyen)', 'Doktor (Uzman)', 'Diş Hekimi', 'Eczacı', 'Hemşire', 'Ebe',
    'Veteriner', 'Fizyoterapist', 'Diyetisyen', 'Psikolog', 'Laborant', 'Sağlık Memuru',
    'Optisyen', 'Paramedik',
  ],
  'Eğitim': [
    'Öğretmen (Sınıf)', 'Öğretmen (Branş)', 'Okul Öncesi Öğretmeni', 'Akademisyen',
    'Öğretim Görevlisi', 'Rehber Öğretmen', 'Özel Ders Öğretmeni', 'Eğitim Koordinatörü',
  ],
  'Mühendislik': [
    'Yazılım Mühendisi', 'Bilgisayar Mühendisi', 'Elektrik-Elektronik Mühendisi',
    'Makine Mühendisi', 'İnşaat Mühendisi', 'Endüstri Mühendisi', 'Kimya Mühendisi',
    'Harita Mühendisi', 'Gıda Mühendisi', 'Ziraat Mühendisi', 'Çevre Mühendisi',
    'Jeoloji Mühendisi', 'Maden Mühendisi', 'Mekatronik Mühendisi',
  ],
  'Bilişim': [
    'Yazılım Geliştirici', 'Mobil Geliştirici', 'Web Geliştirici', 'Veri Analisti',
    'Veri Bilimci', 'Sistem Yöneticisi', 'Ağ Uzmanı', 'Siber Güvenlik Uzmanı',
    'Test Uzmanı', 'DevOps Uzmanı', 'Oyun Geliştirici', 'Teknik Destek Uzmanı',
    'Ürün Yöneticisi', 'UI/UX Tasarımcı',
  ],
  'Hukuk ve Kamu': [
    'Avukat', 'Hakim', 'Savcı', 'Noter', 'Hukuk Müşaviri', 'İcra Memuru',
    'Memur (Kamu)', 'Kaymakam', 'Vali', 'Belediye Çalışanı', 'Zabıta',
    'Polis Memuru', 'Asker (Subay)', 'Asker (Astsubay)', 'İtfaiyeci', 'Gümrük Memuru',
  ],
  'Finans': [
    'Muhasebeci', 'Mali Müşavir', 'Bankacı', 'Finans Uzmanı', 'Denetçi',
    'Sigortacı', 'Aktüer', 'Borsa Uzmanı', 'Kredi Uzmanı', 'Eksper',
  ],
  'Ticaret ve Satış': [
    'Esnaf', 'Dükkân Sahibi', 'Satış Temsilcisi', 'Mağaza Müdürü', 'Kasiyer',
    'Pazarlamacı', 'İthalat-İhracat Uzmanı', 'Emlakçı', 'Toptancı', 'E-ticaret Satıcısı',
    'Kuyumcu', 'Bayi Sahibi',
  ],
  'Sanayi ve Üretim': [
    'Fabrika İşçisi', 'Usta', 'Kaynakçı', 'Tornacı', 'Tesisatçı', 'Elektrikçi',
    'Marangoz', 'Boyacı', 'Sıvacı', 'Demirci', 'Makinist', 'Kalıpçı',
    'Vardiya Amiri', 'Üretim Müdürü', 'Kalite Kontrol Uzmanı',
  ],
  'İnşaat': [
    'Müteahhit', 'Mimar', 'İç Mimar', 'Şantiye Şefi', 'İnşaat İşçisi',
    'Peyzaj Mimarı', 'Teknik Ressam', 'Emlak Geliştirici',
  ],
  'Ulaşım': [
    'Şoför (Ticari)', 'TIR Şoförü', 'Taksici', 'Kurye', 'Kaptan', 'Pilot',
    'Kabin Görevlisi', 'Makinist (Tren)', 'Lojistik Uzmanı', 'Vinç Operatörü',
  ],
  'Turizm ve Hizmet': [
    'Otel Çalışanı', 'Otel Müdürü', 'Aşçı', 'Şef', 'Garson', 'Barista',
    'Turist Rehberi', 'Animatör', 'Resepsiyonist', 'Kuaför', 'Berber',
    'Güzellik Uzmanı', 'Masör', 'Temizlik Görevlisi', 'Güvenlik Görevlisi',
  ],
  'Medya ve Sanat': [
    'Gazeteci', 'Editör', 'Yazar', 'Çevirmen', 'Fotoğrafçı', 'Kameraman',
    'Grafik Tasarımcı', 'Video Editörü', 'Ses Teknisyeni', 'Müzisyen',
    'Oyuncu', 'Yönetmen', 'Sosyal Medya Uzmanı', 'İçerik Üreticisi', 'Ressam',
  ],
  'Tarım ve Hayvancılık': [
    'Çiftçi', 'Besici', 'Arıcı', 'Balıkçı', 'Seracı', 'Bağcı', 'Ormancı',
  ],
  'Spor': [
    'Sporcu (Profesyonel)', 'Antrenör', 'Spor Eğitmeni', 'Hakem', 'Masör (Spor)',
  ],
  'Diğer': [
    'Öğrenci', 'Emekli', 'Ev Hanımı / Ev Erkeği', 'Serbest Meslek', 'Girişimci',
    'Yatırımcı', 'İşsiz', 'Çalışmıyorum', 'Belirtmek İstemiyorum',
  ],
};

function slug(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const PROFESSIONS: Profession[] = Object.entries(GROUPS).flatMap(([group, items]) =>
  items.map((label) => ({ id: slug(label), label, group })),
);

export const PROFESSION_GROUPS = Object.keys(GROUPS);

export function findProfession(id: string | undefined): Profession | null {
  if (!id) return null;
  return PROFESSIONS.find((p) => p.id === id) ?? null;
}
