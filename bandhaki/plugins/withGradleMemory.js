const { withGradleProperties } = require("expo/config-plugins");

// The Expo template ships `-Xmx2048m -XX:MaxMetaspaceSize=512m`. With this many
// native modules the daemon exhausts Metaspace (96% of 512m) and dies during
// :app:packageRelease, which Gradle reports as a bare
// "A failure occurred while executing PackageAndroidArtifact$IncrementalSplitterRunnable"
// with no cause. Heap is not the problem, so only Metaspace is raised.
const JVM_ARGS = "-Xmx2048m -XX:MaxMetaspaceSize=1024m";

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === "org.gradle.jvmargs")
    );

    properties.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: JVM_ARGS,
    });

    config.modResults = properties;
    return config;
  });
};
