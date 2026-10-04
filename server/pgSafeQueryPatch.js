import pg from 'pg';

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (!inSingle && !inDouble && char === '$') {
      const rest = sql.slice(index);
      const match = rest.match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        const tag = match[0];
        if (!dollarTag) {
          dollarTag = tag;
          current += tag;
          index += tag.length - 1;
          continue;
        }
        if (dollarTag === tag) {
          dollarTag = null;
          current += tag;
          index += tag.length - 1;
          continue;
        }
      }
    }

    if (!dollarTag && !inDouble && char === "'" && next !== "'") inSingle = !inSingle;
    else if (!dollarTag && !inSingle && char === '"') inDouble = !inDouble;

    if (!inSingle && !inDouble && !dollarTag && char === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += char;
  }

  const last = current.trim();
  if (last) statements.push(last);
  return statements;
}

function valuesForStatement(statement, values) {
  if (!Array.isArray(values)) return undefined;
  let max = 0;
  for (const match of statement.matchAll(/\$(\d+)/g)) {
    max = Math.max(max, Number(match[1]));
  }
  return max > 0 ? values.slice(0, max) : undefined;
}

function isPreparedMultiCommandError(error) {
  return /cannot insert multiple commands into a prepared statement/i.test(String(error?.message || ''));
}

function patchQuery(proto) {
  if (!proto || proto.__neroaSafeQueryPatch) return;
  const originalQuery = proto.query;

  proto.query = function safeQuery(text, values, callback) {
    const cb = typeof values === 'function' ? values : callback;
    const resolvedValues = typeof values === 'function' ? undefined : values;

    const run = async () => {
      try {
        return await originalQuery.call(this, text, resolvedValues);
      } catch (error) {
        if (!isPreparedMultiCommandError(error) || typeof text !== 'string') throw error;
        const statements = splitSqlStatements(text);
        if (statements.length <= 1) throw error;

        let lastResult = { rows: [], rowCount: 0 };
        for (const statement of statements) {
          const statementValues = valuesForStatement(statement, resolvedValues);
          lastResult = await originalQuery.call(this, statement, statementValues);
        }
        return lastResult;
      }
    };

    if (cb) {
      run().then((result) => cb(null, result)).catch((error) => cb(error));
      return undefined;
    }
    return run();
  };

  Object.defineProperty(proto, '__neroaSafeQueryPatch', { value: true });
}

patchQuery(pg.Pool?.prototype);
patchQuery(pg.Client?.prototype);
