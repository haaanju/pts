// swift-tools-version: 6.2
// The Swift package of @pts/ios (ADR 0064). Its sources are generated: run `npm run build` first, which writes dist/Pts.
import PackageDescription

let package = Package(
    name: "Pts",
    platforms: [.iOS(.v26)],
    products: [.library(name: "Pts", targets: ["Pts"])],
    targets: [.target(name: "Pts", path: "dist/Pts")]
)
