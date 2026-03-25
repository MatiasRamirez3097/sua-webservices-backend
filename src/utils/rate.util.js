import VehicleRate from "../models/VehicleRate";

const getRateForDate = async (vehicleType, date) => {
    const rate = await VehicleRate({
        vehicleType: vehicleType,
        validFrom: { $lte: date },
    }).sort({ validFrom: -1 });

    if (!rate) {
        throw new Error(
            `No rate found for vehicle type ${vehicleType} on ${date}`
        );
    }

    return rate.hourlyRate;
};
