// The token pages, like the Storybook docs: token first, then its value in the current theme, the alias it points to,
// and its description, from PtsCatalog (ADR 0065). Colors, type, and borders so far; spacing follows (ADR 0063).
import Pts
import PtsCatalog
import SwiftUI

struct TokensScreen: View {
    @Environment(\.colorScheme) private var scheme
    @AppStorage("tokensPage") private var page = "Color" // kept like the tab; `-tokensPage Border` opens one

    /// The groups of the docs' Color page, in its order: intent/danger/surface/base → intent/danger; always/* last
    private var sections: [(title: String, entries: [PtsCatalog.Entry])] {
        func section(_ path: String) -> String {
            let parts = path.split(separator: "/")
            return parts[0] == "intent" ? "\(parts[0])/\(parts[1])" : String(parts[0])
        }
        var order: [String] = []
        var groups: [String: [PtsCatalog.Entry]] = [:]
        for entry in PtsCatalog.colors {
            let title = section(entry.path)
            if groups[title] == nil { order.append(title) }
            groups[title, default: []].append(entry)
        }
        return order.sorted { ($0 == "always" ? 1 : 0) < ($1 == "always" ? 1 : 0) }.map { ($0, groups[$0]!) }
    }

    var body: some View {
        // The context index the values come from: light, then dark
        let index = scheme == .dark ? 1 : 0
        NavigationStack {
            List {
                Picker("Page", selection: $page) {
                    ForEach(["Color", "Type", "Border"], id: \.self) { Text($0) }
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
                if page == "Color" {
                    ForEach(sections, id: \.title) { section in
                        Section {
                            ForEach(section.entries) { entry in
                                TokenRow(entry: entry, index: index)
                            }
                        } header: {
                            Header(group: section.title)
                        }
                    }
                } else if page == "Border" {
                    ForEach(["radius", "stroke", "focus-ring"], id: \.self) { group in
                        Section {
                            ForEach(PtsCatalog.border.filter { $0.path.hasPrefix("\(group)/") }) { entry in
                                DimensionRow(entry: entry) { BorderSample(group: group, value: entry.value) }
                            }
                        } header: {
                            Header(group: group)
                        }
                    }
                } else {
                    Section {
                        ForEach(PtsCatalog.typography) { entry in
                            TypeRow(entry: entry)
                        }
                    } header: {
                        Header(group: "text")
                    }
                }
            }
            .navigationTitle("Tokens")
        }
    }
}

/// A section heading like the docs': the group's name, then the token path it covers, ending in a wildcard
private struct Header: View {
    let group: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text((group.split(separator: "/").last ?? "").capitalized)
                .textStyle(PtsTypography.headingSm)
                .foregroundStyle(PtsColors.contentBase)
            Text("\(group)/*")
                .textStyle(PtsTypography.codeMd)
                .foregroundStyle(PtsColors.contentSubtle)
        }
        .textCase(nil)
    }
}

/// A row like the docs' token tables: the sample, then the path, value, alias, and description
private struct TokenRow: View {
    let entry: PtsCatalog.Entry
    let index: Int

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            RoundedRectangle(cornerRadius: PtsBorder.radiusMd)
                .fill(entry.color)
                .stroke(PtsColors.borderSubtle, lineWidth: PtsBorder.strokeThin)
                .frame(width: 44, height: 44)
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.path)
                    .textStyle(PtsTypography.codeMd)
                    .foregroundStyle(PtsColors.contentBase)
                Text(entry.aliases[index].isEmpty ? entry.hex[index] : "\(entry.hex[index])  → \(entry.aliases[index])")
                    .textStyle(PtsTypography.codeMd)
                    .foregroundStyle(PtsColors.contentSubtle)
                if !entry.description.isEmpty {
                    Text(entry.description)
                        .textStyle(PtsTypography.bodySm)
                        .foregroundStyle(PtsColors.contentSubtle)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

/// A text style like the docs' type specimens: its path, a sample in the style, then its iOS text style, size, family,
/// weight, and tracking
private struct TypeRow: View {
    let entry: PtsCatalog.TypeEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.path)
                .textStyle(PtsTypography.codeMd)
                .foregroundStyle(PtsColors.contentSubtle)
            Text(entry.path.hasPrefix("text/code") ? "let gap = 8" : "Plain tokens on iOS")
                .textStyle(entry.style)
                .foregroundStyle(PtsColors.contentBase)
            Text(entry.detail)
                .textStyle(PtsTypography.codeMd)
                .foregroundStyle(PtsColors.contentSubtle)
        }
        .padding(.vertical, 4)
    }
}

/// A dimension like the docs' tables: the sample, then the path, value, alias, and description
struct DimensionRow<Sample: View>: View {
    let entry: PtsCatalog.DimensionEntry
    @ViewBuilder let sample: Sample

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            sample.frame(width: 44, alignment: .leading)
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.path)
                    .textStyle(PtsTypography.codeMd)
                    .foregroundStyle(PtsColors.contentBase)
                Text(entry.alias.isEmpty ? "\(points(entry.value))" : "\(points(entry.value))  → \(entry.alias)")
                    .textStyle(PtsTypography.codeMd)
                    .foregroundStyle(PtsColors.contentSubtle)
                if !entry.description.isEmpty {
                    Text(entry.description)
                        .textStyle(PtsTypography.bodySm)
                        .foregroundStyle(PtsColors.contentSubtle)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func points(_ value: CGFloat) -> String {
        value.rounded() == value ? "\(Int(value))pt" : "\(value)pt"
    }
}

/// A radius on a square, or a stroke width around one
private struct BorderSample: View {
    let group: String
    let value: CGFloat

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: group == "radius" ? min(value, 22) : PtsBorder.radiusMd)
        shape
            .fill(PtsColors.surfaceSubtle)
            .stroke(PtsColors.borderBase, lineWidth: group == "radius" ? PtsBorder.strokeThin : value)
            .frame(width: 44, height: 44)
    }
}
