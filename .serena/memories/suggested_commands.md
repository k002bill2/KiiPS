# Suggested Commands for KiiPS

## Build Commands
Always build from the `KiiPS-HUB` directory to ensure all dependencies are correctly resolved.

- **Full Build**: `mvn clean package` (inside `KiiPS-HUB`)
- **Specific Module Build**: `mvn clean package -pl :KiiPS-SERVICE -am` (where `:KiiPS-SERVICE` is the artifactId of the module, e.g., `:KiiPS-FD`)
- **Skip Tests (Default)**: Tests are skipped by default in `pom.xml`. To run them (if enabled), use `mvn test`.

## Service Control (Inside Service Directory)
- **Start Service**: `./start.sh`
- **Stop Service**: `./stop.sh`
- **Check Logs**: `tail -f logs/log.$(date "+%Y-%m-%d")-0.log` (Naming might vary by service, but this is the general pattern).

## Version Control (SVN)
- **Update**: `svn up`
- **Status**: `svn status`
- **Diff**: `svn diff`

## System Utilities (Darwin/MacOS)
- **Port Check**: `lsof -i :8088 :8100 :8601 :8401 :8701 :8801`
- **Process Check**: `ps -ef | grep kiips`
- **Java Version**: `java -version` (Ensure it is 1.8.x)
