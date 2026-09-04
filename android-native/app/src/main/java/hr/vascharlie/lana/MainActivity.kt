package hr.vascharlie.lana

import android.annotation.SuppressLint
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var webView: WebView
    private var tts: TextToSpeech? = null
    private var ttsReady = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        tts = TextToSpeech(this, this)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(LanaVoiceBridge(), "LanaNative")
        webView.loadUrl("https://lana-v02-git-lana-stabl-5d3f62-charlieosijek2022-8208s-projects.vercel.app/lana-native-test.html")
    }

    override fun onInit(status: Int) {
        if (status != TextToSpeech.SUCCESS) {
            ttsReady = false
            notifyWeb("nativeVoiceError", "TTS_INIT_FAILED")
            return
        }

        val engine = tts ?: return
        val hr = Locale("hr", "HR")
        val result = engine.setLanguage(hr)
        ttsReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED

        if (ttsReady) {
            val candidates = engine.voices
                ?.filter { it.locale.language == "hr" }
                ?.sortedWith(compareBy<Voice> { it.isNetworkConnectionRequired }.thenBy { it.name })
                ?: emptyList()
            val offline = candidates.firstOrNull { !it.isNetworkConnectionRequired }
            if (offline != null) engine.voice = offline
            engine.setSpeechRate(0.92f)
            engine.setPitch(1.02f)
            notifyWeb("nativeVoiceReady", engine.voice?.name ?: "hr-HR")
        } else {
            notifyWeb("nativeVoiceError", "HR_VOICE_NOT_AVAILABLE")
        }
    }

    private fun notifyWeb(function: String, value: String) {
        runOnUiThread {
            val safe = value.replace("\\", "\\\\").replace("'", "\\'")
            webView.evaluateJavascript("window.$function && window.$function('$safe');", null)
        }
    }

    inner class LanaVoiceBridge {
        @JavascriptInterface
        fun isReady(): Boolean = ttsReady

        @JavascriptInterface
        fun speak(text: String): Boolean {
            val engine = tts ?: return false
            if (!ttsReady || text.isBlank()) return false
            runOnUiThread {
                engine.stop()
                engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "lana-${System.currentTimeMillis()}")
            }
            return true
        }

        @JavascriptInterface
        fun stop() {
            runOnUiThread { tts?.stop() }
        }

        @JavascriptInterface
        fun voiceName(): String = tts?.voice?.name ?: ""
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }
}
