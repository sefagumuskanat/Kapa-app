import { AssetTypeDef } from './types';

/**
 * Döviz ve kripto.
 *
 * İkisi de miktar × birim fiyat mantığıyla çalışır (gram/ayar yok), bu yüzden
 * `quote` fiyatlama modunu kullanırlar. Fiyat otomatik güncellenir —
 * ama yalnızca premium üyelerde (bkz. ValuationService).
 */

function fx(symbol: string, label: string, emoji: string, keywords: string[]): AssetTypeDef {
  return {
    id: `fx_${symbol.toLowerCase()}`,
    label,
    category: 'currency',
    emoji,
    keywords: ['döviz', 'para', symbol, ...keywords],
    unit: 'piece',
    pricing: 'quote',
    quote: { kind: 'fx', symbol },
    fields: [
      {
        key: 'miktar',
        label: `Kaç ${symbol}?`,
        type: 'number',
        suffix: symbol,
        required: true,
        defaultValue: '1',
      },
      {
        key: 'nerede',
        label: 'Nerede duruyor?',
        type: 'select',
        options: [
          { value: 'nakit', label: '💵 Nakit / yastık altı' },
          { value: 'banka', label: '🏦 Banka hesabı' },
          { value: 'kasa', label: '🔐 Kasada' },
        ],
      },
    ],
    hint: 'Kuru biz takip ederiz.',
  };
}

export const FX_TYPES: AssetTypeDef[] = [
  fx('USD', 'Amerikan Doları', '💵', ['dolar', 'usd']),
  fx('EUR', 'Euro', '💶', ['euro', 'avro']),
  fx('GBP', 'İngiliz Sterlini', '💷', ['sterlin', 'pound']),
  fx('CHF', 'İsviçre Frangı', '🇨🇭', ['frank', 'frangı']),
  fx('SAR', 'Suudi Riyali', '🇸🇦', ['riyal']),
  fx('AED', 'BAE Dirhemi', '🇦🇪', ['dirhem']),
  fx('JPY', 'Japon Yeni', '🇯🇵', ['yen']),
  fx('AUD', 'Avustralya Doları', '🇦🇺', ['avustralya']),
  fx('CAD', 'Kanada Doları', '🇨🇦', ['kanada']),
  fx('RUB', 'Rus Rublesi', '🇷🇺', ['ruble']),
];

function crypto(symbol: string, label: string, emoji: string, keywords: string[]): AssetTypeDef {
  return {
    id: `crypto_${symbol.toLowerCase()}`,
    label,
    category: 'crypto',
    emoji,
    keywords: ['kripto', 'coin', symbol, ...keywords],
    unit: 'piece',
    pricing: 'quote',
    quote: { kind: 'crypto', symbol },
    fields: [
      {
        key: 'miktar',
        label: `Kaç ${symbol}?`,
        type: 'number',
        suffix: symbol,
        required: true,
        hint: 'Küsuratlı yazabilirsin (0,25 gibi).',
      },
      {
        key: 'nerede',
        label: 'Nerede duruyor?',
        type: 'select',
        options: [
          { value: 'borsa', label: '🏛️ Borsada' },
          { value: 'cuzdan', label: '🔑 Kendi cüzdanımda' },
          { value: 'stake', label: '🔒 Stake / kilitli' },
        ],
      },
    ],
    hint: 'Fiyatı biz takip ederiz.',
  };
}

export const CRYPTO_TYPES: AssetTypeDef[] = [
  crypto('BTC', 'Bitcoin', '₿', ['bitcoin']),
  crypto('ETH', 'Ethereum', '⟠', ['ethereum', 'eth']),
  crypto('USDT', 'Tether (USDT)', '💲', ['tether', 'stablecoin']),
  crypto('BNB', 'BNB', '🟡', ['binance']),
  crypto('SOL', 'Solana', '🟣', ['solana']),
  crypto('XRP', 'XRP (Ripple)', '💧', ['ripple']),
  crypto('ADA', 'Cardano', '🔵', ['cardano']),
  crypto('DOGE', 'Dogecoin', '🐕', ['doge', 'köpek']),
  crypto('AVAX', 'Avalanche', '🔺', ['avalanche']),
  crypto('TRX', 'TRON', '🔻', ['tron']),
  crypto('DOT', 'Polkadot', '⚪', ['polkadot']),
  crypto('LTC', 'Litecoin', '🪙', ['litecoin']),
  crypto('LINK', 'Chainlink', '🔗', ['chainlink']),
  crypto('SHIB', 'Shiba Inu', '🐶', ['shiba']),
];
