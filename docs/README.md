# Documentation

- [Installation](installation.md): prerequisites, release binaries, building from source, Windows support
- [Configuration](configuration.md): scopes and precedence, backends, models, merge semantics
- [Writing commands](commands.md): command files, frontmatter, arguments, templating, input modes
- [Output contracts](output.md): text and JSON output, JSON Schema validation, fenced responses
- [Testing configured prompts](testing.md): regression cases for configured commands, run by `gko config test`
- [MCP server](mcp.md): agent integration over stdio, tool naming, argument and output schemas
- [Built-in commands](cli.md): `doctor`, `config`, `backend`, `model`, `describe`, `update`, degraded mode
- [Deploying on an Intel NPU](intel-npu.md): exporting a model with `optimum-cli`, quantization pitfalls, serving it with OVMS
- [Running on Apple Silicon](apple-silicon.md): serving a GGUF model with `llama-server` on Metal, started and stopped by `gko backend serve`

The [Claude Code skills](../skills/README.md) teach Claude Code to write and repair a `gko`
configuration, and to find and export a model.
