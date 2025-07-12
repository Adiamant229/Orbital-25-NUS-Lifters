/* eslint-env node */
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Needed to support .cjs files used by AsyncStorage (important!)
config.resolver.sourceExts.push("cjs");

// Needed to avoid unstable resolution errors (recent Firebase versions)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
