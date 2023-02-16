# sp-compile

Easy and uniform way to compile our plugins.

This is my first Github Action I've ever made, its not pretty but it works and allows us to change compile settings without having to update all of our plugins.

The compilation takes advantage of our custom installation and distribution system's `install.json` to download dependencies and handle configuration. Due to this there is no official example or support.

This action is open source to more easily be able to use it in our projects, because private actions are a pain in the ass.
