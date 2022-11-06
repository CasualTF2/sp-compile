# sp-compile

Easy and uniform way to compile our plugins.

This is my first Github Action I've ever made, its not pretty but it works and allows us to change compile settings without having to update all of our plugins. Things here may change at any time without notice, this is only really for internal usage.

## Example

Read `actions.yml` for more information regarding inputs and to learn about which inputs are optional and default values.

```yml
name: build

on:
    push:
    pull_request:
    workflow_dispatch:

jobs:
    build:
        name: build
        runs-on: ubuntu-latest

        steps:
            - name: Checkout
              uses: actions/checkout@v3

            - name: Compile
              uses: CasualTF2/sp-compile@main
              with:
                  source-files: |
                      src/file1.sp
                      src/file2.sp
                      src/file3.sp
                  exclude-paths: |
                      some/other/folder1
                      some/other/folder2
                      some/other/folder3
				  output-path: output

			- name: Do something with the files
			  run: ls output
```
