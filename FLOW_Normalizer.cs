using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

class FLOW_Normalizer
{
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;

    private static readonly LowLevelKeyboardProc Proc = HookCallback;
    private static IntPtr hookId = IntPtr.Zero;
    private static NotifyIcon trayIcon;
    private static bool nodeAvailable;
    private static bool isInjectingKeys;
    private static long suppressUntilTick;
    private static string currentLanguage = "de";

    private static Dictionary<string, string> exceptions = new();
    private static List<ContextRule> contextRules = new();

    private static readonly string appDir = AppDomain.CurrentDomain.BaseDirectory;
    private static readonly string rulesPath = Path.Combine(appDir, "flow_rules.json");
    private static readonly string startupLogPath = Path.Combine(appDir, "flow_startup.log");
    private static readonly string cliPath = Path.Combine(appDir, "loom_cli.js");
    private static readonly string pipelinePath = Path.Combine(appDir, "pipeline.js");
    private static readonly string splashDarkPath = Path.Combine(appDir, "FLOW_SPLASH_DARK.png");
    private static readonly string splashLightPath = Path.Combine(appDir, "FLOW_SPLASH_LIGHT.png");
    private static readonly string trayDarkIconPath = Path.Combine(appDir, "FLOW_TRAY_ICON_DARK.ico");
    private static readonly string trayLightIconPath = Path.Combine(appDir, "FLOW_TRAY_ICON_LIGHT.ico");
    private static readonly string aboutDarkLogoPath = Path.Combine(appDir, "FLOW_TRAY_ICON_DARK.png");
    private static readonly string aboutLightLogoPath = Path.Combine(appDir, "FLOW_TRAY_ICON_LIGHT.png");
    private static readonly string startupSoundPath = Path.Combine(appDir, "startup.mp3");

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

    class DictionaryRow
    {
        public string Original { get; set; }
        public string Korrektur { get; set; }
    }

    private static void Log(string message)
    {
        var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
        File.AppendAllText(startupLogPath, line);
    }

    private static bool IsDarkModePreferred()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");
            var value = key?.GetValue("AppsUseLightTheme");
            if (value is int v)
                return v == 0;
        }
        catch (Exception ex)
        {
            Log($"Theme detection failed: {ex.Message}");
        }

        return true;
    }

    private static void PlayStartupSound()
    {
        try
        {
            if (!File.Exists(startupSoundPath))
                return;

            mciSendString("close flow_startup_audio", null, 0, IntPtr.Zero);
            var openCmd = $"open \"{startupSoundPath}\" type mpegvideo alias flow_startup_audio";
            mciSendString(openCmd, null, 0, IntPtr.Zero);
            mciSendString("play flow_startup_audio", null, 0, IntPtr.Zero);
        }
        catch (Exception ex)
        {
            Log($"Startup sound failed: {ex.Message}");
        }
    }

    private static void StopStartupSound()
    {
        try
        {
            mciSendString("stop flow_startup_audio", null, 0, IntPtr.Zero);
            mciSendString("close flow_startup_audio", null, 0, IntPtr.Zero);
        }
        catch
        {
            // no-op
        }
    }

    private static string ResolveSplashPath(bool darkMode)
    {
        if (darkMode && File.Exists(splashDarkPath)) return splashDarkPath;
        if (!darkMode && File.Exists(splashLightPath)) return splashLightPath;
        if (File.Exists(splashDarkPath)) return splashDarkPath;
        if (File.Exists(splashLightPath)) return splashLightPath;
        return null;
    }

    private static void ShowSplashIfAvailable()
    {
        var splashPath = ResolveSplashPath(IsDarkModePreferred());
        if (string.IsNullOrEmpty(splashPath))
            return;

        using var splash = new Form
        {
            FormBorderStyle = FormBorderStyle.None,
            StartPosition = FormStartPosition.CenterScreen,
            TopMost = true,
            ShowInTaskbar = false,
            BackColor = Color.Black,
            Width = 700,
            Height = 420,
        };

        using var image = Image.FromFile(splashPath);
        splash.Width = image.Width;
        splash.Height = image.Height;

        var picture = new PictureBox
        {
            Dock = DockStyle.Fill,
            Image = (Image)image.Clone(),
            SizeMode = PictureBoxSizeMode.Zoom,
        };

        splash.Controls.Add(picture);

        splash.Show();
        var until = DateTime.UtcNow.AddMilliseconds(900);
        while (DateTime.UtcNow < until && splash.Visible)
        {
            Application.DoEvents();
            Thread.Sleep(15);
        }

        splash.Close();
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

    private static void ShowStatusDialog()
    {
        var status =
            $"Hook installiert: {(hookId != IntPtr.Zero ? "Ja" : "Nein")}{Environment.NewLine}" +
            $"Node verfügbar: {(nodeAvailable ? "Ja" : "Nein")}{Environment.NewLine}" +
            $"Sprache: {currentLanguage}{Environment.NewLine}" +
            $"loom_cli.js: {(File.Exists(cliPath) ? "OK" : "Fehlt")}{Environment.NewLine}" +
            $"pipeline.js: {(File.Exists(pipelinePath) ? "OK" : "Fehlt")}{Environment.NewLine}" +
            $"Regeldatei: {rulesPath}{Environment.NewLine}" +
            $"Logdatei: {startupLogPath}";

        MessageBox.Show(status, "FLOW Status", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private static void ShowAboutDialog()
    {
        var dark = IsDarkModePreferred();
        var logoPath = dark && File.Exists(aboutDarkLogoPath)
            ? aboutDarkLogoPath
            : File.Exists(aboutLightLogoPath)
                ? aboutLightLogoPath
                : null;

        using var about = new Form
        {
            Text = "Über FLOW",
            Width = 520,
            Height = 420,
            StartPosition = FormStartPosition.CenterScreen,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            BackColor = dark ? Color.FromArgb(25, 25, 25) : Color.White,
            ForeColor = dark ? Color.White : Color.Black,
        };

        var title = new Label
        {
            Text = "FLOW Normalizer",
            Dock = DockStyle.Top,
            Height = 42,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 14, FontStyle.Bold),
        };

        var credits = new Label
        {
            Text = "Orthographische Normalisierung – systemweit\n\nStartsound: Dank an Yusuf_FX",
            Dock = DockStyle.Bottom,
            Height = 88,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 10),
        };

        about.Controls.Add(title);
        about.Controls.Add(credits);

        if (!string.IsNullOrEmpty(logoPath))
        {
            var picture = new PictureBox
            {
                Dock = DockStyle.Fill,
                SizeMode = PictureBoxSizeMode.Zoom,
                Image = Image.FromFile(logoPath),
            };
            about.Controls.Add(picture);
            picture.BringToFront();
        }

        about.ShowDialog();
    }

    private static void OpenDictionaryEditor()
    {
        var rows = new BindingSource();
        foreach (var item in exceptions)
        {
            rows.Add(new DictionaryRow { Original = item.Key, Korrektur = item.Value });
        }

        using var form = new Form
        {
            Text = "FLOW – Persönliches Wörterbuch",
            Width = 720,
            Height = 520,
            StartPosition = FormStartPosition.CenterScreen,
        };

        var grid = new DataGridView
        {
            Dock = DockStyle.Fill,
            AutoGenerateColumns = true,
            DataSource = rows,
            AllowUserToAddRows = true,
            AllowUserToDeleteRows = true,
        };

        var panel = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 48,
            FlowDirection = FlowDirection.RightToLeft,
            Padding = new Padding(8),
        };

        var saveButton = new Button { Text = "Speichern", Width = 110 };
        var cancelButton = new Button { Text = "Schließen", Width = 110 };

        saveButton.Click += (s, e) =>
        {
            var next = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var rowObj in rows.List)
            {
                if (rowObj is not DictionaryRow row) continue;
                var key = (row.Original ?? string.Empty).Trim().ToLowerInvariant();
                var value = (row.Korrektur ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value)) continue;
                next[key] = value;
            }

            exceptions = new Dictionary<string, string>(next);
            SaveRules();
            Log($"Dictionary editor saved {exceptions.Count} exception entries.");
            MessageBox.Show("Wörterbuch gespeichert.", "FLOW", MessageBoxButtons.OK, MessageBoxIcon.Information);
        };

        cancelButton.Click += (s, e) => form.Close();

        panel.Controls.Add(saveButton);
        panel.Controls.Add(cancelButton);
        form.Controls.Add(grid);
        form.Controls.Add(panel);
        form.ShowDialog();
    }

    private static void SetLanguage(string language)
    {
        currentLanguage = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "de";
        trayIcon.Text = currentLanguage == "en" ? "FLOW – English" : "FLOW – Deutsch";
        Log($"Language set to {currentLanguage}.");
        trayIcon.ShowBalloonTip(2500, "FLOW Sprache", currentLanguage == "en" ? "Englisch aktiviert" : "Deutsch aktiviert", ToolTipIcon.Info);
    }

    private static void RunStartupSelfCheck()
    {
        nodeAvailable = IsNodeAvailable();
        var cliExists = File.Exists(cliPath);
        var pipelineExists = File.Exists(pipelinePath);

        Log($"SelfCheck: cliExists={cliExists}, pipelineExists={pipelineExists}, hookInstalled={(hookId != IntPtr.Zero)}");

        var issues = new List<string>();
        if (!nodeAvailable) issues.Add("node.exe nicht gefunden (PATH prüfen)");
        if (!cliExists) issues.Add("loom_cli.js fehlt im EXE-Ordner");
        if (!pipelineExists) issues.Add("pipeline.js fehlt im EXE-Ordner");
        if (hookId == IntPtr.Zero) issues.Add("Keyboard-Hook nicht installiert");

        if (issues.Count == 0)
        {
            trayIcon.ShowBalloonTip(3500, "FLOW bereit", "Hook + Node + Dateien ok.", ToolTipIcon.Info);
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
        if (string.IsNullOrEmpty(source)) return source;

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
        startInfo.ArgumentList.Add("--lang");
        startInfo.ArgumentList.Add(currentLanguage);
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
        IDataObject backup = null;
        var hasBackup = false;

        try
        {
            if (Clipboard.ContainsText() || Clipboard.ContainsData(DataFormats.UnicodeText))
            {
                backup = Clipboard.GetDataObject();
                hasBackup = backup != null;
            }

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
        finally
        {
            if (hasBackup && backup != null)
            {
                try
                {
                    Clipboard.SetDataObject(backup);
                }
                catch (Exception ex)
                {
                    Log($"Clipboard restore failed: {ex.Message}");
                }
            }
        }
    }

    private static void ReplaceCurrentWord(string original, string corrected)
    {
        try
        {
            isInjectingKeys = true;
            suppressUntilTick = Environment.TickCount64 + 300;
            SendKeys.SendWait("{BACKSPACE " + original.Length + "}");
            SendKeys.SendWait(corrected);
        }
        finally
        {
            isInjectingKeys = false;
        }
    }

    private static bool IsCtrlAltPressed()
    {
        const int VK_CONTROL = 0x11;
        const int VK_MENU = 0x12;
        return (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0
            && (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
        {
            if (isInjectingKeys || Environment.TickCount64 < suppressUntilTick)
            {
                return CallNextHookEx(hookId, nCode, wParam, lParam);
            }

            var key = (Keys)Marshal.ReadInt32(lParam);

            // Hotkey: Ctrl+Alt+Space -> Sprache toggeln
            if (key == Keys.Space && IsCtrlAltPressed())
            {
                SetLanguage(currentLanguage == "de" ? "en" : "de");
                suppressUntilTick = Environment.TickCount64 + 400;
                return CallNextHookEx(hookId, nCode, wParam, lParam);
            }

            if (key is Keys.Space or Keys.Return or Keys.OemPeriod)
            {
                var word = CaptureCurrentWord();
                if (!string.IsNullOrEmpty(word))
                {
                    var corrected = Normalize(word);
                    if (!string.Equals(corrected, word, StringComparison.Ordinal))
                    {
                        ReplaceCurrentWord(word, corrected);
                        AskToLearn(word, corrected);
                    }
                }
            }
        }

        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }

    private static Icon ResolveTrayIcon()
    {
        var dark = IsDarkModePreferred();
        var iconPath = dark && File.Exists(trayDarkIconPath)
            ? trayDarkIconPath
            : File.Exists(trayLightIconPath)
                ? trayLightIconPath
                : null;

        if (!string.IsNullOrEmpty(iconPath))
            return new Icon(iconPath);

        Log("FLOW tray icon not found, using SystemIcons.Application.");
        return SystemIcons.Application;
    }

    [STAThread]
    static void Main()
    {
        try
        {
            Log("FLOW_Normalizer starting.");
            ShowSplashIfAvailable();
            PlayStartupSound();
            currentLanguage = string.Equals(Environment.GetEnvironmentVariable("FLOW_LANGUAGE"), "en", StringComparison.OrdinalIgnoreCase) ? "en" : "de";
            LoadRules();

            trayIcon = new NotifyIcon
            {
                Icon = ResolveTrayIcon(),
                Visible = true,
                Text = "FLOW Normalizer – aktiv",
            };

            var menu = new ContextMenuStrip();
            menu.Items.Add("Persönliches Wörterbuch", null, (s, e) => OpenDictionaryEditor());

            var languageMenu = new ToolStripMenuItem("Sprache");
            languageMenu.DropDownItems.Add("Deutsch", null, (s, e) => SetLanguage("de"));
            languageMenu.DropDownItems.Add("Englisch", null, (s, e) => SetLanguage("en"));
            menu.Items.Add(languageMenu);

            menu.Items.Add("Status anzeigen", null, (s, e) => ShowStatusDialog());
            menu.Items.Add("Diagnose erneut prüfen", null, (s, e) => RunStartupSelfCheck());
            menu.Items.Add("Regeln bearbeiten (flow_rules.json)", null, (s, e) => Process.Start("notepad.exe", rulesPath));
            menu.Items.Add("Log öffnen (flow_startup.log)", null, (s, e) => Process.Start("notepad.exe", startupLogPath));
            menu.Items.Add("Über FLOW", null, (s, e) => ShowAboutDialog());
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

            StopStartupSound();
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

    [DllImport("winmm.dll", CharSet = CharSet.Auto)]
    private static extern int mciSendString(string command, System.Text.StringBuilder returnValue, int returnLength, IntPtr winHandle);

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
}
