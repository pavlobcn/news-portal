using Android.Content;

namespace NewsPortal;

[BroadcastReceiver(Enabled = true, Exported = true)]
[IntentFilter(new[] { Intent.ActionBootCompleted, Intent.ActionLockedBootCompleted })]
public sealed class BootCompletedReceiver : BroadcastReceiver
{
    public override void OnReceive(Context? context, Intent? intent)
    {
        if (context is null || intent?.Action is null)
        {
            return;
        }

        if (intent.Action == Intent.ActionBootCompleted || intent.Action == Intent.ActionLockedBootCompleted)
        {
            BackgroundExecutionService.Start(context);
        }
    }
}
