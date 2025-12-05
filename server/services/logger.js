import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../../logs/designs.log');

export async function saveDesignLog(logEntry) {
  try {
    const logLine = JSON.stringify({
      ...logEntry,
      timestamp: new Date().toISOString()
    }) + '\n';

    await fs.appendFile(LOG_FILE, logLine, 'utf-8');
    console.log('Design log saved:', logEntry.designId);
  } catch (error) {
    console.error('Error saving design log:', error);
  }
}

export async function getDesignLogs(limit = 100) {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    const logs = lines
      .slice(-limit)
      .map(line => JSON.parse(line))
      .reverse();
    return logs;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function getDesignLogById(designId) {
  try {
    const logs = await getDesignLogs(1000);
    return logs.find(log => log.designId === designId);
  } catch (error) {
    console.error('Error getting design log:', error);
    return null;
  }
}
