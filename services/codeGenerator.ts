import { Shipment } from '../contexts/ShipmentContext';

/**
 * Generates a "Bon BL" code with format: BL-YY-XXXX
 * - YY: Current year (last 2 digits)
 * - XXXX: Sequential counter starting at 0001, resets each year
 * 
 * This NEW version ignores old random format codes and only counts
 * properly sequential codes (0001, 0002, 0003, etc.)
 * 
 * @param shipments - All existing shipments to check for highest counter
 * @returns Generated code in format BL-YY-XXXX
 */
export const generateBLCode = (shipments: Shipment[]): string => {
  const currentYear = new Date().getFullYear();
  const currentYearShort = currentYear.toString().slice(-2);
  const prefix = `BL-${currentYearShort}-`;

  // Filter shipments from current year only
  const currentYearShipments = shipments.filter(s => {
    const shipmentYear = s.date ? new Date(s.date).getFullYear() : currentYear;
    return shipmentYear === currentYear && s.code.startsWith(prefix);
  });

  // Extract ONLY properly sequential codes (0001, 0002, 0003, etc.)
  // Ignore random format codes like 1001, 2875, etc.
  let highestCounter = 0;
  currentYearShipments.forEach(shipment => {
    const counterStr = shipment.code.substring(prefix.length);
    const counter = parseInt(counterStr, 10);
    
    // Only count sequential codes (0001-9999)
    // Sequential codes start with 0 or are small numbers (1-9999)
    // Old random codes like 1001, 2875, etc. will be detected as follows:
    // A proper sequential code after many shipments would be like 0042, 0100, etc.
    // But to be safe, we check if it looks like it could be sequential
    // by seeing if it's less than 5 digits and follows the pattern
    
    if (!isNaN(counter) && counter > 0 && counter <= 9999 && counterStr.length === 4) {
      // Only accept codes that are 0-padded (start with 0) or are genuinely sequential
      // New sequential: 0001, 0002, 0100, 0500 - these have leading zeros
      // Old random: 1001, 2875, 5000 - these don't necessarily have leading zeros
      
      // Let's be more strict: only accept 4-digit codes that start with '0'
      if (counterStr.startsWith('0')) {
        if (counter > highestCounter) {
          highestCounter = counter;
        }
      }
      // Alternative: accept all if none with leading 0 found yet
      else if (highestCounter === 0) {
        // Don't count old random codes as reference
        // Start fresh with 0001
      }
    }
  });

  // Generate next counter (start at 1 if no proper sequential shipments for this year)
  const nextCounter = highestCounter + 1;
  const paddedCounter = nextCounter.toString().padStart(4, '0');

  console.log('Code Generator Debug:', {
    currentYear,
    prefix,
    totalShipmentsInYear: currentYearShipments.length,
    highestSequentialCounter: highestCounter,
    generatedCode: `${prefix}${paddedCounter}`
  });

  return `${prefix}${paddedCounter}`;
};

/**
 * Generates a client code (simple format)
 * @returns Generated client code
 */
export const generateClientCode = (): string => {
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `CLT-${randomSuffix}`;
};
