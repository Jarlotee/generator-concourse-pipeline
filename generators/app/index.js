const chalk = require("chalk");
const glob = require("glob");
const path = require("path");
const process = require("child_process");
const url = require("url");
const Generator = require("yeoman-generator");
const constants = require("./constants");

const normalizeAppName = name => name.toLocaleLowerCase().replace(/ /g, "-");

module.exports = class extends Generator {
  initializing() {
    this.log(
      chalk.bold.blue(
        "Deploying code for the first time? Answer a few questions to get started..."
      )
    );
  }

  async prompting() {
    const repository = process
      .execSync("git config --get remote.origin.url")
      .toString()
      .trim();

    const cwd = this.destinationRoot();
    const ignore = ["node_modules"];
    const dotNetProjects = glob.sync("src/**/*.csproj", { cwd });
    const nodeProjects = glob.sync("**/package.json", { cwd, ignore });

    const deploymentType = dotNetProjects.length
      ? constants.DeploymentType.DotnetPaas
      : nodeProjects.length
      ? constants.DeploymentType.NodePaas
      : null;

    const dotNetTests = glob.sync("tests/**/*.csproj", { cwd });

    if (dotNetTests.length) {
      this.testFolder = path.dirname(dotNetTests.pop());
    }

    const testSnippet = this.testFolder
      ? this.testFolder
      : nodeProjects.length
      ? "npm test"
      : null;

    this.answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of your pipeline?",
        default: normalizeAppName(this.appname),
        prefix: ""
      },
      {
        type: "input",
        name: "repository",
        message: "Where is your source code?",
        default: repository,
        prefix: ""
      },
      {
        type: "confirm",
        name: "gitHubVersioning",
        message: "Do you want to use github flow versioning?",
        default: true,
        prefix: ""
      },
      {
        type: "confirm",
        name: "buildPullRequests",
        message: "Do you want to build pull requests?",
        default: true,
        prefix: ""
      },
      {
        type: "list",
        name: "deploymentType",
        message: "What kind of project would you like to create?",
        choices: [
          constants.DeploymentType.DotnetPaas,
          constants.DeploymentType.NodePaas
        ],
        default: deploymentType,
        prefix: ""
      },
      {
        type: "confirm",
        name: "runTests",
        message: `Do you want to run tests? [${testSnippet}]`,
        default: true,
        when: () => !!testSnippet,
        prefix: ""
      }
    ]);
  }

  configuration() {
    const repositoryUrl = url.parse(this.answers.repository);
    const pathSegments = repositoryUrl.path.replace(/.git/, "").split("/");
    const repositoryName = pathSegments.pop();
    const repositoryOwner = pathSegments.pop();

    this.piplineTemplateValues = {
      buildPullRequests: this.answers.buildPullRequests,
      gitHubVersioning: this.answers.gitHubVersioning,
      testFolder: this.testFolder,
      runTests: this.answers.runTests,
      repository: `${repositoryOwner}/${repositoryName}`,
      repositoryOwner,
      repositoryName,
      repositoryUri: repositoryUrl.href
    };
  }

  writing() {
    if (this.answers.deploymentType.indexOf("paas") > -1) {
      this.fs.copy(
        this.templatePath("config/deploy.paas.template"),
        this.destinationPath(".ci/config/dev.json")
      );
      this.fs.copy(
        this.templatePath("config/deploy.paas.template"),
        this.destinationPath(".ci/config/qa.json")
      );
      this.fs.copy(
        this.templatePath("config/deploy.paas.template"),
        this.destinationPath(".ci/config/prod.json")
      );
      this.fs.copy(
        this.templatePath("scripts/deploy.paas.template"),
        this.destinationPath(".ci/scripts/deploy.sh")
      );
    }

    if (this.answers.gitHubVersioning) {
      this.fs.copy(
        this.templatePath("scripts/generate_version.template"),
        this.destinationPath(".ci/scripts/generate_version.sh")
      );
    }

    if (this.answers.deploymentType === constants.DeploymentType.DotnetPaas) {
      this.fs.copy(
        this.templatePath("scripts/publish.dotnet.template"),
        this.destinationPath(".ci/scripts/publish.sh")
      );

      this.fs.copyTpl(
        this.templatePath("pipeline.dotnet.paas.template"),
        this.destinationPath(".ci/pipeline.yaml"),
        this.piplineTemplateValues
      );
    }
  }

  end() {
    this.log(chalk.blue.bold("Pipeline generation complete\n"));
    this.log("Next Steps:");

    if (this.answers.deploymentType.indexOf("paas") > -1) {
      this.log(" * update .ci/config based on your paas resource setup");
    }

    this.log(" * update your readme.md with pipeline information");
    this.log(chalk.gray(`
      ## Update Deployment Pipeline
      1) Make modifications to .ci/deployment.yaml
      2) \`fly -t [team-name] set-pipeline -p ${this.answers.name} -c .ci/pipeline.yaml\`
      3) Commit and Push your changes to github
    `));
  }
};
