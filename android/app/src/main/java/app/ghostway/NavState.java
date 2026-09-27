package app.ghostway;

import java.util.concurrent.CopyOnWriteArrayList;

import org.json.JSONObject;

/**
 * Phone→car navigation state (AA v2 bridge).
 *
 * src/nav-bridge.js (the PWA) pushes a small JSON snapshot through
 * MainActivity's {@code AABridge} WebView interface — that call lands on the
 * WebView's JavaBridge thread. Car templates read on the car host's thread.
 * A volatile JSON snapshot + CopyOnWriteArrayList listeners keeps that safe
 * with no locking in either direction.
 */
public final class NavState {
    public interface Listener {
        /** Called after every state push (any thread) — re-render via invalidate(). */
        void onNavState();
    }

    private static volatile String json;
    private static final CopyOnWriteArrayList<Listener> LISTENERS = new CopyOnWriteArrayList<>();

    private NavState() {}

    public static void set(String stateJson) {
        json = stateJson;
        for (Listener l : LISTENERS) {
            l.onNavState();
        }
    }

    /** Last pushed state, parsed; null when nothing was ever pushed (or parse failed). */
    public static JSONObject snapshot() {
        String j = json;
        if (j == null) return null;
        try {
            return new JSONObject(j);
        } catch (Exception e) {
            return null;
        }
    }

    public static void addListener(Listener l) {
        LISTENERS.add(l);
    }

    public static void removeListener(Listener l) {
        LISTENERS.remove(l);
    }
}