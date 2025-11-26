/**
 * Convierte "YYYY-MM-DDTHH:MM" a "DD/MM/YYYY HH:MM:SS"
 * @param {string} isoString - Ejemplo: "2025-11-26T09:30"
 * @returns {string} - Ejemplo: "26/11/2025 09:30:00"
 */
export const formatDateForApi = (isoString) => {
    if (!isoString) return "";

    // 1. Separamos fecha (2025-11-26) y hora (09:30)
    const [datePart, timePart] = isoString.split("T");

    // 2. Damos vuelta la fecha: 2025-11-26 -> [2025, 11, 26] -> [26, 11, 2025]
    const [year, month, day] = datePart.split("-");

    // 3. Armamos la fecha con barras
    const dateFinal = `${day}/${month}/${year}`;

    // 4. Agregamos los segundos (SS) que el input html no trae por defecto
    // Si la hora ya trajera segundos, solo usamos lo que hay, sino agregamos :00
    const timeFinal = timePart.length === 5 ? `${timePart}:00` : timePart;

    return `${dateFinal} ${timeFinal}`;
};
