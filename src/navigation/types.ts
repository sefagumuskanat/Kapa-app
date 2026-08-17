import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Assets: { category?: string } | undefined;
  /** Ortadaki büyük ekleme butonu — sekme yerine modal açar. */
  AddTab: undefined;
  Ranking: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  AddAsset: { assetId?: string } | undefined;
  AssetDetail: { assetId: string };
  Paywall: { source?: string } | undefined;
  Share: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
