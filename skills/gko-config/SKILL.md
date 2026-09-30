---
name: gko-config
description: Sets up and maintains a `gko` configuration directory — the `.gekko/` layout (backends, models, commands, schemas), scope precedence between `/etc/gekko`, `$XDG_CONFIG_HOME/gekko` and `./.gekko`, and how entries from different scopes replace one another. Use it to bootstrap a project's `.gekko/` from nothing, to decide which scope a piece of configuration belongs in, or to understand why a local file is (or is not) overriding a broader one. Delegates the file formats themselves to gko-backend, gko-model and gko-command.
when_to_use: >
  Trigger on "set up gko in this project", "add gko configuration", "create a
  .gekko directory", "where should this gko config live", "why is my local gko
  config not winning", "gko scopes", or any gko request that spans more than
  one of backends / models / commands.
model: sonnet
effort: medium
allowed-tools: Read Write Edit Glob Grep Bash(gko:*)
---

# Configuring `gko`

`gko` has no business commands compiled in. Everything — commands, models,
backends, output schemas — is configuration read at startup. Adding a command
never requires rebuilding the binary.

## The layout

```text
.gekko/
├── backends/*.toml   # where to send requests, and how      → gko-backend
├── models/*.toml     # which model, on which backend op     → gko-model
├── commands/*.md     # the commands themselves              → gko-command
└── schemas/*.json    # JSON Schema contracts for JSON output
```

Every directory is optional. A missing directory contributes nothing; it is
not an error.

## Scopes and precedence

The same layout may exist at three levels, read broadest first, **most local
wins**:

```text
/etc/gekko                                          system-wide
      ↓
$XDG_CONFIG_HOME/gekko  (or $HOME/.config/gekko)    per user
      ↓
./.gekko                                            per project
```

`XDG_CONFIG_HOME`, when set and non-empty, **replaces** the `$HOME`-derived
path rather than adding to it. A scope directory that does not exist is
skipped silently.

On Windows only `.\.gekko` works out of the box: `/etc/gekko` is a hard-coded Unix
path and the user scope is read from `$HOME`, never `%USERPROFILE%`.

### Which scope for what

| Put it in | When |
| --- | --- |
| `./.gekko` | anything specific to this repository — commit it, teammates get the tooling |
| `$XDG_CONFIG_HOME/gekko` | your personal backend, your machine's model aliases |
| `/etc/gekko` | a shared machine-wide backend, managed by whoever owns the box |

## Merge semantics — replacement, never deep merge

| Kind | Replacement key |
| --- | --- |
| Backends | the `id` field inside the file |
| Models | the `id` field inside the file |
| Commands | the full command path (`git/review`), derived from the file path |

A backend with `id = "ovms"` in `./.gekko` replaces the `/etc/gekko` one
**entirely**. A field present in the broader file and absent from the local
one is *not* inherited. Entries whose keys differ accumulate.

Resolution happens *after* merging, so a model defined in your project may
reference a backend declared only in `/etc/gekko`.

Two files in the **same** scope declaring the same `id` is an error naming
both paths. Across scopes an override is the feature; within one scope it is
ambiguity resolved by filesystem ordering, which is nobody's decision.

## Bootstrapping a project

1. `mkdir -p .gekko/{backends,models,commands}` (add `schemas/` when a command
   needs structured output).
2. Declare the backend → **gko-backend**.
3. Declare a model on one of its operations → **gko-model**.
4. Write the first command → **gko-command**.
5. `gko doctor` — it validates the whole chain and names whatever is broken.
   If it reports a failure, → **gko-doctor**.

Do not invent keys. Every unknown key is **rejected** at load time, by design:
a key read and silently ignored is a defect, not a shortcut. When unsure of a
key, check the matching skill rather than guessing.

## Verifying

```sh
gko doctor          # configuration, backend reachability, every declared schema
gko config models          # the models actually resolved
gko describe <cmd>  # one command's effective definition, as JSON
gko backend serve <model>   # start the backend's runtime, if it declares [runtime]
gko backend status          # which backends declaring a runtime are up
gko backend stop <model>    # end that runtime (remove the container, or signal the process)
gko backend logs <model>    # what the runtime printed
gko --help          # the command tree built from the configuration
```

`gko --help` listing a command is proof it was discovered and parsed.

## Reference

This skill is a summary. When a case is not covered here, or when the
behaviour it describes does not match what the binary does, the repository
documentation is authoritative:

- [Configuration reference](https://github.com/fmatsos/npu/blob/main/docs/configuration.md)
- [Built-in commands](https://github.com/fmatsos/npu/blob/main/docs/cli.md)
- [README](https://github.com/fmatsos/npu/blob/main/README.md)

Related skills: **gko-backend**, **gko-model**, **gko-command**, **gko-doctor**.

<!-- model/effort: Deciding which scope a piece of configuration belongs in, and reasoning about replacement across scopes, is a design call rather than a transcription. -->
