// One screen of native components in the token colors. Type, spacing, and the corner radius are literals until the
// package has them (ADR 0063: type, corners, and spacing are the next steps).
import Pts
import SwiftUI

struct HomeScreen: View {
    @State private var showsSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Card("Text") {
                        Text("content/base, for body text and headings.")
                            .foregroundStyle(PtsColors.contentBase)
                        Text("content/subtle, for secondary text.")
                            .foregroundStyle(PtsColors.contentSubtle)
                    }
                    Card("Buttons") {
                        HStack {
                            Button("Primary") {}
                                .buttonStyle(.borderedProminent)
                                .foregroundStyle(PtsColors.contentInverseBase)
                            Button("Secondary") {}
                                .buttonStyle(.bordered)
                        }
                        Button("Delete", role: .destructive) {}
                            .buttonStyle(.borderedProminent)
                            .tint(PtsColors.intentDangerSurfaceBase)
                            .foregroundStyle(PtsColors.intentDangerContentInverse)
                    }
                    .buttonBorderShape(.capsule)
                    Card("Intents") {
                        ForEach(Intent.all) { intent in
                            Text(intent.name)
                                .font(.subheadline)
                                .foregroundStyle(intent.content)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(intent.surface, in: Capsule())
                                .overlay(Capsule().stroke(intent.border))
                        }
                    }
                }
                .padding(16)
            }
            .background(PtsColors.background)
            .navigationTitle("Plain")
            .toolbar {
                Button("Sheet") { showsSheet = true }
            }
            .sheet(isPresented: $showsSheet) {
                Card("In a sheet") {
                    Text("The card's corners follow the sheet's.")
                        .foregroundStyle(PtsColors.contentSubtle)
                }
                .padding(16)
                .presentationDetents([.medium])
            }
        }
    }
}

/// A card: surface/subtle, with concentric corners no less round than radius/container (32pt with shape round).
struct Card<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(_ title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundStyle(PtsColors.contentBase)
            content
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PtsColors.surfaceSubtle, in: ConcentricRectangle(corners: .concentric(minimum: .fixed(32)), isUniform: true))
    }
}

/// An intent's soft badge: its surface/subtle, content/base on it, and border/subtle.
struct Intent: Identifiable {
    let name: String
    let surface: Color
    let content: Color
    let border: Color
    var id: String { name }

    static let all = [
        Intent(name: "Danger", surface: PtsColors.intentDangerSurfaceSubtle, content: PtsColors.intentDangerContentBase, border: PtsColors.intentDangerBorderSubtle),
        Intent(name: "Warning", surface: PtsColors.intentWarningSurfaceSubtle, content: PtsColors.intentWarningContentBase, border: PtsColors.intentWarningBorderSubtle),
        Intent(name: "Success", surface: PtsColors.intentSuccessSurfaceSubtle, content: PtsColors.intentSuccessContentBase, border: PtsColors.intentSuccessBorderSubtle),
        Intent(name: "Info", surface: PtsColors.intentInfoSurfaceSubtle, content: PtsColors.intentInfoContentBase, border: PtsColors.intentInfoBorderSubtle),
        Intent(name: "Discovery", surface: PtsColors.intentDiscoverySurfaceSubtle, content: PtsColors.intentDiscoveryContentBase, border: PtsColors.intentDiscoveryBorderSubtle),
    ]
}
