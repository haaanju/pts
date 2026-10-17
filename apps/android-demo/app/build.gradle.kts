import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "io.github.haaanju.pts.demo"
    compileSdk = 37

    defaultConfig {
        applicationId = "io.github.haaanju.pts.demo"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }

}

// The library at the version this checkout releases (ADR 0058): publish it to mavenLocal first
val ptsVersion = (JsonSlurper().parse(file("../../../packages/android/package.json")) as Map<*, *>)["version"] as String

dependencies {
    implementation("io.github.haaanju.pts:pts-android:$ptsVersion")
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.activity:activity-compose:1.13.0")
}
