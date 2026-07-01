using Android.App;
using Android.OS;
using Android.Views;
using Android.Views.InputMethods;
using Android.Widget;
using Android.Content;
using Android.Content.PM;
using Android.Graphics;
using Android.Net;
using Android.Provider;

namespace NewsPortal;

[Activity(Label = "NewsPortal", MainLauncher = true, Exported = true)]
public sealed class MainActivity : Activity
{
    private const int NotificationPermissionRequestCode = 100;

    private EditText _ownerText = null!;
    private EditText _repoText = null!;
    private EditText _tokenText = null!;
    private EditText _workflowText = null!;
    private EditText _refText = null!;
    private TextView _statusText = null!;
    private Button _executeButton = null!;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        BuildUi();
        LoadSettings();
        RequestNotificationPermissionIfNeeded();
        RequestBatteryOptimizationExemptionIfNeeded();
        BackgroundExecutionService.Start(this);
    }


    protected override void OnResume()
    {
        base.OnResume();
        BackgroundExecutionService.Start(this);
        UpdateBatteryOptimizationStatus();
    }

    private void BuildUi()
    {
        var scrollView = new ScrollView(this);
        var layout = new LinearLayout(this)
        {
            Orientation = Orientation.Vertical,
        };
        layout.SetPadding(Dp(24), Dp(24), Dp(24), Dp(24));
        scrollView.AddView(layout);

        var title = new TextView(this)
        {
            Text = "NewsPortal",
            TextSize = 28,
            Typeface = Typeface.DefaultBold,
        };
        layout.AddView(title);

        var description = new TextView(this)
        {
            Text = "Save GitHub settings, then trigger the \"Trigger Codex Cloud Task to refresh data\" workflow dispatch.",
            TextSize = 15,
        };
        description.SetPadding(0, Dp(8), 0, Dp(18));
        layout.AddView(description);

        _ownerText = AddField(layout, "Repository owner", "Example: octocat", false);
        _repoText = AddField(layout, "Repository name", "news-portal", false);
        _workflowText = AddField(layout, "Workflow file or ID", GitHubWorkflowDispatchExecutor.DefaultWorkflowId, false);
        _refText = AddField(layout, "Git ref", GitHubWorkflowDispatchExecutor.DefaultRef, false);
        _tokenText = AddField(layout, "GitHub token", "Fine-grained token with Actions workflow permission", true);

        var buttons = new LinearLayout(this) { Orientation = Orientation.Horizontal };
        buttons.SetPadding(0, Dp(12), 0, Dp(12));
        var saveButton = new Button(this) { Text = "Save" };
        var batteryButton = new Button(this) { Text = "Allow background" };
        _executeButton = new Button(this) { Text = "Execute" };
        buttons.AddView(saveButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WrapContent, 1));
        buttons.AddView(batteryButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WrapContent, 1));
        buttons.AddView(_executeButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WrapContent, 1));
        layout.AddView(buttons);

        _statusText = new TextView(this) { TextSize = 14 };
        layout.AddView(_statusText);

        saveButton.Click += (_, _) => SaveSettings(showMessage: true);
        batteryButton.Click += (_, _) => OpenBatteryOptimizationSettings();
        _executeButton.Click += async (_, _) => await ExecuteAsync();
        SetContentView(scrollView);
    }

    private EditText AddField(LinearLayout layout, string label, string hint, bool password)
    {
        var field = new EditText(this)
        {
            Hint = hint,
        };
        field.SetPadding(0, 0, 0, Dp(6));
        if (password)
        {
            field.InputType = Android.Text.InputTypes.ClassText | Android.Text.InputTypes.TextVariationPassword;
        }

        var inputLayout = new LinearLayout(this) { Orientation = Orientation.Vertical };
        var labelView = new TextView(this)
        {
            Text = label,
            TextSize = 13,
            Typeface = Typeface.DefaultBold,
        };
        inputLayout.AddView(labelView);
        inputLayout.AddView(field);
        layout.AddView(inputLayout);
        return field;
    }

    private void LoadSettings()
    {
        var preferences = GetSharedPreferences(GitHubWorkflowDispatchExecutor.PreferencesName, FileCreationMode.Private)!;
        _ownerText.Text = preferences.GetString("owner", string.Empty);
        _repoText.Text = preferences.GetString("repo", "news-portal");
        _workflowText.Text = preferences.GetString("workflowId", GitHubWorkflowDispatchExecutor.DefaultWorkflowId);
        _refText.Text = preferences.GetString("gitRef", GitHubWorkflowDispatchExecutor.DefaultRef);
        _tokenText.Text = preferences.GetString("token", string.Empty);
        _statusText.Text = "Settings loaded from permanent app storage.";
    }

    private void SaveSettings(bool showMessage)
    {
        var preferences = GetSharedPreferences(GitHubWorkflowDispatchExecutor.PreferencesName, FileCreationMode.Private)!;
        using var editor = preferences.Edit()!;
        editor.PutString("owner", _ownerText.Text?.Trim() ?? string.Empty);
        editor.PutString("repo", _repoText.Text?.Trim() ?? string.Empty);
        editor.PutString("workflowId", _workflowText.Text?.Trim() ?? string.Empty);
        editor.PutString("gitRef", _refText.Text?.Trim() ?? string.Empty);
        editor.PutString("token", _tokenText.Text ?? string.Empty);
        editor.Apply();
        HideKeyboard();
        _statusText.Text = "Settings saved.";
        BackgroundExecutionService.Start(this);
        if (showMessage)
        {
            Toast.MakeText(this, "Settings saved", ToastLength.Short)?.Show();
        }
    }

    private async Task ExecuteAsync()
    {
        SaveSettings(showMessage: false);

        _executeButton.Enabled = false;
        _statusText.Text = "Triggering workflow dispatch...";

        var result = await GitHubWorkflowDispatchExecutor.ExecuteAsync(this);
        ShowResult(result.Message, isError: !result.Succeeded);
        _executeButton.Enabled = true;
    }

    private void ShowResult(string message, bool isError)
    {
        _statusText.Text = message;
        Toast.MakeText(this, message, isError ? ToastLength.Long : ToastLength.Short)?.Show();
    }

    private void HideKeyboard()
    {
        var inputMethodManager = (InputMethodManager?)GetSystemService(InputMethodService);
        var token = CurrentFocus?.WindowToken;
        if (token is not null)
        {
            inputMethodManager?.HideSoftInputFromWindow(token, HideSoftInputFlags.None);
        }
    }


    private void RequestBatteryOptimizationExemptionIfNeeded()
    {
        if (IsIgnoringBatteryOptimizations())
        {
            return;
        }

        try
        {
            var intent = new Intent(Settings.ActionRequestIgnoreBatteryOptimizations);
            intent.SetData(Uri.Parse($"package:{PackageName}"));
            StartActivity(intent);
        }
        catch
        {
            OpenBatteryOptimizationSettings();
        }
    }

    private void OpenBatteryOptimizationSettings()
    {
        try
        {
            StartActivity(new Intent(Settings.ActionIgnoreBatteryOptimizationSettings));
        }
        catch
        {
            StartActivity(new Intent(Settings.ActionApplicationDetailsSettings, Uri.Parse($"package:{PackageName}")));
        }

        _statusText.Text = "Allow NewsPortal to ignore battery optimizations so Android is less likely to suspend its foreground service.";
    }

    private bool IsIgnoringBatteryOptimizations()
    {
        if (Build.VERSION.SdkInt < BuildVersionCodes.M)
        {
            return true;
        }

        var powerManager = (PowerManager?)GetSystemService(PowerService);
        return powerManager?.IsIgnoringBatteryOptimizations(PackageName) == true;
    }

    private void UpdateBatteryOptimizationStatus()
    {
        if (_statusText is null)
        {
            return;
        }

        if (IsIgnoringBatteryOptimizations())
        {
            _statusText.Text = "Background execution enabled. Keep the persistent notification visible to reduce Android suspension risk.";
        }
    }

    private void RequestNotificationPermissionIfNeeded()
    {
        if (Build.VERSION.SdkInt >= BuildVersionCodes.Tiramisu &&
            CheckSelfPermission(Android.Manifest.Permission.PostNotifications) != Permission.Granted)
        {
            RequestPermissions(new[] { Android.Manifest.Permission.PostNotifications }, NotificationPermissionRequestCode);
        }
    }

    private int Dp(int value) => (int)(value * Resources.DisplayMetrics!.Density + 0.5f);
}