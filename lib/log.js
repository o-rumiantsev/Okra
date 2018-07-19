'use strict';

const DEFAULT_LOG_DIRECTORY = './log';
const INDENT_LENGTH = 5;
const END_LINE = '\n';

const LOG_FILES = {
  info: '/info.log',
  debug: '/debug.log',
  warning: '/warning.log',
  error: '/error.log',
  server: '/server.log',
  common: '/common.log'
};

const createLogMessage = data => {
  const date = new Date().toISOString();
  const indent = ' '.repeat(INDENT_LENGTH);
  const message = date + indent + data + END_LINE;
  return message;
};

const wrapLogger = (type, logger) => data => {
  const logDirectory = okra.config.log
   ? okra.config.log.directory
   : DEFAULT_LOG_DIRECTORY;

  const logFile = logDirectory + LOG_FILES[type];
  const commonLogFile = logDirectory + LOG_FILES.common;
  const logMessage = createLogMessage(data);

  logger(data);

  const logDirectoryExists = okra.fs.existsSync(logDirectory);
  if (!logDirectoryExists) okra.fs.mkdirSync(logDirectory);

  const options = { flag: 'a' };
  try {
    okra.fs.writeFileSync(logFile, logMessage, options);
    okra.fs.writeFileSync(commonLogFile, logMessage, options);
  } catch (error) {
    okra.colorify.error.log(error);
  }
};

okra.log = {
  info: wrapLogger('info', okra.colorify.info.log),
  debug: wrapLogger('debug', okra.colorify.debug.log),
  warning: wrapLogger('warning', okra.colorify.warning.log),
  error: wrapLogger('error', okra.colorify.error.log)
};
