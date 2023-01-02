import log4js from 'log4js';

let logLevel = !process.env.DEBUG ? 'debug' : 'debug';
console.log(`LogLevel: ${logLevel}`);

log4js.configure({
  appenders: {
    file: { 
      type: 'file', 
      filename: 'log/szfcweb.log', 
      maxLogSize: 10485760, 
      backups: 3, 
      compress: true
    },
    console: { 
      type: 'stdout'
    },
    infoFilter: {
      type: 'logLevelFilter',
      appender: 'console',
      level: logLevel
    }
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    'szfcweb': { appenders: ['file', 'infoFilter'], level: 'debug' }
  }
});

export default log4js.getLogger('szfcweb');