# KAPAMETRE

> **Kaç paralık adamsın?**

**KAPA = “Kaç Paralık Adam”.** KAPAMETRE de tam olarak onu ölçüyor.

Neyin var yazıyorsun, uygulama üç ihtimalle kaç para ettiğini söylüyor ve sana bir karne
kesiyor. Hedef kitle ciddi yatırımcı değil — merakından ya da eğlence olsun diye açan
bireysel kullanıcı. Ton buna göre: mahalle ağzı, şakacı, samimi.
Expo SDK 57 + React Native 0.86 + React 19 + TypeScript.

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

### Tonun tek kuralı

Şaka dürüstlüğü bozmaz. Değerin tahmin olduğu, yatırım tavsiyesi olmadığı ve verinin cihazda
kaldığı bilgisi espriyle yumuşatılır ama **asla gizlenmez**. Örneğin bir kalemin maliyeti
bilinmiyorsa uygulama uydurmaz, "kaça aldın?" der ve kâr/zarar hesaplamaz.

## Üç değerleme senaryosu

| Senaryo | Anlamı | Rolü |
| --- | --- | --- |
| 🏃 **Hızlı Satış** | "Acil param lazım" dersen | likidite iskontosu |
| 🤝 **Normal Satış** | Normal şartlarda satarsan | **ANA METRİK** — karne ve sıralama bunu kullanır |
| 🪑 **Tok Satıcı** | "Alıcıyı beklerim abi" dersen | sabır primi |

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

### Emülatörde / telefonda çalıştırma

```bash
npm install
npx expo start --android     # emülatör açıkken
npx expo start               # QR → Expo Go
```

Proje güncel SDK'da olduğu için mağazadaki Expo Go doğrudan çalışır; ayrı bir
geliştirme derlemesi (dev build) gerekmez.

### Kurulumsuz çalışan sürüm

```bash
npm run build:offline        # dist-offline/ üretir
```

`expo export` mutlak yollar (`/_expo/…`, `/assets/…`) ürettiği için çıktı yalnızca bir
sunucu kökünden çalışır. `scripts/build-offline-web.mjs` bu yolları belge-göreli hale
getirir; sonuç klasör nereye kopyalanırsa kopyalansın, `KAPAMETRE-BASLAT.html` dosyasına
çift tıklayarak `file://` üzerinden açılır. Node, sunucu veya internet gerekmez.

İlk açılışta demo portföy otomatik yüklenir: 22 ayar bilezik, çeyrek altın, gümüş külçe,
pırlanta tektaş, Kadıköy dairesi, araba ve maliyeti bilinmeyen bir telefon — yani her
fiyatlama modundan en az bir örnek. Ayarlar → Demo bölümünden yeniden yüklenebilir.

---

## Mimari

```
src/
├─ content/       vibes.ts — uygulamanın ağzı: tüm metin, emoji ve karne tonu tek dosyada
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
| `MetalPriceService` | Altın/gümüş gram fiyatı | Gerçek API iskeleti hazır, **şu an demo tablo** |
| `ValuationService` | 3 senaryolu değerleme + portföy özeti | Üç fiyatlama modu (aşağıda) |
| `AuthService` | Kayıt + e-posta doğrulama | Sunucu yok; kod ekranda gösterilir |
| `ReminderService` | Bayat fiyat tespiti + bildirim | Kapatılamaz, sıklığı ayarlanır |
| `RankService` | Opt-in, kohort bazlı sıralama | Takma kimlik, kullanıcı listesi yok |
| `SubscriptionService` | Abonelik + restore purchases | Mock mağaza, demo fiyat |
| `PrivacyService` | Tercihler, veri envanteri, tüm veriyi silme | Şifreleme stub'ı |
| `AdService` | Reklam alanı | Bedavada kapanmaz, premium'da açılmaz |

### Katalog ve fiyatlama

Her ürün türü `src/catalog/` altında kendi **sorularını** ve **fiyatlama modunu** taşır.
Yeni bir tür eklemek için yeni ekran yazmak gerekmez; `DynamicForm` alanları kendisi basar.

| Mod | Kimler | Nasıl hesaplanır |
| --- | --- | --- |
| `metal` | Altın, gümüş | saf gram × gram fiyatı × piyasa çarpanı |
| `manualSale` | Pırlanta, ev, arsa, dükkân | kullanıcı güncel değeri girer, 3 senaryo türetilir |
| `manual3` | Araç, elektronik, hobi, diğer | kullanıcı üç fiyatı da kendi girer |

**Altın modeli.** Ziynet altınlarında sabit saf ağırlık (tam 6,608 g; çeyrek onun 1/4'ü),
işçilikli takıda `gram × ayar milyemi`. Ayar milyemleri sektör standardıdır
(22 ayar = 0,916). Sikkelerde darphane primi çarpan olarak eklenir (çeyrek ×1,06),
işçilikli takıda satarken işçiliğin tamamı geri alınamadığı için geri dönüş oranı
uygulanır (bilezik ×0,95). Eski tarih sikkeler ×1,02.

> **Marka/model listesi neden yok?** Araç, kamera, telefon için sahibinden benzeri bir
> model veritabanı tutmak ciddi bir veri işi. Uydurma bir "önerilen fiyat" göstermektense
> bu kalemlerde üç fiyatı kullanıcıya sorduk.

Güven skoru bileşiktir: `kaynak güvenilirliği × 0.7 + veri eksiksizliği × 0.3`, ardından
elle girilen değerin bayatlığına göre ceza ve `[0.05, 0.92]` aralığına sıkıştırma.
**Skor asla 1'e ulaşmaz.**

### Fiyat hatırlatması

Altın ve gümüş otomatik güncellenir. Diğer her şeyin fiyatını kullanıcı girdiği için
bayatlar; `ReminderService` süresi geçenleri bulur, yerel bildirim planlar ve ana ekranda
şerit gösterir. **Hatırlatma kapatılamaz**, yalnızca sıklığı seçilir (haftalık → 3 aylık,
varsayılan aylık). Bildirim izni yoksa uygulama içi şerit yine çıkar.

### Bilinmeyen maliyet

Bir varlığın partilerinden **herhangi biri** maliyetsizse toplam maliyet iddia edilmez
(`acquisitionCost: null`) ve kâr/zarar hesaplanmaz. Portföy düzeyinde bu varlıklar
`unknownCostAssetCount` ile sayılır ve kullanıcıya açıkça bildirilir.

---

## Privacy-first mimari

- Tüm varlık ve belge verisi **cihazda** `EncryptedLocalStore` içinde tutulur.
- Kayıt bilgileri (ad, e-posta, doğum tarihi, meslek) hesap için tutulur; **varlık verisi
  hesaba bağlanmaz**, cihazda kalır.
- Maden fiyatı sorgusu yalnızca `{ metal, currency }` taşır — neyin var bilgisi gitmez.
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

## Karne sistemi

Ana ekranın kahramanı, toplam Normal Satış değerine göre kesilen karne:

| Eşik | Karne |
| --- | --- |
| 0 ₺ | 🕳️ Cepte delik var |
| 25.000 ₺ | 🙂 İdare eder |
| 150.000 ₺ | 😌 Fena değilmişsin |
| 750.000 ₺ | 😎 Adamın malı var |
| 3.000.000 ₺ | 🤑 Kodaman |
| 15.000.000 ₺ | 👑 Efsane |

Sıralama kohortları da aynı dille adlandırılır: *Fakir ama gururlu · Yavaş yavaş toparlıyor ·
Hali vakti yerinde · Kodamanlar ligi.*

## Kutlamalar

Yeni bir şey eklendiğinde konfetili bir kutlama ekranı çıkar — *"Allah bereket versin! Malına
mal kattın yine."* Mesaj rastgele seçilir ama **eklenen şeyin değerine göre** üç havuzdan
birinden gelir; 3.000 ₺'lik bir kaleme "yuh artık, sen bu işi ciddiye almışsın" demek komik
değil, sahte olur. Değer hesaplanamadıysa ayrı bir ton kullanılır ve yalandan övülmez.

Düzenlemede kutlama çıkmaz — yeni bir şey kazanılmadı.

## Ekranlar

| # | Ekran | İçerik |
| --- | --- | --- |
| 1 | Onboarding | KAPA açılımı, 3 tanıtım adımı, sıralama rızası |
| 2 | Kayıt | Ad, soyad, doğum tarihi, e-posta, aramalı meslek listesi |
| 3 | E-posta doğrulama | 6 haneli kod (demo: ekranda gösterilir) |
| 4 | Karnem (Home) | Karne, toplam, "… liralık adamsın", paylaş, hatırlatma şeridi |
| 5 | Mal Varlığım | Filtre, arama, sıralama, kalem başına ve toplam kâr/zarar |
| 6 | Ekleme | 3 adım: türü ara → türe özel sorular → fiyat · sonunda kutlama |
| 7 | Varlık detayı | 3 değer, güven + kaynak, bilgiler, alım, değeri güncelle |
| 8 | Paylaşım | Sosyal medya kartı + paylaş |
| 9 | Sıralama | Maskeli sıralama, premium teaser, gönderilen veri şeffaflığı |
| 10 | Paywall | Mock fiyatlar, restore purchases stub |
| 11 | Ayarlar | Hesap, hatırlatma sıklığı, gizlilik, veri silme |
| 9 | OCR | Belge tarama stub'ı, çıkarılan alanlar + alan bazlı güven |

Her ekran **loading skeleton, empty state, error state ve offline** durumlarını taşır.
Çevrimdışı davranış Ayarlar → Demo bölümünden simüle edilebilir.

## Tasarım sistemi

Dark ama **sıcak** — soğuk lacivert "bankacı" paleti yerine üzüm moru zemin ve canlı vurgular.

| Rol | Renk |
| --- | --- |
| Zemin | `#160E27` |
| Kart | `#241838` · yükseltilmiş `#33244D` |
| Para yeşili | `#37E39B` |
| Sikke sarısı | `#FFC63C` |
| Mercan | `#FF6B81` |
| Mor / turkuaz pop | `#B36BFF` · `#4EC5FF` |
| Metin | `#FFF6EC` (sıcak beyaz) |

**Yazı tipi:** başlıklar Baloo 2 (tombul, yuvarlak, oyuncu), gövde Nunito. İkisi de Türkçe
karakterleri tam destekler. Özel yazı tipinde `fontWeight` çalışmadığı için kalınlık her yerde
aile değiştirilerek veriliyor.

**Şekil dili:** 8px boşluk sistemi, 20–32 köşe yarıçapı, hap şeklinde butonlar, 44px minimum
dokunma alanı. İkonlar büyük ölçüde emoji — vektör ikon yalnızca navigasyon ve ikincil
göstergelerde kaldı. Ürün fotoğrafı yoktur; görsel yalnızca belge OCR ekranındadır.

Senaryo renk kodlaması sabittir: Hızlı = mercan, Normal = yeşil, Tok = sarı. Grafik dilimleri
ayrı bir palet sırası kullanır, böylece yan yana iki benzer ton düşmez.

---

## Doğrulama

```bash
npm run typecheck                      # tsc --noEmit — temiz
npx expo export --platform android     # Metro bundle — başarılı
```

Tüm akışlar (onboarding → karne → liste → detay → varlık ekleme/kaydetme → **kutlama ekranı**
→ sıralama rızası → paywall satın alma → OCR tarama) web export üzerinde headless tarayıcıda
uçtan uca çalıştırılarak doğrulanmıştır; konsol hatası üretmez.

## Sınırlar

- Fiyatlar demo referanslarıdır, piyasa verisi değildir.
- Satın alma akışı gerçek bir mağaza işlemi başlatmaz.
- OCR ekranı kamera açmaz; örnek alanlar üretir.
- Şifreleme katmanı stub'dır (yukarıya bakınız).
