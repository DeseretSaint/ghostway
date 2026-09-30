package app.ghostway;

import android.Manifest;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

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
    private WebView web;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private long pendingApkDownload = -1;

    /** Completed APK download → hand the file to the system installer. */
    private final BroadcastReceiver apkDownloadDone = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (id != pendingApkDownload) return;
            pendingApkDownload = -1;
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            Uri uri = dm != null ? dm.getUriForDownloadedFile(id) : null;
            if (uri == null) return;
            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(uri, "application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            try { startActivity(install); } catch (Exception ignored) { /* no installer */ }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        // The PWA fetches bundled assets (graph .bin.gz, cameras.geojson,
        // wzdx json.gz) with relative fetch() URLs. On file:// Android WebView
        // blocks those (CORS: origin 'null' cannot read file://), leaving the
        // app stuck on "Loading your map…". Allow file access + universal
        // access from file so same-origin asset fetches work offline.
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
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
        // Update downloads (in-app "Download & install") complete → installer.
        ContextCompat.registerReceiver(this, apkDownloadDone,
            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
            ContextCompat.RECEIVER_NOT_EXPORTED);
        web.loadUrl("file:///android_asset/www/index.html");
        setContentView(web);
    }

    /** JS → Java: the PWA calls window.AABridge.navState(json) / downloadApk(url). */
    public class JsBridge {
        @JavascriptInterface
        public void navState(String json) {
            NavState.set(json);
        }

        /** Download the update APK (DownloadManager owns the file + URI grant). */
        @JavascriptInterface
        public void downloadApk(String url) {
            try {
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (dm == null) return;
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                req.setTitle("Ghostway update");
                req.setDescription("Downloading the latest Ghostway build…");
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                pendingApkDownload = dm.enqueue(req);
            } catch (Exception ignored) { /* bad url — the web fallback handles it */ }
        }
    }

    @Override
    protected void onDestroy() {
        try { unregisterReceiver(apkDownloadDone); } catch (Exception ignored) {}
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
