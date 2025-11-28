import { NativeModule, requireNativeModule } from "expo"

type ExpoCrispSdkEvents = Record<string, never>

declare class ExpoCrispSdkModule extends NativeModule<ExpoCrispSdkEvents> {
  // TODO: Declare Crisp SDK methods
}

export default requireNativeModule<ExpoCrispSdkModule>("ExpoCrispSdk")
