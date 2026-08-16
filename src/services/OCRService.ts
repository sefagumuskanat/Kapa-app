import { DocumentKind, ExtractedField, LocalDocumentRecord } from '@/types';
import { createId, nowIso } from '@/utils/id';

/**
 * OCRService (yerel stub).
 *
 * Kapsam kuralı: YALNIZCA belge taranır (fatura, garanti, sertifika).
 * Ürün fotoğrafı, ortam fotoğrafı veya galeri taraması YOKTUR.
 * Görüntü cihazdan çıkmaz; bu stub hiçbir ağ çağrısı yapmaz.
 */

export interface OcrScanRequest {
  kind: DocumentKind;
  /** Kullanıcının verdiği başlık. Boşsa belge türünden türetilir. */
  title?: string;
  linkedAssetId?: string | null;
}

export interface OcrScanResult {
  fields: ExtractedField[];
  /** Alan ortalaması — sahte kesinlik vermemek için gösterilir. */
  overallConfidence: number;
  processedOnDevice: true;
}

export interface IOCRService {
  scanDocument(request: OcrScanRequest): Promise<OcrScanResult>;
  toRecord(request: OcrScanRequest, result: OcrScanResult): LocalDocumentRecord;
  /** Hassas alanları maskeler (IBAN, kart no, TCKN gibi). */
  redact(fields: ExtractedField[]): ExtractedField[];
}

const simulateLatency = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms));

const TEMPLATES: Record<DocumentKind, ExtractedField[]> = {
  invoice: [
    { key: 'merchant', label: 'Satıcı', value: 'Teknoloji Mağazası A.Ş.', confidence: 0.88 },
    { key: 'date', label: 'Tarih', value: '14.03.2025', confidence: 0.92 },
    { key: 'total', label: 'Tutar', value: '92.400 ₺', confidence: 0.81 },
    { key: 'documentNo', label: 'Belge No', value: 'FTR-2025-004182', confidence: 0.74 },
  ],
  warranty: [
    { key: 'brand', label: 'Marka', value: 'Sony', confidence: 0.9 },
    { key: 'serial', label: 'Seri No', value: 'SN-4471-88293', confidence: 0.69 },
    { key: 'validUntil', label: 'Geçerlilik', value: '14.03.2027', confidence: 0.85 },
  ],
  receipt: [
    { key: 'merchant', label: 'Satıcı', value: 'Kuyumcu', confidence: 0.77 },
    { key: 'date', label: 'Tarih', value: '02.11.2023', confidence: 0.8 },
    { key: 'total', label: 'Tutar', value: '58.000 ₺', confidence: 0.72 },
  ],
  certificate: [
    { key: 'issuer', label: 'Düzenleyen', value: 'Gemoloji Laboratuvarı', confidence: 0.86 },
    { key: 'carat', label: 'Karat', value: '0,85', confidence: 0.79 },
    { key: 'certNo', label: 'Sertifika No', value: 'GL-88213-A', confidence: 0.7 },
  ],
  other: [{ key: 'text', label: 'Metin', value: 'Okunan metin', confidence: 0.5 }],
};

const SENSITIVE_KEYS = ['iban', 'card', 'cardNo', 'tckn', 'nationalId', 'account'];

class LocalOCRService implements IOCRService {
  async scanDocument(request: OcrScanRequest): Promise<OcrScanResult> {
    await simulateLatency();
    const fields = this.redact(TEMPLATES[request.kind] ?? TEMPLATES.other);
    const overallConfidence =
      fields.reduce((sum, field) => sum + field.confidence, 0) / Math.max(1, fields.length);
    return { fields, overallConfidence, processedOnDevice: true };
  }

  toRecord(request: OcrScanRequest, result: OcrScanResult): LocalDocumentRecord {
    return {
      id: createId('doc'),
      title: request.title?.trim() || defaultTitle(request.kind),
      kind: request.kind,
      capturedAt: nowIso(),
      linkedAssetId: request.linkedAssetId ?? null,
      extractedFields: result.fields,
      // Yerel şifreli depo anahtarı; dosya yolu değil.
      storageRef: createId('vault'),
      redacted: result.fields.some((field) => field.value.includes('••')),
      neverUploaded: true,
    };
  }

  redact(fields: ExtractedField[]): ExtractedField[] {
    return fields.map((field) => {
      if (!SENSITIVE_KEYS.includes(field.key)) return field;
      return { ...field, value: `•••• ${field.value.slice(-4)}` };
    });
  }
}

function defaultTitle(kind: DocumentKind): string {
  const labels: Record<DocumentKind, string> = {
    invoice: 'Fatura',
    warranty: 'Garanti Belgesi',
    receipt: 'Fiş',
    certificate: 'Sertifika',
    other: 'Belge',
  };
  return labels[kind];
}

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  invoice: 'Fatura',
  warranty: 'Garanti',
  receipt: 'Fiş',
  certificate: 'Sertifika',
  other: 'Diğer',
};

export const ocrService: IOCRService = new LocalOCRService();
