// The modes as an app's settings, as on Android. iOS follows the theme only: density, shape, and viewport are fixed
// (ADR 0063), so there is one choice.
import Pts
import PtsCatalog
import SwiftUI

struct SettingsScreen: View {
    @AppStorage("theme") private var theme = ThemeChoice.system

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Theme", selection: $theme) {
                        ForEach(ThemeChoice.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Appearance")
                } footer: {
                    Text("Light and dark colors. System follows the device. Density and shape are fixed on iOS: relaxed and round.")
                }
                Section("About") {
                    LabeledContent("Tokens", value: "@pts/ios \(PtsCatalog.version)")
                    LabeledContent("Source") {
                        Link("github.com/haaanju/pts", destination: URL(string: "https://github.com/haaanju/pts")!)
                    }
                    LabeledContent("Built with", value: "Terrazzo and SwiftUI")
                }
            }
            .navigationTitle("Settings")
        }
    }
}
