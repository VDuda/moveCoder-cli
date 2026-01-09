import fs from 'fs';
import path from 'path';
import { EcosystemDriver } from './interface.js';

export class DriverManager {
  private drivers: Map<string, EcosystemDriver> = new Map();
  private currentDriverId: string = 'movement'; // Default

  constructor() {
    this.loadDrivers();
  }

  private loadDrivers() {
    // In a real scenario, this might scan a directory.
    // For now, we manually require/import the known drivers or read JSONs.
    // Since we are in ESM/TS, dynamic JSON import with 'fs' is safest for runtime loading.
    
    // We assume the CLI runs from project root, so src/drivers is accessible
    // But for the built version, we might need to adjust paths.
    // For this prototype, we'll hardcode the movement load or try to read it relative to __dirname equivalent.
    
    try {
        const movementPath = path.resolve('src/drivers/movement.json');
        if (fs.existsSync(movementPath)) {
            const raw = fs.readFileSync(movementPath, 'utf-8');
            const driver = JSON.parse(raw) as EcosystemDriver;
            this.drivers.set(driver.id, driver);
        } else {
             // Fallback for dist structure if needed, or just warn
             console.warn("Could not find movement.json driver at", movementPath);
        }
    } catch (e) {
        console.error("Failed to load drivers:", e);
    }
  }

  public getDriver(id: string): EcosystemDriver | undefined {
    return this.drivers.get(id);
  }

  public getCurrentDriver(): EcosystemDriver {
    const driver = this.drivers.get(this.currentDriverId);
    if (!driver) {
        throw new Error(`Current driver '${this.currentDriverId}' not loaded.`);
    }
    return driver;
  }

  public setDriver(id: string) {
    if (!this.drivers.has(id)) {
        throw new Error(`Driver '${id}' not found.`);
    }
    this.currentDriverId = id;
  }
}

export const driverManager = new DriverManager();
