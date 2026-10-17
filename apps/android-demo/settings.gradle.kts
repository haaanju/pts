// The Android demo app (ADR 0057): a Compose screen that uses @pts/android's PtsColors, to see a token change in the
// emulator. It depends on the published library (ADR 0058): publish it to mavenLocal first (README, Usage).
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenLocal() // io.github.haaanju.pts:pts-android, published from packages/android
        google()
        mavenCentral()
    }
}
rootProject.name = "pts-android-demo"
include(":app")
