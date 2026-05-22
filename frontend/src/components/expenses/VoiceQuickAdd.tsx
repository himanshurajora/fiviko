import { useRef, useState } from 'react';
import { useAiStatus, useParseExpense, type ParsedExpense } from '@/lib/ai';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * "Just say it" expense entry: speak (Web Speech API) or type a phrase like
 * "spent 12 on coffee", and AI parses it into the form fields. Hidden when the
 * server has no AI key. Speech capture is browser-native (free); only the parse
 * is a (small) AI call.
 */
export function VoiceQuickAdd({ onParsed }: { onParsed: (e: ParsedExpense) => void }) {
  const { data: aiStatus } = useAiStatus();
  const parse = useParseExpense();
  const [phrase, setPhrase] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const SR = getSpeechRecognition();

  if (!aiStatus?.enabled) return null;

  async function runParse(text: string) {
    const t = text.trim();
    if (t.length < 2) return;
    try {
      const result = await parse.mutateAsync(t);
      onParsed(result);
      notify.custom('Filled from your phrase ✨', { tone: 'success', icon: '✨', sound: 'pop' });
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not understand that'));
    }
  }

  function toggleMic() {
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? '';
      setPhrase(text);
      void runParse(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div className="mt-3 rounded-2xl bg-primary/5 p-3">
      <div className="flex items-center gap-2">
        {SR && (
          <button
            onClick={toggleMic}
            aria-label={listening ? 'Stop listening' : 'Speak your expense'}
            className={`focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg ${listening ? 'animate-pulse bg-danger text-white' : 'bg-primary text-white'}`}
          >
            🎤
          </button>
        )}
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runParse(phrase)}
          placeholder={SR ? 'Speak or type: “spent 12 on coffee”' : 'Type: “spent 12 on coffee”'}
          className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        />
        <button
          onClick={() => runParse(phrase)}
          disabled={parse.isPending}
          className="focus-ring shrink-0 rounded-2xl bg-secondary px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {parse.isPending ? '…' : '✨ Fill'}
        </button>
      </div>
      {listening && <p className="mt-1.5 text-center text-xs text-ink-soft">Listening… say what you spent</p>}
    </div>
  );
}
