using Android.App;
using Android.Content;
using Android.OS;

namespace NewsPortal;

[Service(Exported = false, ForegroundServiceType = Android.Content.PM.ForegroundService.TypeDataSync)]
public sealed class BackgroundExecutionService : Service
{
    private const int NotificationId = 1001;
    private const string ChannelId = "news_portal_background_execution";
    private static readonly TimeSpan ExecutionInterval = TimeSpan.FromMinutes(3);
    private CancellationTokenSource? _stoppingTokenSource;
    private Task? _executionLoop;

    public override IBinder? OnBind(Intent? intent) => null;

    public override StartCommandResult OnStartCommand(Intent? intent, StartCommandFlags flags, int startId)
    {
        CreateNotificationChannel();
        StartForeground(NotificationId, BuildNotification("Background executor is running."));
        StartExecutionLoop();
        return StartCommandResult.Sticky;
    }

    public override void OnTaskRemoved(Intent? rootIntent)
    {
        Start(this);
        base.OnTaskRemoved(rootIntent);
    }

    public override void OnDestroy()
    {
        _stoppingTokenSource?.Cancel();
        _stoppingTokenSource?.Dispose();
        base.OnDestroy();
    }

    private void StartExecutionLoop()
    {
        if (_executionLoop is { IsCompleted: false })
        {
            return;
        }

        _stoppingTokenSource = new CancellationTokenSource();
        _executionLoop = Task.Run(() => RunExecutionLoopAsync(_stoppingTokenSource.Token));
    }

    private async Task RunExecutionLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            if (GitHubPrCommentExecutor.HasRequiredSettings(this))
            {
                var result = await GitHubPrCommentExecutor.ExecuteAsync(this, cancellationToken);
                var prefix = result.Succeeded ? "Last execution succeeded" : "Last execution failed";
                UpdateNotification($"{prefix}: {result.Message}");
            }
            else
            {
                UpdateNotification("Waiting for saved GitHub settings.");
            }

            try
            {
                await Task.Delay(ExecutionInterval, cancellationToken);
            }
            catch (Android.OS.OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private void UpdateNotification(string content)
    {
        var notificationManager = (NotificationManager?)GetSystemService(NotificationService);
        notificationManager?.Notify(NotificationId, BuildNotification(content));
    }

    private Notification BuildNotification(string content)
    {
        var launchIntent = PackageManager?.GetLaunchIntentForPackage(PackageName!) ??
                           new Intent(this, typeof(MainActivity));
        var pendingIntent = PendingIntent.GetActivity(
            this,
            0,
            launchIntent,
            PendingIntentFlags.Immutable | PendingIntentFlags.UpdateCurrent);

        var builder = Build.VERSION.SdkInt >= BuildVersionCodes.O
            ? new Notification.Builder(this, ChannelId)
            : new Notification.Builder(this);

        return builder
            .SetSmallIcon(Android.Resource.Drawable.IcMenuUpload)
            .SetContentTitle("NewsPortal")
            .SetContentText(content)
            .SetStyle(new Notification.BigTextStyle().BigText(content))
            .SetOngoing(true)
            .SetContentIntent(pendingIntent)
            .Build();
    }

    private void CreateNotificationChannel()
    {
        if (Build.VERSION.SdkInt < BuildVersionCodes.O)
        {
            return;
        }

        var channel = new NotificationChannel(
            ChannelId,
            "NewsPortal background execution",
            NotificationImportance.Low)
        {
            Description = "Runs the saved Execute command every 3 minutes."
        };
        var notificationManager = (NotificationManager?)GetSystemService(NotificationService);
        notificationManager?.CreateNotificationChannel(channel);
    }

    internal static void Start(Context context)
    {
        var intent = new Intent(context, typeof(BackgroundExecutionService));
        if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
        {
            context.StartForegroundService(intent);
        }
        else
        {
            context.StartService(intent);
        }
    }
}