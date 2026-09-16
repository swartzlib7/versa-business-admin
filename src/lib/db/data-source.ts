/** Shipped default is Postgres. Fixture is an explicit opt-in for tests without a database. */
export type DataSource = "postgres" | "fixture";

export function dataSource(): DataSource {
  return process.env.DATA_SOURCE === "fixture" ? "fixture" : "postgres";
}

export function isPostgresDataSource(): boolean {
  return dataSource() === "postgres";
}
