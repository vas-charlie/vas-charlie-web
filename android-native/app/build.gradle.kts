plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "hr.vascharlie.lana"
    compileSdk = 35

    defaultConfig {
        applicationId = "hr.vascharlie.lana"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1-native-voice"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
}
