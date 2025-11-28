import { useEvent } from 'expo';
import ExpoCrispSdk from 'expo-crisp-sdk';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const onChangePayload = useEvent(ExpoCrispSdk, 'onChange');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Module API Example</Text>
        <Group name="Constants">
          <Text>{ExpoCrispSdk.PI}</Text>
        </Group>
        <Group name="Functions">
          <Text>{ExpoCrispSdk.hello()}</Text>
        </Group>
        <Group name="Async functions">
          <Button
            title="Set value"
            onPress={async () => {
              await ExpoCrispSdk.setValueAsync('Hello from JS!');
            }}
          />
        </Group>
        <Group name="Events">
          <Text>{onChangePayload?.value}</Text>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  view: {
    flex: 1,
    height: 200,
  },
};
