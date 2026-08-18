import { env } from "cloudflare:workers";
import { hashPassword } from "./password";

const tables = [
  `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, unit_id TEXT NOT NULL DEFAULT 'UPPS', active INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS kpis (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, unit_id TEXT NOT NULL, target REAL NOT NULL, actual REAL NOT NULL, year INTEGER NOT NULL, source TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT NOT NULL, unit_id TEXT NOT NULL, year INTEGER NOT NULL, visibility TEXT NOT NULL, url TEXT NOT NULL DEFAULT '#')`,
  `CREATE TABLE IF NOT EXISTS outcome_results (id INTEGER PRIMARY KEY AUTOINCREMENT, program_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, score REAL NOT NULL, semester TEXT NOT NULL, target REAL NOT NULL DEFAULT 80)`,
  `CREATE TABLE IF NOT EXISTS repositories (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, author TEXT NOT NULL, year INTEGER NOT NULL, type TEXT NOT NULL, program_id TEXT NOT NULL, url TEXT NOT NULL DEFAULT '#')`,
  `CREATE TABLE IF NOT EXISTS laboratories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, field TEXT NOT NULL, equipment_count INTEGER NOT NULL, member_count INTEGER NOT NULL, roadmap_progress REAL NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS auth_credentials (user_id INTEGER PRIMARY KEY, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS academic_records (id INTEGER PRIMARY KEY AUTOINCREMENT, year INTEGER NOT NULL, program_id TEXT NOT NULL, graduated INTEGER NOT NULL, graduated_on_time INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tracer_records (id INTEGER PRIMARY KEY AUTOINCREMENT, year INTEGER NOT NULL, program_id TEXT NOT NULL, traced INTEGER NOT NULL, employed_within_6_months INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS laboratory_usage (id INTEGER PRIMARY KEY AUTOINCREMENT, year INTEGER NOT NULL, laboratory_id INTEGER NOT NULL, available_hours REAL NOT NULL, used_hours REAL NOT NULL, FOREIGN KEY(laboratory_id) REFERENCES laboratories(id))`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, role TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, created_at INTEGER NOT NULL)`,
];

const indexes = [
  `CREATE INDEX IF NOT EXISTS idx_kpis_unit_year ON kpis(unit_id, year)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_unit ON documents(unit_id)`,
  `CREATE INDEX IF NOT EXISTS idx_outcomes_program ON outcome_results(program_id, semester)`,
  `CREATE INDEX IF NOT EXISTS idx_repositories_program_year ON repositories(program_id, year)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON auth_sessions(expires_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_usage_year_lab ON laboratory_usage(year,laboratory_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_year_program ON academic_records(year,program_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tracer_year_program ON tracer_records(year,program_id)`,
];

const seedStatements = [
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('admin@polbeng.ac.id','Administrator Portal','ADMIN','UPPS')`,
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('kajur@polbeng.ac.id','Ketua Jurusan','KAJUR','UPPS')`,
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('kaprodi.nautika@polbeng.ac.id','Kaprodi Nautika','KAPRODI','NAUTIKA')`,
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('kaprodi.kpn@polbeng.ac.id','Kaprodi KPN','KAPRODI','KPN')`,
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('gkm@polbeng.ac.id','Gugus Kendali Mutu','GKM','UPPS')`,
  `INSERT OR IGNORE INTO users(email,name,role,unit_id) VALUES ('sekjur@polbeng.ac.id','Sekretaris Jurusan','SEKJUR','UPPS')`,
  `INSERT OR IGNORE INTO kpis(code,name,category,unit_id,target,actual,year,source) VALUES ('KPI-01','Capaian pembelajaran lulusan','Akademik','UPPS',80,84,2026,'OBE Prodi')`,
  `INSERT OR IGNORE INTO kpis(code,name,category,unit_id,target,actual,year,source) VALUES ('KPI-02','Kelulusan tepat waktu','Akademik','UPPS',85,82,2026,'Akademik')`,
  `INSERT OR IGNORE INTO kpis(code,name,category,unit_id,target,actual,year,source) VALUES ('KPI-03','Serapan lulusan ≤ 6 bulan','Tracer','UPPS',75,78,2026,'Tracer Study')`,
  `INSERT OR IGNORE INTO kpis(code,name,category,unit_id,target,actual,year,source) VALUES ('KPI-04','Pemanfaatan laboratorium','Sarana','UPPS',80,86,2026,'Laboratorium')`,
  `INSERT OR IGNORE INTO documents(title,type,unit_id,year,visibility) VALUES ('Renstra Jurusan Kemaritiman 2025–2029','RENSTRA','UPPS',2025,'PUBLIK')`,
  `INSERT OR IGNORE INTO documents(title,type,unit_id,year,visibility) VALUES ('Dokumen VMTS D3 Nautika','VMTS','NAUTIKA',2025,'PUBLIK')`,
  `INSERT OR IGNORE INTO documents(title,type,unit_id,year,visibility) VALUES ('Kurikulum OBE D3 KPN 2024','KURIKULUM','KPN',2024,'PUBLIK')`,
  `INSERT OR IGNORE INTO outcome_results(program_id,code,name,score,semester,target) VALUES ('NAUTIKA','CPL-01','Menerapkan prinsip keselamatan pelayaran',88,'2025/2026 Genap',80)`,
  `INSERT OR IGNORE INTO outcome_results(program_id,code,name,score,semester,target) VALUES ('NAUTIKA','CPL-02','Menyelesaikan masalah operasional maritim',82,'2025/2026 Genap',80)`,
  `INSERT OR IGNORE INTO outcome_results(program_id,code,name,score,semester,target) VALUES ('KPN','CPL-01','Menerapkan prinsip keselamatan pelayaran',83,'2025/2026 Genap',80)`,
  `INSERT OR IGNORE INTO outcome_results(program_id,code,name,score,semester,target) VALUES ('KPN','CPL-02','Menyelesaikan masalah operasional maritim',86,'2025/2026 Genap',80)`,
  `INSERT OR IGNORE INTO repositories(title,author,year,type,program_id) VALUES ('Analisis Keselamatan Navigasi di Selat Malaka','Rizky Saputra',2025,'Tugas Akhir','NAUTIKA')`,
  `INSERT OR IGNORE INTO repositories(title,author,year,type,program_id) VALUES ('Optimalisasi Bongkar Muat Curah Cair','Nabila Putri',2025,'Tugas Akhir','KPN')`,
  `INSERT OR IGNORE INTO laboratories(name,field,equipment_count,member_count,roadmap_progress) VALUES ('Bridge & Navigation Simulator','Navigasi dan keselamatan pelayaran',18,12,84)`,
  `INSERT OR IGNORE INTO laboratories(name,field,equipment_count,member_count,roadmap_progress) VALUES ('Laboratorium Kepelabuhanan','Operasional pelabuhan dan bongkar muat',32,9,76)`,
  `INSERT OR IGNORE INTO laboratories(name,field,equipment_count,member_count,roadmap_progress) VALUES ('Laboratorium Bahari','Keselamatan, meteorologi, dan lingkungan',24,11,81)`,
  `INSERT OR IGNORE INTO academic_records(year,program_id,graduated,graduated_on_time) VALUES (2026,'NAUTIKA',46,38)`,
  `INSERT OR IGNORE INTO academic_records(year,program_id,graduated,graduated_on_time) VALUES (2026,'KPN',44,36)`,
  `INSERT OR IGNORE INTO tracer_records(year,program_id,traced,employed_within_6_months) VALUES (2026,'NAUTIKA',42,33)`,
  `INSERT OR IGNORE INTO tracer_records(year,program_id,traced,employed_within_6_months) VALUES (2026,'KPN',40,31)`,
  `INSERT OR IGNORE INTO laboratory_usage(year,laboratory_id,available_hours,used_hours) SELECT 2026,id,1000,860 FROM laboratories`,
  `INSERT OR REPLACE INTO app_settings(key,value) VALUES ('seed_version','2')`,
];

export function getD1() {
  if (!env.DB) throw new Error("Database DB belum terhubung.");
  return env.DB;
}

export async function ensureDatabase() {
  const db = getD1();
  await db.batch([...tables, ...indexes].map((sql) => db.prepare(sql)));
  const seeded = await db.prepare("SELECT value FROM app_settings WHERE key = ?").bind("seed_version").first<{value:string}>();
  if (seeded?.value !== "2") await db.batch(seedStatements.map((sql) => db.prepare(sql)));
  const credentialCount = await db.prepare("SELECT COUNT(*) AS count FROM auth_credentials").first<{count:number}>();
  if (!credentialCount?.count) {
    const accounts = await db.prepare("SELECT id,email FROM users WHERE active=1").all<{id:number;email:string}>();
    const statements = [];
    for (const account of accounts.results) {
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword("Polbeng#2026", salt);
      statements.push(db.prepare("INSERT OR IGNORE INTO auth_credentials(user_id,password_salt,password_hash) VALUES (?,?,?)").bind(account.id,salt,passwordHash));
    }
    if (statements.length) await db.batch(statements);
  }
  await refreshDerivedKpis(db);
  return db;
}

export async function refreshDerivedKpis(db = getD1()) {
  await db.batch([
    db.prepare(`UPDATE kpis SET actual = COALESCE((SELECT ROUND(AVG(score),2) FROM outcome_results),0) WHERE code = 'KPI-01'`),
    db.prepare(`UPDATE kpis SET actual = COALESCE((SELECT ROUND(100.0 * SUM(graduated_on_time) / NULLIF(SUM(graduated),0),2) FROM academic_records WHERE year = kpis.year),0) WHERE code = 'KPI-02'`),
    db.prepare(`UPDATE kpis SET actual = COALESCE((SELECT ROUND(100.0 * SUM(employed_within_6_months) / NULLIF(SUM(traced),0),2) FROM tracer_records WHERE year = kpis.year),0) WHERE code = 'KPI-03'`),
    db.prepare(`UPDATE kpis SET actual = COALESCE((SELECT ROUND(100.0 * SUM(used_hours) / NULLIF(SUM(available_hours),0),2) FROM laboratory_usage WHERE year = kpis.year),0) WHERE code = 'KPI-04'`),
  ]);
}
