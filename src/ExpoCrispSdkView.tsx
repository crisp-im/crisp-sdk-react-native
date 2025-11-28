import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoCrispSdkViewProps } from './ExpoCrispSdk.types';

const NativeView: React.ComponentType<ExpoCrispSdkViewProps> =
  requireNativeView('ExpoCrispSdk');

export default function ExpoCrispSdkView(props: ExpoCrispSdkViewProps) {
  return <NativeView {...props} />;
}
