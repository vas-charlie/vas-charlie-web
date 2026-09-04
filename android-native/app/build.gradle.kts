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

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
}
