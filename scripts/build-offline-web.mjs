#!/usr/bin/env node
/**
 * Çevrimdışı, çift tıklanabilir web sürümü üretir.
 *
 * `expo export` mutlak yollar (`/_expo/...`, `/assets/...`) üretir; bunlar yalnızca
 * bir sunucu kökünden servis edilirse çalışır. Klasörü olduğu gibi açan biri için
 * (file:// protokolü) hepsi 404 verir. Bu script çıktıyı belge-göreli yollara
 * çevirir, böylece klasör nereye kopyalanırsa kopyalansın çalışır.
 *
 * Kullanım:  node scripts/build-offline-web.mjs [hedef-klasör]
 */
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] ?? 'dist-offline';

console.log(`> expo export → ${outDir}`);
rmSync(outDir, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${outDir}`, {
  stdio: 'inherit',
  env: { ...process.env, CI: '1' },
});

// 1) index.html içindeki bundle yolu
const indexPath = join(outDir, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const before = html;
html = html.replace(/(src|href)="\/(_expo\/)/g, '$1="./$2');
if (html === before) console.warn('! index.html içinde mutlak yol bulunamadı');
writeFileSync(indexPath, html);

// 2) Bundle içindeki asset (yazı tipi vb.) yolları
const jsDir = join(outDir, '_expo/static/js/web');
const bundles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
let rewritten = 0;
for (const file of bundles) {
  const p = join(jsDir, file);
  const src = readFileSync(p, 'utf8');
  const out = src.replaceAll('"/assets/', '"assets/');
  if (out !== src) {
    writeFileSync(p, out);
    rewritten += 1;
  }
}
console.log(`> ${rewritten}/${bundles.length} bundle dosyasında asset yolu düzeltildi`);

// 3) Çift tıklanacak dosyanın adı açık olsun
copyFileSync(indexPath, join(outDir, 'KAPAMETRE-BASLAT.html'));

writeFileSync(
  join(outDir, 'OKU-BENI.txt'),
  [
    'KAPAMETRE — çevrimdışı demo',
    '',
    'KURULUM YOK. Klasördeki "KAPAMETRE-BASLAT.html" dosyasına çift tıkla.',
    'Tarayıcı açılır ve uygulama çalışır. İnternet bile gerekmiyor.',
    '',
    'Telefon görünümü için tarayıcı penceresini daraltabilirsin.',
    '',
    'Veriler tarayıcının yerel deposunda tutulur, hiçbir yere gönderilmez.',
    'Sıfırlamak için: uygulama içinde Ayarlar > Her şeyi sil.',
    '',
    'Not: Bu bir demodur. Değerler tahminidir, yatırım tavsiyesi değildir.',
  ].join('\n'),
  'utf8',
);

console.log(`> hazır: ${outDir}/KAPAMETRE-BASLAT.html`);
