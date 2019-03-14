## Concourse Pipeline Generator
[![Build Status](https://travis-ci.org/Jarlotee/generator-concourse-pipeline.svg?branch=master)](https://travis-ci.org/Jarlotee/generator-concourse-pipeline)
![Dependency Status](https://david-dm.org/Jarlotee/generator-concourse-pipeline.svg)

Helps you bootstrap your respository for concourse ci.

### Supported Deployment Types

Azure PAAS
* dotnet web
* node web

### Getting Started

* Install `npm install -g generator-concourse-pipeline`
* Run `yo concourse-pipeline`

### Options
```bash
Deploying code for the first time? Answer a few questions to get started...
 What is the name of your pipeline? test-app
 Where is your source code? https://github.com/MyOrg/test-app.git
 Do you want to use github flow versioning? Yes
 Do you want to build pull requests? Yes
 What kind of project would you like to create? dotnet-paas

Next Steps:
 * update .ci/config based on your paas resource setup
 * update your readme.md with pipeline information

      ## Update Deployment Pipeline
      1) Make modifications to .ci/deployment.yaml
      2) `fly -t [team-name] set-pipeline -p test-app -c .ci/pipeline.yaml`
      3) Commit and Push your changes to github
```

### What you get

```bash
└── .ci
    ├── config
    │   ├── dev.json
    │   ├── prod.json
    │   └── qa.json
    ├── pipeline.yaml
    └── scripts
        ├── deploy.sh
        ├── generate_version.sh
        └── publish.sh
```

## License
MIT
