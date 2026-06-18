# NewsPortal Android App

This folder contains a Visual Studio Android solution for the `NewsPortal` app.

## Build an installable APK

1. Open `android-app-src/NewsPortal.sln` in Microsoft Visual Studio 2022 or newer with the .NET Android workload installed.
2. Select the `Release` configuration.
3. Build the `NewsPortal` project.
4. The APK is produced under `android-app-src/NewsPortal/bin/Release/net8.0-android/`.

You can also build from a machine with the .NET Android workload installed:

```bash
dotnet build android-app-src/NewsPortal.sln -c Release
```

The project sets `AndroidPackageFormat` to `apk` so the release output is an APK file that can be copied to an Android device and installed later.

## Runtime use

Enter the GitHub repository owner, repository name, pull request number, and a GitHub token. Press **Save** to persist these values in Android shared preferences. Press **Execute** to call the GitHub API and add this comment to the selected pull request:

```text
@codex Execute Job.md
```

For the current repository, use the repository name `news-portal` and the GitHub owner that hosts your copy of this repo. The token must be allowed to create issue or pull request comments for that repository.
