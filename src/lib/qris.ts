// qris.ts - Helper Generator QRIS Dinamis (EMVCo / ASPI Standard)
// Menghasilkan string payload QRIS dengan dynamic amount untuk di-render menjadi QR Code

function formatTag(tagNum: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tagNum}${len}${value}`;
}

function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

/**
 * Menggenerasikan string payload QRIS dinamis
 * @param merchantName Nama sekolah / yayasan (maks 25 karakter)
 * @param merchantCity Kota lokasi sekolah (maks 15 karakter)
 * @param amount Nominal tagihan yang harus dibayar
 */
export function generateQRISPayload(merchantName: string, merchantCity: string, amount: number): string {
  let payload = '';
  
  // Tag 00: Payload Format Indicator (0201)
  payload += formatTag('00', '01');
  
  // Tag 01: Point of Initiation (12 = Dynamic QR dengan amount)
  payload += formatTag('01', '12');
  
  // Tag 26: Merchant Account Information (Menggunakan Bank Muamalat 147 & Rekening 3090012402)
  const sub00 = formatTag('00', 'ID.CO.QRIS.WWW');
  const sub01 = formatTag('01', '936001473090012402'); // Bank Muamalat prefix 93600147 + No Rekening
  const sub02 = formatTag('02', 'ID1020304050607');     // NMID
  const sub03 = formatTag('03', 'UME');                 // Criteria
  payload += formatTag('26', sub00 + sub01 + sub02 + sub03);
  
  // Tag 52: Merchant Category Code (8211 = Schools / Educational Services)
  payload += formatTag('52', '8211');
  
  // Tag 53: Transaction Currency (360 = IDR Rupiah)
  payload += formatTag('53', '360');
  
  // Tag 54: Transaction Amount (Nominal)
  payload += formatTag('54', String(amount));
  
  // Tag 58: Country Code (ID)
  payload += formatTag('58', 'ID');
  
  // Tag 59: Merchant Name
  const cleanName = "YAYASAN TAMAN AT-TIN".substring(0, 25).trim().toUpperCase();
  payload += formatTag('59', cleanName);
  
  // Tag 60: Merchant City
  const cleanCity = merchantCity.substring(0, 15).trim().toUpperCase();
  payload += formatTag('60', cleanCity);
  
  // Tag 63: CRC-16 Checksum (Payload harus diakhiri '6304' lalu dihitung CRC-nya)
  payload += '6304';
  
  const crc = calculateCRC16(payload);
  return payload + crc;
}
