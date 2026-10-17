import groovy.json.JsonSlurper

plugins {
    id("com.android.library") version "9.4.1"
    `maven-publish`
}

// One version for every @pts/* package (ADR 0014): Changesets writes it to package.json.
val npmPackage = JsonSlurper().parse(file("package.json")) as Map<*, *>
group = "io.github.haaanju.pts"
version = npmPackage["version"] as String

android {
    namespace = "io.github.haaanju.pts"
    compileSdk = 37

    defaultConfig {
        minSdk = 26 // Aspekta's weight axis (FontVariation) needs Android 8
    }

    // The Kotlin and font resources `npm run build` writes (plugin-compose.ts, build-fonts.ts); run it first.
    // dist/catalog is the demo app's (ADR 0060), not the library's.
    sourceSets {
        getByName("main") {
            kotlin.directories += "dist/kotlin"
            res.directories += "dist/res"
        }
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    // The generated classes use Color, Dp, TextStyle, fonts, and @Immutable; consumers get them through the library
    api(platform("androidx.compose:compose-bom:2026.09.00"))
    api("androidx.compose.ui:ui-graphics")
    api("androidx.compose.ui:ui-unit")
    api("androidx.compose.ui:ui-text")
    api("androidx.compose.runtime:runtime")
}

publishing {
    publications {
        register<MavenPublication>("release") {
            artifactId = "pts-android"
            afterEvaluate { from(components["release"]) }
        }
    }
}
