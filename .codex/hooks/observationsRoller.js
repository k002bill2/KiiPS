/**
 * Observations Roller - 90일 롤링 아카이브
 *
 * .claude/learning/observations.jsonl 이 1MB 초과 시:
 * 1. 90일 이전 항목을 .claude/learning/archive/observations-YYYY-MM.jsonl.gz 로 이관
 * 2. 살아있는 (90일 이내) 항목은 원본에 유지
 *
 * 호출 위치: SessionStart 또는 Stop 이벤트
 * 정책: fail-open (실패해도 작업 진행)
 *
 * @version 1.0.0-KiiPS
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const OBSERVATIONS = path.join(
  PROJECT_ROOT,
  ".claude/learning/observations.jsonl",
);
const ARCHIVE_DIR = path.join(PROJECT_ROOT, ".claude/learning/archive");

const SIZE_THRESHOLD = 1024 * 1024; // 1MB
const RETENTION_DAYS = 90;
const LOCK_FILE = path.join(PROJECT_ROOT, ".claude/learning/.roller.lock");

function isLocked() {
  try {
    if (!fs.existsSync(LOCK_FILE)) return false;
    const ageMs = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
    if (ageMs > 5 * 60 * 1000) {
      // 5분 넘은 stale lock 제거
      try {
        fs.unlinkSync(LOCK_FILE);
      } catch (_) {}
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

function acquireLock() {
  try {
    fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: "wx" });
    return true;
  } catch (_) {
    return false;
  }
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (_) {}
}

async function rollObservations() {
  if (!fs.existsSync(OBSERVATIONS)) return { skipped: true, reason: "no-file" };

  const stat = fs.statSync(OBSERVATIONS);
  if (stat.size < SIZE_THRESHOLD) {
    return { skipped: true, reason: "below-threshold", size: stat.size };
  }

  if (isLocked()) {
    return { skipped: true, reason: "locked" };
  }
  if (!acquireLock()) {
    return { skipped: true, reason: "lock-failed" };
  }

  try {
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const liveLines = [];
    const archiveBuckets = new Map(); // YYYY-MM -> array of lines

    const rl = readline.createInterface({
      input: fs.createReadStream(OBSERVATIONS, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      let ts = null;
      try {
        const obj = JSON.parse(line);
        ts = obj.timestamp ? Date.parse(obj.timestamp) : null;
      } catch (_) {
        // 손상된 라인은 살림 (안전)
        liveLines.push(line);
        continue;
      }

      if (ts === null || isNaN(ts) || ts >= cutoffMs) {
        liveLines.push(line);
      } else {
        const d = new Date(ts);
        const bucket = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (!archiveBuckets.has(bucket)) archiveBuckets.set(bucket, []);
        archiveBuckets.get(bucket).push(line);
      }
    }

    // 아카이브 (월별)
    const archived = {};
    for (const [bucket, lines] of archiveBuckets) {
      const archivePath = path.join(
        ARCHIVE_DIR,
        `observations-${bucket}.jsonl.gz`,
      );
      const payload = lines.join("\n") + "\n";
      const gz = zlib.gzipSync(payload);
      // 기존 아카이브가 있으면 append (단순 concat 후 재압축)
      if (fs.existsSync(archivePath)) {
        try {
          const existing = zlib.gunzipSync(fs.readFileSync(archivePath));
          const merged = Buffer.concat([existing, Buffer.from(payload)]);
          fs.writeFileSync(archivePath, zlib.gzipSync(merged));
        } catch (_) {
          // 손상된 아카이브는 새 파일로 백업
          fs.writeFileSync(archivePath + ".new", gz);
        }
      } else {
        fs.writeFileSync(archivePath, gz);
      }
      archived[bucket] = lines.length;
    }

    // 원본 재기록 (atomic via temp file)
    const tmp = OBSERVATIONS + ".tmp";
    fs.writeFileSync(
      tmp,
      liveLines.join("\n") + (liveLines.length ? "\n" : ""),
    );
    fs.renameSync(tmp, OBSERVATIONS);

    const result = {
      ok: true,
      originalSize: stat.size,
      newLineCount: liveLines.length,
      archivedBuckets: archived,
      cutoffDate: new Date(cutoffMs).toISOString(),
    };

    // 알림 (stderr)
    const totalArchived = Object.values(archived).reduce((a, b) => a + b, 0);
    if (totalArchived > 0) {
      process.stderr.write(
        `[ObservationsRoller] ${totalArchived} observations rolled to archive ` +
          `(buckets: ${Object.keys(archived).join(", ")})\n`,
      );
    }
    return result;
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    releaseLock();
  }
}

if (require.main === module) {
  // CLI 모드
  rollObservations()
    .then((r) => {
      if (process.env.OBSERVATIONS_ROLLER_VERBOSE === "1") {
        console.log(JSON.stringify(r, null, 2));
      }
      process.exit(0);
    })
    .catch(() => process.exit(0)); // fail-open
}

module.exports = { rollObservations };
