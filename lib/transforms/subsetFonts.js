var fs = require('fs');
var childProcess = require('child_process');
var passError = require('passerror');
var async = require('async');
var getTemporaryFilePath = require('gettemporaryfilepath');
var getTextByFontFace = require('../util/getTextByFontFace');

module.exports = function (queryObj) {
    return function subsetFonts(assetGraph, cb) {
        var textByFontFace = getTextByFontFace(assetGraph);

        var fontFamiliesToSubset = Object.keys(textByFontFace);

        async.eachLimit(fontFamiliesToSubset, 5, function (fontFamilyName, cb) {
            var chars = textByFontFace[fontFamilyName].chars;
            var cssFontFaceSrc = textByFontFace[fontFamilyName].cssFontFaceSrc;
            var inputFileName = getTemporaryFilePath({suffix: cssFontFaceSrc.to.extension});
            var outputFileName = getTemporaryFilePath({suffix: cssFontFaceSrc.to.extension});
            fs.writeFile(inputFileName, cssFontFaceSrc.to.rawSrc, passError(cb, function () {
                var javaProcess = childProcess.spawn('java', ['-jar', 'node_modules/fontler/lib/sfntly.jar', '-s', chars.join(''), inputFileName, outputFileName]);
                javaProcess.stdout.on('data', function () {});
                javaProcess.stderr.on('data', function () {});
                javaProcess.on('exit', function (exitCode) {
                    if (exitCode) {
                        return cb(new Error('java/sfntly exited with a non-zero exit code: ' + exitCode));
                    }
                    fs.readFile(outputFileName, passError(cb, function (rawSrc) {
                        if (rawSrc.length < cssFontFaceSrc.to.rawSrc.length - 2048) {
                            var subsetFontAsset = new assetGraph.Asset({
                                url: assetGraph.root + 'subset-' + (cssFontFaceSrc.to.fileName || encodeURIComponent(fontFamilyName)) + cssFontFaceSrc.to.extension,
                                rawSrc: rawSrc
                            });
                            assetGraph.addAsset(subsetFontAsset);
                            cssFontFaceSrc.node.parent.append({
                                name: 'font-face'
                            });
                            var newFontFaceRule = cssFontFaceSrc.node.parent.last;
                            newFontFaceRule.append({
                                prop: 'font-family',
                                value: fontFamilyName
                            });
                            var unicodeRangeTokens = [];
                            var currentRangeStart;
                            var currentRangeEnd;
                            function flush() {
                                if (currentRangeStart) {
                                    var unicodeRangeToken = 'U+' + currentRangeStart.toString(16).toUpperCase();
                                    if (currentRangeStart !== currentRangeEnd) {
                                        unicodeRangeToken += '-' + currentRangeEnd.toString(16).toUpperCase();
                                    }
                                    unicodeRangeTokens.push(unicodeRangeToken);
                                    currentRangeStart = currentRangeEnd = undefined;
                                }
                            }
                            chars.forEach(function (ch, i) {
                                var charCode = ch.charCodeAt(0);
                                if (currentRangeStart) {
                                    if (charCode === currentRangeEnd + 1) {
                                        currentRangeEnd = charCode;
                                    } else {
                                        flush();
                                        currentRangeStart = currentRangeEnd = charCode;
                                    }
                                } else {
                                    currentRangeStart = currentRangeEnd = charCode;
                                }
                            });
                            flush();
                            newFontFaceRule.append({
                                prop: 'unicode-range',
                                value: unicodeRangeTokens.join(', ')
                            });
                            assetGraph.addRelation(new assetGraph.CssFontFaceSrc({
                                node: newFontFaceRule,
                                parentNode: newFontFaceRule.parent,
                                from: cssFontFaceSrc.from,
                                to: subsetFontAsset
                            }), 'after', cssFontFaceSrc);
                            cssFontFaceSrc.from.markDirty();
                            cb();
                        } else {
                            // Not worth it
                            cb();
                        }
                    }));
                });
            }));
        }, cb);
    };
};