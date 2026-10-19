// Small pieces the screens share. Type, spacing, and the corner radius are literals until the package has them
// (ADR 0063: type, corners, and spacing are the next steps).
import Pts
import SwiftUI

/// The theme setting: the system's, or one fixed for the app
enum ThemeChoice: String, CaseIterable, Identifiable {
    case system = "System", light = "Light", dark = "Dark"
    var id: String { rawValue }
    var scheme: ColorScheme? { self == .light ? .light : self == .dark ? .dark : nil }
}

/// A card: surface/subtle, with concentric corners no less round than radius/container (32pt with shape round)
struct Card<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) { content }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(PtsColors.surfaceSubtle, in: ConcentricRectangle(corners: .concentric(minimum: .fixed(32)), isUniform: true))
    }
}

/// A section title on a screen
struct SectionTitle: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.title3.bold())
            .foregroundStyle(PtsColors.contentBase)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    /// The primary button: the accent fill (inverse/base) with content/inverse/base on it, the pair pts/contrast checks.
    /// SwiftUI would write white, which fails on dark mode's light inverse/base.
    func primaryButton() -> some View {
        buttonStyle(.borderedProminent).foregroundStyle(PtsColors.contentInverseBase)
    }

    /// The danger button: the danger intent's surface/base with its content/inverse
    func dangerButton() -> some View {
        buttonStyle(.borderedProminent).tint(PtsColors.intentDangerSurfaceBase).foregroundStyle(PtsColors.intentDangerContentInverse)
    }
}

enum Status: String {
    case overdue = "Overdue", dueSoon = "Due soon", inReview = "In review", done = "Done", new = "New"

    /// An intent's soft pair: its surface/subtle and content/base
    var colors: (fill: Color, text: Color) {
        switch self {
        case .overdue: (PtsColors.intentDangerSurfaceSubtle, PtsColors.intentDangerContentBase)
        case .dueSoon: (PtsColors.intentWarningSurfaceSubtle, PtsColors.intentWarningContentBase)
        case .inReview: (PtsColors.intentInfoSurfaceSubtle, PtsColors.intentInfoContentBase)
        case .done: (PtsColors.intentSuccessSurfaceSubtle, PtsColors.intentSuccessContentBase)
        case .new: (PtsColors.intentDiscoverySurfaceSubtle, PtsColors.intentDiscoveryContentBase)
        }
    }
}

/// A soft intent tag, fully round
struct Tag: View {
    let label: String
    let fill: Color
    let text: Color

    init(_ status: Status) {
        (label, fill, text) = (status.rawValue, status.colors.fill, status.colors.text)
    }

    init(_ label: String, fill: Color, text: Color) {
        (self.label, self.fill, self.text) = (label, fill, text)
    }

    var body: some View {
        Text(label)
            .font(.footnote.weight(.medium))
            .lineLimit(1)
            .fixedSize()
            .foregroundStyle(text)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(fill, in: Capsule())
    }
}

/// A number in mono over its label: monospaced digits line up
struct Stat: View {
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.title.bold().monospaced())
                .foregroundStyle(PtsColors.contentBase)
            Text(label)
                .foregroundStyle(PtsColors.contentSubtle)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
