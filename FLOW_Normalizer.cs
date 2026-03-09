using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows.Forms;

class FLOW_Normalizer
{
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private static readonly LowLevelKeyboardProc Proc = HookCallback;
    private static IntPtr hookId = IntPtr.Zero;
    private static NotifyIcon trayIcon;
    private static bool nodeAvailable;

    private static Dictionary<string, string> exceptions = new();
    private static List<ContextRule> contextRules = new();

    private static readonly string appDir = AppDomain.CurrentDomain.BaseDirectory;
    private static readonly string rulesPath = Path.Combine(appDir, "flow_rules.json");
    private static readonly string startupLogPath = Path.Combine(appDir, "flow_startup.log");
    private static readonly string cliPath = Path.Combine(appDir, "loom_cli.js");
    private static readonly string pipelinePath = Path.Combine(appDir, "pipeline.js");

    [Serializable]
    class ContextRule
    {
        public string Trigger { get; set; }
        public string Replace { get; set; }
    }

    class RulesFile
    {
        public Dictionary<string, string> exceptions { get; set; } = new();
        public List<ContextRule> contextRules { get; set; } = new();
    }

    private static void Log(string message)
    {
        var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
        File.AppendAllText(startupLogPath, line);
    }

    private static void LoadRules()
    {
        if (!File.Exists(rulesPath))
        {
            exceptions = new Dictionary<string, string>();
            contextRules = new List<ContextRule>();
            return;
        }

        try
        {
            var rules = JsonSerializer.Deserialize<RulesFile>(File.ReadAllText(rulesPath));
            exceptions = rules?.exceptions ?? new Dictionary<string, string>();
            contextRules = rules?.contextRules ?? new List<ContextRule>();
        }
        catch (Exception ex)
        {
            Log($"LoadRules failed: {ex.Message}");
            exceptions = new Dictionary<string, string>();
            contextRules = new List<ContextRule>();
        }
    }

    private static void SaveRules()
    {
        var rules = new RulesFile
        {
            exceptions = exceptions,
            contextRules = contextRules,
        };

        File.WriteAllText(rulesPath, JsonSerializer.Serialize(rules, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static bool IsNodeAvailable()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("-v");

        try
        {
            using var process = Process.Start(startInfo);
            if (process == null)
            {
                Log("Node check failed: process start returned null.");
                return false;
            }

            var output = process.StandardOutput.ReadToEnd().Trim();
            var stderr = process.StandardError.ReadToEnd().Trim();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                Log($"Node check failed: exit={process.ExitCode}, stderr={stderr}");
                return false;
            }

            Log($"Node check ok: {output}");
            return true;
        }
        catch (Exception ex)
        {
            Log($"Node check exception: {ex.Message}");
            return false;
        }
    }

    private static bool IsForegroundAppWritable()
    {
        try
        {
            return GetForegroundWindow() != IntPtr.Zero;
        }
        catch
        {
            return false;
        }
    }

    private static void RunStartupSelfCheck()
    {
        nodeAvailable = IsNodeAvailable();
        var cliExists = File.Exists(cliPath);
        var pipelineExists = File.Exists(pipelinePath);
        var foregroundOk = IsForegroundAppWritable();

        Log($"SelfCheck: cliExists={cliExists}, pipelineExists={pipelineExists}, foregroundOk={foregroundOk}");

        var issues = new List<string>();
        if (!nodeAvailable) issues.Add("node.exe nicht gefunden (PATH prüfen)");
        if (!cliExists) issues.Add("loom_cli.js fehlt im EXE-Ordner");
        if (!pipelineExists) issues.Add("pipeline.js fehlt im EXE-Ordner");
        if (!foregroundOk) issues.Add("Foreground-Window nicht verfügbar");

        if (issues.Count == 0)
        {
            trayIcon.ShowBalloonTip(4000, "FLOW bereit", "Hook + Node + Dateien ok.", ToolTipIcon.Info);
            Log("SelfCheck: READY");
            return;
        }

        var summary = string.Join("; ", issues);
        trayIcon.ShowBalloonTip(8000, "FLOW Diagnose", summary, ToolTipIcon.Warning);
        Log($"SelfCheck: ISSUES => {summary}");
    }

    private static string Normalize(string text)
    {
        var source = (text ?? string.Empty).Trim();
        var key = source.ToLowerInvariant();

        if (exceptions.TryGetValue(key, out var exception))
            return exception;

        foreach (var rule in contextRules)
        {
            if (!string.IsNullOrWhiteSpace(rule?.Trigger)
                && key.Contains(rule.Trigger.ToLowerInvariant()))
                return rule.Replace ?? source;
        }

        if (!nodeAvailable || !File.Exists(cliPath) || !File.Exists(pipelinePath))
            return source;

        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = appDir,
        };

        startInfo.ArgumentList.Add("loom_cli.js");
        startInfo.ArgumentList.Add(source);

        try
        {
            using var process = Process.Start(startInfo);
            if (process == null)
            {
                Log("Normalize failed: node process could not start.");
                return source;
            }

            var output = process.StandardOutput.ReadToEnd().Trim();
            var stderr = process.StandardError.ReadToEnd().Trim();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                Log($"Normalize failed: exit={process.ExitCode}, stderr={stderr}");
                return source;
            }

            return string.IsNullOrEmpty(output) ? source : output;
        }
        catch (Exception ex)
        {
            Log($"Normalize exception: {ex.Message}");
            return source;
        }
    }

    private static void AskToLearn(string original, string corrected)
    {
        var result = MessageBox.Show(
            $"Flow hat \"{original}\" zu \"{corrected}\" korrigiert.\n\n" +
            "Ja = Als Ausnahme merken\n" +
            "Nein = Als Kontext-Regel merken\n" +
            "Abbrechen = Nicht speichern",
            "Flow lernen",
            MessageBoxButtons.YesNoCancel,
            MessageBoxIcon.Question
        );

        if (result == DialogResult.Yes)
        {
            exceptions[original.ToLowerInvariant()] = corrected;
            SaveRules();
        }
        else if (result == DialogResult.No)
        {
            contextRules.Add(new ContextRule { Trigger = original, Replace = corrected });
            SaveRules();
        }
    }

    private static string CaptureCurrentWord()
    {
        try
        {
            SendKeys.SendWait("^+{LEFT}");
            SendKeys.SendWait("^c");
            Application.DoEvents();
            return Clipboard.ContainsText() ? Clipboard.GetText().Trim() : string.Empty;
        }
        catch (Exception ex)
        {
            Log($"CaptureCurrentWord failed: {ex.Message}");
            return string.Empty;
        }
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
        {
            var key = (Keys)Marshal.ReadInt32(lParam);
            if (key is Keys.Space or Keys.Return or Keys.OemPeriod)
            {
                var word = CaptureCurrentWord();
                if (!string.IsNullOrEmpty(word))
                {
                    var corrected = Normalize(word);
                    if (!string.Equals(corrected, word, StringComparison.Ordinal))
                    {
                        SendKeys.SendWait("{BACKSPACE " + word.Length + "}");
                        SendKeys.SendWait(corrected);
                        AskToLearn(word, corrected);
                    }
                }
            }
        }

        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }

    private static Icon ResolveTrayIcon()
    {
        var iconPath = Path.Combine(appDir, "flow_logo.ico");
        if (File.Exists(iconPath))
            return new Icon(iconPath);

        Log("flow_logo.ico not found, using SystemIcons.Application.");
        return SystemIcons.Application;
    }

    [STAThread]
    static void Main()
    {
        try
        {
            Log("FLOW_Normalizer starting.");
            LoadRules();

            trayIcon = new NotifyIcon
            {
                Icon = ResolveTrayIcon(),
                Visible = true,
                Text = "FLOW Normalizer – aktiv",
            };

            var menu = new ContextMenuStrip();
            menu.Items.Add("Diagnose erneut prüfen", null, (s, e) => RunStartupSelfCheck());
            menu.Items.Add("Regeln bearbeiten (flow_rules.json)", null, (s, e) => Process.Start("notepad.exe", rulesPath));
            menu.Items.Add("Log öffnen (flow_startup.log)", null, (s, e) => Process.Start("notepad.exe", startupLogPath));
            menu.Items.Add("Beenden", null, (s, e) => Application.Exit());
            trayIcon.ContextMenuStrip = menu;

            hookId = SetWindowsHookEx(WH_KEYBOARD_LL, Proc, IntPtr.Zero, 0);
            if (hookId == IntPtr.Zero)
            {
                var errorCode = Marshal.GetLastWin32Error();
                Log($"SetWindowsHookEx failed with Win32 error {errorCode}.");
                MessageBox.Show($"Hook konnte nicht gestartet werden (Error {errorCode}).", "FLOW", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            else
            {
                Log("Keyboard hook installed.");
            }

            RunStartupSelfCheck();
            Application.Run();

            if (hookId != IntPtr.Zero)
                UnhookWindowsHookEx(hookId);

            trayIcon.Visible = false;
            Log("FLOW_Normalizer stopped.");
        }
        catch (Exception ex)
        {
            Log($"Fatal startup error: {ex}");
            MessageBox.Show(ex.Message, "FLOW fatal error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
}
