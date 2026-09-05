package hr.vascharlie.lana

import android.annotation.SuppressLint
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import java.util.ArrayDeque
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var webView: WebView
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private val pendingSpeech = ArrayDeque<String>()
    private var speechSession = 0L
    private var activeUtteranceId: String? = null

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
<script>function greet(){const h=new Date().getHours();return h>=5&&h<12?'Dobro jutro':h>=12&&h<18?'Dobar dan':'Dobra večer'}function say(t){if(window.LanaNative&&LanaNative.isReady()){document.getElementById('status').textContent='Lana govori…';LanaNative.speak(t)}else document.getElementById('status').textContent='Hrvatski glas još nije spreman.'}window.nativeVoiceReady=function(v){document.getElementById('status').textContent='✓ Lana glas spreman: '+v}window.nativeVoiceSpeaking=function(){document.getElementById('status').textContent='Lana govori…'}window.nativeVoiceDone=function(){document.getElementById('status').textContent='✓ Poruka izgovorena do kraja'}window.nativeVoiceError=function(e){document.getElementById('status').textContent='✕ Glas nije dostupan: '+e}</script></body></html>
""".trimIndent()

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
            engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    if (utteranceId == activeUtteranceId) notifyWeb("nativeVoiceSpeaking", "")
                }

                override fun onDone(utteranceId: String?) {
                    if (utteranceId != activeUtteranceId) return
                    runOnUiThread {
                        if (pendingSpeech.isEmpty()) {
                            activeUtteranceId = null
                            notifyWeb("nativeVoiceDone", "")
                        } else {
                            speakNext(engine, speechSession)
                        }
                    }
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    if (utteranceId == activeUtteranceId) notifyWeb("nativeVoiceError", "TTS_SPEAK_ERROR")
                }

                override fun onError(utteranceId: String?, errorCode: Int) {
                    if (utteranceId == activeUtteranceId) notifyWeb("nativeVoiceError", "TTS_SPEAK_ERROR_$errorCode")
                }
            })
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

    private fun splitForSpeech(text: String): List<String> {
        val parts = text
            .trim()
            .split(Regex("(?<=[.!?])\\s+"))
            .map { it.trim() }
            .filter { it.isNotBlank() }
        return if (parts.isEmpty()) listOf(text.trim()) else parts
    }

    private fun speakNext(engine: TextToSpeech, session: Long) {
        if (session != speechSession || pendingSpeech.isEmpty()) return
        val chunk = pendingSpeech.removeFirst()
        val utteranceId = "lana-$session-${System.nanoTime()}"
        activeUtteranceId = utteranceId
        val result = engine.speak(chunk, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
        if (result == TextToSpeech.ERROR) {
            activeUtteranceId = null
            pendingSpeech.clear()
            notifyWeb("nativeVoiceError", "TTS_SPEAK_ERROR")
        }
    }

    inner class LanaVoiceBridge {
        @JavascriptInterface
        fun isReady(): Boolean = ttsReady

        @JavascriptInterface
        fun speak(text: String): Boolean {
            val engine = tts ?: return false
            if (!ttsReady || text.isBlank()) return false

            val chunks = splitForSpeech(text)
            runOnUiThread {
                speechSession += 1
                val session = speechSession
                pendingSpeech.clear()
                pendingSpeech.addAll(chunks)
                activeUtteranceId = null
                speakNext(engine, session)
            }
            return true
        }

        @JavascriptInterface
        fun stop() {
            runOnUiThread {
                speechSession += 1
                pendingSpeech.clear()
                activeUtteranceId = null
                tts?.stop()
                notifyWeb("nativeVoiceReady", tts?.voice?.name ?: "hr-HR")
            }
        }

        @JavascriptInterface
        fun voiceName(): String = tts?.voice?.name ?: ""
    }

    override fun onDestroy() {
        speechSession += 1
        pendingSpeech.clear()
        activeUtteranceId = null
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }
}
