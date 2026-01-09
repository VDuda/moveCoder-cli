import fs from 'fs';
import path from 'path';
import { EcosystemDriver } from './interface.js';
import movementDriver from './movement.json';

export class DriverManager {
  private drivers: Map<string, EcosystemDriver> = new Map();
  private currentDriverId: string = 'movement'; // Default

  constructor() {
    this.loadDrivers();
  }

  private loadDrivers() {
    // Load static drivers
    this.drivers.set(movementDriver.id, movementDriver as EcosystemDriver);
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
