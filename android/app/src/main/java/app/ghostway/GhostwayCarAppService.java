package app.ghostway;

import android.content.Intent;

import androidx.car.app.CarAppService;
import androidx.car.app.CarContext;
import androidx.car.app.Screen;
import androidx.car.app.Session;
import androidx.car.app.model.Action;
import androidx.car.app.model.Distance;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.ListTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.navigation.model.Maneuver;
import androidx.car.app.navigation.model.NavigationTemplate;
import androidx.car.app.navigation.model.RoutingInfo;
import androidx.car.app.navigation.model.Step;
import androidx.car.app.validation.HostValidator;

import org.json.JSONObject;

import java.util.Locale;

/**
 * Ghostway's Android Auto session (v2): plug-and-play turn-by-turn mirror.
 *
 * The phone WebView runs navigation (src/nav-bridge.js pushes state JSON
 * through MainActivity's AABridge → NavState). This service renders ONE screen
 * with two templates: the NavigationTemplate turn panel while navigation is
 * active, the home ListTemplate otherwise. The driver never navigates menus —
 * start a route on the phone and the turn panel appears on the car screen by
 * itself; stop and the home screen returns.
 */
public class GhostwayCarAppService extends CarAppService {
    @Override
    public HostValidator createHostValidator() {
        // Trust ONLY the official Android Auto host signatures (shipped in the
        // androidx.car.app library's hosts_allowed resource). This makes the
        // RELEASE build a first-class car app: AA accepts it without the
        // debug-only "Unknown sources" dance, and the allowlist survives AA
        // self-updates (unlike per-device dev toggles).
        return new HostValidator.Builder(getApplicationContext())
            .addAllowedHosts(R.array.hosts_allowed)
            .build();
    }

    @Override
    public Session onCreateSession() {
        return new NavSession();
    }

    static class NavSession extends Session {
        @Override
        public Screen onCreateScreen(Intent intent) {
            return new CarScreen(getCarContext());
        }
    }

    /** One screen, two templates — see class docs. */
    static class CarScreen extends Screen implements NavState.Listener {
        CarScreen(CarContext ctx) {
            super(ctx);
            NavState.addListener(this);
        }

        @Override
        public void onNavState() {
            invalidate(); // phone pushed new state — redraw whatever fits
        }

        @Override
        public void onDestroy() {
            NavState.removeListener(this);
            super.onDestroy();
        }

        @Override
        public Template onGetTemplate() {
            JSONObject s = NavState.snapshot();
            return (s != null && s.optBoolean("active")) ? navTemplate(s) : homeTemplate(s);
        }

        private Template navTemplate(JSONObject s) {
            Step step = new Step.Builder()
                .setCue(s.optString("instruction", "Continue"))
                .setRoad(s.optString("road", ""))
                .setManeuver(new Maneuver.Builder(maneuverType(s.optString("modifier", ""))).build())
                .build();
            RoutingInfo info = new RoutingInfo.Builder()
                .setCurrentStep(step, Distance.create(s.optDouble("distM", 0), Distance.UNIT_METERS))
                .build();
            // No action strip: NavigationTemplate has no title bar and the
            // host provides system back — one less thing to hit while driving.
            // Trip/TravelEstimate feeds (instrument cluster, AA's own prompts)
            // are the documented follow-up in docs/android-auto-setup.md.
            return new NavigationTemplate.Builder()
                .setNavigationInfo(info)
                .build();
        }

        private Template homeTemplate(JSONObject s) {
            boolean arrived = s != null && s.optBoolean("arrived");
            ItemList list = new ItemList.Builder()
                .addItem(new Row.Builder()
                    .setTitle("Open Ghostway on this phone")
                    .addText("Start a route there — this screen becomes the turn panel automatically.")
                    .build())
                .addItem(new Row.Builder()
                    .setTitle(arrived ? "Arrived — trip complete" : "Camera-avoiding navigation")
                    .addText(arrived
                        ? "Start a new route any time from the phone."
                        : "Strict mode keeps you 30+ m from known ALPR cameras on clearable corridors.")
                    .build())
                .build();
            return new ListTemplate.Builder()
                .setSingleList(list)
                .setTitle("Ghostway")
                .setHeaderAction(Action.APP_ICON)
                .build();
        }

        /** PWA step modifiers → car maneuver icons. */
        private static int maneuverType(String modifier) {
            String m = modifier == null ? "" : modifier.toLowerCase(Locale.ROOT);
            if (m.startsWith("depart")) return Maneuver.TYPE_DEPART;
            if (m.startsWith("arrive") || m.startsWith("destination")) return Maneuver.TYPE_DESTINATION;
            if (m.contains("sharp left")) return Maneuver.TYPE_TURN_SHARP_LEFT;
            if (m.contains("sharp right")) return Maneuver.TYPE_TURN_SHARP_RIGHT;
            if (m.contains("slight left")) return Maneuver.TYPE_TURN_SLIGHT_LEFT;
            if (m.contains("slight right")) return Maneuver.TYPE_TURN_SLIGHT_RIGHT;
            if (m.contains("uturn") || m.contains("u-turn")) return Maneuver.TYPE_U_TURN_LEFT;
            if (m.startsWith("roundabout")) return Maneuver.TYPE_ROUNDABOUT_ENTER_AND_EXIT_CCW;
            if (m.startsWith("merge")) return Maneuver.TYPE_MERGE_SIDE_UNSPECIFIED;
            if (m.startsWith("fork left") || m.startsWith("keep left")) return Maneuver.TYPE_FORK_LEFT;
            if (m.startsWith("fork right") || m.startsWith("keep right")) return Maneuver.TYPE_FORK_RIGHT;
            if (m.equals("left") || m.endsWith(" left")) return Maneuver.TYPE_TURN_NORMAL_LEFT;
            if (m.equals("right") || m.endsWith(" right")) return Maneuver.TYPE_TURN_NORMAL_RIGHT;
            return Maneuver.TYPE_STRAIGHT;
        }
    }
}