['addInitialAssets',
 'populate',
 'inlineDirtyAssets',
 'moveAssetsToStaticDir',
 'registerLabelsAsCustomProtocols',
 'minifyAssets',
 'executeJavaScript',
 'flattenStaticIncludes',
 'drawGraph',
 'addCDNPrefix',
 'addCacheManifestSinglePage',
 'addCacheManifestSiteMap',
 'checkRelationConsistency',
 'bundleRelations',
 'spriteBackgroundImages',
 'addPNG8FallbackForIE6',
 'writeAssetsToDisc'].forEach(function (transformName) {
    exports[transformName] = require('./' + transformName)[transformName];
});
