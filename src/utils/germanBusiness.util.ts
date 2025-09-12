/**
 * German Business Terminology Utility Functions
 * 
 * This utility provides helper functions for German business calculations
 * used throughout the application for package management.
 */

export interface GermanBusinessFields {
  vpe: number;        // VPE = Verpackungseinheit (units per package)
  menge: number;      // Menge = number of packages
  inhalt: number;     // Inhalt = total pieces (VPE × Menge)
  ePreis: number;     // E-Preis = Einzelpreis (price per piece)
  gPreis: number;     // G-Preis = Gesamtpreis (total price)
  einheit: 'Paket' | 'Stück'; // Einheit = unit type
}

export interface ProductData {
  numberperpackage: number; // VPE
  package: number;          // Menge
  quantity: number;         // Inhalt
  price: number;            // E-Preis
}

export interface OrderItemData {
  quantity: number;         // Inhalt (total pieces)
  packages: number;         // Menge (number of packages)
  originalPrice: number;    // E-Preis
  adjustedPrice?: number;   // E-Preis (adjusted)
  unitPerPackageSnapshot: number; // VPE snapshot
}

/**
 * Calculate German business fields from product data
 */
export function calculateGermanBusinessFields(product: ProductData): GermanBusinessFields {
  const vpe = product.numberperpackage;
  const menge = product.package;
  // Calculate inhalt from menge and vpe to ensure consistency
  const inhalt = menge * vpe;
  const ePreis = product.price;
  const gPreis = ePreis * inhalt;
  const einheit = menge > 0 ? 'Paket' : 'Stück';

  return {
    vpe,
    menge,
    inhalt,
    ePreis,
    gPreis: roundTo2Decimals(gPreis),
    einheit
  };
}

/**
 * Calculate German business fields from order item data
 */
export function calculateGermanBusinessFieldsFromOrderItem(item: OrderItemData): GermanBusinessFields {
  const vpe = item.unitPerPackageSnapshot || 1;
  const menge = item.packages;
  const inhalt = item.quantity;
  const ePreis = item.adjustedPrice || item.originalPrice;
  const gPreis = ePreis * inhalt;
  const einheit = menge > 0 ? 'Paket' : 'Stück';

  return {
    vpe,
    menge,
    inhalt,
    ePreis,
    gPreis: roundTo2Decimals(gPreis),
    einheit
  };
}

/**
 * Calculate Inhalt (total pieces) from Menge and VPE
 */
export function calculateInhalt(menge: number, vpe: number, einheit: 'Paket' | 'Stück'): number {
  return einheit === 'Paket' ? menge * vpe : menge;
}

/**
 * Calculate G-Preis (total price) from E-Preis and Inhalt
 */
export function calculateGPreis(ePreis: number, inhalt: number): number {
  return roundTo2Decimals(ePreis * inhalt);
}

/**
 * Calculate Menge (packages) from Inhalt and VPE
 */
export function calculateMenge(inhalt: number, vpe: number): number {
  return vpe > 0 ? Math.floor(inhalt / vpe) : 0;
}

/**
 * Determine Einheit (unit type) based on packages
 */
export function determineEinheit(packages: number): 'Paket' | 'Stück' {
  return packages > 0 ? 'Paket' : 'Stück';
}

/**
 * Round number to 2 decimal places
 */
export function roundTo2Decimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format price for display (German format)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

/**
 * Format number for display (German format)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num);
}

/**
 * Validate German business data
 */
export function validateGermanBusinessData(data: Partial<GermanBusinessFields>): string[] {
  const errors: string[] = [];

  if (data.vpe !== undefined && data.vpe < 0) {
    errors.push('VPE must be non-negative');
  }

  if (data.menge !== undefined && data.menge < 0) {
    errors.push('Menge must be non-negative');
  }

  if (data.inhalt !== undefined && data.inhalt < 0) {
    errors.push('Inhalt must be non-negative');
  }

  if (data.ePreis !== undefined && data.ePreis < 0) {
    errors.push('E-Preis must be non-negative');
  }

  if (data.gPreis !== undefined && data.gPreis < 0) {
    errors.push('G-Preis must be non-negative');
  }

  // Validate calculation consistency
  if (data.vpe !== undefined && data.menge !== undefined && data.inhalt !== undefined) {
    const expectedInhalt = data.menge * data.vpe;
    if (Math.abs(data.inhalt - expectedInhalt) > 0.01) {
      errors.push(`Inhalt (${data.inhalt}) should equal Menge (${data.menge}) × VPE (${data.vpe}) = ${expectedInhalt}`);
    }
  }

  if (data.ePreis !== undefined && data.inhalt !== undefined && data.gPreis !== undefined) {
    const expectedGPreis = data.ePreis * data.inhalt;
    if (Math.abs(data.gPreis - expectedGPreis) > 0.01) {
      errors.push(`G-Preis (${data.gPreis}) should equal E-Preis (${data.ePreis}) × Inhalt (${data.inhalt}) = ${expectedGPreis}`);
    }
  }

  return errors;
}

/**
 * Validate and fix product data consistency
 */
export function validateAndFixProductData(product: ProductData): { product: ProductData; errors: string[] } {
  const errors: string[] = [];
  const fixedProduct = { ...product };

  // Validate VPE
  if (fixedProduct.numberperpackage < 0) {
    errors.push('VPE (numberperpackage) must be non-negative');
    fixedProduct.numberperpackage = Math.max(0, fixedProduct.numberperpackage);
  }

  // Validate Menge
  if (fixedProduct.package < 0) {
    errors.push('Menge (package) must be non-negative');
    fixedProduct.package = Math.max(0, fixedProduct.package);
  }

  // Validate E-Preis
  if (fixedProduct.price < 0) {
    errors.push('E-Preis (price) must be non-negative');
    fixedProduct.price = Math.max(0, fixedProduct.price);
  }

  // Fix quantity consistency
  const expectedQuantity = fixedProduct.package * fixedProduct.numberperpackage;
  if (Math.abs(fixedProduct.quantity - expectedQuantity) > 0.01) {
    errors.push(`Quantity (${fixedProduct.quantity}) should equal Package (${fixedProduct.package}) × VPE (${fixedProduct.numberperpackage}) = ${expectedQuantity}. Auto-correcting.`);
    fixedProduct.quantity = expectedQuantity;
  }

  return { product: fixedProduct, errors };
}

/**
 * Convert order item data to German business format for API responses
 */
export function addGermanFieldsToOrderItem(item: any): any {
  const germanFields = calculateGermanBusinessFieldsFromOrderItem(item);
  return {
    ...item,
    ...germanFields
  };
}

/**
 * Convert product data to German business format for API responses
 */
export function addGermanFieldsToProduct(product: any): any {
  const germanFields = calculateGermanBusinessFields(product);
  return {
    ...product,
    ...germanFields
  };
}
