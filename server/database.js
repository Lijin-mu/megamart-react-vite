import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);
const wasmDirectory = dirname(require.resolve('sql.js'));

export async function openDatabase(filename) {
  const absolutePath = resolve(filename);
  mkdirSync(dirname(absolutePath), { recursive: true });
  const SQL = await initSqlJs({
    locateFile: (file) => resolve(wasmDirectory, file),
  });
  const sqlite = existsSync(absolutePath)
    ? new SQL.Database(new Uint8Array(readFileSync(absolutePath)))
    : new SQL.Database();
  let transactionDepth = 0;

  function persist() {
    if (transactionDepth === 0) {
      writeFileSync(absolutePath, Buffer.from(sqlite.export()));
    }
  }

  function bind(statement, parameters) {
    if (parameters.length) statement.bind(parameters);
  }

  const database = {
    exec(sql) {
      sqlite.exec(sql);
      persist();
    },
    pragma(statement) {
      sqlite.exec(`PRAGMA ${statement}`);
    },
    prepare(sql) {
      return {
        all(...parameters) {
          const statement = sqlite.prepare(sql);
          try {
            bind(statement, parameters);
            const rows = [];
            while (statement.step()) rows.push(statement.getAsObject());
            return rows;
          } finally {
            statement.free();
          }
        },
        get(...parameters) {
          const statement = sqlite.prepare(sql);
          try {
            bind(statement, parameters);
            return statement.step() ? statement.getAsObject() : undefined;
          } finally {
            statement.free();
          }
        },
        run(...parameters) {
          const statement = sqlite.prepare(sql);
          try {
            bind(statement, parameters);
            while (statement.step()) {
              // Consume any returned rows before finalizing the statement.
            }
          } catch (error) {
            if (/UNIQUE constraint failed/i.test(error.message)) {
              error.code = 'SQLITE_CONSTRAINT_UNIQUE';
            }
            throw error;
          } finally {
            statement.free();
          }
          const changes = sqlite.getRowsModified();
          persist();
          return { changes };
        },
      };
    },
    transaction(callback) {
      return (...args) => {
        sqlite.run('BEGIN');
        transactionDepth += 1;
        try {
          const result = callback(...args);
          sqlite.run('COMMIT');
          transactionDepth -= 1;
          persist();
          return result;
        } catch (error) {
          sqlite.run('ROLLBACK');
          transactionDepth -= 1;
          throw error;
        }
      };
    },
  };

  return database;
}
