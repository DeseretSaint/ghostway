package app.ghostway;

import android.Manifest;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;

/**
 * Phone activity: runs the Ghostway PWA (bundled dist assets) in a WebView.
 * Same code, no forks — the car surface is the CarAppService templates.
 *
 * Geolocation: Android WebView has NO built-in permission UI — every
 * navigator.geolocation call is auto-denied unless (a) the app holds the
 * ACCESS_FINE_LOCATION runtime permission AND (b) a WebChromeClient grants
 * the origin via onGeolocationPermissionsShowPrompt. Both wired here: the
 * Android-level prompt fires once on first use (the onboarding "allow
 * location" moment), then the WebView callback grants the page silently.
 */
public class MainActivity extends AppCompatActivity {
    private static final int REQ_LOCATION = 7001;
    private static final int REQ_NOTIFICATIONS = 7002;
    private static final String TAG = "GhostwayUpdate";
    private static final String APK_MIME = "application/vnd.android.package-archive";
    private static final String PREFS = "gw_update";
    private static final String KEY_PENDING = "pending_download_id"; // download in flight
    private static final String KEY_READY = "ready_download_id";     // landed, waiting on install permission
    private static final String EXTRA_INSTALL_ID = "install_download_id";
    private static final String NOTIF_CHANNEL = "gw_updates";
    private static final int NOTIF_ID = 4101;
    // Secure pseudo-origin WebViewAssetLoader serves assets/www from. Real
    // https origin => fetch(), service worker and geolocation work like web.
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String APP_URL =
            "https://" + ASSET_HOST + "/assets/www/index.html";
    private WebViewAssetLoader assetLoader;
    private WebView web;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private long pendingApkDownload = -1;
    private Handler apkPollHandler;
    private BroadcastReceiver downloadCompleteReceiver;

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }

    /** Remember the download id across activity recreates and process death. */
    private void setPending(long id) {
        pendingApkDownload = id;
        SharedPreferences.Editor e = prefs().edit();
        if (id < 0) e.remove(KEY_PENDING); else e.putLong(KEY_PENDING, id);
        e.apply();
    }

    /**
     * Open the system installer over DownloadManager's granted content:// URI.
     *
     * Android 8+ aborts the install activity silently unless the app (a)
     * declares REQUEST_INSTALL_PACKAGES in the manifest and (b) holds the
     * per-app "install unknown apps" grant. Field report 2026-10-20: (a) was
     * missing outright, so InstallStart opened and vanished with no prompt and
     * the APK had to be installed by hand from Files.
     */
    private void openInstaller(DownloadManager dm, long id) {
        Uri uri = dm.getUriForDownloadedFile(id);
        if (uri == null) {
            Log.w(TAG, "no content URI for download " + id);
            Toast.makeText(this, "Couldn't open the update file. Try the update again.", Toast.LENGTH_LONG).show();
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            // Park the id so onResume finishes the job when the user comes back.
            Log.i(TAG, "install permission not granted, routing to the allow screen");
            prefs().edit().putLong(KEY_READY, id).apply();
            Toast.makeText(this, "Allow Ghostway to install updates, then come back.", Toast.LENGTH_LONG).show();
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getPackageName())));
            } catch (Exception ignored) { /* no such settings screen on this build */ }
            return;
        }
        Intent install = new Intent(Intent.ACTION_VIEW);
        install.setDataAndType(uri, APK_MIME);
        install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        Log.i(TAG, "firing installer intent for " + uri);
        postInstallNotification(id);
        try {
            startActivity(install);
        } catch (Exception e) {
            Log.e(TAG, "installer intent failed", e);
            Toast.makeText(this,
                "Couldn't open the installer. The APK is in Downloads as ghostway-update.apk",
                Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Ghostway's own "tap to install" notification.
     *
     * DownloadManager's completed notification is system-owned and routes to
     * the Downloads list, so a tap there never reaches the installer directly
     * (field report: "tap the notification and it just disappears"). This one
     * carries the download id straight into openInstaller(). If the user has
     * notifications off, the DownloadManager notification is still the
     * fallback and the in-app flow is unaffected.
     */
    private void postInstallNotification(long id) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                        NOTIF_CHANNEL, "App updates", NotificationManager.IMPORTANCE_DEFAULT);
                nm.createNotificationChannel(ch);
            }
            Intent open = new Intent(this, MainActivity.class)
                    .putExtra(EXTRA_INSTALL_ID, id)
                    .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(this, NOTIF_ID, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(this, NOTIF_CHANNEL)
                    : new Notification.Builder(this);
            b.setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentTitle("Ghostway update ready")
                    .setContentText("Tap to install the new build")
                    .setContentIntent(pi)
                    .setAutoCancel(true);
            nm.notify(NOTIF_ID, b.build());
        } catch (Exception e) {
            Log.w(TAG, "could not post install notification", e);
        }
    }

    /** Notification tap (and any relaunch) carries the download id in the intent. */
    private void handleInstallExtra(Intent intent) {
        if (intent == null) return;
        long id = intent.getLongExtra(EXTRA_INSTALL_ID, -1L);
        intent.removeExtra(EXTRA_INSTALL_ID);
        if (id < 0) return;
        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (dm == null) return;
        prefs().edit().remove(KEY_READY).apply();
        setPending(-1);
        openInstaller(dm, id);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleInstallExtra(intent);
    }

    /**
     * Android 13+ drops notifications silently without POST_NOTIFICATIONS, and
     * the "tap to install" notification is the only path that reaches the
     * installer from a backgrounded app. Asked once, at update time only.
     */
    private void ensureNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
        }
    }

    /** Query one download; open the installer when it has landed, else keep polling. */
    private void checkApkDownload(long id) {
        pendingApkDownload = id;
        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (dm == null) return;
        try (Cursor c = dm.query(new DownloadManager.Query().setFilterById(id))) {
            if (c == null || !c.moveToFirst()) return;
            int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                Log.i(TAG, "download " + id + " succeeded");
                setPending(-1);
                openInstaller(dm, id);
                return;
            }
            if (status == DownloadManager.STATUS_FAILED) {
                int reason = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                Log.w(TAG, "download " + id + " failed, reason " + reason);
                setPending(-1);
                Toast.makeText(this, "Update download failed. Check your connection and try again.", Toast.LENGTH_LONG).show();
                return;
            }
        }
        scheduleApkPoll(); // still running, look again in 2s
    }

    /**
     * Poll the download (2s) until it settles. The poll alone was not enough:
     * it dies with the activity (swiping the app away, rotation), which is why
     * a completion broadcast is registered alongside it, and the id is kept in
     * SharedPreferences so a restarted activity can pick the job back up.
     */
    private void scheduleApkPoll() {
        if (apkPollHandler == null) apkPollHandler = new Handler(Looper.getMainLooper());
        apkPollHandler.postDelayed(() -> {
            if (pendingApkDownload < 0) return;
            checkApkDownload(pendingApkDownload);
        }, 2000);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        // The PWA fetches bundled assets (graph .bin.gz, cameras.geojson,
        // wzdx json.gz) with relative fetch() URLs. Chromium's Fetch API
        // refuses the file: scheme outright — the allowFileAccess* flags only
        // affect XHR/`<img>`, never fetch() — so under file:// every asset
        // fetch throws. That silently disabled the on-device engine (loadGraph
        // failed, routes fell back to Valhalla) and the bundled camera
        // snapshot. Serve the same assets over https via WebViewAssetLoader:
        // a real secure origin, so fetch(), the service worker and
        // geolocation all behave exactly as they do on the web build.
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                // In-app navigation (route links, reloads) stays in the WebView.
                if (ASSET_HOST.equals(uri.getHost())) return false;
                String scheme = uri.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    // External links open in the system browser — a WebView
                    // dead-ends target=_blank anchors and never downloads files
                    // (field report 2026-09-30: feedback/donate/update taps did
                    // nothing inside the shell).
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                    return true;
                }
                return false; // file:// and friends load in the WebView
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                if (ContextCompat.checkSelfPermission(MainActivity.this,
                        Manifest.permission.ACCESS_FINE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED) {
                    // Android-level grant already held — allow the page origin.
                    callback.invoke(origin, true, false);
                } else {
                    // Ask the OS (first-use system dialog), remember the page
                    // callback so the grant/deny result is forwarded.
                    pendingGeoOrigin = origin;
                    pendingGeoCallback = callback;
                    ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        }, REQ_LOCATION);
                }
            }
        });
        // Phone→car nav bridge (AA v2): src/nav-bridge.js pushes nav state
        // JSON here; GhostwayCarAppService mirrors it onto the head unit.
        web.addJavascriptInterface(new JsBridge(), "AABridge");
        web.loadUrl(APP_URL);
        setContentView(web);

        // Completion broadcast: fires even when the 2s poll was lost with the
        // activity. System-sent (DownloadManager), so the receiver is exported
        // on 33+; it only ever acts on an id this app is tracking.
        downloadCompleteReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id >= 0 && id == pendingApkDownload) checkApkDownload(id);
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadCompleteReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(downloadCompleteReceiver, filter);
        }
        handleInstallExtra(getIntent());
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Back from the "install unknown apps" screen: finish the install.
        long ready = prefs().getLong(KEY_READY, -1);
        if (ready >= 0) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getPackageManager().canRequestPackageInstalls()) return; // still not allowed
            prefs().edit().remove(KEY_READY).apply();
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            if (dm != null) openInstaller(dm, ready);
            return;
        }
        // Activity recreated mid-download (rotation, swipe-away, process death).
        long pending = prefs().getLong(KEY_PENDING, -1);
        if (pending >= 0 && pending != pendingApkDownload) {
            setPending(pending);
            checkApkDownload(pending);
        }
    }

    /** JS → Java: the PWA calls window.AABridge.navState(json) / downloadApk(url). */
    public class JsBridge {
        @JavascriptInterface
        public void navState(String json) {
            NavState.set(json);
        }

        /**
         * Download the update APK and open the installer when it lands.
         * GitHub serves release assets as application/octet-stream — without
         * the explicit APK MIME the completion notification opens nothing
         * (field report 2026-10-01: "clicking the notification does nothing").
         */
        @JavascriptInterface
        public void downloadApk(String url) {
            // Bridge calls arrive on a WebView thread; enqueue, the permission
            // prompt and Toasts all belong on the UI thread.
            runOnUiThread(() -> startUpdateDownload(url));
        }

        private void startUpdateDownload(String url) {
            ensureNotificationPermission();
            try {
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (dm == null) return;
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                req.setTitle("Ghostway update");
                req.setDescription("Downloading the latest Ghostway build…");
                req.setMimeType(APK_MIME);
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                try {
                    // Land in the visible Downloads folder (file managers can
                    // see it); fall back to the system store on old Android.
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "ghostway-update.apk");
                } catch (Exception ignored) { /* <29 without storage perm — default store */ }
                long id = dm.enqueue(req);
                Log.i(TAG, "enqueued update download " + id);
                setPending(id);
                scheduleApkPoll();
            } catch (Exception e) {
                // Enqueue failed outright — get the update in the browser instead.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (apkPollHandler != null) apkPollHandler.removeCallbacksAndMessages(null);
        if (downloadCompleteReceiver != null) {
            try { unregisterReceiver(downloadCompleteReceiver); } catch (Exception ignored) {}
            downloadCompleteReceiver = null;
        }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
            @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_LOCATION || pendingGeoCallback == null) return;
        boolean granted = false;
        for (int r : grantResults) {
            if (r == PackageManager.PERMISSION_GRANTED) { granted = true; break; }
        }
        pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
        pendingGeoOrigin = null;
        pendingGeoCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
