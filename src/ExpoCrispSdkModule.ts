import { NativeModule, requireNativeModule } from 'expo';

import { ExpoCrispSdkModuleEvents } from './ExpoCrispSdk.types';

declare class ExpoCrispSdkModule extends NativeModule<ExpoCrispSdkModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCrispSdkModule>('ExpoCrispSdk');
