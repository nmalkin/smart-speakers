## Change checklist

-   [ ] Consider writing some tests for the new feature or bugfix
-   [ ] Make sure all the existing tests pass (`npm test`)
    -   We have automated tests run for each PR, but they don't run everything: the in-browser tests don't run in the CI environment.
    -   To also run the end-to-end tests that log in to services, you'll need a `SECRETS.json` file with credentials
-   [ ] Make sure your commits have [clear, descriptive messages](https://chris.beams.io/posts/git-commit/)
-   [ ] Try to break apart [commits into logical units](https://enpo.no/2018/2018-12-08-a-careful-commit-history-will-make-code-review-easier.html) to make reviewing easier ([see also](https://www.youtube.com/watch?v=qpdYRPL3SVE))
-   [ ] Bump the version number in the manifest
-   [ ] Delete this boilerplate before making the PR
