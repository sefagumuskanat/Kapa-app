export * from './models';

/** Her ekranın taşıması zorunlu olan yükleme/hata/boş/çevrimdışı durumu. */
export type UiStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface AsyncState<T> {
  status: UiStatus;
  data: T | null;
  error: string | null;
  /** Veri çevrimdışı önbellekten mi geldi. */
  fromCache: boolean;
}

export const initialAsyncState = <T,>(): AsyncState<T> => ({
  status: 'idle',
  data: null,
  error: null,
  fromCache: false,
});
