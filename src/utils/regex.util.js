/** Escapa un texto para usarlo literal dentro de una RegExp (evita inyección / ReDoS). */
export const escapeRegex = (value) =>
    String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Filtro "empieza con" sin distinguir mayúsculas, seguro para Mongo. */
export const startsWith = (value) => ({
    $regex: "^" + escapeRegex(String(value).slice(0, 100)),
    $options: "i",
});
