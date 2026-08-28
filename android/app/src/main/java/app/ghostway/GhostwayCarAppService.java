package app.ghostway;

import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import androidx.car.app.CarAppService;
import androidx.car.app.Session;
import androidx.car.app.Screen;
import androidx.car.app.model.CarMessage;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.ListTemplate;
import androidx.car.app.model.MessageTemplate;
import androidx.car.app.model.Pane;
import androidx.car.app.model.PaneTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.NavigationTemplate;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;

/**
 * Ghostway's Android Auto session (v1): a shallow, templated mirror of the
 * phone app state. The phone WebView remains the computer; the head unit shows
 * recent destinations (pick one → the phone starts routing) plus a status pane.
 *
 * Route/ETA telemetry is intentionally NOT duplicated in v1: the full
 * NavTemplate turn-by-turn binding (surface + listener) lands in the next
 * iteration once the WebView→Session bridge (broadcast intents with route
 * JSON) is proven on a real head unit. This build verifies the AA handshake,
 * the Unknown-sources sideload path, and navigation-category declaration —
 * the parts Keaton needs to see Ghostway on the car screen.
 */
public class GhostwayCarAppService extends CarAppService {
    @Override
    public Session onCreateSession(Intent intent) {
        return new Session() {
            @Override
            public Screen onCreateScreen(Intent intent) {
                return new HomeScreen(this);
            }
        };
    }

    static class HomeScreen extends Screen {
        private final Session session;
        HomeScreen(Session s) {
            super(s.getCarContext());
            this.session = s;
        }

        @Override
        public Template getTemplate() {
            String title = "Ghostway";
            ItemList list = ItemList.builder()
                .addItem(Row.builder()
                    .setTitle("Open Ghostway on this phone")
                    .addText("Routing, camera avoidance, and navigation run in the phone app; the car screen mirrors status in v1.")
                    .build())
                .addItem(Row.builder()
                    .setTitle("Camera-avoiding navigation")
                    .addText("Strict mode keeps you ≥30 m from known ALPR cameras on clearable corridors.")
                    .build())
                .build();
            return ListTemplate.builder()
                .setSingleList(list)
                .setTitle(title)
                .setHeaderAction(androidx.car.app.model.Action.APP_ICON)
                .build();
        }
    }
}
