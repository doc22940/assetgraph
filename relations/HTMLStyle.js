/*global require, exports*/
var util = require('util'),
    _ = require('underscore'),
    Base = require('./Base').Base;

function HTMLStyle(config) {
    Base.call(this, config);
}

util.inherits(HTMLStyle, Base);

_.extend(HTMLStyle.prototype, {
    setUrl: function (url) {
        if (this.node.nodeName === 'link') {
            this.node.href = url;
        } else {
            var document = this.node.ownerDocument,
                link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            this.node.parentNode.replaceChild(link, this.node);
            this.node = link;
        }
    },

    inline: function (src) {
        if (this.node.nodeName === 'style') {
            while (this.node.firstChild) {
                this.node.removeChild(this.node.firstChild);
            }
            this.node.appendChild(document.createTextNode(src));
        } else {
            var document = this.node.ownerDocument,
                style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(src));
            this.node.parentNode.replaceChild(style, this.node);
            this.node = style;
        }
    },

    createNode: function (document) {
        var node = document.createElement('link');
        node.rel = 'stylesheet';
        return node;
    }
});

exports.HTMLStyle = HTMLStyle;
