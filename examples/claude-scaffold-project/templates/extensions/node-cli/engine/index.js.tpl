// Entry point for {{PROJECT_NAME}}.
// Replace this with the actual CLI / library code as the project grows.

export function hello(name = 'world') {
  return `hello, ${name}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(hello(process.argv[2]));
}
