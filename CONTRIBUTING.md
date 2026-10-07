# Contributing to Gekko

Thanks for helping. For anything larger than a small fix, open an issue first so we can agree
on the direction before you spend time on it. Gekko is a generic engine: commands, models and
backends are configuration, never code, so a change that adds a business command to the binary
will not be accepted.

## Working on Gekko

Rust, with the toolchain pinned in `rust-toolchain.toml`. One command is the gate, and CI runs
the same one:

```sh
make qa     # rustfmt --check, clippy (-D warnings), tests, rustdoc and cargo-deny
make fix    # rustfmt and clippy autofixes
```

- `make qa` must pass before you open a pull request.
- Behavior comes with a test. Prompt behavior is covered by `gko config test`, see
  [docs/testing.md](docs/testing.md).
- Documentation lives in `docs/`; update the page that describes what you changed.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `feat:`,
  `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`, with `!` for a breaking change.

## Unlicensing contributions

Gekko is in the public domain ([Unlicense](LICENSE)). To keep it free of anyone's copyright
monopoly, and to remove any doubt about the terms a contribution was made under, every
[non-trivial](https://www.gnu.org/prep/maintain/maintain.html#Legally-Significant) patch comes with
this statement, taken from the [Unlicense website](https://unlicense.org/#unlicensing-contributions):

> I dedicate any and all copyright interest in this software to the
> public domain. I make this dedication for the benefit of the public at
> large and to the detriment of my heirs and successors. I intend this
> dedication to be an overt act of relinquishment in perpetuity of all
> present and future rights to this software under copyright law.

You do not have to type it: the pull request template pre-fills it in the description of every
pull request, and **leaving it there is how you make the dedication**. If you open a pull request
another way (`gh pr create --body`, the API), paste the statement into its description yourself: the `dedication` workflow fails
the pull request while the statement is missing from its description (pull requests from bots and from
the repository owner are exempt).
If you made the change as an employee of an organization, the statement may not be enough: your
employer has to disclaim its copyright too (see
[how SQLite handles it](https://www.sqlite.org/copyright.html)), so say so in the pull request.
