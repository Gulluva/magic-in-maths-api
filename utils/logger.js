// utils/logger.js
const fs = require('fs');
const path = require('path');

// Make sure the logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const createLogger = (filename, options = {}) => {
    const logFile = path.join(logsDir, filename);
    const logStream = fs.createWriteStream(logFile, { 
        flags: options.append ? 'a' : 'w'  // 'a' to append, 'w' to overwrite
    });

    const logger = (...args) => {
        // Get stack trace
        const stack = new Error().stack;
        const caller = stack.split('\n')[2]; // First line is Error, second is log(), third is caller
        
        // Parse the caller info
        const match = caller.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        const [_, functionName, filePath, line, column] = match || ['', '', 'unknown', '0', '0'];
        
        // Get relative file path
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Format timestamp
        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');

        const logEntry = `[${timestamp}] [${relativePath}:${line} ${functionName}] ${message}\n`;
        
        // Log to console if not disabled
        if (!options.disableConsole) {
            console.log(logEntry);
        }
        
        // Write to file
        logStream.write(logEntry);
    };

    // Add method to close the stream
    logger.close = () => {
        logStream.end();
    };

    return logger;
};

// Create specialized loggers
const modelLogger = createLogger('models.log', { append: true });
const testLogger = createLogger('tests.log', { append: false }); // Overwrite for tests

module.exports = {
    createLogger,
    modelLogger,
    testLogger
};