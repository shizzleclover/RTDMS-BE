const chalk = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
};

const logger = {
  info: (module, message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.green}[INFO]${chalk.reset} ${chalk.cyan}[${module}]${chalk.reset} ${message}`
    );
  },

  warn: (module, message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.yellow}[WARN]${chalk.reset} ${chalk.cyan}[${module}]${chalk.reset} ${message}`
    );
  },

  error: (module, message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.red}[ERROR]${chalk.reset} ${chalk.cyan}[${module}]${chalk.reset} ${message}`
    );
  },

  socket: (message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.magenta}[SOCKET]${chalk.reset} ${message}`
    );
  },

  db: (message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.blue}[DB]${chalk.reset} ${message}`
    );
  },

  server: (message) => {
    console.log(
      `${chalk.gray}${getTimestamp()}${chalk.reset} ${chalk.bright}${chalk.green}[SERVER]${chalk.reset} ${message}`
    );
  },
};

module.exports = logger;
