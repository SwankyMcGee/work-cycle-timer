# ============================================================
#  generate-sensory-sounds.ps1
#  ------------------------------------------------------------
#  Creates the built-in sensory music loops in ../media.
#  All audio is synthesized from scratch (sines + filtered
#  noise) — 100% original, no licensing needed for school use.
#
#  The family is all "warm pad" styling, varying the instrument
#  timbre and the chord-change pace:
#    - Warm pad        the original, untouched
#    - Slow strings    bowed-string harmonics + gentle vibrato
#    - Soft organ      drawbar-style tone + slow tremolo
#    - Felt piano      soft struck chords ringing under pedal
#    - Breathing pulse pad + a quiet 69 BPM swell
#
#  Design rules came from autism sound research (see README):
#    - simple, predictable, repetitive (Kalas 2012)
#    - only I / IV / V chords, no chromatic notes
#    - instrumental only, no vocals, consonant (Michel 2024)
#    - slow, soft attack, no sudden loudness (hyperacusis work)
#
#  Every loop is mathematically seamless: frequencies are
#  snapped to whole cycles over the loop length and all
#  envelopes are periodic, so <audio loop> never clicks.
#
#  Run:  powershell -NoProfile -ExecutionPolicy Bypass -File generate-sensory-sounds.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

$cs = @'
using System;
using System.Collections.Generic;
using System.IO;

public static class SensorySynth
{
    const int SR = 44100;
    const double PI2 = Math.PI * 2.0;

    // Snap a frequency so it completes a whole number of cycles
    // over an n-sample loop -> the waveform repeats exactly.
    static double Snap(double f, int n)
    {
        double k = Math.Round(f * n / (double)SR);
        if (k < 1.0) k = 1.0;
        return k * (double)SR / n;
    }

    // Smoothstep: 0->1 with zero slope at both ends (no clicks).
    static double SS(double x)
    {
        if (x <= 0.0) return 0.0;
        if (x >= 1.0) return 1.0;
        return x * x * (3.0 - 2.0 * x);
    }

    static double Wrap(double x, double loop)
    {
        while (x < 0.0) x += loop;
        while (x >= loop) x -= loop;
        return x;
    }

    static void Normalize(float[] l, float[] r, double target)
    {
        double peak = 0.0;
        for (int i = 0; i < l.Length; i++)
        {
            double a = Math.Abs(l[i]);
            if (a > peak) peak = a;
            a = Math.Abs(r[i]);
            if (a > peak) peak = a;
        }
        if (peak < 1e-9) return;
        double g = target / peak;
        for (int i = 0; i < l.Length; i++)
        {
            l[i] = (float)(l[i] * g);
            r[i] = (float)(r[i] * g);
        }
    }

    public static void WriteWav(string path, float[] l, float[] r, int sr)
    {
        int n = l.Length;
        using (MemoryStream ms = new MemoryStream(44 + n * 4))
        using (BinaryWriter w = new BinaryWriter(ms))
        {
            w.Write((byte)'R'); w.Write((byte)'I'); w.Write((byte)'F'); w.Write((byte)'F');
            w.Write(36 + n * 4);
            w.Write((byte)'W'); w.Write((byte)'A'); w.Write((byte)'V'); w.Write((byte)'E');
            w.Write((byte)'f'); w.Write((byte)'m'); w.Write((byte)'t'); w.Write((byte)' ');
            w.Write(16);
            w.Write((short)1);      // PCM
            w.Write((short)2);      // stereo
            w.Write(sr);
            w.Write(sr * 4);        // byte rate
            w.Write((short)4);      // block align
            w.Write((short)16);     // bits per sample
            w.Write((byte)'d'); w.Write((byte)'a'); w.Write((byte)'t'); w.Write((byte)'a');
            w.Write(n * 4);
            for (int i = 0; i < n; i++)
            {
                w.Write(To16(l[i]));
                w.Write(To16(r[i]));
            }
            w.Flush();
            File.WriteAllBytes(path, ms.ToArray());
        }
    }

    static short To16(double v)
    {
        if (v > 1.0) v = 1.0;
        else if (v < -1.0) v = -1.0;
        return (short)Math.Round(v * 32767.0);
    }

    // ==========================================================
    //  THE ORIGINAL WARM PAD (unchanged — the one that was kept)
    //  F -> Bb -> C -> F, 32 s
    // ==========================================================
    static double EnvA(double t)
    {
        if (t < 7.0) return 1.0;
        if (t < 9.0) return 1.0 - SS((t - 7.0) / 2.0);
        if (t < 24.0) return 0.0;
        if (t < 26.0) return SS((t - 24.0) / 2.0);
        return 1.0;
    }

    static double EnvB(double t)
    {
        if (t < 7.0) return 0.0;
        if (t < 9.0) return SS((t - 7.0) / 2.0);
        if (t < 15.0) return 1.0;
        if (t < 17.0) return 1.0 - SS((t - 15.0) / 2.0);
        return 0.0;
    }

    static double EnvC(double t)
    {
        if (t < 15.0) return 0.0;
        if (t < 17.0) return SS((t - 15.0) / 2.0);
        if (t < 24.0) return 1.0;
        if (t < 26.0) return 1.0 - SS((t - 24.0) / 2.0);
        return 0.0;
    }

    static double EnvOf(int id, double t)
    {
        if (id == 0) return EnvA(t);
        if (id == 1) return EnvB(t);
        return EnvC(t);
    }

    class PadVoice
    {
        public double F, Amp, Pl, Pr, TremPh;
        public int TremK, EnvId;
        public PadVoice(double f, double amp, double pan, int tremK, double tremPh, int envId)
        {
            F = f; Amp = amp; TremK = tremK; TremPh = tremPh; EnvId = envId;
            Pl = Math.Sqrt((1.0 - pan) * 0.5);
            Pr = Math.Sqrt((1.0 + pan) * 0.5);
        }
    }

    public static void WarmPad(string path)
    {
        int loop = 32;
        int n = SR * loop;

        double[] fa = { 87.31, 130.81, 174.61, 220.00, 261.63 };   // F chord
        double[] fb = { 116.54, 174.61, 233.08, 293.66 };          // Bb chord
        double[] fc = { 130.81, 196.00, 261.63, 329.63 };          // C chord
        double[] aa = { 0.17, 0.13, 0.12, 0.11, 0.10 };
        double[] ab = { 0.16, 0.13, 0.12, 0.11 };
        double[] ac = { 0.16, 0.13, 0.12, 0.11 };
        double[] pa = { -0.5, 0.3, -0.3, 0.5, 0.0 };
        double[] pb = { -0.4, 0.4, -0.2, 0.2 };
        double[] pc = { -0.4, 0.4, -0.25, 0.25 };

        List<PadVoice> vs = new List<PadVoice>();
        for (int i = 0; i < fa.Length; i++)
            vs.Add(new PadVoice(Snap(fa[i], n), aa[i], pa[i], (i % 3 == 0) ? 4 : 2, i * 1.7, 0));
        for (int i = 0; i < fb.Length; i++)
            vs.Add(new PadVoice(Snap(fb[i], n), ab[i], pb[i], (i % 3 == 0) ? 4 : 2, i * 2.3 + 0.9, 1));
        for (int i = 0; i < fc.Length; i++)
            vs.Add(new PadVoice(Snap(fc[i], n), ac[i], pc[i], (i % 3 == 0) ? 4 : 2, i * 1.1 + 2.1, 2));

        float[] l = new float[n];
        float[] r = new float[n];

        for (int i = 0; i < n; i++)
        {
            double t = i / (double)SR;
            double sl = 0.0, sr = 0.0;
            for (int v = 0; v < vs.Count; v++)
            {
                PadVoice pv = vs[v];
                double e = EnvOf(pv.EnvId, t);
                if (e <= 0.0) continue;
                double tr = 0.88 + 0.12 * Math.Cos(PI2 * pv.TremK * t / loop + pv.TremPh);
                double g = pv.Amp * e * tr;
                double w = PI2 * pv.F;
                double s = Math.Sin(w * t)
                         + 0.30 * Math.Sin(2.0 * w * t)
                         + 0.10 * Math.Sin(3.0 * w * t);
                sl += s * g * pv.Pl;
                sr += s * g * pv.Pr;
            }
            l[i] = (float)sl;
            r[i] = (float)sr;
        }

        Normalize(l, r, 0.5);
        WriteWav(path, l, r, SR);
    }

    // ==========================================================
    //  GENERIC PAD ENGINE — the variations all use this
    // ==========================================================
    class GVoice
    {
        public int Chord;
        public double W;      // angular frequency (snapped)
        public double W2;     // detuned copy angular freq (0 = none)
        public double Amp, Amp2;
        public double Pl, Pr, P2l, P2r;
        public double Beta;   // vibrato modulation index
    }

    class PadOpts
    {
        public int Loop;
        public double[][] Chords;
        public double Xfade = 2.0;                    // chord crossfade seconds
        public double[] Harm = { 1.0, 0.30, 0.10 };   // harmonic recipe = timbre
        public double Strike = 0.0;                   // >0: struck (piano) attack seconds
        public double RingTau = 0.0;                  // struck: decay time constant
        public double VibHz = 0.0, VibCents = 0.0;    // vibrato
        public double TremHz = 0.0, TremDepth = 0.0;  // tremolo (organ spin)
        public double PulseBpm = 0.0, PulseDepth = 0.0; // slow breathing swell
        public double DetuneCents = 0.0;              // chorus width
    }

    // Chord crossfade envelope: fade in over [wk, wk+x],
    // full until the next chord's window, fade out there.
    // Everything is evaluated modulo the loop, so the seam is
    // handled exactly like any other moment.
    static double ChordEnv(double t, double wk, double wnext, double x, double loop)
    {
        double de = Wrap(t - wk, loop);
        if (de < x) return SS(de / x);
        double dl = Wrap(t - wnext, loop);
        if (dl < x) return 1.0 - SS(dl / x);
        double df = Wrap(t - (wk + x), loop);
        double span = Wrap(wnext - (wk + x), loop);
        return df < span ? 1.0 : 0.0;
    }

    static void Pad(string path, PadOpts o)
    {
        int loop = o.Loop;
        int n = SR * loop;
        int nc = o.Chords.Length;
        double spacing = (double)loop / nc;
        float[] l = new float[n];
        float[] r = new float[n];

        double[] panCycle = { 0.0, -0.42, 0.42, -0.22, 0.22, -0.32, 0.32 };
        int vibk = (int)Math.Round(o.VibHz * loop);
        if (o.VibHz > 0.0 && vibk < 1) vibk = 1;

        List<GVoice> vs = new List<GVoice>();
        for (int c = 0; c < nc; c++)
        {
            double[] ch = o.Chords[c];
            for (int m = 0; m < ch.Length; m++)
            {
                double f = Snap(ch[m], n);
                double amp = (m == 0) ? 0.17 : Math.Max(0.07, 0.14 - 0.012 * m);
                double pan = panCycle[m % panCycle.Length];
                GVoice v = new GVoice();
                v.Chord = c;
                v.W = PI2 * f;
                v.Amp = amp;
                v.Pl = Math.Sqrt((1.0 - pan) * 0.5);
                v.Pr = Math.Sqrt((1.0 + pan) * 0.5);
                if (o.DetuneCents > 0.0)
                {
                    double f2 = Snap(f * Math.Pow(2.0, o.DetuneCents / 1200.0), n);
                    v.W2 = PI2 * f2;
                    v.Amp2 = amp * 0.7;
                    double pan2 = -pan;
                    v.P2l = Math.Sqrt((1.0 - pan2) * 0.5);
                    v.P2r = Math.Sqrt((1.0 + pan2) * 0.5);
                }
                if (o.VibHz > 0.0 && o.VibCents > 0.0)
                {
                    double df = f * (Math.Pow(2.0, o.VibCents / 1200.0) - 1.0);
                    v.Beta = df * loop / vibk;
                }
                vs.Add(v);
            }
        }

        double tremk = Math.Round(o.TremHz * loop);
        double pk = Math.Round(o.PulseBpm / 60.0 * loop);
        double[] harm = o.Harm;
        int harmN = harm.Length;
        double[] env = new double[nc];

        for (int i = 0; i < n; i++)
        {
            double t = i / (double)SR;

            for (int c = 0; c < nc; c++)
            {
                if (o.Strike > 0.0)
                {
                    double tt = Wrap(t - c * spacing, loop);
                    if (tt < o.Strike) env[c] = SS(tt / o.Strike);
                    else env[c] = Math.Exp(-(tt - o.Strike) / o.RingTau);
                }
                else
                {
                    env[c] = ChordEnv(t, c * spacing, ((c + 1) % nc) * spacing, o.Xfade, loop);
                }
            }

            double mod = 1.0;
            if (o.TremHz > 0.0 && o.TremDepth > 0.0)
                mod *= 1.0 - o.TremDepth + o.TremDepth * (0.5 + 0.5 * Math.Sin(PI2 * tremk * t / loop));
            if (o.PulseBpm > 0.0 && o.PulseDepth > 0.0)
            {
                double s = 0.5 + 0.5 * Math.Sin(PI2 * pk * t / loop - Math.PI / 2.0);
                mod *= 1.0 - o.PulseDepth + o.PulseDepth * Math.Pow(s, 1.6);
            }

            double sl = 0.0, sr = 0.0;
            for (int vi = 0; vi < vs.Count; vi++)
            {
                GVoice v = vs[vi];
                double e = env[v.Chord] * mod;
                if (e <= 0.0) continue;
                double vph = (v.Beta > 0.0) ? v.Beta * Math.Sin(PI2 * vibk * t / loop) : 0.0;
                double w = v.W;
                double s = 0.0;
                for (int h = 0; h < harmN; h++)
                    s += harm[h] * Math.Sin((h + 1) * (w * t + vph));
                s *= v.Amp * e;
                sl += s * v.Pl;
                sr += s * v.Pr;
                if (v.W2 > 0.0)
                {
                    double s2 = 0.0;
                    for (int h = 0; h < harmN; h++)
                        s2 += harm[h] * Math.Sin((h + 1) * v.W2 * t);
                    s2 *= v.Amp2 * e;
                    sl += s2 * v.P2l;
                    sr += s2 * v.P2r;
                }
            }
            l[i] = (float)sl;
            r[i] = (float)sr;
        }

        Normalize(l, r, 0.5);
        WriteWav(path, l, r, SR);
    }

    // ----------------------------------------------------------
    // 1. Warm pad — slow strings (36 s, chord change every 9 s)
    //    Bowed-string harmonics with a gentle 5.4 Hz vibrato and
    //    chorus width. The slowest of the family.
    //    F - C - Bb - C  (I - V - IV - V), resolves F at the seam
    // ----------------------------------------------------------
    public static void StringsPad(string path)
    {
        Pad(path, new PadOpts
        {
            Loop = 36,
            Chords = new double[][] {
                new double[] { 174.61, 220.00, 261.63, 349.23 },  // F
                new double[] { 196.00, 261.63, 329.63, 392.00 },  // C
                new double[] { 174.61, 233.08, 293.66, 349.23 },  // Bb
                new double[] { 196.00, 261.63, 329.63, 392.00 }   // C
            },
            Xfade = 2.5,
            Harm = new double[] { 1.0, 0.55, 0.40, 0.30, 0.22, 0.16, 0.12, 0.09, 0.06, 0.045, 0.03 },
            VibHz = 5.4,
            VibCents = 6.0,
            DetuneCents = 7.0
        });
    }

    // ----------------------------------------------------------
    // 2. Warm pad — soft organ (24 s, chord change every 6 s)
    //    Drawbar-style tone with a slow Leslie-ish tremolo.
    //    The quickest chord pace of the family.
    //    C - G - F - G  (I - V - IV - V), resolves C at the seam
    // ----------------------------------------------------------
    public static void OrganPad(string path)
    {
        Pad(path, new PadOpts
        {
            Loop = 24,
            Chords = new double[][] {
                new double[] { 130.81, 164.81, 196.00, 261.63 },  // C
                new double[] { 98.00, 146.83, 196.00, 246.94 },   // G
                new double[] { 87.31, 174.61, 220.00, 261.63 },   // F
                new double[] { 98.00, 146.83, 196.00, 246.94 }    // G
            },
            Xfade = 2.0,
            Harm = new double[] { 1.0, 0.65, 0.45, 0.30, 0.25, 0.16, 0.12 },
            TremHz = 4.6,
            TremDepth = 0.16,
            DetuneCents = 4.0
        });
    }

    // ----------------------------------------------------------
    // 3. Warm pad — felt piano (32 s, struck every 8 s)
    //    Soft struck chords that ring out and overlap like the
    //    sustain pedal is down — gentle accents give the pulse.
    //    G - C - D - C  (I - IV - V - IV), resolves G at the seam
    // ----------------------------------------------------------
    public static void PianoPad(string path)
    {
        int loop = 32;
        Pad(path, new PadOpts
        {
            Loop = loop,
            Chords = new double[][] {
                new double[] { 98.00, 146.83, 196.00, 246.94 },   // G
                new double[] { 130.81, 196.00, 261.63, 329.63 },  // C
                new double[] { 146.83, 220.00, 293.66, 369.99 },  // D
                new double[] { 130.81, 196.00, 261.63, 329.63 }   // C
            },
            Harm = new double[] { 1.0, 0.60, 0.45, 0.35, 0.25, 0.18, 0.13, 0.09, 0.065, 0.045 },
            Strike = 0.09,                 // slow felt-hammer attack
            RingTau = loop / 6.0,          // decayed to <0.3% before its own restrike
            DetuneCents = 3.0
        });
    }

    // ----------------------------------------------------------
    // 4. Warm pad — breathing pulse (32 s, chord change every 8 s)
    //    Same pure tone as the original pad, with a quiet 69 BPM
    //    swell for a gentle sense of tempo — no percussion.
    //    F - Bb - C - Bb  (I - IV - V - IV), resolves F at the seam
    // ----------------------------------------------------------
    public static void PulsePad(string path)
    {
        Pad(path, new PadOpts
        {
            Loop = 32,
            Chords = new double[][] {
                new double[] { 87.31, 174.61, 261.63, 349.23 },   // F
                new double[] { 116.54, 233.08, 293.66, 349.23 },  // Bb
                new double[] { 130.81, 196.00, 261.63, 329.63 },  // C
                new double[] { 116.54, 233.08, 293.66, 349.23 }   // Bb
            },
            Xfade = 2.0,
            Harm = new double[] { 1.0, 0.30, 0.12 },
            PulseBpm = 69.0,
            PulseDepth = 0.10,
            DetuneCents = 6.0
        });
    }
}
'@

Add-Type -TypeDefinition $cs

$mediaDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'media'
if (-not (Test-Path $mediaDir)) { New-Item -ItemType Directory -Path $mediaDir | Out-Null }

# Retired tracks (the ones that were cut)
foreach ($f in 'sensory-bells.wav', 'sensory-drone.wav', 'sensory-rain.wav') {
    $p = Join-Path $mediaDir $f
    if (Test-Path $p) {
        Remove-Item $p -Force
        Write-Host "  removed $f"
    }
}

Write-Host 'Generating pad family...'
[SensorySynth]::WarmPad((Join-Path $mediaDir 'sensory-warm-pad.wav'))
Write-Host '  warm pad done'
[SensorySynth]::StringsPad((Join-Path $mediaDir 'sensory-strings.wav'))
Write-Host '  slow strings done'
[SensorySynth]::OrganPad((Join-Path $mediaDir 'sensory-organ.wav'))
Write-Host '  soft organ done'
[SensorySynth]::PianoPad((Join-Path $mediaDir 'sensory-piano.wav'))
Write-Host '  felt piano done'
[SensorySynth]::PulsePad((Join-Path $mediaDir 'sensory-pulse.wav'))
Write-Host '  breathing pulse done'

Get-ChildItem (Join-Path $mediaDir 'sensory-*.wav') |
    ForEach-Object { Write-Host ('  {0}  {1:N0} KB' -f $_.Name, ($_.Length / 1KB)) }

Write-Host 'Done.'
