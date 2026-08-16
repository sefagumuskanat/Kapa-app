# KAPAMETRE

> **Varlığını ölç.**

Kullanıcının sahip olduğu varlıkların bugünkü nakit karşılığını **üç senaryoda** hesaplayan,
privacy-first, Türkiye pazarına yönelik mobil uygulama. Expo + React Native + TypeScript.

Bu depo **gerçek backend gerektirmeyen, tamamen tıklanabilir bir demo** üretir. Tüm servisler
mock'tur; hiçbir canlı fiyat kaynağı, scraping veya gerçek API anahtarı içermez.

---

## Ürün kuralı

KAPAMETRE **değildir**:

- banka veya ödeme kuruluşu
- yatırım tavsiyesi veren bir araç
- pazar yeri
- sosyal platform
- fotoğraf tabanlı envanter uygulaması

KAPAMETRE **sadece** şunu yapar: kullanıcının varlıklarını *metin tabanlı* olarak kaydeder ve
3 senaryoda değerler.

## Üç değerleme senaryosu

| Senaryo | Anlamı | Rolü |
| --- | --- | --- |
| **Hızlı Satış** | Bugün elden çıkarırsan | likidite iskontosu |
| **Normal Satış** | Makul sürede satarsan | **ANA METRİK** — toplam ve sıralama bunu kullanır |
| **Tok Satıcı** | Beklemeye razıysan | sabır primi |

Dördüncü bir değer gösterilmez. Her değer **zorunlu olarak** güven skoru (`confidenceScore`),
kaynak etiketi ve zaman damgası ile birlikte sunulur — sahte kesinlik üretilmez.

---

## Kurulum

```bash
npm install
npm start          # Expo geliştirme sunucusu
npm run android    # veya: ios / web
npm run typecheck  # tsc --noEmit
```

İlk açılışta onboarding tamamlandığında demo portföy otomatik yüklenir
(20g altın · 2 parti, Sony A7 IV seti, maliyeti bilinmeyen telefon, hediye bisiklet,
pırlanta yüzük). Ayarlar → Demo bölümünden yeniden yüklenebilir.

---

## Mimari

```
src/
├─ types/         Domain modelleri (Asset, ValuationSnapshot, RankConsent, …)
├─ data/          storage.ts (şifreli yerel depo soyutlaması), catalog.ts, demoData.ts
├─ services/      Modüler servis katmanı — hepsi arayüz + mock implementasyon
├─ store/         AppContext (reducer tabanlı tek durum kaynağı)
├─ theme/         colors / spacing / typography
├─ components/    Yeniden kullanılabilir UI kiti
├─ screens/       9 ekran
└─ navigation/    Root stack + özel bottom tab bar
```

### Servisler

Her servis bir arayüz (`I…Service`) ve bir mock implementasyon olarak tanımlıdır; gerçek
implementasyona geçmek için yalnızca export edilen örneği değiştirmek yeterlidir.

| Servis | Sorumluluk | Not |
| --- | --- | --- |
| `CatalogService` | Gömülü katalogda arama | Ağ yok, scraping yok |
| `ValuationService` | 3 senaryolu değerleme + portföy özeti | Adapter zinciri (aşağıda) |
| `MarketPriceService` | Kategori bazlı referans fiyat | Canlı fiyat **değil**; minimal payload |
| `RankService` | Opt-in, kohort bazlı sıralama | Takma kimlik, kullanıcı listesi yok |
| `SubscriptionService` | Abonelik + restore purchases | Mock mağaza, demo fiyat |
| `OCRService` | Belge tarama ve alan çıkarımı | Cihazda, yalnızca belge |
| `PrivacyService` | Tercihler, veri envanteri, tüm veriyi silme | Şifreleme stub'ı |
| `AdService` | Reklam alanı | Hedefleme yok, finansal veri taşımaz |

### Değerleme mantığı

`ValuationService` sıralı bir **adapter zinciri** kullanır; ilk çözen adapter kazanır:

1. `CatalogAdapter` — katalog eşleşmesi (güvenilirlik kategoriye göre ölçeklenir)
2. `DeclaredValueAdapter` — kullanıcının beyan ettiği referans değer
3. `MarketAdapter` — kategori bazlı referans tablo
4. `AcquisitionFallbackAdapter` — edinim maliyetinden türetim

Bulunan birim değer üzerine:

- **kondisyon çarpanı** (değerli madenlerde uygulanmaz — ayar/gramaj belirleyicidir)
- **alt parça katkısı** (ör. gövde + lens + çanta)
- **likidite profili** — kategori bazlı hızlı satış iskontosu ve tok satıcı primi

uygulanır. Güven skoru bileşiktir: `kaynak güvenilirliği × 0.7 + veri eksiksizliği × 0.3`,
ardından bayatlık cezası ve `[0.05, 0.92]` aralığına sıkıştırma. **Skor asla 1'e ulaşmaz.**

`ValuationAdapter` arayüzü dışa açıktır; `valuationService.registerAdapter(...)` ile
gerçek bir fiyat kaynağı zincirin başına eklenebilir.

### Bilinmeyen maliyet

Bir varlığın partilerinden **herhangi biri** maliyetsizse toplam maliyet iddia edilmez
(`acquisitionCost: null`) ve kâr/zarar hesaplanmaz. Portföy düzeyinde bu varlıklar
`unknownCostAssetCount` ile sayılır ve kullanıcıya açıkça bildirilir.

---

## Privacy-first mimari

- Tüm varlık ve belge verisi **cihazda** `EncryptedLocalStore` içinde tutulur.
- Sunucuya giden tek fiyat sorgusu payload'ı: `{ category, unit, currency }`.
- Sıralama açıksa giden tek payload: `{ pseudonymId, normalValueBucket, cohort }` —
  ham değer bile gönderilmez, kova etiketine indirgenir.
- Reklam isteği yalnızca `{ slot, locale }` taşır; finansal veriyle hedefleme yapılmaz.
- Ayarlar → *Verin nerede duruyor?* bölümü bu payload'ları kullanıcıya **birebir gösterir**.
- Ayarlar → *Tüm yerel verimi sil* tek adımda geri alınamaz silme yapar.

> **Not:** `storage.ts` içindeki şifreleme katmanı bilinçli bir **yer tutucudur** ve
> kriptografik güvence sağlamaz. Uygulama bunu kullanıcıdan gizlemez — Ayarlar ekranındaki
> Şifreleme kartı stub olduğunu açıkça yazar. Üretimde platform keystore + AES-GCM gelir.

## Sıralama (opt-in)

- Varsayılan **kapalı**; onboarding'de yaş kapısından **ayrı** bir rıza olarak sorulur.
- Yalnızca **Normal Satış** değeri kullanılır.
- Takma kimlik rıza anında cihazda üretilir; rıza geri alınınca silinir.
- Sonuç **kohort bazlı ve maskelidir** (ör. "üst %25"); kesin sıra numarası verilmez.
- **Kullanıcı listesi, profil, takip veya mesajlaşma yoktur.**

---

## Ekranlar

| # | Ekran | İçerik |
| --- | --- | --- |
| 1 | Onboarding | Slogan, 3 tanıtım adımı, 13+ yaş kapısı, ayrı sıralama rızası |
| 2 | Home | Toplam varlık, 3 senaryo kartı, donut grafik, son varlıklar |
| 3 | Asset List | Kategori filtresi, arama, sıralama, isim + değer + kâr/zarar |
| 4 | Add Asset | 4 adım: kategori → katalog/manuel → detay → edinim partisi |
| 5 | Asset Detail | 3 değer kartı, güven + kaynak, edinim kırılımı, parçalar, düzenle |
| 6 | Ranking | Maskeli sıralama, premium teaser, gönderilen veri şeffaflığı |
| 7 | Paywall | Mock fiyatlar, restore purchases stub |
| 8 | Settings / Privacy Center | Veri silme, rıza, reklam, biyometrik kilit |
| 9 | OCR | Belge tarama stub'ı, çıkarılan alanlar + alan bazlı güven |

Her ekran **loading skeleton, empty state, error state ve offline** durumlarını taşır.
Çevrimdışı davranış Ayarlar → Demo bölümünden simüle edilebilir.

## Tasarım sistemi

Dark-first. Palet: arka plan `#0B1220`, kart `#141C2B`, yeşil `#29D391`, altın `#F4C766`,
kırmızı `#FF6B6B`, metin `#F7F9FC`. 8px boşluk sistemi, 16–20 köşe yarıçapı,
44px minimum dokunma alanı. Ürün fotoğrafı yoktur; görsel yalnızca belge OCR ekranındadır.

Senaryo renk kodlaması sabittir: Hızlı = kırmızı, Normal = yeşil, Tok = altın.

---

## Doğrulama

```bash
npm run typecheck                      # tsc --noEmit — temiz
npx expo export --platform android     # Metro bundle — başarılı
```

Tüm akışlar (onboarding → home → liste → detay → varlık ekleme/kaydetme → sıralama rızası →
paywall satın alma → OCR tarama) web export üzerinde headless tarayıcıda uçtan uca
çalıştırılarak doğrulanmıştır; konsol hatası üretmez.

## Sınırlar

- Fiyatlar demo referanslarıdır, piyasa verisi değildir.
- Satın alma akışı gerçek bir mağaza işlemi başlatmaz.
- OCR ekranı kamera açmaz; örnek alanlar üretir.
- Şifreleme katmanı stub'dır (yukarıya bakınız).
