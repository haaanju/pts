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

    // PtsColors.kt straight from the @pts/android build (npm run build), so a token change shows on the next run
    sourceSets {
        getByName("main") {
            kotlin.directories += "../../../packages/android/dist"
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.activity:activity-compose:1.13.0")
}
