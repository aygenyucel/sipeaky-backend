    import RoomsModel from "../api/rooms/model.js";
    const timers = new Map();
    const ROOM_DELETE_TIMEOUT = 5 * 60 * 1000;

    export const scheduleRoomDeletion = (endpoint, callback) => {
    if (timers.has(endpoint)) {
        return;
    }

    const timeout = setTimeout(async () => {
        timers.delete(endpoint);
        try {
            const deleted = await RoomsModel.findOneAndDelete({ endpoint });
            if (!deleted) {
                return;
            }
            if (callback) {
                await callback(deleted);
            }
        } catch (err) {
            console.error(err);
        }

    }, ROOM_DELETE_TIMEOUT);
    
        timers.set(endpoint, timeout);
    };

    export const cancelRoomDeletion = (endpoint) => {
    const timeout = timers.get(endpoint);
    if (timeout) {
        clearTimeout(timeout);
    }
    };