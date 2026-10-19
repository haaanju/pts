// The app's settings, as on Android, less the appearance: iOS apps follow the system's (ADR 0070), and iOS fixes
// density and shape (ADR 0063), so only About is left.
import PtsCatalog
import SwiftUI

struct SettingsScreen: View {
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("Tokens", value: "@pts/ios \(PtsCatalog.version)")
                    LabeledContent("Source") {
                        Link("github.com/haaanju/pts", destination: URL(string: "https://github.com/haaanju/pts")!)
                    }
                    LabeledContent("Built with", value: "Terrazzo and SwiftUI")
                } header: {
                    Text("About")
                } footer: {
                    Text("Light and dark follow the system's appearance. Density and shape are fixed on iOS: relaxed and round.")
                }
            }
            .navigationTitle("Settings")
        }
    }
}
