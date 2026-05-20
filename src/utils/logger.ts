type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

const envLevel = (process.env['LOG_LEVEL'] || 'info').toLowerCase() as Level;
const threshold = ORDER[envLevel] ?? ORDER.info;

function emit(level: Level, msg: string, meta?: unknown): void {
  if (ORDER[level] < threshold) return;
  const ts = new Date().toISOString();
  const tag = `${COLORS[level]}[${level.toUpperCase()}]${RESET}`;
  const line = `${ts} ${tag} ${msg}`;
  if (meta !== undefined) {
    console.log(line, meta);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit('debug', msg, meta),
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};
