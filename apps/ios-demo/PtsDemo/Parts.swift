// Small pieces the screens share
import Pts
import SwiftUI

/// The theme setting: the system's, or one fixed for the app
enum ThemeChoice: String, CaseIterable, Identifiable {
    case system = "System", light = "Light", dark = "Dark"
    var id: String { rawValue }
    var scheme: ColorScheme? { self == .light ? .light : self == .dark ? .dark : nil }
}

/// A card: surface/subtle, in the container shape: concentric corners, never less round than radius/container
struct Card<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinMd) { content }
            .padding(PtsSpacing.paddingXl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(PtsColors.surfaceSubtle, in: PtsShape.container)
    }
}

/// A section title on a screen
struct SectionTitle: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .textStyle(PtsTypography.headingMd)
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
            .textStyle(PtsTypography.labelSm)
            .lineLimit(1)
            .fixedSize()
            .foregroundStyle(text)
            .padding(.horizontal, PtsSpacing.paddingSm)
            .padding(.vertical, PtsSpacing.space50)
            .background(fill, in: Capsule())
    }
}

/// A number in mono over its label: Aspekta has no tabular figures, so digits line up in IBM Plex Mono
struct Stat: View {
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinXs) {
            Text(value)
                .font(.custom("IBM Plex Mono", size: 28, relativeTo: .title).weight(.bold))
                .foregroundStyle(PtsColors.contentBase)
            Text(label)
                .textStyle(PtsTypography.bodyMd)
                .foregroundStyle(PtsColors.contentSubtle)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
