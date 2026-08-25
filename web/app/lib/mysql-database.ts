import mysql, { type Pool, type ResultSetHeader } from "mysql2/promise";
import { hashPassword } from "./password";

let pool: Pool | undefined;
function getPool(){
  pool ??= mysql.createPool({host:process.env.MYSQL_HOST||"127.0.0.1",port:Number(process.env.MYSQL_PORT||3306),database:process.env.MYSQL_DATABASE||"kemaritiman_polbeng",user:process.env.MYSQL_USER||"kemaritiman_app",password:process.env.MYSQL_PASSWORD,connectionLimit:10,charset:"utf8mb4"});
  return pool;
}

class Statement {
  params:unknown[]=[];
  constructor(public sql:string){}
  bind(...params:unknown[]){this.params=params;return this}
  async run(){const [result]=await getPool().execute<ResultSetHeader>(this.sql,this.params);return {meta:{last_row_id:result.insertId},changes:result.affectedRows}}
  async first<T>(){const [rows]=await getPool().execute(this.sql,this.params);return ((rows as T[])[0]??null) as T|null}
  async all<T>(){const [rows]=await getPool().execute(this.sql,this.params);return {results:rows as T[]}}
}
class Database {prepare(sql:string){return new Statement(sql)} async batch(statements:Statement[]){return Promise.all(statements.map(s=>s.run()))}}
const db=new Database();

const tables=[
`CREATE TABLE IF NOT EXISTS app_settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value TEXT NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY AUTO_INCREMENT,email VARCHAR(190) NOT NULL UNIQUE,name VARCHAR(190) NOT NULL,role VARCHAR(30) NOT NULL,unit_id VARCHAR(30) NOT NULL DEFAULT 'UPPS',active TINYINT(1) NOT NULL DEFAULT 1) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS auth_credentials (user_id BIGINT PRIMARY KEY,password_salt VARCHAR(100) NOT NULL,password_hash VARCHAR(100) NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS auth_sessions (token_hash VARCHAR(100) PRIMARY KEY,user_id BIGINT NOT NULL,expires_at BIGINT NOT NULL,INDEX idx_sessions_expiry(expires_at),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS kpis (id BIGINT PRIMARY KEY AUTO_INCREMENT,code VARCHAR(50) NOT NULL UNIQUE,name VARCHAR(255) NOT NULL,category VARCHAR(100) NOT NULL,unit_id VARCHAR(30) NOT NULL,target DECIMAL(8,2) NOT NULL DEFAULT 0,actual DECIMAL(8,2) NOT NULL DEFAULT 0,year INT NOT NULL,source VARCHAR(100) NOT NULL,formula_type VARCHAR(30) NOT NULL,active TINYINT(1) NOT NULL DEFAULT 1,INDEX idx_kpis_unit_year(unit_id,year)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS documents (id BIGINT PRIMARY KEY AUTO_INCREMENT,title VARCHAR(255) NOT NULL,type VARCHAR(50) NOT NULL,unit_id VARCHAR(30) NOT NULL,year INT NOT NULL,visibility VARCHAR(30) NOT NULL,url TEXT NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS outcome_results (id BIGINT PRIMARY KEY AUTO_INCREMENT,program_id VARCHAR(30) NOT NULL,code VARCHAR(50) NOT NULL,name VARCHAR(255) NOT NULL,score DECIMAL(8,2) NOT NULL,semester VARCHAR(80) NOT NULL,target DECIMAL(8,2) NOT NULL DEFAULT 80,upload_id BIGINT NULL,INDEX idx_outcomes_program(program_id,semester)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS repositories (id BIGINT PRIMARY KEY AUTO_INCREMENT,title VARCHAR(255) NOT NULL,author VARCHAR(190) NOT NULL,year INT NOT NULL,type VARCHAR(50) NOT NULL,program_id VARCHAR(30) NOT NULL,url TEXT NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS laboratories (id BIGINT PRIMARY KEY AUTO_INCREMENT,name VARCHAR(255) NOT NULL,field VARCHAR(255) NOT NULL,equipment_count INT NOT NULL,member_count INT NOT NULL,roadmap_progress DECIMAL(8,2) NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS academic_records (id BIGINT PRIMARY KEY AUTO_INCREMENT,year INT NOT NULL,program_id VARCHAR(30) NOT NULL,graduated INT NOT NULL,graduated_on_time INT NOT NULL,upload_id BIGINT NULL,UNIQUE KEY uq_academic(year,program_id)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS tracer_records (id BIGINT PRIMARY KEY AUTO_INCREMENT,year INT NOT NULL,program_id VARCHAR(30) NOT NULL,traced INT NOT NULL,employed_within_6_months INT NOT NULL,upload_id BIGINT NULL,UNIQUE KEY uq_tracer(year,program_id)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS laboratory_usage (id BIGINT PRIMARY KEY AUTO_INCREMENT,year INT NOT NULL,laboratory_id BIGINT NOT NULL,available_hours DECIMAL(10,2) NOT NULL,used_hours DECIMAL(10,2) NOT NULL,upload_id BIGINT NULL,UNIQUE KEY uq_lab_usage(year,laboratory_id),FOREIGN KEY(laboratory_id) REFERENCES laboratories(id)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS evidence_uploads (id BIGINT PRIMARY KEY AUTO_INCREMENT,file_name VARCHAR(255) NOT NULL,mime_type VARCHAR(120) NOT NULL,file_size BIGINT NOT NULL,file_data MEDIUMBLOB NOT NULL,instrument_type VARCHAR(50) NOT NULL,unit_id VARCHAR(30) NOT NULL,year INT NOT NULL,uploaded_by VARCHAR(190) NOT NULL,row_count INT NOT NULL DEFAULT 0,checksum VARCHAR(100) NOT NULL,created_at BIGINT NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS lecturers (id BIGINT PRIMARY KEY AUTO_INCREMENT,nidn VARCHAR(50) UNIQUE,name VARCHAR(190) NOT NULL,program_id VARCHAR(30) NOT NULL,email VARCHAR(190),expertise VARCHAR(255),scholar_id VARCHAR(100),scholar_url TEXT,photo_url TEXT,active TINYINT(1) NOT NULL DEFAULT 1) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS audit_logs (id BIGINT PRIMARY KEY AUTO_INCREMENT,user_email VARCHAR(190) NOT NULL,role VARCHAR(30) NOT NULL,action VARCHAR(80) NOT NULL,entity VARCHAR(80) NOT NULL,entity_id VARCHAR(100),created_at BIGINT NOT NULL) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS workflow_items (id BIGINT PRIMARY KEY AUTO_INCREMENT,entity_type VARCHAR(50) NOT NULL,entity_id BIGINT NULL,unit_id VARCHAR(30) NOT NULL,year INT NOT NULL,title VARCHAR(255) NOT NULL,stage VARCHAR(30) NOT NULL DEFAULT 'PELAKSANAAN',status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',owner_email VARCHAR(190) NOT NULL,reviewer_email VARCHAR(190) NULL,approved_by VARCHAR(190) NULL,finding TEXT NULL,recommendation TEXT NULL,corrective_action TEXT NULL,due_at BIGINT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,INDEX idx_workflow_unit_status(unit_id,status),INDEX idx_workflow_entity(entity_type,entity_id)) ENGINE=InnoDB`,
`CREATE TABLE IF NOT EXISTS workflow_events (id BIGINT PRIMARY KEY AUTO_INCREMENT,workflow_id BIGINT NOT NULL,from_status VARCHAR(30) NULL,to_status VARCHAR(30) NOT NULL,actor_email VARCHAR(190) NOT NULL,actor_role VARCHAR(30) NOT NULL,note TEXT NULL,created_at BIGINT NOT NULL,FOREIGN KEY(workflow_id) REFERENCES workflow_items(id) ON DELETE CASCADE,INDEX idx_workflow_events(workflow_id,created_at)) ENGINE=InnoDB`
];

const seeds=[
`INSERT IGNORE INTO users(email,name,role,unit_id) VALUES ('admin@polbeng.ac.id','Administrator Portal','ADMIN','UPPS'),('kajur@polbeng.ac.id','Ketua Jurusan','KAJUR','UPPS'),('sekjur@polbeng.ac.id','Sekretaris Jurusan','SEKJUR','UPPS'),('kaprodi.nautika@polbeng.ac.id','Kaprodi Nautika','KAPRODI','NAUTIKA'),('kaprodi.kpn@polbeng.ac.id','Kaprodi KPN','KAPRODI','KPN'),('gkm@polbeng.ac.id','Gugus Kendali Mutu','GKM','UPPS')`,
`INSERT IGNORE INTO kpis(code,name,category,unit_id,target,actual,year,source,formula_type) VALUES ('KPI-01','Capaian pembelajaran lulusan','Akademik','UPPS',80,0,2026,'OBE Prodi','AVERAGE_OBE'),('KPI-02','Kelulusan tepat waktu','Akademik','UPPS',85,0,2026,'Data Kelulusan','RATIO_GRADUATION'),('KPI-03','Serapan lulusan ≤ 6 bulan','Tracer','UPPS',75,0,2026,'Tracer Study','RATIO_TRACER'),('KPI-04','Pemanfaatan laboratorium','Sarana','UPPS',80,0,2026,'Log Laboratorium','RATIO_LAB')`,
`INSERT IGNORE INTO laboratories(id,name,field,equipment_count,member_count,roadmap_progress) VALUES (1,'Bridge & Navigation Simulator','Navigasi dan keselamatan pelayaran',18,12,84),(2,'Laboratorium Kepelabuhanan','Operasional pelabuhan dan bongkar muat',32,9,76),(3,'Laboratorium Bahari','Keselamatan, meteorologi, dan lingkungan',24,11,81)`
];

let credentialsSecured=false;
async function secureLegacyCredentials(){
  if(credentialsSecured)return;
  credentialsSecured=true;
  const marker=await db.prepare("SELECT setting_value FROM app_settings WHERE setting_key='legacy_default_credentials_rotated'").first<{setting_value:string}>();
  if(marker)return;
  const credentials=await db.prepare("SELECT user_id AS userId,password_salt AS salt,password_hash AS passwordHash FROM auth_credentials").all<{userId:number;salt:string;passwordHash:string}>();
  for(const credential of credentials.results){
    const legacyHash=await hashPassword("Polbeng#2026",credential.salt);
    if(legacyHash===credential.passwordHash){
      await db.prepare("DELETE FROM auth_sessions WHERE user_id=?").bind(credential.userId).run();
      await db.prepare("DELETE FROM auth_credentials WHERE user_id=?").bind(credential.userId).run();
    }
  }
  const bootstrap=process.env.INITIAL_ADMIN_PASSWORD;
  if(bootstrap){
    const admin=await db.prepare("SELECT u.id FROM users u LEFT JOIN auth_credentials c ON c.user_id=u.id WHERE u.role='ADMIN' AND c.user_id IS NULL ORDER BY u.id LIMIT 1").first<{id:number}>();
    if(admin){const salt=crypto.randomUUID();await db.prepare("INSERT INTO auth_credentials(user_id,password_salt,password_hash) VALUES (?,?,?)").bind(admin.id,salt,await hashPassword(bootstrap,salt)).run()}
  }
  await db.prepare("INSERT INTO app_settings(setting_key,setting_value) VALUES ('legacy_default_credentials_rotated','1') ON DUPLICATE KEY UPDATE setting_value='1'").run();
}

let evidenceMigrated=false;
async function migrateLegacyEvidenceWorkflows(){
  if(evidenceMigrated)return;
  evidenceMigrated=true;
  const marker=await db.prepare("SELECT setting_value FROM app_settings WHERE setting_key='legacy_evidence_workflow_migrated'").first<{setting_value:string}>();
  if(marker)return;
  const rows=await db.prepare("SELECT e.id,e.file_name AS fileName,e.instrument_type AS instrument,e.unit_id AS unitId,e.year,e.uploaded_by AS uploadedBy,e.created_at AS createdAt FROM evidence_uploads e LEFT JOIN workflow_items w ON w.entity_type=e.instrument_type AND w.entity_id=e.id WHERE w.id IS NULL ORDER BY e.id").all<{id:number;fileName:string;instrument:string;unitId:string;year:number;uploadedBy:string;createdAt:number}>();
  const now=Date.now();
  for(const row of rows.results){
    const saved=await db.prepare("INSERT INTO workflow_items(entity_type,entity_id,unit_id,year,title,stage,status,owner_email,reviewer_email,approved_by,finding,created_at,updated_at) VALUES (?,?,?,?,?,'PENGENDALIAN','APPROVED',?,'SYSTEM_MIGRATION','SYSTEM_MIGRATION','Migrated from the pre-PPEPP evidence model.',?,?)")
      .bind(row.instrument,row.id,row.unitId,row.year,`Evidence ${row.instrument}: ${row.fileName}`,row.uploadedBy||"SYSTEM_MIGRATION",row.createdAt||now,now).run();
    const workflowId=saved.meta.last_row_id;
    await db.prepare("INSERT INTO workflow_events(workflow_id,from_status,to_status,actor_email,actor_role,note,created_at) VALUES (?,NULL,'APPROVED','SYSTEM_MIGRATION','ADMIN','Legacy evidence accepted as migration baseline; review may be performed after migration.',?)").bind(workflowId,now).run();
    await db.prepare("INSERT INTO audit_logs(user_email,role,action,entity,entity_id,created_at) VALUES ('SYSTEM_MIGRATION','ADMIN','MIGRATE_LEGACY_EVIDENCE','WORKFLOW',?,?)").bind(String(workflowId),now).run();
  }
  await db.prepare("INSERT INTO app_settings(setting_key,setting_value) VALUES ('legacy_evidence_workflow_migrated',?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)").bind(String(rows.results.length)).run();
}

export async function ensureDatabase(){
  for(const sql of tables)await db.prepare(sql).run();
  for(const sql of seeds)await db.prepare(sql).run();
  await secureLegacyCredentials();
  await migrateLegacyEvidenceWorkflows();
  await refreshDerivedKpis(db);
  return db;
}

export async function refreshDerivedKpis(database=db){
  await database.batch([
    database.prepare("UPDATE kpis SET actual=COALESCE((SELECT ROUND(AVG(o.score),2) FROM outcome_results o JOIN workflow_items w ON w.entity_type='OBE' AND w.entity_id=o.upload_id AND w.status IN ('APPROVED','CLOSED') WHERE w.year=kpis.year AND (kpis.unit_id='UPPS' OR w.unit_id=kpis.unit_id)),actual) WHERE formula_type='AVERAGE_OBE'"),
    database.prepare("UPDATE kpis SET actual=COALESCE((SELECT ROUND(100*SUM(a.graduated_on_time)/NULLIF(SUM(a.graduated),0),2) FROM academic_records a JOIN workflow_items w ON w.entity_type='ACADEMIC' AND w.entity_id=a.upload_id AND w.status IN ('APPROVED','CLOSED') WHERE a.year=kpis.year AND (kpis.unit_id='UPPS' OR w.unit_id=kpis.unit_id)),actual) WHERE formula_type='RATIO_GRADUATION'"),
    database.prepare("UPDATE kpis SET actual=COALESCE((SELECT ROUND(100*SUM(t.employed_within_6_months)/NULLIF(SUM(t.traced),0),2) FROM tracer_records t JOIN workflow_items w ON w.entity_type='TRACER' AND w.entity_id=t.upload_id AND w.status IN ('APPROVED','CLOSED') WHERE t.year=kpis.year AND (kpis.unit_id='UPPS' OR w.unit_id=kpis.unit_id)),actual) WHERE formula_type='RATIO_TRACER'"),
    database.prepare("UPDATE kpis SET actual=COALESCE((SELECT ROUND(100*SUM(l.used_hours)/NULLIF(SUM(l.available_hours),0),2) FROM laboratory_usage l JOIN workflow_items w ON w.entity_type='LAB' AND w.entity_id=l.upload_id AND w.status IN ('APPROVED','CLOSED') WHERE l.year=kpis.year),actual) WHERE formula_type='RATIO_LAB'")
  ]);
}
