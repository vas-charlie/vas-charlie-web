package hr.vascharlie.lana

import android.annotation.SuppressLint
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.webkit.JavascriptInterface
import android.webkit.WebView
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
        webView.addJavascriptInterface(LanaVoiceBridge(), "LanaNative")
        webView.loadDataWithBaseURL(null, localPage(), "text/html", "UTF-8", null)
    }

    private fun localPage(): String = """
<!doctype html><html lang='hr'><head><meta name='viewport' content='width=device-width,initial-scale=1'>
<style>body{margin:0;background:#070b16;color:white;font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center}.box{width:min(900px,92vw);text-align:center}h1{font-size:44px;margin:0 0 8px}.sub{color:#aab4ca;margin-bottom:28px}.status{padding:14px;border:1px solid #28334b;border-radius:14px;margin:18px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}button{font-size:22px;padding:20px;border:0;border-radius:14px;background:#1769ff;color:white;font-weight:700}.stop{background:#343b4d}@media(max-width:650px){h1{font-size:32px}button{font-size:18px;padding:16px}}</style></head>
<body><div class='box'><h1>LANA</h1><div class='sub'>VAŠ CHARLIE • native voice test</div><div id='status' class='status'>Pokrećem hrvatski glas…</div><div class='grid'><button onclick='say(greet()+" i dobrodošli. Hvala vam što ste odabrali VAŠ CHARLIE. Želim vam ugodnu vožnju.")'>Pozdravi</button><button onclick='say(greet()+". Smjestite se udobno. Ako vam nešto zatreba tijekom vožnje, slobodno recite. Želim vam ugodnu vožnju.")'>Topli pozdrav</button><button onclick='say(greet()+" i dobrodošli ponovno. Drago mi je što ste opet s VAŠ CHARLIE. Želim vam ugodnu vožnju.")'>Stalni klijent</button><button onclick='say("Hvala vam na vožnji i povjerenju. Ako želite, nakon vožnje slobodno ostavite iskrenu recenziju. Želim vam sretan nastavak dana.")'>Hvala / doviđenja</button><button class='stop' onclick='LanaNative.stop()'>Stop</button></div></div>
<script>function greet(){const h=new Date().getHours();return h>=5&&h<12?'Dobro jutro':h>=12&&h<18?'Dobar dan':'Dobra večer'}function say(t){if(window.LanaNative&&LanaNative.isReady()){LanaNative.speak(t)}else document.getElementById('status').textContent='Hrvatski glas još nije spreman.'}window.nativeVoiceReady=function(v){document.getElementById('status').textContent='✓ Lana glas spreman: '+v}window.nativeVoiceError=function(e){document.getElementById('status').textContent='✕ Glas nije dostupan: '+e}</script></body></html>
""".trimIndent()

    override fun onInit(status: Int) {
        if (status != TextToSpeech.SUCCESS) { ttsReady = false; notifyWeb("nativeVoiceError", "TTS_INIT_FAILED"); return }
        val engine = tts ?: return
        val hr = Locale("hr", "HR")
        val result = engine.setLanguage(hr)
        ttsReady = result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED
        if (ttsReady) {
            val candidates = engine.voices?.filter { it.locale.language == "hr" }?.sortedWith(compareBy<Voice> { it.isNetworkConnectionRequired }.thenBy { it.name }) ?: emptyList()
            val offline = candidates.firstOrNull { !it.isNetworkConnectionRequired }
            if (offline != null) engine.voice = offline
            engine.setSpeechRate(0.92f); engine.setPitch(1.02f)
            notifyWeb("nativeVoiceReady", engine.voice?.name ?: "hr-HR")
        } else notifyWeb("nativeVoiceError", "HR_VOICE_NOT_AVAILABLE")
    }

    private fun notifyWeb(function: String, value: String) { runOnUiThread { val safe=value.replace("\\","\\\\").replace("'","\\'"); webView.evaluateJavascript("window.$function && window.$function('$safe');", null) } }

    inner class LanaVoiceBridge {
        @JavascriptInterface fun isReady(): Boolean = ttsReady
        @JavascriptInterface fun speak(text: String): Boolean { val engine=tts?:return false; if(!ttsReady||text.isBlank()) return false; runOnUiThread { engine.stop(); engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "lana-${System.currentTimeMillis()}") }; return true }
        @JavascriptInterface fun stop() { runOnUiThread { tts?.stop() } }
        @JavascriptInterface fun voiceName(): String = tts?.voice?.name ?: ""
    }
    override fun onDestroy() { tts?.stop(); tts?.shutdown(); super.onDestroy() }
}
