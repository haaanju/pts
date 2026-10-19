// The demo app of @pts/ios (ADR 0063, 0065): native SwiftUI components, colored from the tokens, in the four tabs of
// the Android demo. The accent is inverse/base (ADR 0063); light and dark follow the system unless Settings picks one.
import Pts
import SwiftUI

@main
struct PtsDemoApp: App {
    @AppStorage("theme") private var theme = ThemeChoice.system
    // The open tab, kept across launches; `-tab tokens` as a launch argument opens one (for screenshots)
    @AppStorage("tab") private var tab = "home"

    var body: some Scene {
        WindowGroup {
            TabView(selection: $tab) {
                Tab("Home", systemImage: "house", value: "home") { HomeScreen() }
                Tab("Tokens", systemImage: "list.bullet", value: "tokens") { TokensScreen() }
                Tab("Components", systemImage: "square.grid.2x2", value: "components") { ComponentsScreen() }
                Tab("Settings", systemImage: "gearshape", value: "settings") { SettingsScreen() }
            }
            .tint(PtsColors.inverseBase)
            .preferredColorScheme(theme.scheme)
        }
    }
}
