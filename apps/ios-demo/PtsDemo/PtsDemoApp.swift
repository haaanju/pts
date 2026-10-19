// The demo app of @pts/ios (ADR 0063, 0065): native SwiftUI components, colored from the tokens. The accent is
// inverse/base (ADR 0063); light and dark follow the system, through the color sets.
import Pts
import SwiftUI

@main
struct PtsDemoApp: App {
    var body: some Scene {
        WindowGroup {
            HomeScreen()
                .tint(PtsColors.inverseBase)
        }
    }
}
