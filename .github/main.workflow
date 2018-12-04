workflow "Run tests" {
  on = "push"
  resolves = ["Test"]
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
  needs = "Build"
  uses = "actions/npm@master"
  args = "test"
}

action "Lint" {
  needs = "Setup"
  uses = "actions/npm@master"
  args = "run lint"
}