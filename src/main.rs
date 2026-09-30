//! Shell of the binary: all the logic lives in `lib.rs`.

/// `gekko::run()` returns an exit code (`Ok(i32)`), not just a boolean
/// success/failure: `Ok(0)` is ordinary success, `Ok(code)` for `code != 0`
/// carries the exit code of a REPORT (`gko doctor` — cf. `gekko::run`'s doc),
/// already written to stdout by `run` itself before returning here — this
/// is not an engine failure, so `main` must neither write it a second time
/// nor write it to stderr. `Err` remains a pipeline failure: message
/// on stderr, code via `Error::exit_code`.
fn main() {
    match gekko::run() {
        Ok(0) => {}
        Ok(code) => std::process::exit(code),
        Err(err) => {
            // `anstream` strips the colour when stderr is not a terminal.
            if gekko::error::error_format_from_args(std::env::args())
                == gekko::error::ErrorFormat::Json
            {
                anstream::eprintln!("{}", err.envelope());
            } else {
                anstream::eprintln!(
                    "{}",
                    gekko::style::paint(gekko::style::ERROR, &err.to_string())
                );
            }
            std::process::exit(err.exit_code());
        }
    }
}
