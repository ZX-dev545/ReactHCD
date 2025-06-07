module.exports = {
  presets: [
    [
      "babel-preset-expo",
      {
        // enable polyfill for import.meta in Hermes
        unstable_transformImportMeta: true
      }
    ]
  ]
};