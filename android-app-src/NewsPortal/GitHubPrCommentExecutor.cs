using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Android.Content;

namespace NewsPortal;

internal static class GitHubPrCommentExecutor
{
    internal const string PreferencesName = "NewsPortalSettings";
    internal const string DefaultComment = "@codex Execute Job.md";

    internal static GitHubSettings LoadSettings(Context context)
    {
        var preferences = context.GetSharedPreferences(PreferencesName, FileCreationMode.Private)!;
        return new GitHubSettings(
            preferences.GetString("owner", string.Empty) ?? string.Empty,
            preferences.GetString("repo", "news-portal") ?? "news-portal",
            preferences.GetString("prNumber", string.Empty) ?? string.Empty,
            preferences.GetString("token", string.Empty) ?? string.Empty);
    }

    internal static bool HasRequiredSettings(Context context) => LoadSettings(context).IsComplete;

    internal static async Task<ExecutionResult> ExecuteAsync(Context context, CancellationToken cancellationToken = default)
    {
        var settings = LoadSettings(context);
        if (!settings.IsComplete)
        {
            return ExecutionResult.Failure("Repository owner, repository name, PR number, and token are required.");
        }

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsPortal-Android-App");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.Token);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
            client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

            var endpoint =
                $"https://api.github.com/repos/{Uri.EscapeDataString(settings.Owner)}/{Uri.EscapeDataString(settings.Repo)}/issues/{Uri.EscapeDataString(settings.PrNumber)}/comments";
            var payload = JsonSerializer.Serialize(new { body = DefaultComment });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await client.PostAsync(endpoint, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            return response.StatusCode == HttpStatusCode.Created
                ? ExecutionResult.Success("Comment added successfully.")
                : ExecutionResult.Failure($"GitHub API error {(int)response.StatusCode}: {TrimForDisplay(responseBody)}");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return ExecutionResult.Failure("Execution cancelled.");
        }
        catch (Exception ex)
        {
            return ExecutionResult.Failure($"Error calling GitHub API: {ex.Message}");
        }
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
}

internal sealed record GitHubSettings(string Owner, string Repo, string PrNumber, string Token)
{
    internal bool IsComplete =>
        !string.IsNullOrWhiteSpace(Owner) &&
        !string.IsNullOrWhiteSpace(Repo) &&
        !string.IsNullOrWhiteSpace(PrNumber) &&
        !string.IsNullOrWhiteSpace(Token);
}

internal sealed record ExecutionResult(bool Succeeded, string Message)
{
    internal static ExecutionResult Success(string message) => new(true, message);

    internal static ExecutionResult Failure(string message) => new(false, message);
}
