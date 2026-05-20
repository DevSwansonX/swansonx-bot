"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEvents = loadEvents;
const ready_js_1 = require("../events/ready.js");
const interactionCreate_js_1 = require("../events/interactionCreate.js");
const logger_js_1 = require("../utils/logger.js");
const ALL_EVENTS = [
    ready_js_1.readyEvent,
    interactionCreate_js_1.interactionCreateEvent,
];
function loadEvents(client) {
    for (const evt of ALL_EVENTS) {
        if (evt.once) {
            client.once(evt.name, (...args) => Promise.resolve(evt.execute(...args)).catch((err) => logger_js_1.logger.error(`Event ${evt.name} threw`, err)));
        }
        else {
            client.on(evt.name, (...args) => Promise.resolve(evt.execute(...args)).catch((err) => logger_js_1.logger.error(`Event ${evt.name} threw`, err)));
        }
        logger_js_1.logger.debug(`Bound event: ${String(evt.name)}`);
    }
    logger_js_1.logger.info(`Bound ${ALL_EVENTS.length} events`);
}
//# sourceMappingURL=eventHandler.js.map