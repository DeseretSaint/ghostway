package app.ghostway;

import android.content.Intent;
import androidx.car.app.CarAppService;
import androidx.car.app.validation.HostValidator;
import androidx.car.app.Session;
import androidx.car.app.Screen;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.ListTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.model.Action;

/**
 * Ghostway's Android Auto session (v1): a shallow, templated mirror of the
 * phone app state. The phone WebView remains the computer; the head unit shows
 * a home template (v1) so the AA handshake, Unknown-sources sideload path, and
 * navigation-category declaration are proven on a real head unit.
 *
 * Full NavTemplate turn-by-turn binding (route/ETA mirrored from the phone
 * session) is the next iteration, once the WebView→Session bridge is verified
 * against Keaton's head unit.
 */
public class GhostwayCarAppService extends CarAppService {
    @Override
    public HostValidator createHostValidator() {
        // Accept any host (sideloaded/debug build; not for store release).
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR;
    }

    @Override
    public Session onCreateSession(Intent intent) {
        return new Session() {
            @Override
            public Screen onCreateScreen(Intent intent) {
                return new HomeScreen(getCarContext());
            }
        };
    }

    static class HomeScreen extends Screen {
        HomeScreen(androidx.car.app.CarContext ctx) {
            super(ctx);
        }

        @Override
        public Template onGetTemplate() {
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
                .setTitle("Ghostway")
                .setHeaderAction(Action.APP_ICON)
                .build();
        }
    }
}
