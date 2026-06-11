/**
 * speech — Petits wrappers autour des Web Speech APIs du navigateur.
 *
 * - Reconnaissance vocale (Speech-to-Text) : SpeechRecognition / webkit.
 * - Synthèse vocale (Text-to-Speech) : speechSynthesis.
 *
 * Ces APIs ne sont pas disponibles partout (surtout la reconnaissance, plutôt
 * Chrome / Edge desktop & Android). Le module expose des détecteurs de support
 * pour permettre un repli (saisie au clavier) côté UI.
 */

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

/** La reconnaissance vocale est-elle disponible ? */
export function isRecognitionSupported() {
  return !!SR;
}

/** La synthèse vocale est-elle disponible ? */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Crée un module de reconnaissance vocale en français.
 * @param {object} cb
 * @param {(text:string, isFinal:boolean)=>void} [cb.onResult] - transcript cumulé (final) + interim
 * @param {(err:string)=>void} [cb.onError]
 * @param {()=>void} [cb.onEnd]
 * @returns {{ start:()=>void, stop:()=>void, abort:()=>void, supported:boolean }}
 */
export function createRecognizer({ onResult, onError, onEnd } = {}) {
  if (!SR) {
    return { start() {}, stop() {}, abort() {}, supported: false };
  }

  const rec = new SR();
  rec.lang = 'fr-FR';
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;

  let finalText = '';
  let stopped = false;

  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onResult?.((finalText + interim).trim(), interim === '');
  };

  rec.onerror = (e) => { onError?.(e?.error || 'speech-error'); };

  rec.onend = () => {
    // Certains navigateurs coupent l'écoute toute seule : on relance tant que
    // l'utilisateur n'a pas explicitement arrêté.
    if (!stopped) {
      try { rec.start(); return; } catch { /* ignore */ }
    }
    onEnd?.();
  };

  return {
    supported: true,
    start() { stopped = false; finalText = ''; try { rec.start(); } catch { /* already started */ } },
    stop()  { stopped = true; try { rec.stop(); } catch { /* ignore */ } },
    abort() { stopped = true; try { rec.abort(); } catch { /* ignore */ } },
  };
}

/** Lit un texte à voix haute (français), si supporté. No-op sinon. */
export function speak(text, { rate = 1, pitch = 1 } = {}) {
  if (!isSpeechSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'fr-FR';
    u.rate = rate;
    u.pitch = pitch;
    const frVoice = window.speechSynthesis.getVoices().find((v) => /fr/i.test(v.lang));
    if (frVoice) u.voice = frVoice;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

/** Coupe toute lecture vocale en cours. */
export function stopSpeaking() {
  if (isSpeechSupported()) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
}
