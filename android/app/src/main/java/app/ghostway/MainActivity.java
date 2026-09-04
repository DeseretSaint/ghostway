package app.ghostway;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Phone activity: runs the Ghostway PWA (bundled dist assets) in a WebView.
 * Same code, no forks — the car surface is the CarAppService templates.
 */
public class MainActivity extends AppCompatActivity {
    private WebView web;

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
        web.setWebViewClient(new WebViewClient());
        web.loadUrl("file:///android_asset/www/index.html");
        setContentView(web);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
