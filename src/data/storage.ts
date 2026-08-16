import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Yerel şifreli depo soyutlaması (MOCK).
 *
 * Gerçek üründe bu katmanın altına platform keystore (iOS Keychain /
 * Android Keystore) + AES-GCM yerleştirilir. Buradaki dönüşüm YALNIZCA
 * arayüzü sabitlemek için vardır ve kriptografik güvence sağlamaz.
 * Tüm varlık verisi cihazda kalır; hiçbir yazma işlemi ağa çıkmaz.
 */

const NAMESPACE = 'kapametre.v1';
const ENVELOPE_PREFIX = 'kpm1:';

export interface SecureStoreAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/** Test ve web fallback için bellek adaptörü. */
export class MemoryAdapter implements SecureStoreAdapter {
  private map = new Map<string, string>();

  async getItem(key: string) {
    return this.map.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.map.set(key, value);
  }

  async removeItem(key: string) {
    this.map.delete(key);
  }

  async getAllKeys() {
    return Array.from(this.map.keys());
  }
}

class AsyncStorageAdapter implements SecureStoreAdapter {
  async getItem(key: string) {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  }

  async getAllKeys() {
    return (await AsyncStorage.getAllKeys()) as string[];
  }
}

/** Bağımlılıksız base64 (RN'de atob/btoa her ortamda yok). */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(input: string): string {
  const bytes = utf8Bytes(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64[b2 & 63];
  }
  return out;
}

function fromBase64(input: string): string {
  const clean = input.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const index = B64.indexOf(char);
    if (index === -1) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return utf8String(bytes);
}

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = input.charCodeAt(++i);
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function utf8String(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
    } else if (b0 < 0xe0) {
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b0 < 0xf0) {
      out += String.fromCharCode(((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
    } else {
      const code =
        ((b0 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const adjusted = code - 0x10000;
      out += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
    }
  }
  return out;
}

/** Yer tutucu dönüşüm — gerçek şifreleme değildir, yalnızca düz metin okumayı engeller. */
function obfuscate(plain: string, key: string): string {
  let out = '';
  for (let i = 0; i < plain.length; i += 1) {
    out += String.fromCharCode(plain.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return `${ENVELOPE_PREFIX}${toBase64(out)}`;
}

function deobfuscate(envelope: string, key: string): string {
  if (!envelope.startsWith(ENVELOPE_PREFIX)) return envelope;
  const raw = fromBase64(envelope.slice(ENVELOPE_PREFIX.length));
  let out = '';
  for (let i = 0; i < raw.length; i += 1) {
    out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

export class EncryptedLocalStore {
  constructor(
    private adapter: SecureStoreAdapter = new AsyncStorageAdapter(),
    private encryptionKey = 'kapametre-local-key-stub',
  ) {}

  private scoped(key: string) {
    return `${NAMESPACE}.${key}`;
  }

  async read<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await this.adapter.getItem(this.scoped(key));
      if (raw == null) return fallback;
      return JSON.parse(deobfuscate(raw, this.encryptionKey)) as T;
    } catch {
      return fallback;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    const payload = obfuscate(JSON.stringify(value), this.encryptionKey);
    await this.adapter.setItem(this.scoped(key), payload);
  }

  async remove(key: string): Promise<void> {
    await this.adapter.removeItem(this.scoped(key));
  }

  /** Privacy Center "tüm verimi sil" akışının tek giriş noktası. */
  async wipeAll(): Promise<number> {
    const keys = (await this.adapter.getAllKeys()).filter((k) => k.startsWith(NAMESPACE));
    await Promise.all(keys.map((k) => this.adapter.removeItem(k)));
    return keys.length;
  }

  async listKeys(): Promise<string[]> {
    const keys = await this.adapter.getAllKeys();
    return keys.filter((k) => k.startsWith(NAMESPACE)).map((k) => k.slice(NAMESPACE.length + 1));
  }
}

export const STORAGE_KEYS = {
  assets: 'assets',
  documents: 'documents',
  rankConsent: 'rank-consent',
  subscription: 'subscription',
  preferences: 'preferences',
  onboarding: 'onboarding',
} as const;

export const localStore = new EncryptedLocalStore();
