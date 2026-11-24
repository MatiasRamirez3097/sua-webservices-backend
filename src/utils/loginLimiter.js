// Limitador simple en memoria para intentos de login fallidos.
// Bloquea por IP+usuario y por IP tras demasiados fallos en la ventana.
// (Si el backend corre en varias instancias, conviene moverlo a Redis.)

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_USER = 5;
const MAX_FAILS_PER_IP = 30;

const attempts = new Map(); // key -> { count, first }

const keyUser = (ip, email) => `u:${ip}:${String(email || "").toLowerCase()}`;
const keyIp = (ip) => `ip:${ip}`;

const get = (key) => {
    const entry = attempts.get(key);
    if (!entry) return 0;
    if (Date.now() - entry.first > WINDOW_MS) {
        attempts.delete(key);
        return 0;
    }
    return entry.count;
};

const bump = (key) => {
    const entry = attempts.get(key);
    if (!entry || Date.now() - entry.first > WINDOW_MS) {
        attempts.set(key, { count: 1, first: Date.now() });
    } else {
        entry.count += 1;
    }
};

export const isLoginBlocked = (ip, email) =>
    get(keyUser(ip, email)) >= MAX_FAILS_PER_USER ||
    get(keyIp(ip)) >= MAX_FAILS_PER_IP;

export const registerLoginFailure = (ip, email) => {
    bump(keyUser(ip, email));
    bump(keyIp(ip));
};

export const clearLoginFailures = (ip, email) => {
    attempts.delete(keyUser(ip, email));
};

// Limpieza periódica para que el Map no crezca indefinidamente
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of attempts) if (now - v.first > WINDOW_MS) attempts.delete(k);
}, WINDOW_MS).unref();
