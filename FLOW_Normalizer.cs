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

    enum TriggerMode { EveryWord, EveryPeriod, EveryParagraph }
    private static TriggerMode currentTriggerMode = TriggerMode.EveryWord;

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
        public string triggerMode { get; set; } = "EveryWord";
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
        var dark = IsDarkModePreferred();
        var splashPath = ResolveSplashPath(dark);
        if (string.IsNullOrEmpty(splashPath))
            return;

        using var splash = new Form
        {
            FormBorderStyle = FormBorderStyle.None,
            StartPosition = FormStartPosition.CenterScreen,
            TopMost = true,
            ShowInTaskbar = false,
            BackColor = dark ? Color.Black : Color.White,
            Opacity = 0,
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

        // Fade in
        for (double opacity = 0; opacity <= 1.0; opacity += 0.05)
        {
            splash.Opacity = Math.Min(opacity, 1.0);
            Application.DoEvents();
            Thread.Sleep(12);
        }
        splash.Opacity = 1.0;

        // Hold
        var until = DateTime.UtcNow.AddMilliseconds(700);
        while (DateTime.UtcNow < until && splash.Visible)
        {
            Application.DoEvents();
            Thread.Sleep(15);
        }

        // Fade out
        for (double opacity = 1.0; opacity >= 0; opacity -= 0.05)
        {
            splash.Opacity = Math.Max(opacity, 0);
            Application.DoEvents();
            Thread.Sleep(12);
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
            if (Enum.TryParse<TriggerMode>(rules?.triggerMode, out var mode))
                currentTriggerMode = mode;
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
            triggerMode = currentTriggerMode.ToString(),
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
        var dark = IsDarkModePreferred();

        using var form = new Form
        {
            Text = "FLOW \u2013 Status",
            Width = 440,
            Height = 320,
            StartPosition = FormStartPosition.CenterScreen,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            BackColor = dark ? Color.FromArgb(25, 25, 25) : Color.White,
            ForeColor = dark ? Color.White : Color.Black,
        };

        var statusItems = new[]
        {
            ("Hook installiert", hookId != IntPtr.Zero ? "\u2714 Ja" : "\u2718 Nein"),
            ("Node verf\u00fcgbar", nodeAvailable ? "\u2714 Ja" : "\u2718 Nein"),
            ("Sprache", currentLanguage.ToUpperInvariant()),
            ("Ausl\u00f6ser", currentTriggerMode switch
            {
                TriggerMode.EveryParagraph => "Nach Absatz",
                TriggerMode.EveryPeriod    => "Nach Satz",
                _                          => "Nach jedem Wort",
            }),
            ("loom_cli.js", File.Exists(cliPath) ? "\u2714 OK" : "\u2718 Fehlt"),
            ("pipeline.js", File.Exists(pipelinePath) ? "\u2714 OK" : "\u2718 Fehlt"),
            ("Regeldatei", Path.GetFileName(rulesPath)),
            ("Logdatei", Path.GetFileName(startupLogPath)),
        };

        var body = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = statusItems.Length,
            Padding = new Padding(16),
            AutoSize = true,
            BackColor = form.BackColor,
        };
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40));
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 60));

        foreach (var (label, value) in statusItems)
        {
            var lbl = new Label
            {
                Text = label,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                ForeColor = form.ForeColor,
                AutoSize = true,
                Padding = new Padding(0, 4, 0, 4),
            };
            var val = new Label
            {
                Text = value,
                Font = new Font("Segoe UI", 10),
                ForeColor = dark ? Color.FromArgb(180, 200, 220) : Color.FromArgb(50, 50, 50),
                AutoSize = true,
                Padding = new Padding(0, 4, 0, 4),
            };
            body.Controls.Add(lbl);
            body.Controls.Add(val);
        }

        form.Controls.Add(body);
        form.ShowDialog();
    }

    private static void ShowShortcutsDialog()
    {
        var dark = IsDarkModePreferred();

        using var form = new Form
        {
            Text = "FLOW \u2013 Tastenk\u00fcrzel",
            Width = 420,
            Height = 340,
            StartPosition = FormStartPosition.CenterScreen,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            BackColor = dark ? Color.FromArgb(25, 25, 25) : Color.White,
            ForeColor = dark ? Color.White : Color.Black,
        };

        var shortcuts = new[]
        {
            ("Ctrl + Alt + Space", "Sprache umschalten (DE \u2194 EN)"),
            ("Leertaste / Enter / Punkt", "Normalisierung ausl\u00f6sen"),
            ("Tray-Icon \u2192 Rechtsklick", "Men\u00fc \u00f6ffnen"),
        };

        var body = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = shortcuts.Length + 1,
            Padding = new Padding(20, 24, 20, 12),
            BackColor = form.BackColor,
        };
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 45));
        body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 55));

        foreach (var (key, desc) in shortcuts)
        {
            var keyLabel = new Label
            {
                Text = key,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                ForeColor = dark ? Color.FromArgb(100, 170, 240) : Color.FromArgb(0, 90, 180),
                AutoSize = true,
                Padding = new Padding(0, 6, 0, 6),
            };
            var descLabel = new Label
            {
                Text = desc,
                Font = new Font("Segoe UI", 10),
                ForeColor = form.ForeColor,
                AutoSize = true,
                Padding = new Padding(0, 6, 0, 6),
            };
            body.Controls.Add(keyLabel);
            body.Controls.Add(descLabel);
        }

        var hint = new Label
        {
            Text = "Der Ausl\u00f6ser-Modus kann im Tray-Men\u00fc unter \u201EAusl\u00f6ser\u201C ge\u00e4ndert werden.",
            Font = new Font("Segoe UI", 9),
            ForeColor = dark ? Color.FromArgb(140, 140, 140) : Color.FromArgb(120, 120, 120),
            Dock = DockStyle.Bottom,
            Height = 40,
            TextAlign = ContentAlignment.MiddleCenter,
        };

        form.Controls.Add(body);
        form.Controls.Add(hint);
        form.ShowDialog();
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
            Text = "\u00dcber FLOW",
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

        var version = new Label
        {
            Text = "v1.0.0",
            Dock = DockStyle.Top,
            Height = 20,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 9),
            ForeColor = dark ? Color.FromArgb(140, 140, 140) : Color.FromArgb(120, 120, 120),
        };

        var credits = new Label
        {
            Text = "Orthographische Normalisierung \u2013 systemweit\n\nStartsound: Dank an Yusuf_FX",
            Dock = DockStyle.Bottom,
            Height = 88,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 10),
        };

        about.Controls.Add(title);
        about.Controls.Add(version);
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
        var dark = IsDarkModePreferred();
        var bgColor = dark ? Color.FromArgb(25, 25, 25) : Color.White;
        var fgColor = dark ? Color.White : Color.Black;
        var gridBgColor = dark ? Color.FromArgb(35, 35, 35) : Color.White;
        var gridAltColor = dark ? Color.FromArgb(28, 28, 28) : Color.FromArgb(245, 245, 250);
        var gridLineColor = dark ? Color.FromArgb(55, 55, 55) : Color.FromArgb(220, 220, 220);
        var headerBgColor = dark ? Color.FromArgb(40, 40, 40) : Color.FromArgb(240, 240, 240);
        var accentColor = dark ? Color.FromArgb(60, 130, 220) : Color.FromArgb(0, 100, 200);

        var rows = new BindingSource();
        foreach (var item in exceptions)
        {
            rows.Add(new DictionaryRow { Original = item.Key, Korrektur = item.Value });
        }

        using var form = new Form
        {
            Text = "FLOW \u2013 Pers\u00f6nliches W\u00f6rterbuch",
            Width = 720,
            Height = 520,
            StartPosition = FormStartPosition.CenterScreen,
            BackColor = bgColor,
            ForeColor = fgColor,
        };

        var grid = new DataGridView
        {
            Dock = DockStyle.Fill,
            AutoGenerateColumns = true,
            DataSource = rows,
            AllowUserToAddRows = true,
            AllowUserToDeleteRows = true,
            BackgroundColor = gridBgColor,
            DefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = gridBgColor,
                ForeColor = fgColor,
                SelectionBackColor = accentColor,
                SelectionForeColor = Color.White,
                Font = new Font("Segoe UI", 10),
                Padding = new Padding(4, 2, 4, 2),
            },
            AlternatingRowsDefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = gridAltColor,
                ForeColor = fgColor,
                SelectionBackColor = accentColor,
                SelectionForeColor = Color.White,
            },
            ColumnHeadersDefaultCellStyle = new DataGridViewCellStyle
            {
                BackColor = headerBgColor,
                ForeColor = fgColor,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Padding = new Padding(4),
            },
            EnableHeadersVisualStyles = false,
            GridColor = gridLineColor,
            BorderStyle = BorderStyle.None,
            CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal,
            RowHeadersVisible = false,
            AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
        };

        var panel = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 52,
            FlowDirection = FlowDirection.RightToLeft,
            Padding = new Padding(12, 8, 12, 8),
            BackColor = bgColor,
        };

        var saveButton = new Button
        {
            Text = "Speichern",
            Width = 120,
            Height = 32,
            FlatStyle = FlatStyle.Flat,
            BackColor = accentColor,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10),
            Cursor = Cursors.Hand,
        };

        var cancelButton = new Button
        {
            Text = "Schlie\u00dfen",
            Width = 120,
            Height = 32,
            FlatStyle = FlatStyle.Flat,
            BackColor = bgColor,
            ForeColor = fgColor,
            Font = new Font("Segoe UI", 10),
            Cursor = Cursors.Hand,
        };

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
            trayIcon.ShowBalloonTip(2000, "FLOW", $"W\u00f6rterbuch gespeichert ({exceptions.Count} Eintr\u00e4ge).", ToolTipIcon.Info);
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

    private static void SetTriggerMode(TriggerMode mode)
    {
        currentTriggerMode = mode;
        SaveRules();
        var label = mode switch
        {
            TriggerMode.EveryParagraph => "nach Absatz",
            TriggerMode.EveryPeriod    => "nach Satz",
            _                          => "nach jedem Wort",
        };
        Log($"TriggerMode set to {mode}.");
        trayIcon.ShowBalloonTip(2500, "FLOW Auslöser", $"Normalisierung {label}", ToolTipIcon.Info);
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
        var dark = IsDarkModePreferred();
        var bgColor = dark ? Color.FromArgb(30, 30, 30) : Color.FromArgb(250, 250, 250);
        var fgColor = dark ? Color.FromArgb(230, 230, 230) : Color.FromArgb(30, 30, 30);
        var accentColor = dark ? Color.FromArgb(60, 130, 220) : Color.FromArgb(0, 100, 200);
        var borderColor = dark ? Color.FromArgb(55, 55, 55) : Color.FromArgb(210, 210, 210);

        var toast = new Form
        {
            FormBorderStyle = FormBorderStyle.None,
            StartPosition = FormStartPosition.Manual,
            TopMost = true,
            ShowInTaskbar = false,
            BackColor = bgColor,
            ForeColor = fgColor,
            Width = 380,
            Height = 110,
            Opacity = 0,
            Padding = new Padding(1),
        };

        // Position at bottom-right of primary screen
        var screen = Screen.PrimaryScreen.WorkingArea;
        toast.Location = new Point(screen.Right - toast.Width - 16, screen.Bottom - toast.Height - 16);

        // Thin border panel
        var border = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = bgColor,
            Padding = new Padding(12),
        };
        toast.Controls.Add(border);
        toast.Paint += (s, e) =>
        {
            using var pen = new Pen(borderColor, 1);
            e.Graphics.DrawRectangle(pen, 0, 0, toast.Width - 1, toast.Height - 1);
        };

        var label = new Label
        {
            Text = $"\u201E{original}\u201C \u2192 \u201E{corrected}\u201C",
            AutoSize = false,
            Dock = DockStyle.Top,
            Height = 28,
            Font = new Font("Segoe UI", 9.5f),
            ForeColor = fgColor,
        };

        var btnPanel = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            Height = 34,
            FlowDirection = FlowDirection.LeftToRight,
            Padding = new Padding(0),
            BackColor = bgColor,
        };

        Button MakeButton(string text, int width)
        {
            return new Button
            {
                Text = text,
                Width = width,
                Height = 28,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 8.5f),
                BackColor = bgColor,
                ForeColor = fgColor,
                Cursor = Cursors.Hand,
                Margin = new Padding(0, 0, 6, 0),
            };
        }

        var btnException = MakeButton("Merken", 80);
        btnException.BackColor = accentColor;
        btnException.ForeColor = Color.White;
        var btnContext = MakeButton("Kontextregel", 100);
        var btnDismiss = MakeButton("Ignorieren", 90);

        btnException.Click += (s, e) =>
        {
            exceptions[original.ToLowerInvariant()] = corrected;
            SaveRules();
            toast.Close();
        };

        btnContext.Click += (s, e) =>
        {
            contextRules.Add(new ContextRule { Trigger = original, Replace = corrected });
            SaveRules();
            toast.Close();
        };

        btnDismiss.Click += (s, e) => toast.Close();

        btnPanel.Controls.Add(btnException);
        btnPanel.Controls.Add(btnContext);
        btnPanel.Controls.Add(btnDismiss);

        border.Controls.Add(label);
        border.Controls.Add(btnPanel);

        // Auto-dismiss after 6 seconds
        var timer = new System.Windows.Forms.Timer { Interval = 6000 };
        timer.Tick += (s, e) =>
        {
            timer.Stop();
            timer.Dispose();
            if (!toast.IsDisposed) toast.Close();
        };

        toast.Show();
        timer.Start();

        // Fade in
        for (double opacity = 0; opacity <= 1.0; opacity += 0.1)
        {
            toast.Opacity = Math.Min(opacity, 1.0);
            Application.DoEvents();
            Thread.Sleep(8);
        }
        toast.Opacity = 1.0;
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

            var word = Clipboard.ContainsText() ? Clipboard.GetText().Trim() : string.Empty;

            // Selektion aufheben und Cursor zurück ans Wortende setzen.
            // Nach Ctrl+Shift+Left liegt der aktive Cursor am linken Rand der Selektion;
            // {RIGHT} springt an den rechten Rand (= ursprüngliche Position) ohne weitere Bewegung.
            // Ohne diesen Schritt würde der nachfolgende Auslöser-Tastendruck (Space/Enter/Punkt)
            // die gesamte Selektion ersetzen und das Wort löschen.
            if (!string.IsNullOrEmpty(word))
                SendKeys.SendWait("{RIGHT}");

            return word;
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

            var triggered = currentTriggerMode switch
            {
                TriggerMode.EveryParagraph => key == Keys.Return,
                TriggerMode.EveryPeriod    => key is Keys.Return or Keys.OemPeriod,
                _                          => key is Keys.Space or Keys.Return or Keys.OemPeriod,
            };

            if (triggered)
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
            menu.Items.Add("Pers\u00f6nliches W\u00f6rterbuch", null, (s, e) => OpenDictionaryEditor());

            var languageMenu = new ToolStripMenuItem("Sprache");
            languageMenu.DropDownItems.Add("Deutsch", null, (s, e) => SetLanguage("de"));
            languageMenu.DropDownItems.Add("Englisch", null, (s, e) => SetLanguage("en"));
            menu.Items.Add(languageMenu);

            var triggerMenu = new ToolStripMenuItem("Ausl\u00f6ser");
            triggerMenu.DropDownItems.Add("Nach jedem Wort (Leerzeichen)", null, (s, e) => SetTriggerMode(TriggerMode.EveryWord));
            triggerMenu.DropDownItems.Add("Nach Satz (Punkt / Enter)",     null, (s, e) => SetTriggerMode(TriggerMode.EveryPeriod));
            triggerMenu.DropDownItems.Add("Nach Absatz (Enter)",           null, (s, e) => SetTriggerMode(TriggerMode.EveryParagraph));
            menu.Items.Add(triggerMenu);

            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Tastenk\u00fcrzel", null, (s, e) => ShowShortcutsDialog());
            menu.Items.Add("Status anzeigen", null, (s, e) => ShowStatusDialog());
            menu.Items.Add("Diagnose erneut pr\u00fcfen", null, (s, e) => RunStartupSelfCheck());

            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Regeln bearbeiten (flow_rules.json)", null, (s, e) => Process.Start("notepad.exe", rulesPath));
            menu.Items.Add("Log \u00f6ffnen (flow_startup.log)", null, (s, e) => Process.Start("notepad.exe", startupLogPath));

            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("\u00dcber FLOW", null, (s, e) => ShowAboutDialog());
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
