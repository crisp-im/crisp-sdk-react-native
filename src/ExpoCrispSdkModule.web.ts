import { registerWebModule, NativeModule } from 'expo';

import { ExpoCrispSdkModuleEvents } from './ExpoCrispSdk.types';

class ExpoCrispSdkModule extends NativeModule<ExpoCrispSdkModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoCrispSdkModule, 'ExpoCrispSdkModule');
