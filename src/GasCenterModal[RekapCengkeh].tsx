/**
 * Modal GAS Center (Headless API Endpoint & Data Sync Console)
 * File: GasCenterModal[RekapCengkeh].tsx
 */
import React, { useState } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Save, 
  RotateCcw,
  Send,
  Code2,
  Sliders,
  Play,
  Copy,
  Check,
  FileCode,
  Zap
} from 'lucide-react';
import { GasConfig } from './types[RekapCengkeh]';
import { saveGasConfig, DEFAULT_EXEC_URL, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME, testGasPayload } from './Code[RekapCengkeh]';

const GAS_TEMPLATE_CODE = `/**
 * =========================================================================
 * ALL-IN-ONE GOOGLE APPS SCRIPT: MONITORING REKAP PROSES CENGKEH
 * File Target di Google Apps Script Editor: Kode.gs
 * Divisi Produksi I - PT Batu Karang
 * =========================================================================
 */

var SPREADSHEET_ID = "1bYUgDYlb3PcVSWLlkqeh-Rh23tpXDL1bV-8F6Sur-9M";
var DEFAULT_SHEET = "DATA PROSES CKH";

function getSpreadsheetSafe_(id) {
  var targetId = id || SPREADSHEET_ID;
  var ss = null;
  if (targetId) {
    try { ss = SpreadsheetApp.openById(targetId); if (ss) return ss; } catch(e) {}
  }
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); if (ss) return ss; } catch(e) {}
  return null;
}

function getSheetSafe_(ss, preferredName) {
  if (!ss) return null;
  var targetName = preferredName || DEFAULT_SHEET;
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getName().indexOf("PROSES CKH") > -1) return all[i];
  }
  return all.length > 0 ? all[0] : null;
}

function findActualLastRow_(sheet) {
  var maxRows = Math.min(sheet.getLastRow(), 950);
  if (maxRows < 11) return 10;
  var bValues = sheet.getRange(11, 2, maxRows - 10, 1).getValues();
  var lastFilled = 10;
  for (var r = bValues.length - 1; r >= 0; r--) {
    var val = bValues[r][0];
    if (val !== "" && val !== null && val !== undefined && String(val).trim() !== "") {
      lastFilled = r + 11;
      break;
    }
  }
  return lastFilled;
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "ping";
    var reqSheet = (e && e.parameter && e.parameter.sheet) || DEFAULT_SHEET;
    var reqId = (e && e.parameter && e.parameter.spreadsheetId) || SPREADSHEET_ID;
    
    // Tampilan status saat dibuka langsung di browser (Health-check)
    if (action === "ping" || action === "pingDhp" || !action) {
      var ssTest = getSpreadsheetSafe_(reqId);
      var sheetTest = getSheetSafe_(ssTest, reqSheet);
      var lastRow = sheetTest ? findActualLastRow_(sheetTest) : 0;
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "ping",
        service: "Web App Integrasi Rekap Cengkeh (Divisi Produksi I)",
        connectedSpreadsheetId: reqId,
        connectedSheetName: sheetTest ? sheetTest.getName() : "Tidak Ditemukan",
        actualDataRows: lastRow,
        timestamp: new Date().toISOString(),
        message: "Google Apps Script Online & Terhubung Sempurna ke Spreadsheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "getData") {
      var ss = getSpreadsheetSafe_(reqId);
      if (!ss) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Spreadsheet ID '" + reqId + "' tidak dapat dibuka. Pastikan ID valid dan izin akun sesuai."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var sheet = getSheetSafe_(ss, reqSheet);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Sheet '" + reqSheet + "' tidak ditemukan di spreadsheet."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var values = sheet.getDataRange().getDisplayValues();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: values.length,
        sheet: sheet.getName(),
        data: values
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: action,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server GAS Exception: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    hasLock = lock.tryLock(15000);
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || "ping";
    
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "ping",
        timestamp: new Date().toISOString(),
        message: "Headless GAS REST Online & Responsive"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Operasi Sinkronisasi DHP ke Rekap (syncDhpToRekap atau appendRow)
    if (action === "syncDhpToRekap" || (action === "appendRow" && body.row)) {
      var targetId = body.spreadsheetId || SPREADSHEET_ID;
      var ss = getSpreadsheetSafe_(targetId);
      if (!ss) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Spreadsheet Master (" + targetId + ") tidak dapat dibuka. Pastikan ID valid."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var sheet = getSheetSafe_(ss, body.sheet || DEFAULT_SHEET);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Sheet '" + (body.sheet || DEFAULT_SHEET) + "' tidak ditemukan."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Ambil data dari payload terstruktur atau array row
      var inputData = body.inputData || {};
      var row = body.row || [];
      
      var tgl = String(inputData.colB_tanggal || row[1] || "").trim();
      if (body.partaiId === "PARTAI 3" && (tgl.indexOf("12 November") > -1 || !tgl)) {
        tgl = "Rabu, 11 November 2026";
      } else if (body.partaiId === "PARTAI 2" && (tgl.indexOf("11 November") > -1 || !tgl)) {
        tgl = "Selasa, 10 November 2026";
      } else if (body.partaiId === "PARTAI 1" && (tgl.indexOf("10 November") > -1 || !tgl)) {
        tgl = "Senin, 09 November 2026";
      } else if (body.partaiId === "PARTAI 4" && (tgl.indexOf("13 November") > -1 || !tgl)) {
        tgl = "Kamis, 12 November 2026";
      }
      var jenis = String(inputData.colE_jenis || row[4] || "").trim();
      var kaGld = String(inputData.colF_kaGld || row[5] || "").trim();
      var gld = Number(inputData.colG_gldKering || row[6] || 0);
      var rjB = Number(inputData.colH_rjBasah || row[7] || 0);
      var rjK = Number(inputData.colK_rjKering || row[10] || 0);
      var kaDry = String(inputData.colL_kaDry || row[11] || "").trim();
      var jalurProses = String(inputData.colQ_jalurProses || row[16] || (body.partaiId === "PARTAI 3" ? "Silo" : "Manual")).trim();
      
      // =======================================================
      // ANTI-DUPLIKASI (IDEMPOTENT WRITE PROTECTION):
      // Pindai hingga 25 baris terakhir di DATA PROSES CKH.
      // Jika data partai ini sudah pernah dicatat sebelumnya (berdasarkan Tanggal Admoist
      // ATAU Bobot Gelondong Kering yang sama persis), sistem otomatis MEMPERBARUI
      // baris tersebut tanpa pernah membuat baris duplikat ganda!
      // =======================================================
      var lastRow = findActualLastRow_(sheet);
      var targetRow = -1;
      var isDuplicateFound = false;
      
      var scanStart = Math.max(11, lastRow - 25);
      var scanCount = Math.max(1, lastRow - scanStart + 1);
      if (lastRow >= 11) {
        var existingRange = sheet.getRange(scanStart, 1, scanCount, 12).getValues();
        for (var ex = 0; ex < existingRange.length; ex++) {
          var exRowIdx = scanStart + ex;
          var exTgl = String(existingRange[ex][1] || "").trim(); // Col B (Tanggal Admoist)
          var exGld = Number(existingRange[ex][6] || 0);         // Col G (Gld Kering)
          var exRjK = Number(existingRange[ex][10] || 0);        // Col K (Rj Kering)
          
          var matchTgl = (tgl && exTgl && (tgl.toLowerCase() === exTgl.toLowerCase()));
          var matchGld = (gld > 0 && exGld > 0 && Math.abs(gld - exGld) < 0.5);
          var matchRjK = (rjK > 0 && exRjK > 0 && Math.abs(rjK - exRjK) < 1.0);
          
          if (matchTgl || (matchGld && matchRjK) || matchGld) {
            targetRow = exRowIdx;
            isDuplicateFound = true;
            break;
          }
        }
      }
      
      // Jika entri baru belum ada di sheet master, tambahkan di baris paling bawah
      if (!isDuplicateFound) {
        targetRow = Math.max(lastRow + 1, 11);
      }
      
      // Salin formula jika baris target belum punya formula di Kolom I
      var existingFormulaI = sheet.getRange(targetRow, 9).getFormula();
      if (!existingFormulaI && targetRow > 11) {
        sheet.getRange(targetRow - 1, 1, 1, 17).copyTo(
          sheet.getRange(targetRow, 1, 1, 17),
          SpreadsheetApp.CopyPasteType.PASTE_FORMULA,
          false
        );
      }
      
      // Tulis HANYA ke kolom mentah (B, E, F, G, H, K, L, Q). Kolom C, D, I, J, M, N, O, P aman terjaga!
      if (tgl) sheet.getRange(targetRow, 2).setValue(tgl);
      if (jenis) sheet.getRange(targetRow, 5).setValue(jenis);
      if (kaGld) sheet.getRange(targetRow, 6).setValue(kaGld);
      if (gld > 0) sheet.getRange(targetRow, 7).setValue(gld);
      if (rjB > 0) sheet.getRange(targetRow, 8).setValue(rjB);
      if (rjK > 0) sheet.getRange(targetRow, 11).setValue(rjK);
      if (kaDry) sheet.getRange(targetRow, 12).setValue(kaDry);
      sheet.getRange(targetRow, 17).setValue(jalurProses);
      
      SpreadsheetApp.flush(); // Commit fisik ke Google Sheets
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: action,
        targetRow: targetRow,
        appendedRow: targetRow,
        isUpdate: isDuplicateFound,
        partaiId: body.partaiId || "PARTAI",
        message: isDuplicateFound
          ? "Sukses (Anti-Duplikat): Data " + (body.partaiId || "Partai") + " sudah tercatat di baris #" + targetRow + ". Baris #" + targetRow + " berhasil DIPERBARUI (Tanggal Admoist disinkronkan ke: " + tgl + ") tanpa membuat baris duplikat ganda."
          : "Sukses: Data " + (body.partaiId || "Partai") + " (" + tgl + ") berhasil dibukukan ke baris baru #" + targetRow + " Sheet Master. Kolom rumus (C, D, I, J, M, N, O, P) tetap utuh terlindungi."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      received: body
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server GAS Exception: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch(e) {}
    }
  }
}

/**
 * OTOMASI PENUH SERVER-SIDE 24/7 (UNATTENDED / TANPA KLIK TOMBOL)
 * Memindai PARTAI 1 s/d PARTAI 4 di Kertas Kerja DHP dan membukukan ke DATA PROSES CKH saat status 'Susut Akhir'.
 */
function autoSyncAllPartaiToServer() {
  var logs = [];
  try {
    var ssDhp = SpreadsheetApp.openById("1ZEJjMQMBkE8k3NIeHA32P2SooIpvXIfnq_f-pruCelQ");
    var partaiTabs = ["PARTAI 1", "PARTAI 2", "PARTAI 3", "PARTAI 4"];
    
    for (var p = 0; p < partaiTabs.length; p++) {
      var tabName = partaiTabs[p];
      var sheet = ssDhp.getSheetByName(tabName);
      if (!sheet) continue;
      
      var maxRows = Math.min(sheet.getLastRow(), 350);
      if (maxRows < 20) continue;
      
      var headerValues = sheet.getRange(1, 1, 3, 20).getValues();
      var noLap = "";
      var tglMulai = "";
      var jenis = "Manado Grade A (2024)";
      
      var l1Str = headerValues[0].join(" ");
      var l2Str = headerValues[1].join(" ");
      
      var mNoLap = l1Str.match(/:\s*([0-9A-Za-z\/\-_]+)/);
      if (mNoLap) noLap = mNoLap[1].trim();
      
      var mTgl = l2Str.match(/([A-Za-z]+,\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
      if (mTgl) tglMulai = mTgl[1].trim();
      
      var mStock = l1Str.match(/Nama Stock[^:]*:\s*([^"]+)/i) || l1Str.match(/:\s*(Manado[^\",]+)/i);
      if (mStock) jenis = mStock[1].trim();
      
      var statusDropdown = "";
      var scanStart = Math.min(maxRows, 85);
      var scanCount = Math.min(Math.max(maxRows - scanStart + 1, 1), 60);
      var qValues = sheet.getRange(scanStart, 16, scanCount, 3).getValues();
      
      for (var r = 0; r < qValues.length; r++) {
        var valQ = String(qValues[r][1] || "");
        var valR = String(qValues[r][2] || "");
        if (/susut\s*akhir/i.test(valQ) || /susut\s*akhir/i.test(valR)) {
          statusDropdown = "Susut Akhir (Gld Kering-Rj. Kering)";
          break;
        }
      }
      
      if (statusDropdown !== "Susut Akhir (Gld Kering-Rj. Kering)") {
        continue;
      }
      
      var gldKering = 0;
      var rjBasah = 0;
      var rjKering = 0;
      var kaGldStr = "";
      var kaDryStr = "";
      
      try {
        var cellR11 = sheet.getRange("R11").getValue();
        if (typeof cellR11 === "number" && cellR11 > 100) gldKering = cellR11;
      } catch (e) {}
      
      try {
        var cellR22 = sheet.getRange("R22").getValue();
        if (typeof cellR22 === "number" && cellR22 > 100) rjBasah = cellR22;
      } catch (e) {}
      
      try {
        var cellQ297 = sheet.getRange("Q297").getValue();
        var cellR297 = sheet.getRange("R297").getValue();
        if (typeof cellQ297 === "number" && cellQ297 > 100) rjBasah = cellQ297;
        if (typeof cellR297 === "number" && cellR297 > 100) rjKering = cellR297;
      } catch (e) {}
      
      var allData = sheet.getRange(1, 1, Math.min(maxRows, 320), 18).getValues();
      for (var i = 0; i < allData.length; i++) {
        var rowStr = allData[i].join(" ");
        if (rowStr.indexOf("Netto :") > -1 && (i < 15 || rowStr.indexOf("SYNC") > -1) && !gldKering) {
          for (var c = 0; c < allData[i].length; c++) {
            var v = allData[i][c];
            if (typeof v === "number" && v > 100) { gldKering = v; break; }
          }
        }
        if (rowStr.indexOf("Kadar Air Pra Rendam :") > -1 || rowStr.indexOf("Pra Rendam :") > -1) {
          for (var c = 0; c < allData[i].length; c++) {
            if (String(allData[i][c]).indexOf("%") > -1 || (typeof allData[i][c] === "number" && allData[i][c] < 40)) {
              kaGldStr = String(allData[i][c]).trim();
              break;
            }
          }
        }
        if (rowStr.indexOf("Susut Akhir (Gld Kering-Rj. Kering)") > -1 && !rjKering) {
          for (var c = 0; c < allData[i].length; c++) {
            var v = allData[i][c];
            if (typeof v === "number" && v > 100) { rjKering = v; break; }
          }
        }
      }
      
      if (!rjKering) {
        for (var i = 70; i < allData.length; i++) {
          var rowStr = allData[i].join(" ");
          if (rowStr.indexOf("Proses Dryer") > -1 || rowStr.indexOf("Total Dryer") > -1 || rowStr.indexOf("Grand Total") > -1) {
            for (var c = 0; c < allData[i].length; c++) {
              var v = allData[i][c];
              if (typeof v === "number" && v > 500) { rjKering = v; }
            }
          }
        }
      }
      
      if (gldKering <= 0 || rjKering <= 0) continue;
      
      // Tanggal Proses Admoist Resmi untuk Kolom B DATA PROSES CKH:
      var tglAdmoistPartai = "Senin, 09 November 2026";
      if (tabName === "PARTAI 1") tglAdmoistPartai = "Senin, 09 November 2026";
      else if (tabName === "PARTAI 2") tglAdmoistPartai = "Selasa, 10 November 2026";
      else if (tabName === "PARTAI 3") tglAdmoistPartai = "Rabu, 11 November 2026";
      else if (tabName === "PARTAI 4") tglAdmoistPartai = "Kamis, 12 November 2026";
      
      try {
        var cellR11 = sheet.getRange("R11");
        var valR11 = String(cellR11.getDisplayValue() || "").trim();
        var rawValR11 = cellR11.getValue();
        
        var dObj = null;
        if (rawValR11 instanceof Date && !isNaN(rawValR11.getTime())) {
          dObj = rawValR11;
        } else {
          var slashMatch = valR11.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
          if (slashMatch) {
            var day = parseInt(slashMatch[1], 10);
            var month = parseInt(slashMatch[2], 10);
            var year = parseInt(slashMatch[3], 10);
            if (year < 100) year += 2000;
            dObj = new Date(year, month - 1, day);
          }
        }
        
        if (dObj) {
          var dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          var monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          var day = dObj.getDate();
          var dayPadded = day < 10 ? "0" + day : "" + day;
          var monthName = monthNames[dObj.getMonth()];
          var year = dObj.getFullYear();
          tglAdmoistPartai = dayNames[dObj.getDay()] + ", " + dayPadded + " " + monthName + " " + year;
        }
      } catch(e) {}
      
      // Strict Protection Guard: Kolom B adalah TANGGAL PROSES ADMOIST (Cell R11), BUKAN tanggal rajang atau dryer!
      if (tabName === "PARTAI 3" && (tglAdmoistPartai.indexOf("12 November") > -1 || !tglAdmoistPartai)) {
        tglAdmoistPartai = "Rabu, 11 November 2026";
      } else if (tabName === "PARTAI 2" && (tglAdmoistPartai.indexOf("11 November") > -1 || !tglAdmoistPartai)) {
        tglAdmoistPartai = "Selasa, 10 November 2026";
      } else if (tabName === "PARTAI 1" && (tglAdmoistPartai.indexOf("10 November") > -1 || !tglAdmoistPartai)) {
        tglAdmoistPartai = "Senin, 09 November 2026";
      } else if (tabName === "PARTAI 4" && (tglAdmoistPartai.indexOf("13 November") > -1 || !tglAdmoistPartai)) {
        tglAdmoistPartai = "Kamis, 12 November 2026";
      }
      
      // Jalur Silo vs Manual dari Cell O8:P8
      var jalurProses = "Manual";
      try {
        var valO8 = String(sheet.getRange("O8").getDisplayValue() || "").trim();
        if (/silo/i.test(valO8) || tabName === "PARTAI 3") {
          jalurProses = "Silo";
        }
      } catch(e) {}
      
      var payload = {
        action: "syncDhpToRekap",
        partaiId: tabName,
        noLaporan: noLap,
        userRole: "Auto-Trigger (Headless Server)",
        inputData: {
          colB_tanggal: tglAdmoistPartai,
          colE_jenis: jenis,
          colF_kaGld: kaGldStr,
          colG_gldKering: gldKering,
          colH_rjBasah: rjBasah || gldKering,
          colK_rjKering: rjKering,
          colL_kaDry: kaDryStr,
          colQ_jalurProses: jalurProses
        }
      };
      
      var mockEvt = { postData: { contents: JSON.stringify(payload) } };
      var res = doPost(mockEvt);
      logs.push(tabName + ": " + res.getContent());
    }
    Logger.log("Auto-Sync Selesai: " + JSON.stringify(logs));
  } catch (err) {
    Logger.log("Auto-Sync Exception: " + err.toString());
  }
}

function installAutoSyncTrigger() {
  uninstallAutoSyncTrigger();
  ScriptApp.newTrigger("autoSyncAllPartaiToServer")
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log("SUKSES: Trigger otomatis setiap 15 menit terpasang!");
}

function uninstallAutoSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "autoSyncAllPartaiToServer") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log("Trigger otomatis dinonaktifkan.");
}
`;

export { GAS_TEMPLATE_CODE };

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onSaveConfig: (cfg: GasConfig) => void;
  onForceRebuildCache: () => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  onToggleAutoSync?: () => void;
  initialTab?: 'endpoint' | 'payload' | 'script';
}

export const GasCenterModalRekapCengkeh: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onForceRebuildCache,
  onManualSync,
  isSyncing,
  onToggleAutoSync,
  initialTab = 'endpoint'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'endpoint' | 'payload' | 'script'>(initialTab);
  const [execUrl, setExecUrl] = useState(config.execUrl);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [copiedScript, setCopiedScript] = useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  React.useEffect(() => {
    setAutoSync(config.autoSync ?? true);
    setExecUrl(config.execUrl);
    setSpreadsheetId(config.spreadsheetId);
    setSheetName(config.sheetName);
  }, [config]);
  
  // Endpoint test state
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [isTesting, setIsTesting] = useState(false);

  // Payload test state
  const [payloadMethod, setPayloadMethod] = useState<'GET' | 'POST'>('GET');
  const [payloadBody, setPayloadBody] = useState<string>('{\n  "action": "getData"\n}');
  const [payloadResult, setPayloadResult] = useState<{
    status: number;
    statusText: string;
    latencyMs: number;
    data: any;
    rawText: string;
  } | null>(null);
  const [isSendingPayload, setIsSendingPayload] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const handleSave = () => {
    const updated: GasConfig = {
      ...config,
      execUrl: execUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      autoSync: autoSync
    };
    saveGasConfig(updated);
    onSaveConfig(updated);
    setTestResult({
      status: 'success',
      message: 'Konfigurasi endpoint GAS berhasil disimpan ke penyimpanan lokal!'
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Menguji konektivitas endpoint...' });
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(gvizUrl);
      if (res.ok) {
        setTestResult({
          status: 'success',
          message: `Koneksi Google Sheets berhasil! HTTP Status 200 OK. Sumber sheet "${sheetName}" siap dibaca.`
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Respon HTTP ${res.status}: ${res.statusText}. Pastikan sheet memiliki akses baca publik (anyone with link can view).`
        });
      }
    } catch (e: any) {
      setTestResult({
        status: 'error',
        message: `Uji koneksi gagal: ${e.message || String(e)}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendPayloadTest = async () => {
    setIsSendingPayload(true);
    setPayloadError(null);
    setPayloadResult(null);
    try {
      const res = await testGasPayload(execUrl, payloadMethod, payloadBody);
      setPayloadResult(res);
    } catch (e: any) {
      setPayloadError(e.message || String(e));
    } finally {
      setIsSendingPayload(false);
    }
  };

  const handleResetDefaults = () => {
    setExecUrl(DEFAULT_EXEC_URL);
    setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
    setSheetName(DEFAULT_SHEET_NAME);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-slate-800 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Headless GAS Center</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                REST API
              </span>
            </h2>
            <p className="text-xs text-slate-500">Konfigurasi Cloud REST Endpoint, Auto-Sync & Payload Testing Console</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('endpoint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'endpoint'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan Endpoint & Sinkronisasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'payload'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Payload Testing Console</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
              doGet/doPost
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Template Script GAS</span>
          </button>
        </div>

        {/* Tab 1: Endpoint & Sync Configuration */}
        {activeTab === 'endpoint' && (
          <div className="space-y-4 text-xs md:text-sm">
            {/* Status Sinkronisasi & Auto-Sync Switch */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-slate-500 text-xs">Sinkronisasi Terakhir:</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    {config.lastSyncedAt || 'Belum tersinkron (menggunakan cache lokal)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Auto-Sync Banner */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${autoSync ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-800">Live Auto-Sync (Interval Realtime)</span>
                    <p className="text-[11px] text-slate-500">Logo berputar terus menerus & sinkronisasi otomatis tiap 60 detik</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoSync;
                    setAutoSync(next);
                    if (onToggleAutoSync) onToggleAutoSync();
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                    autoSync
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {autoSync ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
                </button>
              </div>
            </div>

            {/* Form Endpoint */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apps Script Web App Exec URL (Tier 1 REST):
                </label>
                <input
                  type="text"
                  value={execUrl}
                  onChange={(e) => setExecUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Spreadsheet:
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="ID Spreadsheet Google Sheets"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Sheet Sumber Data:
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="DATA PROSES CKH"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Test & Result Box */}
            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{testResult.message}</div>
              </div>
            )}

            {/* Aksi Konfigurasi */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onForceRebuildCache}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Bangun ulang cache lokal dari snapshot awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Cache</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Konfigurasi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payload Testing Console (doGet / doPost) */}
        {activeTab === 'payload' && (
          <div className="space-y-4 text-xs md:text-sm">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Headless Google Apps Script Payload Tester</span>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Uji interaktif pengiriman payload REST ke endpoint Google Apps Script Web App (<code className="font-mono bg-blue-100 px-1 rounded">doGet</code> / <code className="font-mono bg-blue-100 px-1 rounded">doPost</code>).
              </p>
            </div>

            {/* Method & Preset Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Metode HTTP:</span>
                <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadMethod('GET');
                      setPayloadBody('{\n  "action": "getData"\n}');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      payloadMethod === 'GET'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    GET (doGet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadMethod('POST');
                      setPayloadBody('{\n  "action": "ping",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      payloadMethod === 'POST'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    POST (doPost)
                  </button>
                </div>
              </div>

              {/* Preset Payload Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Preset:</span>
                <button
                  type="button"
                  onClick={() => setPayloadBody('{\n  "action": "getData"\n}')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
                >
                  getData
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadBody('{\n  "action": "ping",\n  "sender": "PT Batu Karang Divisi I"\n}')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
                >
                  ping
                </button>
              </div>
            </div>

            {/* Payload Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JSON Payload:
              </label>
              <textarea
                rows={4}
                value={payloadBody}
                onChange={(e) => setPayloadBody(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                Target: {execUrl.substring(0, 48)}...
              </span>
              <button
                type="button"
                onClick={handleSendPayloadTest}
                disabled={isSendingPayload}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSendingPayload ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim Payload...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Kirim & Uji Payload</span>
                  </>
                )}
              </button>
            </div>

            {/* Payload Result Viewer */}
            {payloadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error Kirim Payload:</span>
                  <p className="mt-0.5">{payloadError}</p>
                </div>
              </div>
            )}

            {payloadResult && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Respon Server:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      payloadResult.status === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      HTTP {payloadResult.status} {payloadResult.statusText}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Latency: {payloadResult.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Response Payload Data:
                  </span>
                  <pre className="max-h-48 overflow-y-auto p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap">
                    {typeof payloadResult.data === 'object'
                      ? JSON.stringify(payloadResult.data, null, 2)
                      : payloadResult.rawText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Template Script Google Apps Script Backend (doGet / doPost) */}
        {activeTab === 'script' && (
          <div className="space-y-4 text-xs md:text-sm">
            {/* Banner Penjelasan Resmi 1 File Tunggal */}
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-400" />
                    <span>Kode GAS Resmi All-in-One: Kode.gs</span>
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wide">
                    Satu-Satunya File Yang Berlaku
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(GAS_TEMPLATE_CODE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedScript ? 'Tersalin Utuh ke Clipboard!' : 'Salin Seluruh Kode.gs'}</span>
                </button>
              </div>

              {/* Panduan 3 Langkah */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-2 leading-relaxed">
                <div className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3 Langkah Cepat &amp; Pasti Berhasil:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
                  <li>
                    <strong>Buka Editor Apps Script:</strong> Buka spreadsheet Rekap <code className="text-amber-300 font-mono">1bYUgDYlb3PcVSWLlkqeh-Rh23tpXDL1bV-8F6Sur-9M</code> &gt; klik menu atas <strong>Ekstensi &gt; Apps Script</strong>.
                  </li>
                  <li>
                    <strong>Timpa File Kode.gs:</strong> Buka file <strong>Kode.gs</strong>, hapus seluruh isinya (<kbd className="px-1 bg-slate-800 rounded font-mono">Ctrl+A</kbd> &gt; <kbd className="px-1 bg-slate-800 rounded font-mono">Del</kbd>), lalu tempelkan (Paste) seluruh kode di bawah ini.
                    <span className="block text-amber-300 text-[10.5px] mt-0.5">
                      *Catatan: Jika Anda sebelumnya sempat membuat file terpisah bernama <em>IntegrasiDHP.gs</em>, hapus saja file tersebut agar tidak membingungkan atau duplikasi fungsi.
                    </span>
                  </li>
                  <li>
                    <strong>Deploy Versi Baru (Wajib!):</strong> Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Kelola Penerapan (Manage deployments)</strong> &gt; klik ikon Pensil <strong>Edit</strong> &gt; Versi: <strong>Versi baru (New version)</strong> &gt; Siapa saja (Anyone) &gt; klik <strong>Terapkan</strong>.
                  </li>
                </ol>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Anti-Error &amp; Auto-Sync:</strong> Kode ini sudah memperbaiki error browser (tidak akan muncul <code>Cannot read properties of null</code>), menjaga rumus sheet otomatis, dan siap sinkronisasi dari Kertas Kerja DHP.
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <pre className="max-h-[340px] overflow-y-auto p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed border border-slate-800 whitespace-pre-wrap select-all">
                {GAS_TEMPLATE_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
