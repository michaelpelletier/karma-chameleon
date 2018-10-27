# karma-chameleon-reporter

```
 ╱▉▔▉▔▉▔▉╲▕▔╲
╱▕▋▕▋▕▋▕▋┈▔┈╰╲
▏▕▎▕▎▕▎▕▎┈▕▔╲╰╲
▏╱▔▔╲▂  ▂▂▏╲▇▏▕      Karma Chameleon Reporter
▏▏╱╲▕ ╲╰╲┈╲╰━━━̸━╮
╲╲▏╱▕  ╲╰▔▏▔▔▔ ╰╯
 ╲▂▂╱   ▔▔
```

This reporter is intended to give a breakdown of test results in a way that is
quite clear exactly what has been run, skipped, or failed, and what the results
for the tests are on a browser-by-browser basis.

It is a standalone reporter, and is partially based on [Karma Summary Reporter](https://github.com/sth/karma-summary-reporter).

When an entire file passes, it simply displays how many tests passed for that
file, to give an idea of what test coverage is like. When a file has an amount
of errors or pending tests, it will specifically call out those items.

Each file header is coloured to correspond to its overall state. Red if it has
any errors, yellow if it has no errors but some pending, and green if everything
has passed.

### Screenshot
![Example](/karma-chameleon.png?raw=true "Example Condensed Output")

## Installation
Install via NPM
    `npm install --save-dev karma-chameleon`

Add to your Karma Config (karma.conf.js)
    ```
    config.set({
        reporters: ['karma-chameleon']
    })
    ```