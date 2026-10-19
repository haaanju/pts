// The token pages, like the Storybook docs: token first, then its value in the current theme, the alias it points to,
// and its description, from PtsCatalog (ADR 0065). Only colors so far; type, spacing, and corners follow (ADR 0063).
import Pts
import PtsCatalog
import SwiftUI

struct TokensScreen: View {
    @Environment(\.colorScheme) private var scheme

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
                ForEach(sections, id: \.title) { section in
                    Section {
                        ForEach(section.entries) { entry in
                            TokenRow(entry: entry, index: index)
                        }
                    } header: {
                        Header(group: section.title)
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
                .font(.headline)
                .foregroundStyle(PtsColors.contentBase)
            Text("\(group)/*")
                .font(.footnote.monospaced())
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
            RoundedRectangle(cornerRadius: 8)
                .fill(entry.color)
                .stroke(PtsColors.borderSubtle)
                .frame(width: 44, height: 44)
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.path)
                    .font(.subheadline.monospaced())
                    .foregroundStyle(PtsColors.contentBase)
                Text(entry.aliases[index].isEmpty ? entry.hex[index] : "\(entry.hex[index])  → \(entry.aliases[index])")
                    .font(.footnote.monospaced())
                    .foregroundStyle(PtsColors.contentSubtle)
                if !entry.description.isEmpty {
                    Text(entry.description)
                        .font(.footnote)
                        .foregroundStyle(PtsColors.contentSubtle)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
