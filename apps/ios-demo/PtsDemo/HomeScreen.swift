// The owner's app, as on Android (ADR 0061, 0062): a greeting, what's new in the tokens, what the app is, the tokens
// at a glance, then sample project content set apart under Examples.
import Pts
import PtsCatalog
import SwiftUI

private struct Project: Identifiable {
    let name: String
    let detail: String
    let status: Status
    var id: String { name }
}

private let projects = [
    Project(name: "Checkout redesign", detail: "8 tasks · updated 2h ago", status: .overdue),
    Project(name: "Onboarding flow", detail: "Kickoff on Monday", status: .new),
    Project(name: "Settings revamp", detail: "Due Friday · 3 tasks left", status: .dueSoon),
    Project(name: "Dark mode audit", detail: "Waiting on 2 reviewers", status: .inReview),
    Project(name: "Design tokens v1", detail: "Shipped 3 days ago", status: .done),
    Project(name: "Search results", detail: "Shipped last week", status: .done),
]

/// A greeting for the time of day: 05–12 morning, 12–18 afternoon, 18–22 evening, otherwise late
private func greeting(_ date: Date) -> String {
    switch Calendar.current.component(.hour, from: date) {
    case 5..<12: "Good morning"
    case 12..<18: "Good afternoon"
    case 18..<22: "Good evening"
    default: "Working late"
    }
}

struct HomeScreen: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: PtsSpacing.gapBetweenLg) {
                    // Read again every minute, so a greeting left open from the morning doesn't stay "Good morning"
                    TimelineView(.everyMinute) { context in
                        Text("\(greeting(context.date)), Hanju")
                            .textStyle(PtsTypography.headingMd)
                            .foregroundStyle(PtsColors.contentBase)
                    }
                    WhatsNew()
                    About()
                    AtAGlance()
                    Divider().overlay(PtsColors.borderSubtle)
                    SectionTitle("Examples")
                    Banner()
                    Summary()
                    Recent()
                }
                .padding(PtsSpacing.paddingLg)
            }
            .navigationTitle("Projects")
            .toolbar {
                ToolbarItemGroup {
                    Button("Search", systemImage: "magnifyingglass") {}
                    Button("Notifications", systemImage: "bell") {}
                }
            }
        }
    }
}

/// This version's changelog entries, read at build time, counted by kind: the entries themselves are in the changelog
private struct WhatsNew: View {
    var body: some View {
        let kinds = Dictionary(grouping: PtsCatalog.releaseNotes) { $0.components(separatedBy: ":").first ?? "" }
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinMd) {
            VStack(alignment: .leading, spacing: PtsSpacing.gapWithinXs) {
                SectionTitle("What's new in Plain \(PtsCatalog.version)")
                if let date = PtsCatalog.releaseDate.flatMap({ try? Date($0, strategy: .iso8601.year().month().day()) }) {
                    Text("Released \(date.formatted(date: .long, time: .omitted))")
                        .foregroundStyle(PtsColors.contentSubtle)
                }
            }
            HStack(spacing: PtsSpacing.gapWithinSm) {
                ForEach(kinds.keys.sorted(), id: \.self) { kind in
                    // New is the discovery intent (new things), Fix the success one
                    let (fill, text) = kind == "New" ? (PtsColors.intentDiscoverySurfaceSubtle, PtsColors.intentDiscoveryContentBase)
                        : kind == "Fix" ? (PtsColors.intentSuccessSurfaceSubtle, PtsColors.intentSuccessContentBase)
                        : (PtsColors.surfaceStrong, PtsColors.contentBase)
                    Tag("\(kinds[kind]!.count) \(kind)", fill: fill, text: text)
                }
            }
        }
    }
}

private struct About: View {
    var body: some View {
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinMd) {
            SectionTitle("About this app")
            Text("Native SwiftUI components, colored by the `@pts/ios` tokens.")
                .foregroundStyle(PtsColors.contentBase)
        }
    }
}

/// The tokens the app reads, counted from the catalog, so the numbers follow the tokens
private struct AtAGlance: View {
    var body: some View {
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinMd) {
            SectionTitle("At a glance")
            Card {
                HStack(spacing: PtsSpacing.gapBetweenSm) {
                    Stat(value: "\(PtsCatalog.colors.count)", label: "colors")
                    Stat(value: "\(PtsCatalog.typography.count)", label: "type")
                    Stat(value: "\(PtsCatalog.spacing.count)", label: "spacing")
                    Stat(value: "\(PtsCatalog.border.count)", label: "border")
                }
                VStack(alignment: .leading, spacing: PtsSpacing.gapWithinXs) {
                    Text("\(PtsCatalog.modifiers.count) mode: \(PtsCatalog.modifiers.joined(separator: ", "))")
                        .foregroundStyle(PtsColors.contentBase)
                    Text("@pts/ios \(PtsCatalog.version) · Terrazzo · SwiftUI")
                        .foregroundStyle(PtsColors.contentSubtle)
                }
            }
        }
    }
}

/// An info banner: the intent's soft fill and its content color, title and text the same size, told apart by weight
private struct Banner: View {
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: PtsSpacing.gapWithinMd) {
            Image(systemName: "info.circle.fill")
            VStack(alignment: .leading, spacing: PtsSpacing.gapWithinXs) {
                Text("Design review moved to Thursday").textStyle(PtsTypography.labelLg)
                Text("The checkout redesign review is now Thursday at 2 PM.").textStyle(PtsTypography.bodyMd)
            }
        }
        .foregroundStyle(PtsColors.intentInfoContentBase)
        .padding(PtsSpacing.paddingLg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PtsColors.intentInfoSurfaceSubtle, in: PtsShape.container)
    }
}

/// A card of project numbers
private struct Summary: View {
    var body: some View {
        Card {
            HStack(spacing: PtsSpacing.gapBetweenSm) {
                Stat(value: "12", label: "Open")
                Stat(value: "03", label: "Due soon")
                Stat(value: "28", label: "Done")
            }
        }
    }
}

private struct Recent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: PtsSpacing.gapWithinMd) {
            HStack {
                SectionTitle("Recent")
                // A chevron, so the text-only button doesn't read as text in the accent, the text color's near twin
                Button {} label: {
                    HStack(spacing: PtsSpacing.gapWithinXs) {
                        Text("See all")
                        Image(systemName: "chevron.right")
                    }
                }
            }
            VStack(spacing: 0) {
                ForEach(projects) { project in
                    HStack(spacing: PtsSpacing.gapWithinMd) {
                        Initials(name: project.name)
                        VStack(alignment: .leading, spacing: PtsSpacing.space50) {
                            Text(project.name).textStyle(PtsTypography.labelLg).foregroundStyle(PtsColors.contentBase)
                            Text(project.detail).textStyle(PtsTypography.bodySm).foregroundStyle(PtsColors.contentSubtle)
                        }
                        Spacer()
                        Tag(project.status)
                    }
                    .padding(.vertical, PtsSpacing.paddingMd)
                    if project.id != projects.last?.id { Divider().overlay(PtsColors.borderSubtle) }
                }
            }
        }
    }
}

private struct Initials: View {
    let name: String

    var body: some View {
        Text(name.split(separator: " ").prefix(2).map { $0.prefix(1).uppercased() }.joined())
            .textStyle(PtsTypography.labelMd)
            .foregroundStyle(PtsColors.contentBase)
            .frame(width: PtsSpacing.sizeControlMd, height: PtsSpacing.sizeControlMd)
            .background(PtsColors.surfaceStrong, in: Circle())
    }
}
