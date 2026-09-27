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

import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleEventObserver;

import androidx.car.app.navigation.NavigationManager;
import androidx.car.app.navigation.NavigationManagerCallback;
import androidx.car.app.model.DateTimeWithZone;
import androidx.car.app.navigation.model.Destination;
import androidx.car.app.navigation.model.TravelEstimate;
import androidx.car.app.navigation.model.Trip;

import java.util.Locale;
import java.util.TimeZone;

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
        private final Handler main = new Handler(Looper.getMainLooper());
        private boolean navActive = false; // main thread only
        private boolean callbackSet = false;

        CarScreen(CarContext ctx) {
            super(ctx);
            NavState.addListener(this);
            // Screen has no onDestroy() override — unhook through the lifecycle.
            getLifecycle().addObserver((LifecycleEventObserver) (src, event) -> {
                if (event == Lifecycle.Event.ON_DESTROY) {
                    NavState.removeListener(CarScreen.this);
                    if (navActive) {
                        navActive = false;
                        try {
                            getCarContext().getCarService(NavigationManager.class).navigationEnded();
                        } catch (RuntimeException ignored) { /* host gone */ }
                    }
                }
            });
        }

        @Override
        public void onNavState() {
            // Pushes arrive on the WebView's JavaBridge thread; Screen is not
            // thread safe — marshal the redraw onto the main thread.
            main.post(this::invalidate);
        }

        @Override
        public Template onGetTemplate() {
            JSONObject s = NavState.snapshot();
            boolean active = s != null && s.optBoolean("active");
            syncNavManager(s, active);
            return active ? navTemplate(s) : homeTemplate(s);
        }

        /**
         * Trip feeds for the instrument cluster / HUD and AA prompt muting
         * (NavigationManager). Strictly best-effort: the turn panel above never
         * depends on this, so a host that rejects trip data still gets the
         * NavigationTemplate. Main thread only (all callers are).
         */
        private void syncNavManager(JSONObject s, boolean active) {
            try {
                NavigationManager nav = getCarContext().getCarService(NavigationManager.class);
                if (!callbackSet) {
                    callbackSet = true;
                    nav.setNavigationManagerCallback(new NavigationManagerCallback() {
                        @Override
                        public void onStopNavigation() {
                            // Host asked us to stop the trip feed. The phone owns
                            // navigation — end the feed; the next state push re-syncs.
                            if (navActive) {
                                navActive = false;
                                try { nav.navigationEnded(); } catch (RuntimeException ignored) {}
                            }
                        }
                    });
                }
                if (active && !navActive) {
                    nav.navigationStarted();
                    navActive = true;
                }
                if (!active && navActive) {
                    nav.navigationEnded();
                    navActive = false;
                    return;
                }
                if (active) nav.updateTrip(buildTrip(s));
            } catch (RuntimeException e) {
                // HostException on non-navigation hosts / IllegalStateException on
                // odd ordering — the panel still renders without trip feeds.
            }
        }

        private static Trip buildTrip(JSONObject s) {
            double distM = s.optDouble("distM", 0);
            double remainingM = s.optDouble("remainingM", 0);
            long etaS = Math.max(0, s.optLong("etaS", 0));
            String road = s.optString("road", "");
            String to = s.optString("toLabel", "");
            // Rough split of the ETA between the maneuver and the destination.
            long stepEtaS = remainingM > 1 ? Math.round(etaS * (distM / remainingM)) : etaS;
            Step step = new Step.Builder()
                .setCue(s.optString("instruction", "Continue"))
                .setRoad(road)
                .setManeuver(new Maneuver.Builder(maneuverType(s.optString("modifier", ""))).build())
                .build();
            TravelEstimate stepEst = new TravelEstimate.Builder(
                    Distance.create(distM, Distance.UNIT_METERS), arrival(stepEtaS))
                .setRemainingTimeSeconds(stepEtaS)
                .build();
            Destination dest = new Destination.Builder()
                .setName(to.isEmpty() ? "Destination" : to)
                .build();
            TravelEstimate destEst = new TravelEstimate.Builder(
                    Distance.create(remainingM, Distance.UNIT_METERS), arrival(etaS))
                .setRemainingTimeSeconds(etaS)
                .build();
            return new Trip.Builder()
                .addStep(step, stepEst)
                .addDestination(dest, destEst)
                .setCurrentRoad(road)
                .setLoading(false)
                .build();
        }

        private static DateTimeWithZone arrival(long etaS) {
            // Builder(Distance, DateTimeWithZone) is the minSdk-23-safe ctor.
            return DateTimeWithZone.create(
                System.currentTimeMillis() + etaS * 1000L, TimeZone.getDefault());
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
            // Cluster/HUD feeds + AA prompt muting go through NavigationManager
            // (syncNavManager) on the same state pushes.
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