package hr.vascharlie.lanaclean;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.File;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {

    private TextToSpeech tts;
    private boolean ttsReady = false;
    private TextView status;
    private TextView detail;
    private final ArrayDeque<String> speechQueue = new ArrayDeque<>();
    private MediaPlayer player;
    private long session = 0;
    private File activeFile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildUi();
        status.setText("Pokrećem hrvatski glas…");
        tts = new TextToSpeech(this, this);
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(28), dp(24), dp(28), dp(24));
        root.setBackgroundColor(Color.rgb(5, 8, 22));

        TextView title = new TextView(this);
        title.setText("LANA");
        title.setTextColor(Color.WHITE);
        title.setTextSize(42);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        root.addView(title, new LinearLayout.LayoutParams(-1, -2));

        TextView subtitle = new TextView(this);
        subtitle.setText("VAŠ CHARLIE  •  CLEAN v2");
        subtitle.setTextColor(Color.rgb(164, 176, 205));
        subtitle.setTextSize(15);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(-1, -2);
        subLp.setMargins(0, dp(6), 0, dp(24));
        root.addView(subtitle, subLp);

        status = new TextView(this);
        status.setTextColor(Color.WHITE);
        status.setTextSize(20);
        status.setGravity(Gravity.CENTER);
        status.setPadding(dp(18), dp(14), dp(18), dp(14));
        root.addView(status, new LinearLayout.LayoutParams(-1, -2));

        detail = new TextView(this);
        detail.setTextColor(Color.rgb(142, 155, 184));
        detail.setTextSize(13);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(dp(10), dp(8), dp(10), dp(18));
        root.addView(detail, new LinearLayout.LayoutParams(-1, -2));

        Button greet = makeButton("POZDRAVI");
        greet.setOnClickListener(v -> startGreeting());
        LinearLayout.LayoutParams buttonLp = new LinearLayout.LayoutParams(-1, dp(64));
        buttonLp.setMargins(0, dp(8), 0, dp(12));
        root.addView(greet, buttonLp);

        Button stop = makeButton("STOP");
        stop.setBackgroundColor(Color.rgb(48, 55, 74));
        stop.setOnClickListener(v -> stopEverything());
        root.addView(stop, new LinearLayout.LayoutParams(-1, dp(56)));

        setContentView(root);
    }

    private Button makeButton(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(20);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackgroundColor(Color.rgb(40, 102, 255));
        b.setAllCaps(false);
        return b;
    }

    @Override
    public void onInit(int result) {
        if (result != TextToSpeech.SUCCESS) {
            status.setText("✕ TTS se nije pokrenuo");
            detail.setText("TTS_INIT_FAILED");
            return;
        }

        Locale hr = new Locale("hr", "HR");
        int languageResult = tts.setLanguage(hr);
        if (languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            status.setText("✕ Hrvatski glas nije dostupan");
            detail.setText("HR_VOICE_NOT_AVAILABLE");
            return;
        }

        Voice selected = chooseCroatianVoice(tts.getVoices());
        if (selected != null) tts.setVoice(selected);
        tts.setSpeechRate(0.96f);
        tts.setPitch(1.01f);

        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                runOnUiThread(() -> status.setText("Lana priprema glas…"));
            }

            @Override
            public void onDone(String utteranceId) {
                long callbackSession = parseSession(utteranceId);
                if (callbackSession != session) return;
                runOnUiThread(() -> playActiveFile(callbackSession));
            }

            @Override
            @SuppressWarnings("deprecation")
            public void onError(String utteranceId) {
                runOnUiThread(() -> showError("TTS_SYNTHESIS_ERROR"));
            }

            @Override
            public void onError(String utteranceId, int errorCode) {
                runOnUiThread(() -> showError("TTS_ERROR_" + errorCode));
            }
        });

        ttsReady = true;
        Voice voice = tts.getVoice();
        status.setText("✓ Lana je spremna");
        detail.setText(voice == null ? "hr-HR" : "Glas: " + voice.getName() + " • kvaliteta " + voice.getQuality() + (voice.isNetworkConnectionRequired() ? " • mrežni" : " • lokalni"));
    }

    private Voice chooseCroatianVoice(Set<Voice> voices) {
        if (voices == null) return null;
        List<Voice> candidates = new ArrayList<>();
        for (Voice voice : voices) {
            if (voice.getLocale() != null && "hr".equalsIgnoreCase(voice.getLocale().getLanguage())) {
                candidates.add(voice);
            }
        }
        candidates.sort(Comparator
                .comparingInt(Voice::getQuality).reversed()
                .thenComparing(Voice::isNetworkConnectionRequired)
                .thenComparing(Voice::getName));
        return candidates.isEmpty() ? null : candidates.get(0);
    }

    private void startGreeting() {
        if (!ttsReady) {
            status.setText("Hrvatski glas još nije spreman.");
            return;
        }

        stopEverythingInternal(false);
        session++;
        speechQueue.clear();

        // Namjerno režemo samo na prirodnim granicama rečenica.
        // Nema više rezanja svaka 4 slova/riječi usred fraze.
        speechQueue.add(timeGreeting() + " i dobrodošli.");
        speechQueue.add("Hvala vam što ste odabrali Vaš Čarli.");
        speechQueue.add("Želim vam ugodnu vožnju.");

        status.setText("Lana priprema prirodan pozdrav…");
        synthesizeNext(session);
    }

    private String timeGreeting() {
        int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
        if (hour >= 5 && hour < 12) return "Dobro jutro";
        if (hour >= 12 && hour < 18) return "Dobar dan";
        return "Dobra večer";
    }

    private void synthesizeNext(long expectedSession) {
        if (expectedSession != session) return;
        if (speechQueue.isEmpty()) {
            status.setText("✓ Pozdrav izgovoren do kraja");
            return;
        }

        String sentence = speechQueue.removeFirst();
        activeFile = new File(getCacheDir(), "lana_" + expectedSession + "_" + System.nanoTime() + ".wav");
        Bundle params = new Bundle();
        String utteranceId = "lana:" + expectedSession + ":" + System.nanoTime();
        int result = tts.synthesizeToFile(sentence, params, activeFile, utteranceId);
        if (result == TextToSpeech.ERROR) showError("SYNTHESIZE_TO_FILE_FAILED");
    }

    private void playActiveFile(long expectedSession) {
        if (expectedSession != session || activeFile == null || !activeFile.exists()) return;
        releasePlayer();
        try {
            player = new MediaPlayer();
            player.setDataSource(activeFile.getAbsolutePath());
            player.setOnPreparedListener(mp -> {
                if (expectedSession != session) return;
                status.setText("Lana govori…");
                mp.start();
            });
            player.setOnCompletionListener(mp -> {
                File finished = activeFile;
                releasePlayer();
                if (finished != null) finished.delete();
                activeFile = null;
                if (expectedSession == session) synthesizeNext(expectedSession);
            });
            player.setOnErrorListener((mp, what, extra) -> {
                showError("AUDIO_PLAYBACK_" + what + "_" + extra);
                return true;
            });
            player.prepareAsync();
        } catch (Exception e) {
            showError("AUDIO_EXCEPTION_" + e.getClass().getSimpleName());
        }
    }

    private long parseSession(String utteranceId) {
        try {
            String[] parts = utteranceId.split(":");
            return Long.parseLong(parts[1]);
        } catch (Exception e) {
            return -1;
        }
    }

    private void showError(String code) {
        status.setText("✕ Govor nije dovršen");
        detail.setText(code + " • " + currentVoiceLabel());
        speechQueue.clear();
        releasePlayer();
    }

    private String currentVoiceLabel() {
        Voice voice = tts == null ? null : tts.getVoice();
        return voice == null ? "bez glasa" : voice.getName();
    }

    private void stopEverything() {
        stopEverythingInternal(true);
        status.setText(ttsReady ? "✓ Lana je spremna" : "Govor zaustavljen");
    }

    private void stopEverythingInternal(boolean incrementSession) {
        if (incrementSession) session++;
        speechQueue.clear();
        if (tts != null) tts.stop();
        releasePlayer();
        if (activeFile != null) {
            activeFile.delete();
            activeFile = null;
        }
    }

    private void releasePlayer() {
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            try { player.reset(); } catch (Exception ignored) {}
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onDestroy() {
        session++;
        speechQueue.clear();
        releasePlayer();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
