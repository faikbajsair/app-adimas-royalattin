/**
 * GOOGLE APPS SCRIPT WEB APP - PORTAL AKADEMIK & PPDB ROYAL AT-TIN
 * Folder ID: 1WE3DcPsO4bfDAliGp6J925XeNr3JngAY (Folder Upload Bukti Transfer)
 */

const UPLOAD_FOLDER_ID = "1WE3DcPsO4bfDAliGp6J925XeNr3JngAY";

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Action: ensureSheet (Membuat sheet jika belum ada)
    if (action === "ensureSheet") {
      const sheetName = requestData.sheetName;
      const headers = requestData.headers || [];
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        if (headers.length > 0) {
          sheet.appendRow(headers);
        }
      } else {
        if (sheet.getLastRow() === 0 && headers.length > 0) {
          sheet.appendRow(headers);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Action: getAll (Membaca seluruh data sheet)
    if (action === "getAll") {
      const sheetName = requestData.sheetName;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() === 0) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const data = sheet.getDataRange().getDisplayValues();
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Action: insert (Menambahkan baris baru)
    if (action === "insert") {
      const sheetName = requestData.sheetName;
      const rowValues = requestData.rowValues || [];
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.appendRow(rowValues);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Action: update (Memperbarui data baris tertentu)
    if (action === "update") {
      const sheetName = requestData.sheetName;
      const rowNum = parseInt(requestData.rowNum, 10);
      const rowValues = requestData.rowValues || [];
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error("Sheet " + sheetName + " tidak ditemukan.");
      }
      if (rowNum > 0 && rowValues.length > 0) {
        sheet.getRange(rowNum, 1, 1, rowValues.length).setValues([rowValues]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Action: uploadFile (Menyimpan berkas fisik ke Google Drive Folder)
    if (action === "uploadFile") {
      const base64Data = requestData.base64Data;
      const fileName = requestData.fileName || "bukti_transfer_" + Date.now();
      const mimeType = requestData.mimeType || "application/octet-stream";

      if (!base64Data) {
        throw new Error("Data base64 file tidak boleh kosong.");
      }

      // Ambil folder Google Drive tujuan
      let folder;
      try {
        folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
      } catch (err) {
        const folders = DriveApp.getFoldersByName("Folder Upload Bukti Transfer");
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder("Folder Upload Bukti Transfer");
        }
      }

      const decoded = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decoded, mimeType, fileName);
      const file = folder.createFile(blob);
      
      // Atur izin agar file dapat diakses oleh Admin via link
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileUrl = file.getUrl();
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        url: fileUrl,
        fileId: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Action tidak dikenali: " + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================================
// Fungsi ini dijalankan SEKALI di Google Apps Script editor untuk menyetujui izin Google Drive Create File
// =========================================================================================
function testAuthorization() {
  const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  const testFile = folder.createFile("test_auth_check.txt", "Koneksi Google Drive Sukses!");
  Logger.log("Koneksi & Izin Sukses! File test berhasil dibuat: " + testFile.getUrl());
  testFile.setTrashed(true); // Langsung hapus file test agar folder tetap bersih
}
