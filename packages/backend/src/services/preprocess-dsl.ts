/**
 * Auto-fix common DSL mistakes before parsing.
 * These are silent fixups — no errors returned.
 */
export function preprocessDSL(dsl: string): string {
  let result = dsl;

  // Replace React-style newlines {'\n'} and {"\n"} with actual newlines
  result = result.replace(/\{['"]\\n['"]\}/g, '\n');

  return result;
}
