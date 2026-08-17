import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { DEMO_ASSETS } from '@/data/demoData';
import { localStore, STORAGE_KEYS } from '@/data/storage';
import {
  authService,
  DEFAULT_PREFERENCES,
  DEFAULT_RANK_CONSENT,
  DEFAULT_REMINDER,
  FREE_ENTITLEMENT,
  privacyService,
  PrivacyPreferences,
  RegistrationInput,
  reminderService,
  rankService,
  subscriptionService,
  valuationService,
} from '@/services';
import {
  Asset,
  PortfolioSnapshot,
  RankConsent,
  ReminderFrequency,
  ReminderSettings,
  SubscriptionEntitlement,
  UiStatus,
  UserProfile,
  ValuationSnapshot,
} from '@/types';
import { nowIso } from '@/utils/id';

interface OnboardingState {
  completed: boolean;
  ageGatePassed: boolean;
}

const DEFAULT_ONBOARDING: OnboardingState = { completed: false, ageGatePassed: false };

interface State {
  status: UiStatus;
  error: string | null;
  /** Değerleme yeniden hesaplanırken true. */
  revaluating: boolean;
  offline: boolean;
  assets: Asset[];
  valuations: Record<string, ValuationSnapshot>;
  portfolio: PortfolioSnapshot | null;
  profile: UserProfile | null;
  reminders: ReminderSettings;
  consent: RankConsent;
  entitlement: SubscriptionEntitlement;
  preferences: PrivacyPreferences;
  onboarding: OnboardingState;
}

const initialState: State = {
  status: 'idle',
  error: null,
  revaluating: false,
  offline: false,
  assets: [],
  valuations: {},
  portfolio: null,
  profile: null,
  reminders: DEFAULT_REMINDER,
  consent: DEFAULT_RANK_CONSENT,
  entitlement: FREE_ENTITLEMENT,
  preferences: DEFAULT_PREFERENCES,
  onboarding: DEFAULT_ONBOARDING,
};

type Action =
  | { type: 'load/start' }
  | { type: 'load/error'; error: string }
  | {
      type: 'load/success';
      payload: Pick<
        State,
        | 'assets'
        | 'profile'
        | 'reminders'
        | 'consent'
        | 'entitlement'
        | 'preferences'
        | 'onboarding'
      >;
    }
  | { type: 'valuation/start' }
  | { type: 'valuation/done'; valuations: ValuationSnapshot[]; portfolio: PortfolioSnapshot }
  | { type: 'assets/set'; assets: Asset[] }
  | { type: 'profile/set'; profile: UserProfile | null }
  | { type: 'reminders/set'; reminders: ReminderSettings }
  | { type: 'consent/set'; consent: RankConsent }
  | { type: 'entitlement/set'; entitlement: SubscriptionEntitlement }
  | { type: 'preferences/set'; preferences: PrivacyPreferences }
  | { type: 'onboarding/set'; onboarding: OnboardingState }
  | { type: 'offline/set'; offline: boolean }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: null };
    case 'load/error':
      return { ...state, status: 'error', error: action.error };
    case 'load/success':
      return {
        ...state,
        ...action.payload,
        status: action.payload.assets.length === 0 ? 'empty' : 'ready',
        error: null,
      };
    case 'valuation/start':
      return { ...state, revaluating: true };
    case 'valuation/done': {
      const valuations: Record<string, ValuationSnapshot> = {};
      for (const valuation of action.valuations) valuations[valuation.assetId] = valuation;
      return { ...state, revaluating: false, valuations, portfolio: action.portfolio };
    }
    case 'assets/set':
      return {
        ...state,
        assets: action.assets,
        status: action.assets.length === 0 ? 'empty' : 'ready',
      };
    case 'profile/set':
      return { ...state, profile: action.profile };
    case 'reminders/set':
      return { ...state, reminders: action.reminders };
    case 'consent/set':
      return { ...state, consent: action.consent };
    case 'entitlement/set':
      return { ...state, entitlement: action.entitlement };
    case 'preferences/set':
      return { ...state, preferences: action.preferences };
    case 'onboarding/set':
      return { ...state, onboarding: action.onboarding };
    case 'offline/set':
      return { ...state, offline: action.offline };
    case 'reset':
      // Hesap ve onboarding korunur; silinen şey kullanıcının verisidir.
      return {
        ...initialState,
        status: 'empty',
        onboarding: state.onboarding,
        profile: state.profile,
      };
    default:
      return state;
  }
}

interface AppContextValue extends State {
  isPremium: boolean;
  /** Kayıt tamam ve e-posta doğrulanmış mı. */
  isAuthenticated: boolean;
  /** Elle güncellenmesi gereken, süresi geçmiş varlıklar. */
  staleAssets: Asset[];
  reload: () => Promise<void>;
  revaluate: (assets?: Asset[]) => Promise<void>;
  addAsset: (asset: Asset) => Promise<void>;
  updateAsset: (asset: Asset) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  registerAccount: (input: RegistrationInput) => Promise<string>;
  verifyEmail: (code: string) => Promise<{ ok: boolean; message: string }>;
  resendCode: () => Promise<string>;
  signOut: () => Promise<void>;
  setReminderFrequency: (frequency: ReminderFrequency) => Promise<void>;
  dismissReminder: () => Promise<void>;
  setRankConsent: (granted: boolean) => Promise<void>;
  purchasePremium: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  cancelPremium: () => Promise<void>;
  updatePreferences: (patch: Partial<PrivacyPreferences>) => Promise<void>;
  completeOnboarding: (ageGatePassed: boolean) => Promise<void>;
  deleteAllData: () => Promise<number>;
  loadDemoData: () => Promise<void>;
  setOffline: (offline: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const persistAssets = useCallback(async (assets: Asset[]) => {
    await localStore.write(STORAGE_KEYS.assets, assets);
  }, []);

  const revaluate = useCallback(async (assets?: Asset[]) => {
    const target = assets ?? [];
    dispatch({ type: 'valuation/start' });
    const valuations = await valuationService.valuateAll(target);
    const portfolio = valuationService.buildPortfolioSnapshot(target, valuations);
    dispatch({ type: 'valuation/done', valuations, portfolio });
  }, []);

  const reload = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const [assets, profile, reminders, consent, entitlement, preferences, onboarding] =
        await Promise.all([
          localStore.read<Asset[]>(STORAGE_KEYS.assets, []),
          authService.getProfile(),
          reminderService.getSettings(),
          rankService.getConsent(),
          subscriptionService.getEntitlement(),
          privacyService.getPreferences(),
          localStore.read<OnboardingState>(STORAGE_KEYS.onboarding, DEFAULT_ONBOARDING),
        ]);

      dispatch({
        type: 'load/success',
        payload: { assets, profile, reminders, consent, entitlement, preferences, onboarding },
      });
      await revaluate(assets);
    } catch (error) {
      dispatch({
        type: 'load/error',
        error: error instanceof Error ? error.message : 'Veriler yüklenemedi.',
      });
    }
  }, [revaluate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const commitAssets = useCallback(
    async (assets: Asset[]) => {
      dispatch({ type: 'assets/set', assets });
      await persistAssets(assets);
      await revaluate(assets);
    },
    [persistAssets, revaluate],
  );

  const value = useMemo<AppContextValue>(() => {
    const isPremium = state.entitlement.active && state.entitlement.tier === 'premium';
    const isAuthenticated = state.profile != null && state.profile.emailVerified;
    const staleAssets = reminderService.findStaleAssets(state.assets, state.reminders);

    return {
      ...state,
      isPremium,
      isAuthenticated,
      staleAssets,
      reload,
      revaluate: (assets?: Asset[]) => revaluate(assets ?? state.assets),

      addAsset: async (asset: Asset) => {
        await commitAssets([asset, ...state.assets]);
      },

      updateAsset: async (asset: Asset) => {
        const next = state.assets.map((candidate) =>
          candidate.id === asset.id ? { ...asset, updatedAt: nowIso() } : candidate,
        );
        await commitAssets(next);
      },

      deleteAsset: async (assetId: string) => {
        await commitAssets(state.assets.filter((asset) => asset.id !== assetId));
      },

      registerAccount: async (input: RegistrationInput) => {
        const { profile, demoCode } = await authService.register(input);
        dispatch({ type: 'profile/set', profile });
        return demoCode;
      },

      verifyEmail: async (code: string) => {
        const result = await authService.verifyEmail(code);
        if (result.ok) {
          const profile = await authService.getProfile();
          dispatch({ type: 'profile/set', profile });
          // Hatırlatma her zaman açık; hesap kurulur kurulmaz planlanır.
          await reminderService.schedule(state.reminders);
        }
        return result;
      },

      resendCode: async () => authService.resendCode(),

      signOut: async () => {
        await authService.signOut();
        await reminderService.cancelAll();
        dispatch({ type: 'profile/set', profile: null });
      },

      setReminderFrequency: async (frequency: ReminderFrequency) => {
        const reminders = await reminderService.setFrequency(frequency);
        dispatch({ type: 'reminders/set', reminders });
      },

      dismissReminder: async () => {
        const reminders = await reminderService.markPrompted();
        dispatch({ type: 'reminders/set', reminders });
      },

      setRankConsent: async (granted: boolean) => {
        const consent = granted
          ? await rankService.grantConsent()
          : await rankService.revokeConsent();
        dispatch({ type: 'consent/set', consent });
      },

      purchasePremium: async (productId: string) => {
        const entitlement = await subscriptionService.purchase(productId);
        dispatch({ type: 'entitlement/set', entitlement });
      },

      restorePurchases: async () => {
        const entitlement = await subscriptionService.restorePurchases();
        dispatch({ type: 'entitlement/set', entitlement });
      },

      cancelPremium: async () => {
        const entitlement = await subscriptionService.cancel();
        dispatch({ type: 'entitlement/set', entitlement });
      },

      updatePreferences: async (patch: Partial<PrivacyPreferences>) => {
        const preferences = await privacyService.updatePreferences(patch);
        dispatch({ type: 'preferences/set', preferences });
      },

      completeOnboarding: async (ageGatePassed: boolean) => {
        const onboarding: OnboardingState = { completed: true, ageGatePassed };
        await localStore.write(STORAGE_KEYS.onboarding, onboarding);
        dispatch({ type: 'onboarding/set', onboarding });
        await privacyService.updatePreferences({ ageGatePassed });
      },

      deleteAllData: async () => {
        const { removedKeys } = await privacyService.deleteAllLocalData();
        dispatch({ type: 'reset' });
        await revaluate([]);
        return removedKeys;
      },

      loadDemoData: async () => {
        await commitAssets(DEMO_ASSETS);
      },

      setOffline: (offline: boolean) => dispatch({ type: 'offline/set', offline }),
    };
  }, [state, reload, revaluate, commitAssets]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp yalnızca AppProvider içinde kullanılabilir.');
  return context;
}

/** Tek bir varlığın güncel değerlemesini döndürür. */
export function useValuation(assetId: string): ValuationSnapshot | null {
  const { valuations } = useApp();
  return valuations[assetId] ?? null;
}
