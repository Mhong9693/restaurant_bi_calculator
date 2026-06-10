import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

// Check current columns
const [cols] = await conn.execute("SHOW COLUMNS FROM gpSettings");
const colNames = cols.map(c => c.Field);
console.log('Current columns:', colNames.join(', '));

// Rename normalCommission → normalGpPercent if needed
if (colNames.includes('normalCommission') && !colNames.includes('normalGpPercent')) {
  await conn.execute("ALTER TABLE gpSettings CHANGE normalCommission normalGpPercent decimal(5,2) NOT NULL DEFAULT '30'");
  console.log('Renamed normalCommission → normalGpPercent');
}
if (colNames.includes('plusCommission') && !colNames.includes('plusGpPercent')) {
  await conn.execute("ALTER TABLE gpSettings CHANGE plusCommission plusGpPercent decimal(5,2) NOT NULL DEFAULT '23'");
  console.log('Renamed plusCommission → plusGpPercent');
}

// Add new columns if missing
const [cols2] = await conn.execute("SHOW COLUMNS FROM gpSettings");
const colNames2 = cols2.map(c => c.Field);

if (!colNames2.includes('normalVatOnGp')) {
  await conn.execute("ALTER TABLE gpSettings ADD COLUMN normalVatOnGp decimal(5,2) DEFAULT '7' NOT NULL");
  console.log('Added normalVatOnGp');
}
if (!colNames2.includes('normalTotalCost')) {
  await conn.execute("ALTER TABLE gpSettings ADD COLUMN normalTotalCost decimal(10,2) DEFAULT '0' NOT NULL");
  console.log('Added normalTotalCost');
}
if (!colNames2.includes('plusVatOnGp')) {
  await conn.execute("ALTER TABLE gpSettings ADD COLUMN plusVatOnGp decimal(5,2) DEFAULT '7' NOT NULL");
  console.log('Added plusVatOnGp');
}
if (!colNames2.includes('plusTotalCost')) {
  await conn.execute("ALTER TABLE gpSettings ADD COLUMN plusTotalCost decimal(10,2) DEFAULT '0' NOT NULL");
  console.log('Added plusTotalCost');
}

const [finalCols] = await conn.execute("SHOW COLUMNS FROM gpSettings");
console.log('Final columns:', finalCols.map(c => c.Field).join(', '));
console.log('Migration complete!');
await conn.end();
