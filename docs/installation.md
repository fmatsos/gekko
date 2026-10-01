# Installation

- [Prerequisites](#prerequisites)
- [From a release](#from-a-release)
- [Linux and macOS](#linux-and-macos)
- [Windows](#windows)
- [Verify the installation](#verify-the-installation)

## Prerequisites

**Rust toolchain.** The repository pins its toolchain in `rust-toolchain.toml`, so
[rustup](https://rustup.rs) downloads the right version (1.98.1, edition 2024) automatically. You
do not need to install a specific Rust version by hand — you only need rustup itself.

**An OpenAI-compatible backend, reachable over HTTP.** `gko` speaks the OpenAI chat-completions
protocol; every operation a backend declares is a `POST` under the hood, `chat` being the
conventional name. [OpenVINO Model
Server](https://github.com/openvinotoolkit/model_server) is the reference target, but anything
exposing `POST /v1/chat/completions` (or an equivalent path you configure) will do.

Without a backend listening, every business command fails with exit code `3`. The built-ins
(`doctor`, `config models`, `backend serve`, `describe`) still work.

**Docker — optional.** Only the lifecycle commands (`gko backend serve`, `stop`, `status`, `logs`) need it: a
backend can declare a `[runtime]` table with `type = "docker"` saying how to start its own
runtime, and those commands drive it. Nothing else in the CLI touches Docker, and a configuration
without that table never asks for it. The other family, `type = "process"`, needs no daemon at
all — it spawns the server the backend names directly on this machine.

## From a release

Each `vX.Y.Z` tag publishes a stripped binary per target — `x86_64-unknown-linux-gnu`,
`aarch64-unknown-linux-gnu`, `x86_64-apple-darwin`, `aarch64-apple-darwin`,
`x86_64-pc-windows-msvc`, `aarch64-pc-windows-msvc` — on the
[releases page](https://github.com/fmatsos/gekko/releases), together with the changelog for that
version. The Linux binaries link only glibc and run on any glibc-based distribution. Each platform ships
twice: an archive (`gko-vX.Y.Z-<platform>.tar.gz` or `.zip`)
containing the executable and the README, and a raw, uncompressed executable
(`gko-<platform>`, or `gko-<platform>.exe` on Windows) — the one `gko update` downloads itself,
authenticated against the SHA-256 in the release's `gko-update.json` manifest. Either way, put
`gko` (renaming the raw download and, on Linux and macOS, `chmod +x` it) anywhere on your `PATH`;
there is nothing else to install. Future releases can then be installed in place with `gko
update`, provided the directory containing the executable is writable by the current user.

## Linux and macOS

```sh
# 1. Install rustup if you don't have it
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
. "$HOME/.cargo/env"

# 2. Build and install gko
git clone https://github.com/fmatsos/gekko.git gekko
cd gekko
cargo install --path .
```

`cargo install` places the binary in `~/.cargo/bin`, which rustup adds to your `PATH`.

> [!TIP]
> On a distribution that ships its own Rust package, make sure `~/.cargo/bin` comes **before**
> `/usr/bin` in your `PATH`, otherwise the system `rustc` shadows the pinned toolchain.

## Windows

```powershell
# 1. Install rustup from https://rustup.rs (rustup-init.exe)

# 2. Build and install gko
git clone https://github.com/fmatsos/gekko.git gekko
cd gekko
cargo install --path .
```

> [!WARNING]
> **Windows support is partial.** Configuration scopes follow Windows conventions: the system
> scope is `%ProgramData%\gekko`, the user scope `%APPDATA%\gekko` (see
> [Configuration](configuration.md)), and the project `.gekko` is found as on Unix. The runtime
> lifecycle is split: `type = "docker"` works (Docker Desktop is its prerequisite, not `gko`'s
> code), while a backend declaring `type = "process"` is
> rejected at load time naming the file — that family needs a `$XDG_STATE_HOME`/`$HOME` state
> directory and a `SIGTERM`, neither of which Windows has. Everything else — command discovery,
> arguments, templating, structured output, the other built-ins — is platform-independent.

`cargo install --path .` builds with the `hardware-tooling` Cargo feature on by default, which
declares `gko model discover` and `gko backend tune` (see
[Cargo feature: `hardware-tooling`](cli.md#cargo-feature-hardware-tooling)). Build with `--no-default-features`
for a smaller, engine-only CLI without them.

## Verify the installation

```sh
gko doctor
```

This validates your configuration, probes every configured backend and compiles every declared
output schema. It is the fastest way to tell whether a setup problem is yours or your runtime's —
see [Exit codes](../README.md#exit-codes).
