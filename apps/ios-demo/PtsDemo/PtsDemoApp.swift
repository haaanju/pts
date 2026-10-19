// The demo app of @pts/ios (ADR 0063, 0065, 0066): native SwiftUI components, colored and set in type from the tokens,
// in the four tabs of the Android demo. The accent is inverse/base (ADR 0063); light and dark follow the system unless
// Settings picks one.
import Pts
import SwiftUI
import UIKit

@main
struct PtsDemoApp: App {
    @AppStorage("theme") private var theme = ThemeChoice.system
    // The open tab, kept across launches; `-tab tokens` as a launch argument opens one (for screenshots)
    @AppStorage("tab") private var tab = "home"

    init() {
        PtsFonts.register()
        // Navigation titles are UIKit's, outside SwiftUI's font: Aspekta bold at the sizes of display-lg (large title)
        // and heading-sm's weight at the inline title's size, scaled by Dynamic Type like the text styles
        let bold = UIFontDescriptor(fontAttributes: [
            .family: "Aspekta Variable",
            UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String): [0x7767_6874: 700], // 'wght'
        ])
        let bar = UINavigationBar.appearance()
        bar.largeTitleTextAttributes = [.font: UIFontMetrics(forTextStyle: .largeTitle).scaledFont(for: UIFont(descriptor: bold, size: 34))]
        bar.titleTextAttributes = [.font: UIFontMetrics(forTextStyle: .headline).scaledFont(for: UIFont(descriptor: bold, size: 17))]
    }

    var body: some Scene {
        WindowGroup {
            TabView(selection: $tab) {
                Tab("Home", systemImage: "house", value: "home") { HomeScreen() }
                Tab("Tokens", systemImage: "list.bullet", value: "tokens") { TokensScreen() }
                Tab("Components", systemImage: "square.grid.2x2", value: "components") { ComponentsScreen() }
                Tab("Settings", systemImage: "gearshape", value: "settings") { SettingsScreen() }
            }
            .textStyle(PtsTypography.bodyMd)
            .tint(PtsColors.inverseBase)
            .preferredColorScheme(theme.scheme)
        }
    }
}
