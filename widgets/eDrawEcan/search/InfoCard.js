///////////////////////////////////////////////////////////////////////////
// Copyright © 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(["dojo/_base/declare", "dojo/_base/array", "dojo/date/locale", "dojo/dom-class", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dojo/text!./templates/InfoCard.html", "dojo/i18n!../nls/strings", "./util"], function (declare, array, locale, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, i18n, util) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    i18n: i18n,
    templateString: template,

    canDelete: false,
    item: null,
    resultsPane: null,

    _dfd: null,

    postCreate: function postCreate() {
      this.inherited(arguments);

      var self = this,
          btn = this.deleteButton;
      if (this.canDelete) {
        domClass.remove(btn, "disabled");
      }
    },

    startup: function startup() {
      if (this._started) {
        return;
      }
      this.inherited(arguments);
      this.render();
    },

    addClicked: function addClicked() {
      var self = this,
          btn = this.addButton;
      this.resultsPane.addPortalDrawingItem(this.item.id);
    },

    detailsClicked: function detailsClicked() {
      //var item = this.item;
      //var baseUrl = util.checkMixedContent(item.portalUrl);
      //var url = baseUrl + "/home/item.html?id=" + encodeURIComponent(item.id);
      //window.open(url);
      this.resultsPane.showPortalDrawingDetails(this.item.id);
    },

    deleteClicked: function deleteClicked() {
      if (this.canDelete) {
        this.resultsPane.deletePortalDrawing(this.item.id);
      } else {
        return;
      }
    },

    formatDate: function formatDate(date) {
      if (typeof date === "number") {
        date = new Date(date);
      }
      var fmt = i18n.search.item.dateFormat;
      return locale.format(date, {
        selector: "date",
        datePattern: fmt
      });
    },

    render: function render() {
      // TODO escape text or not?
      util.setNodeText(this.titleNode, this.item.title);
      util.setNodeTitle(this.titleNode, this.item.title);
      this._renderThumbnail();
      this._renderTypeOwnerDate();
      if (this.canRemove) {
        util.setNodeText(this.addButton, i18n.search.item.actions.remove);
      }
    },

    _renderThumbnail: function _renderThumbnail() {
      var nd = this.thumbnailNode,
          thumbnailUrl = this.item.thumbnailUrl;
      nd.innerHTML = "";
      thumbnailUrl = util.checkMixedContent(thumbnailUrl);
      var thumbnail = document.createElement("IMG");
      thumbnail.src = thumbnailUrl || "widgets/eDrawEcan/images/placeholder_120x80.png";
      nd.appendChild(thumbnail);
    },

    _renderTypeOwnerDate: function _renderTypeOwnerDate() {
      var s,
          item = this.item;

      var sType = i18n.search.item.types[item.type];
      if (typeof sType === "undefined" || sType === null) {
        sType = item.type;
      }
      var typeByOwnerPattern = i18n.search.item.typeByOwnerPattern;
      s = typeByOwnerPattern.replace("{type}", sType);
      s = s.replace("{owner}", item.owner);
      util.setNodeText(this.typeByOwnerNode, s);

      var sDate = this.formatDate(item.modified);
      s = i18n.search.item.datePattern.replace("{date}", sDate);
      util.setNodeText(this.dateNode, s);
    }

  });
});
