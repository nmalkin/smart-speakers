workflow "Run checks" {
  on = "push"
  resolves = ["Build", "Test", "Lint"]
}

action "Setup" {
  uses = "actions/npm@master"
  args = "install"
}

action "Build" {
  needs = "Setup"
  uses = "actions/npm@master"
  args = "run build"
}

action "Test" {
  needs = "Setup"
  uses = "actions/npm@master"
  args = "test"
}

action "Lint" {
  needs = "Setup"
  uses = "actions/npm@master"
  args = "run lint"
}