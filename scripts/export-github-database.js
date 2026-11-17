// Export schema and deployable content; keep credentials and user records local.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const db = require('../db-adapter');
const root = path.resolve(__dirname, '..');
const config = db.mysqlConfig();
const dump = path.join(path.dirname(config.cli), 'mysqldump.exe');
const contentTables = ['app_state','quiz_questions','safety_cases','safety_education_tasks','source_pool'];
const common = ['--host',config.host,'--port',String(config.port),'--user',config.user,'--default-character-set=utf8mb4','--single-transaction','--skip-lock-tables','--set-gtid-purged=OFF','--no-tablespaces','--skip-comments','--skip-triggers'];
function run(extra) {
  const result = spawnSync(dump,[...common,...extra],{env:{...process.env,MYSQL_PWD:config.password},windowsHide:true,encoding:'utf8',maxBuffer:64*1024*1024});
  if (result.error || result.status !== 0) throw new Error('数据库导出失败，请检查 MySQL 服务和导出工具。');
  return result.stdout;
}
const schema = run(['--no-data',config.database]);
const content = run(['--no-create-info',config.database,...contentTables]);
const output = path.join(root,'database','nankai_security_guard_public_seed.sql');
fs.writeFileSync(output,'-- Latest deployable database: schema and project content.\n-- Accounts, password hashes, personal identities and learning records are excluded.\n-- Import into a NEW empty database; this script recreates tables.\n\n'+schema+'\n'+content);
const fallback = JSON.parse(fs.readFileSync(path.join(root,'data','safety-case-db.json'),'utf8'));
const current = db.readMysqlDatabase(fallback);
const snapshot = {schemaVersion:current.schemaVersion || fallback.schemaVersion,updatedAt:current.updatedAt,sourcePool:current.sourcePool || [],cases:current.cases || [],collection:current.collection || {}};
fs.writeFileSync(path.join(root,'data','safety-case-db.json'),JSON.stringify(snapshot,null,2)+'\n');
console.log('导出完成：完整表结构、题库、案例、学习任务、来源与应用状态。');
console.log('当前案例数：'+snapshot.cases.length+'；SQL 字节数：'+fs.statSync(output).size);
