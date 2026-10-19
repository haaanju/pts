// SwiftUI's own components, in a native grouped list (its background stays the system's, ADR 0063), colored only by
// the app's tint (inverse/base) and, where a fill needs its own content color, the token pair.
import Pts
import SwiftUI

struct ComponentsScreen: View {
    @State private var notifications = true
    @State private var period = "Week"
    @State private var sort = "Due date"
    @State private var tasks = 3
    @State private var name = "Checkout redesign"
    @State private var progress = 0.4
    @State private var due = Date.now
    @State private var alert = false
    @State private var confirm = false
    @State private var sheet = false

    var body: some View {
        NavigationStack {
            List {
                Section("Buttons") {
                    HStack {
                        Button("Primary") {}.primaryButton()
                        Button("Secondary") {}.buttonStyle(.bordered)
                        Button("Ghost") {}.buttonStyle(.borderless)
                    }
                    HStack {
                        Button("Delete", role: .destructive) {}.dangerButton()
                        Button("Disabled") {}.primaryButton().disabled(true)
                    }
                    HStack {
                        Button("Glass") {}.buttonStyle(.glass)
                        Button("Glass prominent") {}.buttonStyle(.glassProminent).foregroundStyle(PtsColors.contentInverseBase)
                    }
                }
                .buttonBorderShape(.capsule)

                Section("Icon buttons") {
                    HStack(spacing: 16) {
                        Button("Like", systemImage: "heart") {}.buttonStyle(.bordered)
                        Button("Edit", systemImage: "pencil") {}.primaryButton()
                        Button("Share", systemImage: "square.and.arrow.up") {}.buttonStyle(.glass)
                        Button("Add", systemImage: "plus") {}.buttonStyle(.glassProminent).foregroundStyle(PtsColors.contentInverseBase)
                    }
                    .labelStyle(.iconOnly)
                    .buttonBorderShape(.circle)
                }

                Section("Tags") {
                    HStack {
                        ForEach([Status.overdue, .dueSoon, .inReview], id: \.self) { Tag($0) }
                    }
                    HStack {
                        ForEach([Status.done, .new], id: \.self) { Tag($0) }
                    }
                }

                Section("Selection") {
                    // The system's green: iOS draws a white knob, which dark mode's light inverse/base can't carry
                    Toggle("Notifications", isOn: $notifications)
                        .tint(Color(.systemGreen))
                    Picker("Period", selection: $period) {
                        ForEach(["Day", "Week", "Month"], id: \.self) { Text($0) }
                    }
                    .pickerStyle(.segmented)
                    Picker("Sort by", selection: $sort) {
                        ForEach(["Due date", "Name", "Status"], id: \.self) { Text($0) }
                    }
                    Stepper("Tasks: \(tasks)", value: $tasks, in: 0...20)
                }

                Section {
                    TextField("Project name", text: $name)
                    Slider(value: $progress)
                    DatePicker("Due", selection: $due, displayedComponents: .date)
                } header: {
                    Text("Inputs")
                } footer: {
                    Text("Shown on the board and in search")
                }

                Section("Progress") {
                    ProgressView(value: 0.6)
                    HStack {
                        ProgressView()
                        Gauge(value: 0.7) { Text("Done") }.gaugeStyle(.accessoryCircularCapacity)
                    }
                }

                Section("Cards") {
                    Card {
                        Text("Card").font(.headline).foregroundStyle(PtsColors.contentBase)
                        Text("surface/subtle, concentric corners").foregroundStyle(PtsColors.contentSubtle)
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }

                Section("Menus and dialogs") {
                    Menu("Actions") {
                        Button("Duplicate", systemImage: "plus.square.on.square") {}
                        Button("Archive", systemImage: "archivebox") {}
                        Button("Delete", systemImage: "trash", role: .destructive) {}
                    }
                    Button("Open alert") { alert = true }
                    Button("Open confirmation") { confirm = true }
                    Button("Open sheet") { sheet = true }
                }
            }
            .navigationTitle("Components")
            .alert("Archive project?", isPresented: $alert) {
                Button("Archive") {}
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Checkout redesign moves to the archive. You can restore it later.")
            }
            .confirmationDialog("Delete project?", isPresented: $confirm, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {}
            }
            .sheet(isPresented: $sheet) {
                VStack(spacing: 16) {
                    Card {
                        Text("In a sheet").font(.headline).foregroundStyle(PtsColors.contentBase)
                        Text("The card's corners follow the sheet's.").foregroundStyle(PtsColors.contentSubtle)
                    }
                    Button("Done") { sheet = false }.primaryButton().buttonBorderShape(.capsule)
                }
                .padding(16)
                .presentationDetents([.medium])
            }
        }
    }
}
