import ExpoModulesCore

public class ExpoCrispSdkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCrispSdk")

    Constant("PI") {
      Double.pi
    }

    Events("onChange")

    Function("hello") {
      return "Hello world! 👋"
    }

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
