import Crisp, {
  type CrispLogEntry,
  CrispLogLevel,
  getSDKVersion,
  type PushNotificationPayload,
  useCrispEvents,
} from 'expo-crisp-sdk';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 1. Get your Website ID from https://app.crisp.chat/settings/websites/
const WEBSITE_ID = process.env.EXPO_PUBLIC_CRISP_WEBSITE_ID!;

type LogEntryWithId = CrispLogEntry & { id: string };

let logIdCounter = 0;

const getLogLevelName = (level: CrispLogLevel): string => {
  const names: Record<CrispLogLevel, string> = {
    [CrispLogLevel.VERBOSE]: 'VERBOSE',
    [CrispLogLevel.DEBUG]: 'DEBUG',
    [CrispLogLevel.INFO]: 'INFO',
    [CrispLogLevel.WARN]: 'WARN',
    [CrispLogLevel.ERROR]: 'ERROR',
    [CrispLogLevel.ASSERT]: 'ASSERT',
  };
  return names[level] ?? 'UNKNOWN';
};

function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatStatus, setChatStatus] = useState<'closed' | 'open'>('closed');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntryWithId[]>([]);
  const [currentLogLevel, setCurrentLogLevel] = useState<CrispLogLevel>(
    CrispLogLevel.DEBUG,
  );
  const [lastNotification, setLastNotification] =
    useState<PushNotificationPayload | null>(null);

  console.log('SDK Version:', getSDKVersion());

  useCrispEvents({
    onSessionLoaded: id => {
      console.log('[Crisp] Session loaded:', id);
      setSessionId(id);
    },
    onChatOpened: () => {
      console.log('[Crisp] Chat opened');
      setChatStatus('open');
    },
    onChatClosed: () => {
      console.log('[Crisp] Chat closed');
      setChatStatus('closed');
    },
    onMessageSent: message => {
      console.log('[Crisp] Message sent:', message);
    },
    onMessageReceived: message => {
      console.log('[Crisp] Message received:', message);
    },
    onPushNotificationReceived: notification => {
      console.log('[Crisp] Push notification received:', notification);
      setLastNotification(notification);
    },
    onLogReceived: log => {
      console.log(
        `[Crisp Log] [${getLogLevelName(log.level)}] ${log.tag}: ${
          log.message
        }`,
      );
      const logWithId: LogEntryWithId = {
        ...log,
        id: `log-${++logIdCounter}`,
      };
      setLogs(prev => [...prev.slice(-19), logWithId]);
    },
  });

  useEffect(() => {
    if (!WEBSITE_ID || WEBSITE_ID === 'YOUR_WEBSITE_ID') {
      Alert.alert(
        'Configuration Required',
        'Please set your Crisp Website ID in App.tsx (WEBSITE_ID constant)',
      );
      return;
    }
    Crisp.configure(WEBSITE_ID);
    Crisp.setLogLevel(CrispLogLevel.DEBUG);
  }, []);

  const handleSetLogLevel = (level: CrispLogLevel) => {
    Crisp.setLogLevel(level);
    setCurrentLogLevel(level);
    setLogs([]);
  };

  const handleLogin = () => {
    Crisp.setTokenId('bare-example-token-001');
    Crisp.setUserEmail('test@bareexample.com');
    Crisp.setUserNickname('Bare Example User');
    Crisp.setUserPhone('+33600000000');
    Crisp.setUserCompany({
      name: 'Test Company',
      url: 'https://example.com',
      companyDescription: 'Bare Workflow Test',
      employment: {
        title: 'Developer',
        role: 'Engineering',
      },
      geolocation: {
        city: 'Paris',
        country: 'FR',
      },
    });

    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    Crisp.setTokenId(null);
    Crisp.resetSession();
    setIsLoggedIn(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expo Crisp SDK</Text>
        <Text style={styles.subtitle}>Bare Workflow Test</Text>
        <Text style={styles.version}>v{getSDKVersion()}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Session */}
        <Text style={styles.sectionTitle}>User Session</Text>
        {!isLoggedIn ? (
          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login (Set User Info)</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout (Reset Session)</Text>
          </Pressable>
        )}
        <Text style={styles.hint}>
          {isLoggedIn
            ? 'User info set. Tap "Open Chat" to talk with support.'
            : 'Login to set user information, then open the chat.'}
        </Text>

        {/* Open Chat */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Chat</Text>
        <Pressable
          style={[styles.button, styles.chatButton]}
          onPress={() => Crisp.show()}
        >
          <Text style={styles.buttonText}>Open Chat</Text>
        </Pressable>

        {/* Events */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Events Callbacks
        </Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Chat Status:</Text>
            <View
              style={[
                styles.statusBadge,
                chatStatus === 'open' ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {chatStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Session ID:</Text>
            <Text style={styles.statusValue}>{sessionId ?? 'Not loaded'}</Text>
          </View>
        </View>

        {/* Messages */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Show Message Test
        </Text>
        <View style={styles.messageButtons}>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              Crisp.showMessage({ type: 'text', text: 'Hello from Crisp!' });
            }}
          >
            <Text style={styles.buttonText}>Text Message</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              Crisp.showMessage({
                type: 'picker',
                id: 'rating',
                text: 'How would you rate our service?',
                choices: [
                  { value: 'great', label: 'Great!', selected: false },
                  { value: 'ok', label: "It's okay", selected: false },
                  { value: 'poor', label: 'Could be better', selected: false },
                ],
              });
            }}
          >
            <Text style={styles.buttonText}>Picker Message</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.messageButton]}
            onPress={() => {
              Crisp.showMessage({
                type: 'field',
                id: 'email',
                text: "What's your email?",
                explain: "We'll send you a confirmation",
                required: true,
              });
            }}
          >
            <Text style={styles.buttonText}>Field Message</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Tap a button then open the chat to see the message.
        </Text>

        {/* Push Notifications */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Push Notifications
        </Text>
        <View style={styles.statusContainer}>
          {lastNotification ? (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Title:</Text>
                <Text style={styles.statusValue}>{lastNotification.title}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Body:</Text>
                <Text style={styles.statusValue}>{lastNotification.body}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.statusLabel}>
              No Crisp notification received yet
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.button, styles.messageButton, { marginTop: 12 }]}
          onPress={() => {
            Crisp.setShouldPromptForNotificationPermission(false);
            console.log('[Crisp] Disabled auto notification prompt');
          }}
        >
          <Text style={styles.buttonText}>Disable Auto Prompt</Text>
        </Pressable>

        {/* Logger */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Logger Test
        </Text>
        <View style={styles.logLevelButtons}>
          {(
            [
              { level: CrispLogLevel.DEBUG, label: 'DEBUG' },
              { level: CrispLogLevel.INFO, label: 'INFO' },
              { level: CrispLogLevel.WARN, label: 'WARN' },
              { level: CrispLogLevel.ERROR, label: 'ERROR' },
            ] as const
          ).map(({ level, label }) => (
            <Pressable
              key={level}
              style={[
                styles.logLevelButton,
                currentLogLevel === level && styles.logLevelButtonActive,
              ]}
              onPress={() => handleSetLogLevel(level)}
            >
              <Text
                style={[
                  styles.logLevelButtonText,
                  currentLogLevel === level && styles.logLevelButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>
          Current level: {getLogLevelName(currentLogLevel)}
        </Text>

        {logs.length > 0 && (
          <View style={styles.logsContainer}>
            <View style={styles.logsHeader}>
              <Text style={styles.logsTitle}>Recent Logs ({logs.length})</Text>
              <Pressable onPress={() => setLogs([])}>
                <Text style={styles.clearButton}>Clear</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.logsList}>
              {logs.map(log => (
                <View key={log.id} style={styles.logEntry}>
                  <Text
                    style={[
                      styles.logLevel,
                      log.level >= CrispLogLevel.ERROR && styles.logLevelError,
                      log.level === CrispLogLevel.WARN && styles.logLevelWarn,
                      log.level === CrispLogLevel.INFO && styles.logLevelInfo,
                    ]}
                  >
                    [{getLogLevelName(log.level)}]
                  </Text>
                  <Text style={styles.logTag}>{log.tag}:</Text>
                  <Text style={styles.logMessage} numberOfLines={2}>
                    {log.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  chatButton: {
    backgroundColor: '#28a745',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#d4edda',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageButtons: {
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#6c757d',
  },
  logLevelButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  logLevelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  logLevelButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  logLevelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  logLevelButtonTextActive: {
    color: '#fff',
  },
  logsContainer: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  clearButton: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  logsList: {
    flex: 1,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  logLevel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6c757d',
    fontWeight: '600',
  },
  logLevelError: {
    color: '#dc3545',
  },
  logLevelWarn: {
    color: '#ffc107',
  },
  logLevelInfo: {
    color: '#17a2b8',
  },
  logTag: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#888',
  },
  logMessage: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#ccc',
    flex: 1,
  },
});
