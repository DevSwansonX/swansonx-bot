"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS = {
    debug: '\x1b[90m',
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
};
const RESET = '\x1b[0m';
const envLevel = (process.env['LOG_LEVEL'] || 'info').toLowerCase();
const threshold = ORDER[envLevel] ?? ORDER.info;
function emit(level, msg, meta) {
    if (ORDER[level] < threshold)
        return;
    const ts = new Date().toISOString();
    const tag = `${COLORS[level]}[${level.toUpperCase()}]${RESET}`;
    const line = `${ts} ${tag} ${msg}`;
    if (meta !== undefined) {
        console.log(line, meta);
    }
    else {
        console.log(line);
    }
}
exports.logger = {
    debug: (msg, meta) => emit('debug', msg, meta),
    info: (msg, meta) => emit('info', msg, meta),
    warn: (msg, meta) => emit('warn', msg, meta),
    error: (msg, meta) => emit('error', msg, meta),
};
//# sourceMappingURL=logger.js.map