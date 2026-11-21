/**
 * Formula fields (1.0.15, state_records_pipeline.md): a small, safe
 * expression language. No `eval`: formulas are parsed into a tree and the
 * tree is evaluated against one row (a header or one line).
 *
 *   numbers           12, 0.5
 *   field api names   line_quantity, unit_cost
 *   operators         + - * /  ( )  and comparisons = <> < > <= >=
 *   functions         SUM(a, b, …)  ROUND(x, places)  MIN(…)  MAX(…)
 *                     IF(condition, then, else)  FIRST(a, b, …)
 *
 * Empty fields count as 0 in arithmetic. FIRST returns the first value that
 * is not empty. Division by zero gives an empty result. Comparisons give
 * 1 (true) or 0 (false). No disk or DB access here, so forms can use it for
 * a live preview and the server uses it when saving.
 */

export type FormulaNode =
  | { kind: "num"; value: number }
  | { kind: "ref"; name: string }
  | { kind: "neg"; arg: FormulaNode }
  | { kind: "bin"; op: "+" | "-" | "*" | "/" | "=" | "<>" | "<" | ">" | "<=" | ">="; left: FormulaNode; right: FormulaNode }
  | { kind: "call"; fn: FormulaFunction; args: FormulaNode[] };

export const FORMULA_FUNCTIONS = ["SUM", "ROUND", "MIN", "MAX", "IF", "FIRST"] as const;
export type FormulaFunction = (typeof FORMULA_FUNCTIONS)[number];

export type CompiledFormula =
  | { ok: true; ast: FormulaNode; refs: string[] }
  | { ok: false; error: string };

type Token =
  | { t: "num"; v: number; at: number }
  | { t: "id"; v: string; at: number }
  | { t: "op"; v: string; at: number }
  | { t: "end"; at: number };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(text.slice(i));
      if (!m) throw new Error(`Unexpected "${c}" at position ${i + 1}.`);
      tokens.push({ t: "num", v: Number(m[1]), at: i });
      i += m[1].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i))!;
      tokens.push({ t: "id", v: m[0], at: i });
      i += m[0].length;
      continue;
    }
    const two = text.slice(i, i + 2);
    if (two === "<>" || two === "<=" || two === ">=") {
      tokens.push({ t: "op", v: two, at: i });
      i += 2;
      continue;
    }
    if ("+-*/(),=<>".includes(c)) {
      tokens.push({ t: "op", v: c, at: i });
      i++;
      continue;
    }
    throw new Error(`Unexpected "${c}" at position ${i + 1}.`);
  }
  tokens.push({ t: "end", at: text.length });
  return tokens;
}

function parse(text: string): FormulaNode {
  const tokens = tokenize(text);
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => {
    const tok = peek();
    return tok.t === "op" && tok.v === v;
  };
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`Expected "${v}" at position ${peek().at + 1}.`);
    pos++;
  };

  const comparison = (): FormulaNode => {
    let left = additive();
    for (;;) {
      const tok = peek();
      if (tok.t === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(tok.v)) {
        pos++;
        left = { kind: "bin", op: tok.v as "=", left, right: additive() };
      } else return left;
    }
  };
  const additive = (): FormulaNode => {
    let left = multiplicative();
    while (isOp("+") || isOp("-")) {
      const op = (peek() as { v: string }).v as "+" | "-";
      pos++;
      left = { kind: "bin", op, left, right: multiplicative() };
    }
    return left;
  };
  const multiplicative = (): FormulaNode => {
    let left = unary();
    while (isOp("*") || isOp("/")) {
      const op = (peek() as { v: string }).v as "*" | "/";
      pos++;
      left = { kind: "bin", op, left, right: unary() };
    }
    return left;
  };
  const unary = (): FormulaNode => {
    if (isOp("-")) {
      pos++;
      return { kind: "neg", arg: unary() };
    }
    if (isOp("+")) {
      pos++;
      return unary();
    }
    return primary();
  };
  const primary = (): FormulaNode => {
    const tok = peek();
    if (tok.t === "num") {
      pos++;
      return { kind: "num", value: tok.v };
    }
    if (tok.t === "id") {
      pos++;
      if (isOp("(")) {
        const fn = tok.v.toUpperCase();
        if (!(FORMULA_FUNCTIONS as readonly string[]).includes(fn)) {
          throw new Error(`Unknown function ${tok.v}. Use ${FORMULA_FUNCTIONS.join(", ")}.`);
        }
        pos++;
        const args: FormulaNode[] = [];
        if (!isOp(")")) {
          args.push(comparison());
          while (isOp(",")) {
            pos++;
            args.push(comparison());
          }
        }
        expect(")");
        if (fn === "IF" && args.length !== 3) throw new Error("IF needs three parts: IF(condition, then, else).");
        if (fn === "ROUND" && (args.length < 1 || args.length > 2)) throw new Error("ROUND takes a value and optional places: ROUND(x, 2).");
        if (args.length === 0) throw new Error(`${fn} needs at least one value.`);
        return { kind: "call", fn: fn as FormulaFunction, args };
      }
      return { kind: "ref", name: tok.v };
    }
    if (isOp("(")) {
      pos++;
      const inner = comparison();
      expect(")");
      return inner;
    }
    throw new Error(tok.t === "end" ? "The formula ends too early." : `Unexpected "${(tok as { v: string }).v}" at position ${tok.at + 1}.`);
  };

  const ast = comparison();
  if (peek().t !== "end") throw new Error(`Unexpected "${(peek() as { v: string }).v}" at position ${peek().at + 1}.`);
  return ast;
}

function collectRefs(node: FormulaNode, out: Set<string>): void {
  if (node.kind === "ref") out.add(node.name);
  else if (node.kind === "neg") collectRefs(node.arg, out);
  else if (node.kind === "bin") {
    collectRefs(node.left, out);
    collectRefs(node.right, out);
  } else if (node.kind === "call") node.args.forEach((a) => collectRefs(a, out));
}

export function compileFormula(text: string): CompiledFormula {
  if (!text.trim()) return { ok: false, error: "Enter a formula." };
  try {
    const ast = parse(text);
    const refs = new Set<string>();
    collectRefs(ast, refs);
    return { ok: true, ast, refs: [...refs] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** A value read from a row: a number, or null when the field is empty / not a number. */
export type RowReader = (name: string) => number | null;

export function readRow(row: Record<string, unknown>): RowReader {
  return (name) => {
    const raw = row[name];
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "boolean") return raw ? 1 : 0;
    const text = String(raw).trim();
    if (text === "") return null;
    if (text === "true") return 1;
    if (text === "false") return 0;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  };
}

export function evaluateFormula(node: FormulaNode, read: RowReader): number | null {
  const num = (n: FormulaNode) => evaluateFormula(n, read) ?? 0;
  switch (node.kind) {
    case "num":
      return node.value;
    case "ref":
      return read(node.name);
    case "neg":
      return -num(node.arg);
    case "bin": {
      const a = num(node.left);
      const b = num(node.right);
      switch (node.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return b === 0 ? null : a / b;
        case "=": return a === b ? 1 : 0;
        case "<>": return a !== b ? 1 : 0;
        case "<": return a < b ? 1 : 0;
        case ">": return a > b ? 1 : 0;
        case "<=": return a <= b ? 1 : 0;
        case ">=": return a >= b ? 1 : 0;
      }
      return null;
    }
    case "call": {
      if (node.fn === "IF") {
        const cond = evaluateFormula(node.args[0], read);
        return evaluateFormula(cond !== null && cond !== 0 ? node.args[1] : node.args[2], read);
      }
      if (node.fn === "FIRST") {
        for (const arg of node.args) {
          const v = evaluateFormula(arg, read);
          if (v !== null) return v;
        }
        return null;
      }
      if (node.fn === "ROUND") {
        const v = evaluateFormula(node.args[0], read);
        if (v === null) return null;
        const places = node.args[1] ? Math.max(0, Math.min(10, Math.trunc(num(node.args[1])))) : 0;
        const f = Math.pow(10, places);
        return Math.round(v * f) / f;
      }
      const values = node.args.map((a) => evaluateFormula(a, read)).filter((v): v is number => v !== null);
      if (node.fn === "SUM") return values.reduce((s, v) => s + v, 0);
      if (!values.length) return null;
      return node.fn === "MIN" ? Math.min(...values) : Math.max(...values);
    }
  }
}

export type FormulaFieldDef = { api_name: string; formula: string };

/**
 * Order formula fields so each one runs after the formulas it uses. Returns
 * the order, or the first loop found ("a → b → a").
 */
export function orderFormulas(fields: FormulaFieldDef[]): { ok: true; order: string[] } | { ok: false; error: string } {
  const refsOf = new Map<string, string[]>();
  for (const f of fields) {
    const compiled = compileFormula(f.formula);
    refsOf.set(f.api_name, compiled.ok ? compiled.refs.filter((r) => fields.some((x) => x.api_name === r)) : []);
  }
  const order: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (name: string, path: string[]): string | null => {
    if (state.get(name) === "done") return null;
    if (state.get(name) === "visiting") return [...path, name].join(" → ");
    state.set(name, "visiting");
    for (const dep of refsOf.get(name) ?? []) {
      const loop = visit(dep, [...path, name]);
      if (loop) return loop;
    }
    state.set(name, "done");
    order.push(name);
    return null;
  };
  for (const f of fields) {
    const loop = visit(f.api_name, []);
    if (loop) return { ok: false, error: `These formulas use each other in a loop: ${loop}.` };
  }
  return { ok: true, order };
}

const fmt = (n: number) => String(Math.round(n * 1_000_000) / 1_000_000);

/**
 * Values of every formula field for one row, in dependency order (a formula
 * sees the results of the formulas it uses). Bad formulas and loops give "".
 */
export function computeFormulaValues(
  fields: FormulaFieldDef[],
  row: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  const ordered = orderFormulas(fields);
  if (!ordered.ok) {
    for (const f of fields) out[f.api_name] = "";
    return out;
  }
  const working: Record<string, unknown> = { ...row };
  const byName = new Map(fields.map((f) => [f.api_name, f]));
  for (const name of ordered.order) {
    const compiled = compileFormula(byName.get(name)!.formula);
    const value = compiled.ok ? evaluateFormula(compiled.ast, readRow(working)) : null;
    out[name] = value === null || !Number.isFinite(value) ? "" : fmt(value);
    working[name] = out[name];
  }
  return out;
}
