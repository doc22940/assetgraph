var expect = require('./unexpected-with-plugins'),
    AssetGraph = require('../lib'),
    query = AssetGraph.query;

describe('bundleRelations', function () {
    describe('with the oneBundlePerIncludingAsset strategy', function (done) {
        it('should bundle two stylesheets', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/singleHtml'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 6);
                    expect(assetGraph, 'to contain asset', 'Html');
                    expect(assetGraph, 'to contain assets', 'Png', 3);
                    expect(assetGraph, 'to contain assets', 'Css', 2);
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 2);
                    expect(assetGraph, 'to contain relations', 'CssImage', 4);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relation', 'HtmlStyle');
                    expect(assetGraph, 'to contain asset', 'Css');
                    expect(assetGraph.findAssets({type: 'Css'})[0]._lastKnownByteLength, 'to be a number');
                    var cssBackgroundImages = assetGraph.findRelations({type: 'CssImage'}),
                        bundle = assetGraph.findAssets({type: 'Css'})[0];
                    expect(cssBackgroundImages, 'to have length', 4);
                    cssBackgroundImages.forEach(function (cssBackgroundImage) {
                        expect(cssBackgroundImage.from.id, 'to equal', bundle.id);
                    });
                })
                .run(done);
        });

        it('should bundle correctly when two Html assets that relate to some of the same Css assets', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/twoHtmls'})
                .loadAssets('1.html', '2.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 'Html', 2);
                    expect(assetGraph, 'to contain assets', 'Css', 5);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 'Css', 2);
                    var cssRules = assetGraph.findAssets({type: 'Css', incoming: {from: {url: /\/1\.html$/}}})[0].parseTree.cssRules;
                    expect(cssRules, 'to have length', 5);
                    expect(cssRules[0].style.color, 'to equal', 'azure');
                    expect(cssRules[1].style.color, 'to equal', 'beige');
                    expect(cssRules[2].style.color, 'to equal', 'crimson');
                    expect(cssRules[3].style.color, 'to equal', 'deeppink');
                    expect(cssRules[4].style.color, 'to equal', '#eeeee0');
                    var cssRules = assetGraph.findAssets({type: 'Css', incoming: {from: {url: /\/2\.html$/}}})[0].parseTree.cssRules;
                    expect(cssRules, 'to have length', 3);
                    expect(cssRules[0].style.color, 'to equal', '#eeeee0');
                    expect(cssRules[1].style.color, 'to equal', 'beige');
                    expect(cssRules[2].style.color, 'to equal', 'crimson');
                })
                .run(done);
        });

        it('should bundle correctly in the presence of conditional comments', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/conditionalCommentInTheMiddle/'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 5);
                    expect(assetGraph, 'to contain relations', 'HtmlConditionalComment', 2);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 3);
                    expect(assetGraph, 'to contain relations', {from: {url: /\/index\.html$/}, type: 'HtmlStyle'}, 2);

                    var cssRules = assetGraph.findRelations({from: {url: /\/index\.html$/}})[0].to.parseTree.cssRules;
                    expect(cssRules, 'to have length', 2);
                    expect(cssRules[0].style.getPropertyValue('color'), 'to equal', '#aaaaaa');
                    expect(cssRules[1].style.getPropertyValue('color'), 'to equal', '#bbbbbb');

                    var cssAsset = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[1].to;
                    expect(cssAsset.url, 'to match', /\/e\.css$/);
                    expect(cssAsset.parseTree.cssRules, 'to have length', 1);
                    expect(cssAsset.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#eeeeee');

                    var conditionalCommentBody = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlConditionalComment'})[1].to,
                        htmlStyles = assetGraph.findRelations({from: conditionalCommentBody});
                    expect(htmlStyles, 'to have length', 1);
                    expect(htmlStyles[0].to.parseTree.cssRules, 'to have length', 2);
                    expect(htmlStyles[0].to.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#cccccc');
                    expect(htmlStyles[0].to.parseTree.cssRules[1].style.getPropertyValue('color'), 'to equal', '#dddddd');
                })
                .run(done);
        });

        it('should bundle HtmlStyles correctly when two of them are in an inverted conditional comment', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/invertedConditionalCommentInTheMiddle/'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 5);
                    expect(assetGraph, 'to contain relations', 'HtmlConditionalComment', 1);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 3);
                    expect(assetGraph, 'to contain relations', {from: {url: /\/index\.html$/}, type: 'HtmlStyle'}, 3);
                    var cssRules = assetGraph.findRelations({type: 'HtmlStyle', from: {url: /\/index\.html$/}})[0].to.parseTree.cssRules;
                    expect(cssRules, 'to have length', 2);
                    expect(cssRules[0].style.getPropertyValue('color'), 'to equal', '#aaaaaa');
                    expect(cssRules[1].style.getPropertyValue('color'), 'to equal', '#bbbbbb');

                    cssRules = assetGraph.findRelations({type: 'HtmlStyle', from: {url: /\/index\.html$/}})[1].to.parseTree.cssRules;
                    expect(cssRules, 'to have length', 2);
                    expect(cssRules[0].style.getPropertyValue('color'), 'to equal', '#cccccc');
                    expect(cssRules[1].style.getPropertyValue('color'), 'to equal', '#dddddd');

                    var cssAsset = assetGraph.findRelations({type: 'HtmlStyle', from: {url: /\/index\.html$/}})[2].to;
                    expect(cssAsset.url, 'to match', /\/e\.css$/);
                    expect(cssAsset.parseTree.cssRules, 'to have length', 1);
                    expect(cssAsset.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#eeeeee');
                })
                .run(done);
        });

        it('should not bundle stylesheets with different media attributes', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/differentMedia/'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 'Html', 3);
                    expect(assetGraph, 'to contain assets', 'Css', 7);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 'Css', 5);
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 5);
                    expect(assetGraph, 'to contain relations', {from: {url: /\/index\.html$/}, type: 'HtmlStyle'}, 4);
                    expect(assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[0].node.hasAttribute('media'), 'not to be truthy');

                    var htmlStyle = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[0];
                    expect(htmlStyle.to.parseTree.cssRules, 'to have length', 2);
                    expect(htmlStyle.to.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#aaaaaa');
                    expect(htmlStyle.to.parseTree.cssRules[1].style.getPropertyValue('color'), 'to equal', '#bbbbbb');
                    expect(assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[1].node.getAttribute('media'), 'to equal', 'aural and (device-aspect-ratio: 16/9)');

                    htmlStyle = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[1];
                    expect(htmlStyle.to.parseTree.cssRules, 'to have length', 2);
                    expect(htmlStyle.to.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#cccccc');
                    expect(htmlStyle.to.parseTree.cssRules[1].style.getPropertyValue('color'), 'to equal', '#dddddd');
                    expect(assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[2].node.getAttribute('media'), 'to equal', 'screen');
                    expect(assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[2].to.url, 'to match', /\/e\.css$/);
                    expect(assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[3].to.url, 'to match', /\/f\.css$/);
                })
                .run(done);
        });

        it('should respect the nobundle attribute', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/skippedScripts/'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 6);
                    expect(assetGraph, 'to contain asset', 'Html');
                    expect(assetGraph, 'to contain assets', 'JavaScript', 5);
                })
                .bundleRelations({type: 'HtmlScript', node: function (node) {return !node.hasAttribute('nobundle');}}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain assets', 'JavaScript', 4);
                    expect(assetGraph.findRelations({type: 'HtmlScript'}).map(function (htmlScript) {
                        return htmlScript.to.text.replace(/\n/g, '');
                    }), 'to equal', [
                        'alert("a.js");',
                        'alert("b.js");alert("c.js");',
                        'alert("d.js");',
                        'alert("e.js");'
                    ]);
                })
                .run(done);
        });

        it('should gather all the copyright notices and put them at the top of the bundle', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/copyrightNotices/'})
                .loadAssets('index.html')
                .populate()
                .bundleRelations({type: 'HtmlScript'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph.findAssets({type: 'JavaScript'})[0].text,'to match', /\/\*! Copyright a \*\/[\s\S]*\/\*! Copyright c \*\//);
                })
                .run(done);
        });

        it('should handle 5 HtmlStyles in a Html asset, two of which is in a conditional comment', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/conditionalCommentInTheMiddle/'})
                .loadAssets('index.html')
                .populate()
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 5);
                    expect(assetGraph, 'to contain relations', 'HtmlConditionalComment', 2);
                })
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    expect(assetGraph, 'to contain relations', 'HtmlStyle', 3);
                    expect(assetGraph, 'to contain relations', {type: 'HtmlStyle', from: {url: /\/index\.html$/}}, 2);
                    var cssRules = assetGraph.findRelations({from: {url: /\/index\.html$/}})[0].to.parseTree.cssRules;
                    expect(cssRules, 'to have length', 2);
                    expect(cssRules[0].style.getPropertyValue('color'), 'to equal', '#aaaaaa');
                    expect(cssRules[1].style.getPropertyValue('color'), 'to equal', '#bbbbbb');

                    var cssAsset = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'})[1].to;
                    expect(cssAsset.url, 'to match', /\/e\.css$/);
                    expect(cssAsset.parseTree.cssRules, 'to have length', 1);
                    expect(cssAsset.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#eeeeee');

                    var conditionalCommentBody = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlConditionalComment'})[1].to,
                        htmlStyles = assetGraph.findRelations({from: conditionalCommentBody});
                    expect(htmlStyles, 'to have length', 1);
                    expect(htmlStyles[0].to.parseTree.cssRules, 'to have length', 2);
                    expect(htmlStyles[0].to.parseTree.cssRules[0].style.getPropertyValue('color'), 'to equal', '#cccccc');
                    expect(htmlStyles[0].to.parseTree.cssRules[1].style.getPropertyValue('color'), 'to equal', '#dddddd');
                })
                .run(done);
        });

        it('should handle an @import in a second stylesheet', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/importRules/'})
                .loadAssets('index.html')
                .populate()
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    var htmlStyles = cssAsset = assetGraph.findRelations({from: {url: /\/index\.html$/}, type: 'HtmlStyle'});

                    expect(htmlStyles, 'to have length', 1);
                    expect(htmlStyles[0].hrefType, 'to equal', 'relative');

                    var cssAsset = htmlStyles[0].to,
                        cssRules = cssAsset.parseTree.cssRules;
                    expect(cssRules, 'to have length', 5);
                    expect(cssRules[0].href, 'to equal', 'imported.css');
                    expect(cssRules[1].href, 'to equal', 'otherImported.css');
                    expect(cssRules[2].style.getPropertyValue('color'), 'to equal', 'red');
                    expect(cssRules[3].style.getPropertyValue('color'), 'to equal', 'blue');
                    expect(cssRules[4].style.getPropertyValue('color'), 'to equal', 'yellow');
                })
                .run(done);
        });

        it('should handle multiple stylesheets, one of which is referred to with a root-relative url', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/rootRelative/'})
                .loadAssets('index.html')
                .populate()
                .bundleRelations({type: 'HtmlStyle'}, {strategyName: 'oneBundlePerIncludingAsset'})
                .queue(function (assetGraph) {
                    var htmlStyles = assetGraph.findRelations({type: 'HtmlStyle'});
                    expect(htmlStyles, 'to have length', 1);
                    expect(htmlStyles[0].hrefType, 'to equal', 'rootRelative');
                })
                .run(done);
        });

        it('should handle script tags interrupted by an external script inclusion', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/scriptExternal/'})
                .loadAssets('index.html')
                .populate({
                    followRelations: {href: query.not(/^https?:/)}
                })
                .bundleRelations(
                    {
                        type: 'HtmlScript',
                        to: {
                            type: 'JavaScript',
                            isLoaded: true
                        }
                    }, {
                        strategyName: 'oneBundlePerIncludingAsset'
                    }
                )
                .queue(function (assetGraph) {
                    var htmlScripts = assetGraph.findRelations({type: 'HtmlScript'}, true);
                    expect(htmlScripts, 'to have length', 3);

                    expect((htmlScripts[0].href || '').substr(0, 4), 'not to equal', 'http');

                    expect(htmlScripts[1].href.substr(0, 4), 'to equal', 'http');

                    expect((htmlScripts[2].href || '').substr(0, 4), 'not to equal', 'http');
                })
                .run(done);
        });

        it('should handle script tags in both <head> and <body>', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/scriptsInHead/'})
                .loadAssets('index.html')
                .populate()
                .bundleRelations({
                    type: 'HtmlScript',
                    to: {
                        type: 'JavaScript',
                        isLoaded: true
                    }
                }, {
                    strategyName: 'oneBundlePerIncludingAsset'
                })
                .queue(function (assetGraph) {
                    var htmlScripts = assetGraph.findRelations({type: 'HtmlScript'}, true);
                    expect(htmlScripts, 'to have length', 2);
                    var htmlScripts = assetGraph.findRelations({type: 'HtmlScript'}, true);
                    expect(htmlScripts[0].node.parentNode.tagName, 'to equal', 'HEAD');
                    var htmlScripts = assetGraph.findRelations({type: 'HtmlScript'}, true);
                    expect(htmlScripts[1].node.parentNode.tagName, 'to equal', 'BODY');
                })
                .run(done);
        });

        it('should handle script tags in alternating strict mode', function (done) {
            new AssetGraph({root: __dirname + '/bundleRelations/strictScripts/'})
                .on('info', function (e) {
                    if (!this._infos) {
                        this._infos = [];
                    }
                    this._infos.push(e);
                })
                .loadAssets('index.html')
                .populate()
                .bundleRelations({
                    type: 'HtmlScript',
                    to: {
                        type: 'JavaScript',
                        isLoaded: true
                    }
                }, {
                    strategyName: 'oneBundlePerIncludingAsset'
                })
                .queue(function (assetGraph) {
                    var htmlScripts = assetGraph.findRelations({type: 'HtmlScript'}, true);
                    expect(htmlScripts, 'to have length', 4);
                    expect(assetGraph._infos, 'to have length', 2);
                })
                .run(done);
        });
    });
});