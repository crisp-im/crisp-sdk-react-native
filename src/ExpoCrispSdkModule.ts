import { NativeModule, requireNativeModule } from "expo";

import type {
  Company,
  CrispSessionEventColors,
  SessionEvent,
} from "./ExpoCrispSdk.types";

type ExpoCrispSdkEvents = Record<string, never>;

declare class ExpoCrispSdkModule extends NativeModule<ExpoCrispSdkEvents> {
  // Configuration
  configure(websiteId: string): void;
  setTokenId(tokenId: string | null): void;

  // User Information
  setUserEmail(email: string, signature?: string | null): void;
  setUserNickname(name: string): void;
  setUserPhone(phone: string): void;
  setUserCompany(company: Company): void;
  setUserAvatar(url: string): void;

  // Session Data
  setSessionString(key: string, value: string): void;
  setSessionBool(key: string, value: boolean): void;
  setSessionInt(key: string, value: number): void;
  setSessionSegment(segment: string): void;
  setSessionSegments(segments: string[], overwrite?: boolean): void;
  getSessionIdentifier(): Promise<string | null>;

  // Events
  pushSessionEvent(name: string, color: CrispSessionEventColors): void;
  pushSessionEvents(events: SessionEvent[]): void;

  // Session Management
  resetSession(): void;

  // UI
  show(): void;
  searchHelpdesk(): void;
  openHelpdeskArticle(
    id: string,
    locale: string,
    title?: string | null,
    category?: string | null
  ): void;
  runBotScenario(scenarioId: string): void;
}

export default requireNativeModule<ExpoCrispSdkModule>("ExpoCrispSdk");
