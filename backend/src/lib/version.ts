/**
 * Application Version
 *
 * Provides version information for the application.
 * This is loaded at runtime from package.json.
 *
 * @module lib/version
 */

import fs from 'fs';
import path from 'path';

interface PackageJson {
  name: string;
  version: string;
  description?: string;
}

/**
 * Read package.json and extract version info
 */
function loadPackageJson(): PackageJson {
  try {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    return JSON.parse(packageContent) as PackageJson;
  } catch {
    // Fallback values if package.json can't be read
    return {
      name: 'turbocat-backend',
      version: '1.0.0',
    };
  }
}

const packageInfo = loadPackageJson();

export const APP_NAME = packageInfo.name;
export const APP_VERSION = packageInfo.version;
export const APP_DESCRIPTION = packageInfo.description || 'Turbocat Backend API';

export default {
  name: APP_NAME,
  version: APP_VERSION,
  description: APP_DESCRIPTION,
};
