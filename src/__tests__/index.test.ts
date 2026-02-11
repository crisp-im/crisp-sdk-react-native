const mockModule = {
  configure: jest.fn(),
  setTokenId: jest.fn(),
  setLogLevel: jest.fn(),
  setUserEmail: jest.fn(),
  setUserNickname: jest.fn(),
  setUserPhone: jest.fn(),
  setUserCompany: jest.fn(),
  setUserAvatar: jest.fn(),
  setSessionString: jest.fn(),
  setSessionBool: jest.fn(),
  setSessionInt: jest.fn(),
  setSessionSegment: jest.fn(),
  setSessionSegments: jest.fn(),
  getSessionIdentifier: jest.fn(),
  pushSessionEvent: jest.fn(),
  pushSessionEvents: jest.fn(),
  resetSession: jest.fn(),
  show: jest.fn(),
  searchHelpdesk: jest.fn(),
  openHelpdeskArticle: jest.fn(),
  runBotScenario: jest.fn(),
  registerPushToken: jest.fn(),
  isCrispPushNotification: jest.fn(),
  setShouldPromptForNotificationPermission: jest.fn(),
  showMessage: jest.fn(),
};

jest.mock("../ExpoCrispSdkModule", () => ({
  __esModule: true,
  default: mockModule,
}));

import {
  configure,
  getSessionIdentifier,
  isCrispPushNotification,
  openHelpdeskArticle,
  pushSessionEvent,
  pushSessionEvents,
  registerPushToken,
  resetSession,
  runBotScenario,
  searchHelpdesk,
  setLogLevel,
  setSessionBool,
  setSessionInt,
  setSessionSegment,
  setSessionSegments,
  setSessionString,
  setShouldPromptForNotificationPermission,
  setTokenId,
  setUserAvatar,
  setUserCompany,
  setUserEmail,
  setUserNickname,
  setUserPhone,
  show,
  showMessage,
} from "../index";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("wrapper functions", () => {
  // ---- Configuration ----

  it("configure delegates to native module", () => {
    configure("website-123");
    expect(mockModule.configure).toHaveBeenCalledWith("website-123");
  });

  it("setTokenId delegates to native module", () => {
    setTokenId("token-abc");
    expect(mockModule.setTokenId).toHaveBeenCalledWith("token-abc");
  });

  it("setTokenId accepts null", () => {
    setTokenId(null);
    expect(mockModule.setTokenId).toHaveBeenCalledWith(null);
  });

  it("setLogLevel delegates to native module", () => {
    setLogLevel(2);
    expect(mockModule.setLogLevel).toHaveBeenCalledWith(2);
  });

  // ---- User Information ----

  it("setUserEmail delegates with email only", () => {
    setUserEmail("test@example.com");
    expect(mockModule.setUserEmail).toHaveBeenCalledWith("test@example.com", undefined);
  });

  it("setUserEmail delegates with email and signature", () => {
    setUserEmail("test@example.com", "sig-123");
    expect(mockModule.setUserEmail).toHaveBeenCalledWith("test@example.com", "sig-123");
  });

  it("setUserNickname delegates to native module", () => {
    setUserNickname("John");
    expect(mockModule.setUserNickname).toHaveBeenCalledWith("John");
  });

  it("setUserPhone delegates to native module", () => {
    setUserPhone("+33600000000");
    expect(mockModule.setUserPhone).toHaveBeenCalledWith("+33600000000");
  });

  it("setUserCompany delegates to native module", () => {
    const company = { name: "Acme", url: "https://acme.com" };
    setUserCompany(company);
    expect(mockModule.setUserCompany).toHaveBeenCalledWith(company);
  });

  it("setUserAvatar delegates to native module", () => {
    setUserAvatar("https://example.com/avatar.png");
    expect(mockModule.setUserAvatar).toHaveBeenCalledWith("https://example.com/avatar.png");
  });

  // ---- Session Data ----

  it("setSessionString delegates to native module", () => {
    setSessionString("key", "value");
    expect(mockModule.setSessionString).toHaveBeenCalledWith("key", "value");
  });

  it("setSessionBool delegates to native module", () => {
    setSessionBool("premium", true);
    expect(mockModule.setSessionBool).toHaveBeenCalledWith("premium", true);
  });

  it("setSessionInt delegates to native module", () => {
    setSessionInt("visits", 42);
    expect(mockModule.setSessionInt).toHaveBeenCalledWith("visits", 42);
  });

  it("setSessionSegment delegates to native module", () => {
    setSessionSegment("vip");
    expect(mockModule.setSessionSegment).toHaveBeenCalledWith("vip");
  });

  it("setSessionSegments delegates to native module", () => {
    setSessionSegments(["vip", "beta"], true);
    expect(mockModule.setSessionSegments).toHaveBeenCalledWith(["vip", "beta"], true);
  });

  it("setSessionSegments defaults overwrite to false when omitted", () => {
    setSessionSegments(["vip"]);
    expect(mockModule.setSessionSegments).toHaveBeenCalledWith(["vip"], false);
  });

  it("getSessionIdentifier delegates to native module", async () => {
    mockModule.getSessionIdentifier.mockResolvedValue("session-xyz");
    const result = await getSessionIdentifier();
    expect(result).toBe("session-xyz");
    expect(mockModule.getSessionIdentifier).toHaveBeenCalled();
  });

  it("getSessionIdentifier returns null when no session", async () => {
    mockModule.getSessionIdentifier.mockResolvedValue(null);
    const result = await getSessionIdentifier();
    expect(result).toBeNull();
  });

  // ---- Events ----

  it("pushSessionEvent delegates to native module", () => {
    pushSessionEvent("Checkout", 3);
    expect(mockModule.pushSessionEvent).toHaveBeenCalledWith("Checkout", 3);
  });

  it("pushSessionEvents delegates to native module", () => {
    const events = [
      { name: "A", color: 0 },
      { name: "B", color: 1 },
    ];
    pushSessionEvents(events);
    expect(mockModule.pushSessionEvents).toHaveBeenCalledWith(events);
  });

  // ---- Session Management ----

  it("resetSession delegates to native module", () => {
    resetSession();
    expect(mockModule.resetSession).toHaveBeenCalled();
  });

  // ---- UI ----

  it("show delegates to native module", () => {
    show();
    expect(mockModule.show).toHaveBeenCalled();
  });

  it("searchHelpdesk delegates to native module", () => {
    searchHelpdesk();
    expect(mockModule.searchHelpdesk).toHaveBeenCalled();
  });

  it("openHelpdeskArticle converts options object to positional args", () => {
    openHelpdeskArticle({
      id: "getting-started",
      locale: "en",
      title: "Getting Started",
      category: "Guides",
    });
    expect(mockModule.openHelpdeskArticle).toHaveBeenCalledWith(
      "getting-started",
      "en",
      "Getting Started",
      "Guides",
    );
  });

  it("openHelpdeskArticle works with only required fields", () => {
    openHelpdeskArticle({ id: "article-1", locale: "fr" });
    expect(mockModule.openHelpdeskArticle).toHaveBeenCalledWith(
      "article-1",
      "fr",
      undefined,
      undefined,
    );
  });

  it("runBotScenario delegates to native module", () => {
    runBotScenario("scenario-123");
    expect(mockModule.runBotScenario).toHaveBeenCalledWith("scenario-123");
  });

  // ---- Push Notifications ----

  it("registerPushToken delegates to native module", () => {
    registerPushToken("fcm-token-xyz");
    expect(mockModule.registerPushToken).toHaveBeenCalledWith("fcm-token-xyz");
  });

  it("isCrispPushNotification delegates and returns result", () => {
    mockModule.isCrispPushNotification.mockReturnValue(true);
    const result = isCrispPushNotification({ from: "crisp" });
    expect(result).toBe(true);
    expect(mockModule.isCrispPushNotification).toHaveBeenCalledWith({ from: "crisp" });
  });

  it("isCrispPushNotification returns false for non-crisp", () => {
    mockModule.isCrispPushNotification.mockReturnValue(false);
    const result = isCrispPushNotification({ from: "other" });
    expect(result).toBe(false);
  });

  it("setShouldPromptForNotificationPermission delegates to native module", () => {
    setShouldPromptForNotificationPermission(false);
    expect(mockModule.setShouldPromptForNotificationPermission).toHaveBeenCalledWith(false);
  });

  // ---- Messages ----

  it("showMessage delegates to native module", () => {
    const content = { type: "text" as const, text: "Hello!" };
    showMessage(content);
    expect(mockModule.showMessage).toHaveBeenCalledWith(content);
  });
});

describe("module encapsulation", () => {
  it("does not export native module as default", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const indexExports = require("../index");
    expect(indexExports.default).toBeUndefined();
  });
});
