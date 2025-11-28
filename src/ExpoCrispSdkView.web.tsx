import * as React from 'react';

import { ExpoCrispSdkViewProps } from './ExpoCrispSdk.types';

export default function ExpoCrispSdkView(props: ExpoCrispSdkViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
