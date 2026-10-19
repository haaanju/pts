// swift-tools-version: 6.2
// The Swift package of @pts/ios (ADR 0064). Its sources are generated: run `npm run build` first, which writes dist/Pts.
import PackageDescription

let package = Package(
    name: "Pts",
    platforms: [.iOS(.v26)],
    products: [
        .library(name: "Pts", targets: ["Pts"]),
        // Every color with its path, description, and alias, and this version's release: for the demo app (ADR 0065)
        .library(name: "PtsCatalog", targets: ["PtsCatalog"]),
    ],
    targets: [
        .target(name: "Pts", path: "dist/Pts", resources: [.copy("Fonts")]),
        .target(name: "PtsCatalog", dependencies: ["Pts"], path: "dist/catalog"),
    ]
)
