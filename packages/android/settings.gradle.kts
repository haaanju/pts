// @pts/android as an Android library (ADR 0058): the Kotlin that `npm run build` writes to dist/, published as
// io.github.haaanju.pts:pts-android at the version in package.json, so an app depends on a release, not this folder.
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
rootProject.name = "pts-android"
