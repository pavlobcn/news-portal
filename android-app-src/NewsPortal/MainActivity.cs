using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Android.App;
using Android.OS;
using Android.Views;
using Android.Views.InputMethods;
using Android.Widget;
using Android.Content;
using Android.Graphics;

namespace NewsPortal;

[Activity(Label = "NewsPortal", MainLauncher = true, Exported = true)]
public sealed class MainActivity : Activity
{
    private const string PreferencesName = "NewsPortalSettings";
    private const string DefaultComment = "@codex Execute Job.md";

    private EditText _ownerText = null!;
    private EditText _repoText = null!;
    private EditText _tokenText = null!;
    private EditText _prNumberText = null!;
    private TextView _statusText = null!;
    private Button _executeButton = null!;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        BuildUi();
        LoadSettings();
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
            Text = "Save GitHub settings, then add \"@codex Execute Job.md\" as a pull request comment.",
            TextSize = 15,
        };
        description.SetPadding(0, Dp(8), 0, Dp(18));
        layout.AddView(description);

        _ownerText = AddField(layout, "Repository owner", "Example: octocat", false);
        _repoText = AddField(layout, "Repository name", "news-portal", false);
        _prNumberText = AddField(layout, "Pull request number", "Example: 123", false);
        _prNumberText.InputType = Android.Text.InputTypes.ClassNumber;
        _tokenText = AddField(layout, "GitHub token", "Fine-grained token with PR comment permission", true);

        var buttons = new LinearLayout(this) { Orientation = Orientation.Horizontal };
        buttons.SetPadding(0, Dp(12), 0, Dp(12));
        var saveButton = new Button(this) { Text = "Save" };
        _executeButton = new Button(this) { Text = "Execute" };
        buttons.AddView(saveButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WrapContent, 1));
        buttons.AddView(_executeButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WrapContent, 1));
        layout.AddView(buttons);

        _statusText = new TextView(this) { TextSize = 14 };
        layout.AddView(_statusText);

        saveButton.Click += (_, _) => SaveSettings(showMessage: true);
        _executeButton.Click += async (_, _) => await ExecuteAsync();
        SetContentView(scrollView);
    }

    private EditText AddField(LinearLayout layout, string label, string hint, bool password)
    {
        var field = new EditText(this)
        {
            Hint = hint,
            SingleLine = true,
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
        var preferences = GetSharedPreferences(PreferencesName, FileCreationMode.Private)!;
        _ownerText.Text = preferences.GetString("owner", string.Empty);
        _repoText.Text = preferences.GetString("repo", "news-portal");
        _prNumberText.Text = preferences.GetString("prNumber", string.Empty);
        _tokenText.Text = preferences.GetString("token", string.Empty);
        _statusText.Text = "Settings loaded from permanent app storage.";
    }

    private void SaveSettings(bool showMessage)
    {
        var preferences = GetSharedPreferences(PreferencesName, FileCreationMode.Private)!;
        using var editor = preferences.Edit()!;
        editor.PutString("owner", _ownerText.Text?.Trim() ?? string.Empty);
        editor.PutString("repo", _repoText.Text?.Trim() ?? string.Empty);
        editor.PutString("prNumber", _prNumberText.Text?.Trim() ?? string.Empty);
        editor.PutString("token", _tokenText.Text ?? string.Empty);
        editor.Apply();
        HideKeyboard();
        _statusText.Text = "Settings saved.";
        if (showMessage)
        {
            Toast.MakeText(this, "Settings saved", ToastLength.Short)?.Show();
        }
    }

    private async Task ExecuteAsync()
    {
        SaveSettings(showMessage: false);
        var owner = _ownerText.Text?.Trim();
        var repo = _repoText.Text?.Trim();
        var prNumber = _prNumberText.Text?.Trim();
        var token = _tokenText.Text;

        if (string.IsNullOrWhiteSpace(owner) || string.IsNullOrWhiteSpace(repo) ||
            string.IsNullOrWhiteSpace(prNumber) || string.IsNullOrWhiteSpace(token))
        {
            ShowResult("Repository owner, repository name, PR number, and token are required.", isError: true);
            return;
        }

        _executeButton.Enabled = false;
        _statusText.Text = "Adding PR comment...";

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsPortal-Android-App");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
            client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

            var endpoint = $"https://api.github.com/repos/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repo)}/issues/{Uri.EscapeDataString(prNumber)}/comments";
            var payload = JsonSerializer.Serialize(new { body = DefaultComment });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await client.PostAsync(endpoint, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == HttpStatusCode.Created)
            {
                ShowResult("Comment added successfully.", isError: false);
            }
            else
            {
                ShowResult($"GitHub API error {(int)response.StatusCode}: {TrimForDisplay(responseBody)}", isError: true);
            }
        }
        catch (Exception ex)
        {
            ShowResult($"Error calling GitHub API: {ex.Message}", isError: true);
        }
        finally
        {
            _executeButton.Enabled = true;
        }
    }

    private void ShowResult(string message, bool isError)
    {
        _statusText.Text = message;
        Toast.MakeText(this, message, isError ? ToastLength.Long : ToastLength.Short)?.Show();
    }

    private static string TrimForDisplay(string value)
    {
        const int maxLength = 300;
        if (string.IsNullOrWhiteSpace(value))
        {
            return "No response body.";
        }

        return value.Length <= maxLength ? value : value[..maxLength] + "...";
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

    private int Dp(int value) => (int)(value * Resources.DisplayMetrics!.Density + 0.5f);
}
