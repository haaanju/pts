// The Android demo app (ADR 0057): a Compose screen that uses @pts/android's PtsColors, to see a token change in the
// emulator. Not published; it compiles the generated Kotlin and shows it.
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
        google()
        mavenCentral()
    }
}
rootProject.name = "pts-android-demo"
include(":app")
