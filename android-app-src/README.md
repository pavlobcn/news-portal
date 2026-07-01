# NewsPortal Android App

This folder contains a Visual Studio Android solution for the `NewsPortal` app.

## Build an installable APK

1. Open `android-app-src/NewsPortal.sln` in Microsoft Visual Studio 2022 17.14 or newer with the .NET 10 Android workload installed.
2. Select the `Release` configuration.
3. Build the `NewsPortal` project.
4. The APK is produced under `android-app-src/NewsPortal/bin/Release/net10.0-android/`.

You can also build from a machine with the .NET 10 Android workload installed:

```bash
dotnet build android-app-src/NewsPortal.sln --configuration Release -p:AndroidPackageFormat=apk
```

The project sets `AndroidPackageFormat` to `apk` so the release output is an APK file that can be copied to an Android device and installed later.

## Runtime use

Enter the GitHub repository owner, repository name, workflow file or ID, Git ref, and a GitHub token. Press **Save** to persist these values in Android shared preferences. Press **Execute** to call the GitHub Actions workflow dispatch API for the saved workflow.

For this repository, use the workflow file `codex-hourly.yml` to trigger **Trigger Codex Cloud Task to refresh data** and the Git ref `main` unless you need to dispatch a different branch. The token must be allowed to write Actions workflows for that repository.
