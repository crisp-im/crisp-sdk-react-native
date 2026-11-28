import { act, renderHook } from "@testing-library/react";

// Mock the native module before importing the hook
const mockRemove = jest.fn();
const mockAddListener = jest.fn(() => ({ remove: mockRemove }));

jest.mock("../ExpoCrispSdkModule", () => ({
  __esModule: true,
  default: {
    addListener: mockAddListener,
  },
}));

import type { CrispLogEntry, CrispMessage, PushNotificationPayload } from "../ExpoCrispSdk.types";
import { type CrispEventCallbacks, useCrispEvents } from "../useCrispEvents";
import migration from "./fixtures/native-migration.json";

beforeEach(() => {
  mockAddListener.mockClear();
  mockRemove.mockClear();
  mockAddListener.mockImplementation(() => ({ remove: mockRemove }));
});

describe("useCrispEvents", () => {
  it("subscribes to all 7 events on mount", () => {
    renderHook(() => useCrispEvents({}));

    expect(mockAddListener).toHaveBeenCalledTimes(7);
    expect(mockAddListener).toHaveBeenCalledWith("onSessionLoaded", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith("onChatOpened", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith("onChatClosed", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith("onMessageSent", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith("onMessageReceived", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith("onLogReceived", expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith(
      "onPushNotificationReceived",
      expect.any(Function),
    );
  });

  it("removes all subscriptions on unmount", () => {
    const { unmount } = renderHook(() => useCrispEvents({}));

    expect(mockRemove).not.toHaveBeenCalled();

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(7);
  });

  it("works with no callbacks (empty object)", () => {
    expect(() => {
      const { unmount } = renderHook(() => useCrispEvents());
      unmount();
    }).not.toThrow();
  });

  it("calls onSessionLoaded with sessionId", () => {
    const onSessionLoaded = jest.fn();
    renderHook(() => useCrispEvents({ onSessionLoaded }));

    const handler = getListenerHandler("onSessionLoaded");
    act(() => handler({ sessionId: "session_123" }));

    expect(onSessionLoaded).toHaveBeenCalledWith("session_123");
  });

  it("calls onChatOpened", () => {
    const onChatOpened = jest.fn();
    renderHook(() => useCrispEvents({ onChatOpened }));

    const handler = getListenerHandler("onChatOpened");
    act(() => handler({}));

    expect(onChatOpened).toHaveBeenCalledTimes(1);
  });

  it("calls onChatClosed", () => {
    const onChatClosed = jest.fn();
    renderHook(() => useCrispEvents({ onChatClosed }));

    const handler = getListenerHandler("onChatClosed");
    act(() => handler({}));

    expect(onChatClosed).toHaveBeenCalledTimes(1);
  });

  it("calls onMessageSent with message", () => {
    const onMessageSent = jest.fn();
    renderHook(() => useCrispEvents({ onMessageSent }));

    const message: CrispMessage = {
      content: "Hello",
      timestamp: Date.now(),
      fromOperator: false,
      fingerprint: "fp_123",
      isMe: true,
      origin: "local",
    };

    const handler = getListenerHandler("onMessageSent");
    act(() => handler({ message }));

    expect(onMessageSent).toHaveBeenCalledWith(message);
  });

  it("calls onMessageReceived with message", () => {
    const onMessageReceived = jest.fn();
    renderHook(() => useCrispEvents({ onMessageReceived }));

    const message: CrispMessage = {
      content: "Hi there!",
      timestamp: Date.now(),
      fromOperator: true,
      fingerprint: "fp_456",
      isMe: false,
      origin: "network",
      user: { nickname: "Support Agent", avatar: "https://example.com/avatar.png" },
    };

    const handler = getListenerHandler("onMessageReceived");
    act(() => handler({ message }));

    expect(onMessageReceived).toHaveBeenCalledWith(message);
  });

  it("calls onLogReceived with log entry", () => {
    const onLogReceived = jest.fn();
    renderHook(() => useCrispEvents({ onLogReceived }));

    const log: CrispLogEntry = { level: 2, tag: "Crisp", message: "Connected" };

    const handler = getListenerHandler("onLogReceived");
    act(() => handler({ log }));

    expect(onLogReceived).toHaveBeenCalledWith(log);
  });

  it("calls onPushNotificationReceived with payload", () => {
    const onPushNotificationReceived = jest.fn();
    renderHook(() => useCrispEvents({ onPushNotificationReceived }));

    const payload: PushNotificationPayload = { title: "New message", body: "You have a reply" };

    const handler = getListenerHandler("onPushNotificationReceived");
    act(() => handler(payload));

    expect(onPushNotificationReceived).toHaveBeenCalledWith(payload);
  });

  it("uses latest callbacks via ref (no stale closures)", () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();

    const { rerender } = renderHook(
      (props: { cb: () => void }) => useCrispEvents({ onChatOpened: props.cb }),
      { initialProps: { cb: firstCallback } },
    );

    // Update to second callback
    rerender({ cb: secondCallback });

    // Fire event — should call the second (latest) callback
    const handler = getListenerHandler("onChatOpened");
    act(() => handler({}));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it("does not re-subscribe when callbacks change", () => {
    const { rerender } = renderHook(
      (props: { cb: () => void }) => useCrispEvents({ onChatOpened: props.cb }),
      { initialProps: { cb: jest.fn() } },
    );

    // Initial mount: 7 subscriptions
    expect(mockAddListener).toHaveBeenCalledTimes(7);

    // Rerender with different callback
    rerender({ cb: jest.fn() });

    // Should NOT add more listeners (empty dep array)
    expect(mockAddListener).toHaveBeenCalledTimes(7);
  });
});

describe("native migration event compatibility", () => {
  const events: Array<{ name: keyof CrispEventCallbacks; payload: unknown; args: unknown[] }> = [
    {
      name: "onSessionLoaded",
      payload: { sessionId: "synthetic-session" },
      args: ["synthetic-session"],
    },
    { name: "onChatOpened", payload: {}, args: [] },
    { name: "onChatClosed", payload: {}, args: [] },
    {
      name: "onMessageSent",
      payload: { message: migration.receivedMessage },
      args: [migration.receivedMessage],
    },
    {
      name: "onMessageReceived",
      payload: { message: migration.receivedMessage },
      args: [migration.receivedMessage],
    },
    {
      name: "onLogReceived",
      payload: { log: { level: 3, tag: "Crisp", message: "Synthetic" } },
      args: [{ level: 3, tag: "Crisp", message: "Synthetic" }],
    },
    {
      name: "onPushNotificationReceived",
      payload: { title: "Synthetic", body: "Reply" },
      args: [{ title: "Synthetic", body: "Reply" }],
    },
  ];

  it.each(events)("updates $name handlers without resubscribing", ({ name, payload, args }) => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(
      (callbacks: CrispEventCallbacks) => useCrispEvents(callbacks),
      { initialProps: { [name]: first } },
    );
    const listener = getListenerHandler(name);
    rerender({ [name]: second });
    act(() => listener(payload));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(...args);
    expect(mockAddListener).toHaveBeenCalledTimes(7);
    rerender({});
    act(() => listener(payload));
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(7);
  });

  it("forwards repeated session-loaded events rather than treating them as one-shot", () => {
    const onSessionLoaded = jest.fn();
    renderHook(() => useCrispEvents({ onSessionLoaded }));
    const handler = getListenerHandler("onSessionLoaded");
    act(() => {
      handler({ sessionId: "synthetic-session" });
      handler({ sessionId: "synthetic-session" });
    });
    expect(onSessionLoaded).toHaveBeenCalledTimes(2);
  });

  it("preserves millisecond timestamps and fingerprints beyond the safe integer range", () => {
    const onMessageReceived = jest.fn();
    renderHook(() => useCrispEvents({ onMessageReceived }));
    act(() => getListenerHandler("onMessageReceived")({ message: migration.receivedMessage }));
    const received = onMessageReceived.mock.calls[0][0];
    expect(received).toBe(migration.receivedMessage);
    expect(received.timestamp).toBe(1794225600123);
    expect(received.fingerprint).toBe("9007199254740993");
  });

  it("cleans each subscription exactly once across StrictMode remounts", () => {
    const removers: jest.Mock[] = [];
    mockAddListener.mockImplementation(() => {
      const remove = jest.fn();
      removers.push(remove);
      return { remove };
    });
    const { unmount } = renderHook(() => useCrispEvents({}), {
      reactStrictMode: true,
    });
    expect(mockAddListener).toHaveBeenCalledTimes(14);
    expect(removers.filter((remove) => remove.mock.calls.length === 0)).toHaveLength(7);
    unmount();
    for (const remove of removers) expect(remove).toHaveBeenCalledTimes(1);
  });
});

/** Helper to extract the listener handler for a specific event */
function getListenerHandler(eventName: string): (...args: unknown[]) => void {
  const calls = mockAddListener.mock.calls as unknown as Array<
    [string, (...args: unknown[]) => void]
  >;
  const call = calls.find(([name]) => name === eventName);
  if (!call) throw new Error(`No listener registered for ${eventName}`);
  return call[1];
}
