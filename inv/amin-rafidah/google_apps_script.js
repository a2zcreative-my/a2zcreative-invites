/**
 * Google Apps Script for Wedding Invitation RSVP
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/home
 * 2. Click "New Project".
 * 3. Paste this code into the editor (replace existing code).
 * 4. Save the project (e.g., "Aiman Rafhanah RSVP").
 * 5. Run the 'setup' function once to create the sheet headers (optional, manual is fine too).
 * 6. Click "Deploy" > "New Deployment".
 * 7. Select type: "Web App".
 * 8. Description: "v1".
 * 9. Execute as: "Me" (your email).
 * 10. Who has access: "Anyone" (IMPORTANT!).
 * 11. Click "Deploy".
 * 12. Copy the "Web App URL" (starts with https://script.google.com/macros/s/...).
 * 13. Paste this URL into your `script.js` file (replace the GOOGLE_SCRIPT_URL variable).
 */

const SHEET_NAME = 'RSVP Responses';

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const sheet = getSheet();

        // Parse parameters
        // Format: Timestamp, Name, Phone, Attendance, Pax, TimeSlot, Wishes
        const params = e.parameter;

        const timestamp = new Date();
        const name = params.guestName;
        const phone = params.phoneNumber;
        // 'attendance' field comes from radio buttons (Hadir/Tak Hadir)
        const attendance = params.attendance || 'Hadir';
        const pax = (attendance === 'Hadir') ? (params.guestCount || '1') : '-';
        const timeSlot = (attendance === 'Hadir') ? (params.timeSlot || '-') : '-';
        const wishes = params.wishes || '';

        // Append to sheet
        sheet.appendRow([timestamp, name, phone, attendance, pax, timeSlot, wishes]);

        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers if new sheet
        sheet.appendRow(['Timestamp', 'Nama', 'No. Telefon', 'Kehadiran', 'Bilangan', 'Waktu', 'Ucapan']);
        // Freeze header row
        sheet.setFrozenRows(1);
        // Bold headers
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    return sheet;
}

function setup() {
    const sheet = getSheet();
    Logger.log('Setup Complete. Sheet Name: ' + sheet.getName());
}
