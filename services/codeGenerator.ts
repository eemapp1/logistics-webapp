import { Shipment } from '../contexts/ShipmentContext';

/**
 * Generates a "Bon BL" code with format: BL-YY-XXXX
 * - YY: Current year (last 2 digits)
 * - XXXX: Sequential counter starting at 0001, resets each year
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

  // Extract counter from codes like "BL-26-0001"
  let highestCounter = 0;
  currentYearShipments.forEach(shipment => {
    const counterStr = shipment.code.substring(prefix.length);
    const counter = parseInt(counterStr, 10);
    if (!isNaN(counter) && counter > highestCounter) {
      highestCounter = counter;
    }
  });

  // Generate next counter (start at 1 if no shipments for this year)
  const nextCounter = highestCounter + 1;
  const paddedCounter = nextCounter.toString().padStart(4, '0');

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
