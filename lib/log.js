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
  const logDirectory = framework.config.log.directory || DEFAULT_LOG_DIRECTORY;
  const logFile = logDirectory + LOG_FILES[type];
  const commonLogFile = logDirectory + LOG_FILES.common;
  const logMessage = createLogMessage(data);

  logger(data);

  const logDirectoryExists = framework.fs.existsSync(logDirectory);
  if (!logDirectoryExists) framework.fs.mkdirSync(logDirectory);

  const options = { flag: 'a' };
  try {
    framework.fs.writeFileSync(logFile, logMessage, options);
    framework.fs.writeFileSync(commonLogFile, logMessage, options);
  } catch (error) {
    framework.colorify.error.log(error);
  }
};

framework.log = {
  info: wrapLogger('info', framework.colorify.info.log),
  debug: wrapLogger('debug', framework.colorify.debug.log),
  warning: wrapLogger('warning', framework.colorify.warning.log),
  error: wrapLogger('error', framework.colorify.error.log)
};
