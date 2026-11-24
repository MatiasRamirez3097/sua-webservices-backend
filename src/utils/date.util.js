/**
 * Convierte "YYYY-MM-DDTHH:MM" a "DD/MM/YYYY HH:MM:SS"
 * (formato con el que guardamos la fecha del lote en la DB y se muestra en el front)
 * @param {string} isoString - Ejemplo: "2025-11-26T09:30"
 * @returns {string} - Ejemplo: "26/11/2025 09:30:00"
 */
export const formatDateForApi = (isoString) => {
    if (!isoString) return "";

    // 1. Separamos fecha (2025-11-26) y hora (09:30)
    const [datePart, timePart = "00:00"] = isoString.split("T");

    // 2. Damos vuelta la fecha: 2025-11-26 -> [2025, 11, 26] -> [26, 11, 2025]
    const [year, month, day] = datePart.split("-");

    // 3. Armamos la fecha con barras
    const dateFinal = `${day}/${month}/${year}`;

    // 4. Agregamos los segundos (SS) que el input html no trae por defecto
    // Si la hora ya trajera segundos, solo usamos lo que hay, sino agregamos :00
    const timeFinal = timePart.length === 5 ? `${timePart}:00` : timePart;

    return `${dateFinal} ${timeFinal}`;
};

/**
 * Normaliza una fecha al formato que pide la API SUA v2: "yyyy-MM-dd HH:mm:ss".
 * Acepta:
 *  - "DD/MM/YYYY HH:MM[:SS]"  (formato guardado en Batch.date)
 *  - "YYYY-MM-DDTHH:MM[:SS]"  (valor crudo de un input datetime-local)
 *  - "YYYY-MM-DD HH:MM[:SS]"  (ya en formato API)
 * @param {string} value
 * @returns {string} - Ejemplo: "2025-11-26 09:30:00"
 */
export const toSuaApiDateTime = (value) => {
    if (!value) throw new Error("Fecha de resolución vacía");

    const str = String(value).trim();
    let year, month, day, time;

    const dmy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
    const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/);

    if (dmy) {
        [, day, month, year, time] = dmy;
    } else if (ymd) {
        [, year, month, day, time] = ymd;
    } else {
        throw new Error(`Formato de fecha no reconocido: "${str}"`);
    }

    if (time.length === 5) time = `${time}:00`;

    return `${year}-${month}-${day} ${time}`;
};
